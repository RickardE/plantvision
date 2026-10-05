"use client";

import type Konva from "konva";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Stage, Transformer } from "react-konva";
import { productCutoutSrc } from "@/features/products/images";
import type { Placement } from "@/lib/images/placement";
import type { EditorItem } from "./editor-state";
import { useLoadedImage } from "./image-cache";

export const PRODUCT_DRAG_TYPE = "application/x-plantvision-product";

export type EditorCanvasHandle = {
  /** Renders the composition at the room image's full resolution as a JPEG. */
  exportImage(): Promise<Blob | null>;
};

type Props = {
  roomUrl: string;
  roomWidth: number;
  roomHeight: number;
  items: EditorItem[];
  selectedKey: string | null;
  onSelect(key: string | null): void;
  onChange(key: string, patch: Partial<Placement>): void;
  /** A product was dropped on the canvas at the given normalised position. */
  onDropProduct(payload: string, position: { x: number; y: number }): void;
};

/**
 * The design canvas: the room photo with product cut-outs that can be dragged, resized and
 * rotated (Konva Transformer). All positions are converted to/from fractions of the room image.
 */
export const EditorCanvas = forwardRef<EditorCanvasHandle, Props>(function EditorCanvas(
  { roomUrl, roomWidth, roomHeight, items, selectedKey, onSelect, onChange, onDropProduct },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const room = useLoadedImage(roomUrl);
  // The editor only renders in the browser (see design-editor-loader), so window is available.
  const [coarsePointer] = useState(() => window.matchMedia("(pointer: coarse)").matches);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry!.contentRect;
      setSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = size.width && size.height ? Math.min(size.width / roomWidth, size.height / roomHeight) : 0;
  const stageWidth = Math.floor(roomWidth * scale);
  const stageHeight = Math.floor(roomHeight * scale);

  // Detach the transformer when nothing is selected; the selected item attaches it once its
  // image has loaded (see CanvasItem).
  useEffect(() => {
    if (!selectedKey) transformerRef.current?.nodes([]);
  }, [selectedKey]);

  useImperativeHandle(ref, () => ({
    async exportImage() {
      const stage = stageRef.current;
      const transformer = transformerRef.current;
      if (!stage || !stageWidth) return null;
      const previous = transformer?.nodes() ?? [];
      transformer?.nodes([]);
      try {
        const blob = await stage.toBlob({ pixelRatio: roomWidth / stageWidth, mimeType: "image/jpeg", quality: 0.92 });
        return blob instanceof Blob ? blob : null;
      } finally {
        transformer?.nodes(previous);
      }
    },
  }));

  return (
    <div
      ref={containerRef}
      data-testid="editor-canvas"
      className="relative flex size-full items-center justify-center overflow-hidden"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(PRODUCT_DRAG_TYPE)) e.preventDefault();
      }}
      onDrop={(e) => {
        const payload = e.dataTransfer.getData(PRODUCT_DRAG_TYPE);
        const stage = stageRef.current;
        if (!payload || !stage) return;
        e.preventDefault();
        const rect = stage.container().getBoundingClientRect();
        onDropProduct(payload, {
          x: (e.clientX - rect.left) / stageWidth,
          y: (e.clientY - rect.top) / stageHeight,
        });
      }}
    >
      {stageWidth > 0 ? (
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          className="overflow-hidden rounded-xl shadow-lg"
          onMouseDown={(e) => e.target === e.target.getStage() && onSelect(null)}
          onTouchStart={(e) => e.target === e.target.getStage() && onSelect(null)}
        >
          <Layer>
            {room ? (
              <KonvaImage
                image={room}
                width={stageWidth}
                height={stageHeight}
                listening
                onMouseDown={() => onSelect(null)}
                onTap={() => onSelect(null)}
              />
            ) : null}
            {items.map((item) => (
              <CanvasItem
                key={item.key}
                item={item}
                stageWidth={stageWidth}
                stageHeight={stageHeight}
                selected={item.key === selectedKey}
                transformerRef={transformerRef}
                onSelect={() => onSelect(item.key)}
                onChange={(patch) => onChange(item.key, patch)}
              />
            ))}
            <Transformer
              ref={transformerRef}
              keepRatio
              enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
              rotationSnaps={[0, 90, 180, 270]}
              rotationSnapTolerance={4}
              anchorSize={coarsePointer ? 22 : 12}
              anchorCornerRadius={coarsePointer ? 11 : 6}
              rotateAnchorOffset={coarsePointer ? 36 : 24}
              anchorStroke="#1f3a2e"
              anchorFill="#ffffff"
              borderStroke="#e8795a"
              borderStrokeWidth={1.5}
              padding={2}
              flipEnabled={false}
              boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 12 ? oldBox : newBox)}
            />
          </Layer>
        </Stage>
      ) : null}
    </div>
  );
});

function CanvasItem({
  item,
  stageWidth,
  stageHeight,
  selected,
  transformerRef,
  onSelect,
  onChange,
}: {
  item: EditorItem;
  stageWidth: number;
  stageHeight: number;
  selected: boolean;
  transformerRef: React.RefObject<Konva.Transformer | null>;
  onSelect(): void;
  onChange(patch: Partial<Placement>): void;
}) {
  const image = useLoadedImage(item.productImageId ? productCutoutSrc(item.productImageId) : null);
  const nodeRef = useRef<Konva.Image>(null);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!selected || !image || !nodeRef.current || !transformer) return;
    transformer.nodes([nodeRef.current]);
    transformer.getLayer()?.batchDraw();
  }, [selected, image, transformerRef, item, stageWidth, stageHeight]);

  if (!image) return null;

  const width = item.width * stageWidth;
  const height = width * (image.naturalHeight / image.naturalWidth);

  return (
    <KonvaImage
      ref={nodeRef}
      id={`item-${item.key}`}
      image={image}
      x={item.x * stageWidth}
      y={item.y * stageHeight}
      width={width}
      height={height}
      offsetX={width / 2}
      offsetY={height / 2}
      rotation={item.rotation}
      scaleX={item.flipX ? -1 : 1}
      draggable
      onMouseDown={onSelect}
      onTap={onSelect}
      onDragStart={onSelect}
      onDragEnd={(e) => onChange({ x: e.target.x() / stageWidth, y: e.target.y() / stageHeight })}
      onTransformEnd={(e) => {
        const node = e.target;
        const factor = Math.abs(node.scaleX());
        node.scaleX(item.flipX ? -1 : 1);
        node.scaleY(1);
        onChange({
          x: node.x() / stageWidth,
          y: node.y() / stageHeight,
          width: item.width * factor,
          rotation: node.rotation(),
        });
      }}
    />
  );
}
