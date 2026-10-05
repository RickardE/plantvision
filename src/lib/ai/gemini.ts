import { ImageGenerationError, type GenerateVisualizationInput, type ImageGenerationProvider } from "./types";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 180_000;

/** Aspect ratios Gemini image models accept. */
const SUPPORTED_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"] as const;

export function closestAspectRatio(ratio: number) {
  let best: string = SUPPORTED_RATIOS[0];
  let bestDiff = Infinity;
  for (const candidate of SUPPORTED_RATIOS) {
    const [w, h] = candidate.split(":").map(Number);
    const diff = Math.abs(Math.log(ratio) - Math.log(w! / h!));
    if (diff < bestDiff) {
      best = candidate;
      bestDiff = diff;
    }
  }
  return best;
}

type GeminiPart = { text?: string; inlineData?: { mimeType: string; data: string } };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
};

/**
 * Google Gemini image generation ("Nano Banana" family) through the REST API. Chosen because it
 * is strong at editing a given photo while keeping the scene intact, accepts several reference
 * images in one request, and needs no SDK.
 */
export class GeminiImageProvider implements ImageGenerationProvider {
  readonly name = "gemini";

  constructor(
    private readonly apiKey: string,
    readonly model: string,
  ) {}

  async generate(input: GenerateVisualizationInput) {
    const parts: GeminiPart[] = [{ text: input.prompt }];
    for (const image of [input.roomImage, input.compositeImage, ...input.productImages]) {
      parts.push({ text: image.label });
      parts.push({ inlineData: { mimeType: image.mimeType, data: image.data.toString("base64") } });
    }

    let response: Response;
    try {
      response = await fetch(`${ENDPOINT}/${encodeURIComponent(this.model)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": this.apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseModalities: ["IMAGE"],
            imageConfig: { aspectRatio: closestAspectRatio(input.aspectRatio) },
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      throw new ImageGenerationError(`Gemini request failed: ${(error as Error).message}`, true);
    }

    const body = (await response.json().catch(() => ({}))) as GeminiResponse;
    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      throw new ImageGenerationError(`Gemini error ${response.status}: ${body.error?.message ?? "unknown"}`, retryable);
    }
    if (body.promptFeedback?.blockReason) {
      throw new ImageGenerationError(`Gemini blocked the request: ${body.promptFeedback.blockReason}`);
    }
    const image = body.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
    if (!image) {
      throw new ImageGenerationError(
        `Gemini returned no image (finish reason: ${body.candidates?.[0]?.finishReason ?? "unknown"})`,
      );
    }
    return { data: Buffer.from(image.data, "base64"), mimeType: image.mimeType };
  }
}
