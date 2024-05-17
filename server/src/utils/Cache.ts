import fs from "fs";
import path from "path";

type CacheData = {
  [key: string]: { value: any; expiresAt: number };
};

type StrongCacheData = {
  values: any[];
};

class Cache {
  private cache: Map<string, { value: any; expiresAt: number }>;
  private cacheFilePath: string;

  constructor(cacheFilePath: string) {
    this.cache = new Map();
    this.cacheFilePath = cacheFilePath;
    this.loadCache();
  }

  private loadCache(): void {
    try {
      const data = fs.readFileSync(this.cacheFilePath, "utf-8");
      const parsedData: CacheData = JSON.parse(data);
      const now = Date.now();
      for (const key in parsedData) {
        if (parsedData.hasOwnProperty(key)) {
          const { value, expiresAt } = parsedData[key];
          if (expiresAt > now) {
            this.cache.set(key, { value, expiresAt });
          }
        }
      }
    } catch (error) {
      console.log("Error loading cache:", error);
    }
  }

  saveCache(): void {
    const cacheData: CacheData = {};
    const now = Date.now();
    this.cache.forEach((entry, key) => {
      if (entry.expiresAt > now) {
        cacheData[key] = entry;
      }
    });
    fs.writeFileSync(this.cacheFilePath, JSON.stringify(cacheData));
  }

  set(key: string, value: any, ttl: number): void {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
    this.saveCache();
  }

  get(key: string): any | undefined {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value;
    } else {
      this.cache.delete(key);
      this.saveCache();
      return undefined;
    }
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.saveCache();
  }

  clear(): void {
    this.cache.clear();
    this.saveCache();
  }
}

class StrongCache {
  private cache: Set<any>;
  private cacheFilePath: string;

  constructor(cacheFilePath: string) {
    this.cache = new Set();
    this.cacheFilePath = cacheFilePath;
    this.loadCache();
  }

  private loadCache(): void {
    try {
      const data = fs.readFileSync(this.cacheFilePath, "utf-8");
      const parsedData: StrongCacheData = JSON.parse(data);
      if (parsedData.values && Array.isArray(parsedData.values)) {
        parsedData.values.forEach((value) => {
          this.cache.add(value);
        });
      } else {
        console.log("Invalid cache data format.");
      }
    } catch (error) {
      console.log("Error loading cache:", error);
    }
  }

  saveCache(): void {
    const cacheData: StrongCacheData = {
      values: Array.from(this.cache),
    };
    fs.writeFileSync(this.cacheFilePath, JSON.stringify(cacheData));
  }

  add(value: any): void {
    this.cache.add(value);
    this.saveCache();
  }

  has(value: any): boolean {
    return this.cache.has(value);
  }

  delete(value: any): void {
    this.cache.delete(value);
    this.saveCache();
  }

  clear(): void {
    this.cache.clear();
    this.saveCache();
  }
}

// Instances
const cache = new Cache("CacheMap.json");
const strongCache = new StrongCache("StrongCacheMap.json");

export { cache, strongCache };
