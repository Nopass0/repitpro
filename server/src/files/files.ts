import { mkdirSync, writeFile } from "fs";
import { extname } from "path";

/**
 * Uploads a file to the server and returns the new path of the file if successful; otherwise, returns null.
 *
 * @param {Buffer} file - The file to be uploaded
 * @param {any} callback - The callback function to be executed after the file is saved
 * @return {Promise<string | null>} The new path of the file if successful; otherwise, null
 */
export const upload = async (
  file: Buffer,
  callback?: any
): Promise<string | null> => {
  console.log(file, "-----------------------------"); // <Buffer 25 50 44 ...>

  // Create a dummy filename with an extension to be used with the extname function
  const dummyFilename = `dummy.${extname("filename.txt").slice(1)}`;
  const ext = extname(dummyFilename).slice(1);

  try {
    await mkdirSync("../../files", { recursive: true });
  } catch (err) {
    console.error(err, "ERROR IN mkdirSync");
  }

  // Create a new filename with random symbols of length 256
  const filename = `${await Array.from({ length: 256 }, () =>
    ((Math.random() * 36) | 0).toString(36)
  ).join("")}.${ext}`;

  // Save the file to the ../../files folder
  writeFile(`../../files/${filename}`, file, (err) => {
    callback && callback({ message: err ? "failure" : "success" });

    if (!err) {
      return `../../files/${filename}`;
    } else {
      return null;
    }
  });

  return null;
};
