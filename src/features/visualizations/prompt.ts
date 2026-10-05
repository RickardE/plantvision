import { describePosition, placementToPixels, type Placement } from "@/lib/images/placement";

/**
 * Builds the instruction text sent to the image model. English, because image models follow
 * English instructions most reliably; the designer's own instruction is passed through as-is.
 *
 * The rules mirror the specification: the AI makes the designer's composition photorealistic
 * and must not make design decisions of its own.
 */
export type PromptItem = Placement & {
  productName: string;
  kind: "plant" | "pot" | "accessory" | "other";
  widthCm: number | null;
  heightCm: number | null;
  aspect: number;
  /** 1-based index of this product's reference image in the request. */
  referenceIndex: number;
};

const KIND_LABEL: Record<PromptItem["kind"], string> = {
  plant: "plant",
  pot: "planter/pot",
  accessory: "accessory",
  other: "decorative item",
};

export function buildVisualizationPrompt(input: {
  items: PromptItem[];
  image: { width: number; height: number };
  instructions?: string | null;
}) {
  const { items, image } = input;
  const ordered = [...items].sort((a, b) => a.referenceIndex - b.referenceIndex);

  const lines = ordered.map((item, index) => {
    const box = placementToPixels(item, image, item.aspect);
    const pos = describePosition(box, image);
    const size = [item.widthCm && `${item.widthCm} cm wide`, item.heightCm && `${item.heightCm} cm tall`]
      .filter(Boolean)
      .join(", ");
    const orientation = [
      Math.abs(item.rotation) >= 1 ? `rotated ${Math.round(item.rotation)}° clockwise` : null,
      item.flipX ? "mirrored horizontally" : null,
    ]
      .filter(Boolean)
      .join(", ");
    return (
      `${index + 1}. ${KIND_LABEL[item.kind]} "${item.productName}"` +
      (size ? ` (real size: ${size})` : "") +
      ` — reference image ${item.referenceIndex + 2}. ` +
      `Placed with its centre ${pos.centreFromLeft} from the left edge and its bottom edge ${pos.bottomFromTop} from the top; ` +
      `occupies about ${pos.widthShare} of the image width and ${pos.heightShare} of the image height` +
      (orientation ? `; ${orientation}` : "") +
      "."
    );
  });

  const extra = input.instructions?.trim();

  return [
    "You are a professional architectural visualisation artist for an interior landscaping company.",
    "Turn the designer's rough composition into a single photorealistic photograph of the same room.",
    "",
    "Images provided:",
    "- Image 1: the original, untouched photo of the customer's room.",
    "- Image 2: the designer's composition — the same room with product cut-outs pasted in at the intended positions and sizes.",
    "- Images 3 and later: clean reference photos of each product, listed below.",
    "",
    "Products in the composition:",
    ...lines,
    "",
    "Rules (follow all of them):",
    "- Keep the room exactly as in Image 1: same walls, floor, windows, furniture, architecture, camera angle, framing, perspective and proportions.",
    "- Place every listed product exactly where it is in Image 2, at the same size and orientation. Do not move, resize, add, remove or replace products, and do not add any other plants or objects.",
    "- Make each product look like the reference photo (species, leaf shape, colours, pot shape and finish), rendered as a real object in the room.",
    "- Adapt products to the room's lighting and perspective: correct scale in depth, realistic contact with the floor or surface, soft natural shadows and reflections, matching colour temperature.",
    "- Remove any cut-out artefacts such as white edges, halos or flat paste-in look.",
    "- Produce a natural, high-resolution photograph with no text, labels, borders or watermarks.",
    ...(extra ? ["", `Additional instruction from the designer (must not break the rules above): ${extra}`] : []),
  ].join("\n");
}
