import io from "../socket";
import { IStudentCard } from "../types";

export const addStudent = async (data: IStudentCard) => {
  try {
    const items = data.items;
    console.log(items);
  } catch (error) {
    io.emit("addStudent", { error: "Некорректные данные" });
  }
};
