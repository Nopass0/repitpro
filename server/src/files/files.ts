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
      // Calculate hash-sum
      const hashSum = calculateBufferHash(file);
      let mimeType = type; // Use type as mime type
      let ext: string = "";
      const fileExtension = name.split(".").pop(); // Properly get the file extension

      console.log(
        "\n-----------------name----------------\n",
        name,
        "\n-----------ext----------\n",
        fileExtension
      );

      if (fileExtension === "ogg") {
        ext = "ogg";
      } else if (fileExtension === "mkv") {
        ext = "mkv";
      } else {
        ext = fileExtension ? fileExtension : "unknown"; // Default to "unknown" if no extension is found
      }

      const fileName = `${randomBytes(6).toString("hex")}.${ext}`;
      const filePath = join(FilesDir, fileName); // Use the new file name with the correct extension

      // Check if file already exists in db (By path)
      const existingFile = await db.file.findFirst({
        where: { path: filePath },
      });

      if (existingFile) {
        ids.push(existingFile.id);
        continue;
      }

      // Write file to disk (replace with appropriate function)
      writeFileSync(filePath, file);

      const newFile = await db.file.create({
        data: {
          hashSum,
          name: fileName,
          size,
          type: mimeType,
          extraType: extraType || "",
          path: filePath,
          userId: userID,
        },
      });

      console.log(
        "ext",
        ext,
        "mimeType",
        mimeType,
        "file size",
        file.length // assuming 'file' is a Buffer
      );

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

  const file_ = readFileSync(filePathAbsolute);

  console.log("File path", filePathAbsolute, file_);

  return file_;
};

export const uploadFiles = (data: IUploadFiles) => {
  console.log(data);
};
