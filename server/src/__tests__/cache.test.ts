import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { UltraCache } from "../utils/Cache";

describe("UltraCache", () => {
  let cache: UltraCache;
  const TEST_DB = ":memory:";

  beforeEach(() => {
    cache = new UltraCache({
      filename: TEST_DB,
      cleanupInterval: 1000,
      maxSize: 5,
    });
  });

  afterEach(() => {
    if (cache) {
      cache.close();
    }
  });

  describe("Basic Operations", () => {
    it("should set and get a value", () => {
      cache.set("key1", "value1", 1000);
      expect(cache.get("key1")).toBe("value1");
    });

    it("should handle complex objects", () => {
      const complexObject = {
        name: "test",
        numbers: [1, 2, 3],
        nested: { a: 1, b: 2 },
      };
      cache.set("complex", complexObject, 1000);
      expect(cache.get("complex")).toEqual(complexObject);
    });

    it("should return undefined for non-existent keys", () => {
      expect(cache.get("nonexistent")).toBeUndefined();
    });

    it("should delete a value", () => {
      cache.set("key1", "value1", 1000);
      cache.delete("key1");
      expect(cache.get("key1")).toBeUndefined();
    });

    it("should clear all values", () => {
      cache.set("key1", "value1", 1000);
      cache.set("key2", "value2", 1000);
      cache.clear();
      expect(cache.get("key1")).toBeUndefined();
      expect(cache.get("key2")).toBeUndefined();
    });
  });

  describe("TTL Functionality", () => {
    it("should expire items after TTL", async () => {
      cache.set("shortTTL", "value", 100); // 100ms TTL
      expect(cache.get("shortTTL")).toBe("value");

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(cache.get("shortTTL")).toBeUndefined();
    });

    it("should handle multiple TTLs correctly", async () => {
      cache.set("long", "longValue", 500); // 500ms TTL
      cache.set("short", "shortValue", 100); // 100ms TTL

      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(cache.get("long")).toBe("longValue");
      expect(cache.get("short")).toBeUndefined();
    });
  });

  describe("Size Management", () => {
    it("should respect maxSize limit", () => {
      // Добавляем элементы сверх лимита (maxSize = 5)
      for (let i = 0; i < 10; i++) {
        cache.set(`key${i}`, `value${i}`, 1000);
      }

      // Проверяем, что некоторые старые элементы были удалены
      let existingCount = 0;
      for (let i = 0; i < 10; i++) {
        if (cache.get(`key${i}`) !== undefined) {
          existingCount++;
        }
      }
      expect(existingCount).toBeLessThanOrEqual(5);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid JSON values gracefully", () => {
      const db = cache["db"];
      db.exec(`
        INSERT OR REPLACE INTO cache (key, value, expires_at) 
        VALUES ('invalid', 'invalid-json', ${Date.now() + 1000})
      `);

      expect(cache.get("invalid")).toBeUndefined();
    });

    it("should handle concurrent operations", async () => {
      const results = await Promise.all(
        Array(100)
          .fill(0)
          .map(async (_, i) => {
            await cache.set(`key${i}`, `value${i}`, 1000);
            const value = await cache.get(`key${i}`);
            if (i % 2 === 0) {
              await cache.delete(`key${i}`);
            }
            return value;
          })
      );

      expect(
        results.every(
          (result) => result === undefined || typeof result === "string"
        )
      ).toBe(true);
    });
  });

  describe("Performance", () => {
    it("should handle rapid operations", async () => {
      const start = performance.now();

      // 1000 операций записи
      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i}`, `value${i}`, 1000);
      }

      // 1000 операций чтения
      for (let i = 0; i < 1000; i++) {
        cache.get(`key${i}`);
      }

      const end = performance.now();
      expect(end - start).toBeLessThan(1000); // Должно быть быстрее 1 секунды
    });

    it("should handle large objects", () => {
      const largeObject = {
        data: Array(1000)
          .fill(0)
          .map((_, i) => ({
            id: i,
            value: `test value ${i}`,
            timestamp: Date.now(),
            nested: {
              a: i * 2,
              b: `nested value ${i}`,
              deep: {
                x: i * 3,
                y: `deep value ${i}`,
              },
            },
          })),
      };

      cache.set("large", largeObject, 5000);
      const retrieved = cache.get("large");
      expect(retrieved).toEqual(largeObject);
    });

    it("should handle multiple concurrent read/write operations", async () => {
      const operations = Array(50)
        .fill(0)
        .map(async (_, i) => {
          const writes = Array(20)
            .fill(0)
            .map((_, j) => {
              return cache.set(`key${i}-${j}`, `value${i}-${j}`, 1000);
            });

          const reads = Array(20)
            .fill(0)
            .map((_, j) => {
              return cache.get(`key${i}-${j}`);
            });

          const deletes = Array(10)
            .fill(0)
            .map((_, j) => {
              return cache.delete(`key${i}-${j}`);
            });

          return Promise.all([...writes, ...reads, ...deletes]);
        });

      await expect(Promise.all(operations)).resolves.toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined values", () => {
      cache.set("undefined", undefined, 1000);
      expect(cache.get("undefined")).toBeUndefined();
    });

    it("should handle null values", () => {
      cache.set("null", null, 1000);
      expect(cache.get("null")).toBeNull();
    });

    it("should handle empty strings", () => {
      cache.set("empty", "", 1000);
      expect(cache.get("empty")).toBe("");
    });

    it("should handle zero TTL", () => {
      cache.set("zero", "value", 0);
      expect(cache.get("zero")).toBeUndefined();
    });

    it("should handle negative TTL", () => {
      cache.set("negative", "value", -1000);
      expect(cache.get("negative")).toBeUndefined();
    });
  });

  describe("Cleanup", () => {
    it("should clean up expired items automatically", async () => {
      // Устанавливаем несколько значений с коротким TTL
      for (let i = 0; i < 5; i++) {
        cache.set(`expire${i}`, `value${i}`, 100);
      }

      // Устанавливаем несколько значений с длинным TTL
      for (let i = 0; i < 5; i++) {
        cache.set(`keep${i}`, `value${i}`, 5000);
      }

      // Ждем истечения короткого TTL
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Проверяем, что короткие значения удалены, а длинные остались
      for (let i = 0; i < 5; i++) {
        expect(cache.get(`expire${i}`)).toBeUndefined();
        expect(cache.get(`keep${i}`)).toBe(`value${i}`);
      }
    });
  });
});
