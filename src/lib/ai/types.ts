/**
 * Contract between PlantVision and an external image-generation service. Adding a provider
 * means implementing this interface and registering it in `./index.ts`; nothing else changes.
 */
export type ImageInput = { data: Buffer; mimeType: string; label: string };

export type GenerateVisualizationInput = {
  /** Full instructions (see features/visualizations/prompt.ts). */
  prompt: string;
  /** The untouched room photo. */
  roomImage: ImageInput;
  /** The designer's composition: products pasted onto the room at their placement. */
  compositeImage: ImageInput;
  /** One clean reference image per distinct product, in the order the prompt lists them. */
  productImages: ImageInput[];
  /** Output aspect ratio (width / height) to match the room photo. */
  aspectRatio: number;
};

export type GeneratedImage = { data: Buffer; mimeType: string };

export interface ImageGenerationProvider {
  readonly name: string;
  readonly model: string;
  generate(input: GenerateVisualizationInput): Promise<GeneratedImage>;
}

export class ImageGenerationError extends Error {
  constructor(
    message: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = "ImageGenerationError";
  }
}
