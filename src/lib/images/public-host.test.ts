import { describe, expect, it } from "vitest";
import { assertPublicHttpsUrl, isPrivateAddress } from "./public-host";

describe("isPrivateAddress", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.20.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "::1",
    "fd00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
  ])("blocks %s", (address) => expect(isPrivateAddress(address)).toBe(true));

  it.each(["93.184.216.34", "172.32.0.1", "2606:4700::1111"])("allows %s", (address) =>
    expect(isPrivateAddress(address)).toBe(false),
  );
});

describe("assertPublicHttpsUrl", () => {
  it("rejects http and internal hosts", async () => {
    await expect(assertPublicHttpsUrl(new URL("http://example.com/a.jpg"))).rejects.toThrow("https");
    await expect(assertPublicHttpsUrl(new URL("https://127.0.0.1/a.jpg"))).rejects.toThrow("not allowed");
    await expect(assertPublicHttpsUrl(new URL("https://[::1]/a.jpg"))).rejects.toThrow("not allowed");
  });
});
