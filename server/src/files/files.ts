import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";
import * as crypto from "crypto";
import { IUploadFiles } from "../types";
import db from "../db";

function calculateBufferHash(buffer: Buffer): string {
  const hash = crypto.createHash("sha256");
  hash.update(buffer);
  return hash.digest("hex");
}

function getMimeType(fileExtension: string, originalType: any): string {
  // Common MIME type mappings
  const mimeTypes: { [key: string]: string } = {
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ogg: "audio/ogg",
    mkv: "video/x-matroska",
  };

  // If original type is a string and seems valid, use it
  if (typeof originalType === "string" && originalType.includes("/")) {
    return originalType;
  }

  // Normalize extension and look up MIME type
  const ext = fileExtension.toLowerCase();
  return mimeTypes[ext] || "application/octet-stream";
}

export const upload = async (
  data: IUploadFiles[],
  userID: string,
  extraType?: string,
  callback?: (Ids: string[]) => void
) => {
  const folderName = randomBytes(16).toString("hex");
  const ids: string[] = [];

  if (data && data.length > 0) {
    const FilesDir = join("./files", folderName);
    mkdirSync(FilesDir, { recursive: true });

    for (const item of data) {
      const { file, name, size, type } = item;

      if (file === undefined) continue;

      // Calculate hash-sum
      const hashSum = calculateBufferHash(file);

      // Get file extension and proper MIME type
      const fileExtension = name.split(".").pop()?.toLowerCase() || "unknown";
      const mimeType = getMimeType(fileExtension, type);

      // Create a sanitized filename with the original extension
      const fileName = `${name.split(".")[0]}_${randomBytes(6).toString(
        "hex"
      )}.${fileExtension}`;
      const filePath = join(FilesDir, fileName);

      // Check if file already exists in db (By path)
      const existingFile = await db.file.findFirst({
        where: { path: filePath },
      });

      if (existingFile) {
        ids.push(existingFile.id);
        continue;
      }

      // Write file to disk
      writeFileSync(filePath, file);

      // Create database record with proper string type
      const newFile = await db.file.create({
        data: {
          hashSum,
          name: fileName,
          size: Number(size) || 0,
          type: mimeType,
          extraType: extraType || "",
          path: filePath,
          userId: userID,
        },
      });

      ids.push(newFile.id);
    }
  }

  if (callback) callback(ids);
  return ids;
};

export const getBufferByFilePath = async (filePath: string) => {
  const file = await db.file.findFirst({ where: { path: filePath } });

  if (!file) {
    return null;
  }

  const filePathAbsolute = join(__dirname, "..", "..", file.path);
  return readFileSync(filePathAbsolute);
};

export const uploadFiles = (data: IUploadFiles) => {
  console.log("Received upload request:", data);
};
