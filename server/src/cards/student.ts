import io from "../socket";
import { IStudentCard } from "../types";
import db from "../db";

const DEBAG = true;

export const addStudent = async (data: IStudentCard) => {
  try {
    //create db instance
    const student = await db.student.create({
      data: {
        nameStudent: data.nameStudent,
        phoneNumber: data.phoneNumber,
        contactFace: data.contactFace,
        email: data.email,
        prePayCost: data.prePayCost,
        prePayDate: data.prePayDate,
        costOneLesson: data.costOneLesson,
        commentStudent: data.commentStudent,
        link: data.link,
        cost: data.cost,
      },
    });

    // //create items instance
    // const items = await db.item.createMany({
    //   data: data.items.map(item => ({
    //     ...item,
    //     studentId: student.id
    //   }))
    // })
  } catch (error) {
    io.emit("addStudent", { error: "Некорректные данные" });
  }
};
