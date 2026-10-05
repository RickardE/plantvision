import "server-only";
import { serverEnv } from "@/lib/env";
import { GeminiImageProvider } from "./gemini";
import { MockImageProvider } from "./mock";
import type { ImageGenerationProvider } from "./types";

export type { ImageGenerationProvider } from "./types";

/** The configured provider (AI_PROVIDER). Tests and local development use the mock. */
export function getImageProvider(): ImageGenerationProvider {
  const env = serverEnv();
  switch (env.AI_PROVIDER) {
    case "gemini":
      return new GeminiImageProvider(env.GEMINI_API_KEY!, env.GEMINI_IMAGE_MODEL);
    case "mock":
      return new MockImageProvider();
  }
}
