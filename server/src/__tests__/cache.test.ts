import { it, describe, expect } from "bun:test";
import { cache, strongCache } from "../utils/Cache";

describe("Cache", () => {
  it("should save and load cache", () => {
    cache.set("key", "value");
    expect(cache.get("key")).toBe("value");
  }),
    it("should clear cache", () => {
      cache.set("key", "value");
      cache.clear();
      expect(cache.get("key")).toBeUndefined();
    }),
    it("should delete cache", () => {
      cache.set("key", "value");
      cache.delete("key");
      expect(cache.get("key")).toBeUndefined();
    });
});

describe("StrongCache", () => {
  it("should save and load strong cache", () => {
    strongCache.add("value");
    expect(strongCache.has("value")).toBe(true);
  }),
    it("should clear strong cache", () => {
      strongCache.add("value");
      strongCache.clear();
      expect(strongCache.has("value")).toBe(false);
    });
});
