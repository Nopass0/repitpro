import { writeFile } from "fs";
import io from "../socket";

export const upload = (file, callback) => {
  console.log(file); // <Buffer 25 50 44 ...>

  //create filename
  //create db instance

  // save the content to the disk, for example
  writeFile("../../files", file, (err) => {
    callback({ message: err ? "failure" : "success" });
  });
};
