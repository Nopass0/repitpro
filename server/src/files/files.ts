import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";
import { strongCache } from "../utils/Cache";
import * as crypto from "crypto";
import { IUploadFiles } from "../types";
import db from "../db";
const mimetics = require("mimetics");

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
      //calculate hash-sum
      const hashSum = calculateBufferHash(file);
      let mimeType: any;
      let ext: string = "";
      let last = item.name.split(".").length - 1;
      console.log(
        "\n-----------------name----------------\n",
        item.name,
        "\n-----------ext----------\n",
        item.name.split(".")[-1]
      );
      if (item.name.split(".")[last] == "ogg") {
        mimeType = "audio/ogg";
        ext = "ogg";
      } else if (item.name.split(".")[last] == "mkv") {
        mimeType = "video/x-matroska";
        ext = "mkv";
      } else {
        mimeType = await mimetics(file); // returns "image/png"
        ext = mimeType.ext; // returns "png"
      }
      const fileName = `${randomBytes(6).toString("hex")}.${ext}`;
      const filePath = join(FilesDir, name);

      //check if file already exists in db (By path)
      const existingFile = await db.file.findFirst({
        where: { path: filePath },
      });

      if (existingFile) {
        ids.push(existingFile.id);
        continue;
      }
      // Write file to disk (replace with appropriate function)
      await writeFileSync(filePath, file);

      const newFile = await db.file.create({
        data: {
          hashSum,
          name: fileName,
          size,
          type,
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

  const filePathAbsolute = join(
    `${__dirname.replace("src", "").replace("src", "").replace("\\files", "")}`,
    file.path
  );

  const file_ = await readFileSync(filePathAbsolute);

  console.log("File path", filePathAbsolute, file_);

  return file_;
};

export const uploadFiles = (data: IUploadFiles) => {
  console.log(data);
};
