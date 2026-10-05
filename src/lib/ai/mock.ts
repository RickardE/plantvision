import sharp from "sharp";
import type { GenerateVisualizationInput, ImageGenerationProvider } from "./types";

/**
 * Deterministic stand-in for local development and tests. Returns the composition with a light
 * "photo" grade so it is visibly different from the input, after a short delay.
 */
export class MockImageProvider implements ImageGenerationProvider {
  readonly name = "mock";
  readonly model = "mock-v1";

  constructor(private readonly delayMs = Number(process.env.MOCK_AI_DELAY_MS ?? 1500)) {}

  async generate(input: GenerateVisualizationInput) {
    if (input.prompt.includes("__FAIL__")) throw new Error("Mock provider asked to fail");
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    const data = await sharp(input.compositeImage.data)
      .modulate({ brightness: 1.04, saturation: 1.12 })
      .blur(0.6)
      .jpeg({ quality: 90 })
      .toBuffer();
    return { data, mimeType: "image/jpeg" };
  }
}
