import { mkdirSync, writeFile } from "fs";
import { describe, it, expect } from "bun:test";
import { extname } from "path";
import { log } from "console";

export const upload = async (
  files: Buffer,
  callback?: any
): Promise<string | null> => {
  //   console.log(file, "-----------------------------"); // <Buffer 25 50 44 ...>
  return null;
};

// //bun test
