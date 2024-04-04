import { Prisma, PrismaClient } from "@prisma/client";
import { IStudentCardResponse, ITimeLine, IItemCard } from "../types";
import db from "../db";
import io from "../socket";

export async function addStudent(data: IStudentCardResponse) {
  const {
    nameStudent,
    phoneNumber,
    contactFace,
    email,
    prePayCost,
    prePayDate,
    costOneLesson,
    commentStudent,
    link,
    cost,
    items,
    token,
  } = data;

  const userId = await db.token.findFirst({
    where: {
      token,
    },
  });
  if (!userId) {
    throw new Error("Invalid token");
  }

  const createdIds = [];
  for (const item of items) {
    const createdItem = await db.item.create({
      data: {
        itemName: item.itemName,
        tryLessonCheck: item.tryLessonCheck || false,
        tryLessonCost: item.tryLessonCost || "",
        todayProgramStudent: item.todayProgramStudent || "",
        targetLesson: item.targetLesson || "",
        programLesson: item.programLesson || "",
        typeLesson: Number(item.typeLesson) || 0,
        placeLesson: item.placeLesson || "",
        timeLesson: item.timeLesson || "",
        valueMuiSelectArchive: item.valueMuiSelectArchive || 1,
        startLesson: new Date(item.startLesson) || null,
        endLesson: new Date(item.endLesson) || null,
        nowLevel: item.nowLevel || 0,
        lessonDuration: item.lessonDuration || 0,
        timeLinesArray: JSON.stringify(item.timeLinesArray) || "{}",
        // userId.userId,
        userId: userId.userId,
      },
    });
    createdIds.push(String(createdItem.id));
  }

  //get array of ids of created items
  console.log(createdIds);

  const student = await db.student.create({
    data: {
      nameStudent,
      phoneNumber,
      contactFace,
      email,
      prePayCost,
      prePayDate: prePayDate ? new Date(prePayDate) : null, // в случае null, поле не заполняется
      costOneLesson,
      commentStudent,
      link: link ? link : "",
      cost: cost ? cost : "",
      items: createdIds,
      // userId,
      userId: userId.userId,
    },
  });
}

// Функция для валидации токена и получения userId
async function validateTokenAndGetUserId(
  token: string
): Promise<string | null> {
  const tokenData = await db.token.findFirst({
    where: { token },
    select: { userId: true },
  });

  return tokenData?.userId ?? null;
}

export async function getAllStudents() {
  try {
    const students = await db.student.findMany();
    return students;
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
}

export async function getStudentById(id: string) {
  try {
    const student = await db.student.findUnique({
      where: { id },
    });
    return student;
  } catch (error) {
    console.error("Error fetching student:", error);
    throw error;
  }
}

export async function updateStudent(id: string, data) {
  try {
    const updatedStudent = await db.student.update({
      where: { id },
      data,
    });
    return updatedStudent;
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
}

export async function getStudentList(token) {
  try {
    const userId = await db.token.findFirst({
      where: {
        token,
      },
    });

    const students = await db.student.findMany({
      where: {
        userId: userId.userId,
      },
      select: {
        nameStudent: true,
        phoneNumber: true,
        isArchived: true,
      },
    });
    console.log(students);
    io.emit("getStudentList", students);
    return students;
  } catch (error) {
    console.error("Error fetching student list:", error);
    throw error;
  }
}
