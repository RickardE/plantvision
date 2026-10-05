import { z } from "zod";

/**
 * Server-side environment, validated once on first use so a missing variable fails loudly
 * with a clear message instead of as an obscure runtime error deep in a request.
 */
const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  // Used in invite and password-reset links, so it must be the real public URL.
  NEXT_PUBLIC_SITE_URL: z.url(),
  AI_PROVIDER: z.enum(["mock", "gemini"]).default("mock"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_IMAGE_MODEL: z.string().default("gemini-2.5-flash-image"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (!cached) {
    const parsed = serverSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
    }
    if (parsed.data.AI_PROVIDER === "gemini" && !parsed.data.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required when AI_PROVIDER=gemini");
    }
    cached = parsed.data;
  }
  return cached;
}

/** Public values are inlined at build time, so they must be referenced literally. */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
};
