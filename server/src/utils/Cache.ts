import fs from "fs";

type CacheData = {
  [key: string]: any;
};

type StrongCacheData = {
  values: any[];
};

class Cache {
  private cache: Map<string, any>;

  constructor() {
    this.cache = new Map();
    this.loadCache();
  }

  private loadCache(): void {
    try {
      const data = fs.readFileSync("CacheMap.json", "utf-8");
      const parsedData: CacheData = JSON.parse(data);
      for (const key in parsedData) {
        if (parsedData.hasOwnProperty(key)) {
          this.cache.set(key, parsedData[key]);
        }
      }
    } catch (error) {
      console.log("Error loading cache:", error);
    }
  }

  saveCache(): void {
    const cacheData: CacheData = {};
    this.cache.forEach((value, key) => {
      cacheData[key] = value;
    });
    fs.writeFileSync("./CacheMap.json", JSON.stringify(cacheData));
  }

  set(key: string, value: any): void {
    this.cache.set(key, value);
    this.saveCache();
  }

  get(key: string): any | undefined {
    return this.cache.get(key);
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

//instances
const cache = new Cache();
const strongCache = new StrongCache("StrongCacheMap.json");

export { cache, strongCache };
