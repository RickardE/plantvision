import { afterEach, describe, expect, it, vi } from "vitest";
import { closestAspectRatio, GeminiImageProvider } from "./gemini";

const input = {
  prompt: "Make it real",
  roomImage: { data: Buffer.from("room"), mimeType: "image/jpeg", label: "Image 1" },
  compositeImage: { data: Buffer.from("comp"), mimeType: "image/jpeg", label: "Image 2" },
  productImages: [{ data: Buffer.from("prod"), mimeType: "image/png", label: "Image 3" }],
  aspectRatio: 4 / 3,
};

afterEach(() => vi.unstubAllGlobals());

describe("closestAspectRatio", () => {
  it("picks the nearest supported ratio", () => {
    expect(closestAspectRatio(4032 / 3024)).toBe("4:3");
    expect(closestAspectRatio(3024 / 4032)).toBe("3:4");
    expect(closestAspectRatio(1920 / 1080)).toBe("16:9");
    expect(closestAspectRatio(1)).toBe("1:1");
  });
});

describe("GeminiImageProvider", () => {
  it("sends the prompt with labelled images and returns the generated image", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ inlineData: { mimeType: "image/png", data: Buffer.from("result").toString("base64") } }],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await new GeminiImageProvider("key", "gemini-test").generate(input);
    expect(result.data.toString()).toBe("result");

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("/models/gemini-test:generateContent");
    expect(init.headers["x-goog-api-key"]).toBe("key");
    const body = JSON.parse(init.body);
    expect(body.contents[0].parts).toHaveLength(7);
    expect(body.contents[0].parts[1]).toEqual({ text: "Image 1" });
    expect(body.generationConfig.imageConfig.aspectRatio).toBe("4:3");
  });

  it("marks rate limits as retryable and reports missing images", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "slow down" } }), { status: 429 })),
    );
    await expect(new GeminiImageProvider("k", "m").generate(input)).rejects.toMatchObject({ retryable: true });

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ candidates: [{ finishReason: "SAFETY" }] }), { status: 200 })),
    );
    await expect(new GeminiImageProvider("k", "m").generate(input)).rejects.toThrow(/SAFETY/);
  });
});
