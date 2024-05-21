import { ICardFile } from "types";
import { join } from "path";
import fs from "fs";
import db from "../db";

export const deleteFileById = async (ids: string[], extrudeIds: string[]) => {
  try {
    console.log(
      "\n--------------extrude ids----------\n",
      extrudeIds,
      "\n---------------\n",
      "\n--------------------------ids---------------------\n",
      ids,
      "\n--------------------------\n"
    );
    for (const id of ids) {
      //if id in extrudeIds, skip
      console.log(
        "\n-------------------------extrudeIds.includes------------------------\n",
        extrudeIds.includes(id),
        "\n----------------\n"
      );
      if (extrudeIds.includes(id)) {
        continue;
      }
      console.log(
        "\n-------------------------not-skiped------------------------\n",
        id,
        "\n----------------\n"
      );
      const file = await db.file.findUnique({
        where: {
          id: id,
        },
        select: {
          path: true,
        },
      });

      if (!file) {
        console.error("File not found");
        return false;
      }

      const fullPath = join(__dirname.replace("src", ""), file.path).replace(
        "utils\\",
        ""
      ); // Using absolute path
      console.log("Full path: \n", fullPath);
      // delete file
      fs.unlinkSync(fullPath);
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
