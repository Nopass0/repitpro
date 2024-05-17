import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "fs";
import { cache, strongCache } from "../utils/Cache";

describe("Cache", () => {
  beforeEach(() => {
    cache.clear();
    fs.writeFileSync("./CacheMap.json", "{}");
  });

  afterEach(() => {
    cache.clear();
    fs.writeFileSync("./CacheMap.json", "{}");
  });

  it("should set and get a value", () => {
    cache.set("key1", "value1");
    const value = cache.get("key1");
    expect(value).toBe("value1");
  });

  it("should delete a value", () => {
    cache.set("key1", "value1");
    cache.delete("key1");
    const value = cache.get("key1");
    expect(value).toBeUndefined();
  });

  it("should clear all values", () => {
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.clear();
    const value1 = cache.get("key1");
    const value2 = cache.get("key2");
    expect(value1).toBeUndefined();
    expect(value2).toBeUndefined();
  });

  it("should persist values to file", () => {
    cache.set("key1", "value1");
    const cacheData = JSON.parse(fs.readFileSync("./CacheMap.json", "utf-8"));
    expect(cacheData["key1"]).toBe("value1");
  });
});

describe("StrongCache", () => {
  beforeEach(() => {
    strongCache.clear();
    fs.writeFileSync("StrongCacheMap.json", JSON.stringify({ values: [] }));
  });

  afterEach(() => {
    strongCache.clear();
    fs.writeFileSync("StrongCacheMap.json", JSON.stringify({ values: [] }));
  });

  it("should add and check a value", () => {
    strongCache.add("value1");
    const hasValue = strongCache.has("value1");
    expect(hasValue).toBe(true);
  });

  it("should delete a value", () => {
    strongCache.add("value1");
    strongCache.delete("value1");
    const hasValue = strongCache.has("value1");
    expect(hasValue).toBe(false);
  });

  it("should clear all values", () => {
    strongCache.add("value1");
    strongCache.add("value2");
    strongCache.clear();
    const hasValue1 = strongCache.has("value1");
    const hasValue2 = strongCache.has("value2");
    expect(hasValue1).toBe(false);
    expect(hasValue2).toBe(false);
  });

  it("should persist values to file", () => {
    strongCache.add("value1");
    const cacheData = JSON.parse(
      fs.readFileSync("StrongCacheMap.json", "utf-8")
    );
    expect(cacheData.values).toContain("value1");
  });
});
