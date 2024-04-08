import { Prisma, PrismaClient } from "@prisma/client";
import { IStudentCardResponse, ITimeLine, IItemCard } from "../types";
import db from "../db";
import io from "../socket";
import { addDays, differenceInDays, isWithinInterval } from "date-fns";

// Получение дня недели, начиная с понедельника
function getDay(date) {
  const dayIndex = date.getDay() - 1;
  return dayIndex === -1 ? 6 : dayIndex;
}

// Массив дней недели, начиная с понедельника
const days = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

export async function addStudent(data) {
  try {
    console.log(data, "Schedule", data.items[0].timeLinesArray[0].startTime);
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

    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    if (!token_) {
      throw new Error("Invalid token");
    }

    const userId = await token_.userId;

    if (!userId) {
      throw new Error("Invalid token");
    }

    const createdGroup = await db.group.create({
      data: {
        groupName: "",
        userId,
        items: {
          create: items.map((item) => ({
            itemName: item.itemName,
            tryLessonCheck: item.tryLessonCheck || false,
            tryLessonCost: item.tryLessonCost || "",
            todayProgramStudent: item.todayProgramStudent || "",
            targetLesson: item.targetLesson || "",
            programLesson: item.programLesson || "",
            typeLesson: Number(item.typeLesson) || 1, // Преобразование в число
            placeLesson: item.placeLesson || "",
            timeLesson: item.timeLesson || "",
            valueMuiSelectArchive: item.valueMuiSelectArchive || 1,
            startLesson: item.startLesson ? new Date(item.startLesson) : null,
            endLesson: item.endLesson ? new Date(item.endLesson) : null,
            nowLevel: item.nowLevel || 0,
            lessonDuration: item.lessonDuration || null,
            timeLinesArray: item.timeLinesArray || {},
            userId: userId,
          })),
        },
        students: {
          create: [
            {
              nameStudent,
              contactFace,
              phoneNumber,
              email,
              address: "",
              linkStudent: link || "",
              costStudent: cost || "",
              commentStudent,
              prePayCost,
              prePayDate: prePayDate ? new Date(prePayDate) : null,
              selectedDate: null,
              storyLesson: "",
              costOneLesson,
              targetLessonStudent: "",
              todayProgramStudent: "",
              userId: userId,
            },
          ],
        },
      },
    });

    const createdItems = await Promise.all(
      items.map((item) =>
        db.item.create({
          data: {
            itemName: item.itemName,
            tryLessonCheck: item.tryLessonCheck || false,
            tryLessonCost: item.tryLessonCost || "",
            todayProgramStudent: item.todayProgramStudent || "",
            targetLesson: item.targetLesson || "",
            programLesson: item.programLesson || "",
            typeLesson: Number(item.typeLesson) || 1,
            placeLesson: item.placeLesson || "",
            timeLesson: item.timeLesson || "",
            valueMuiSelectArchive: item.valueMuiSelectArchive || 1,
            startLesson: item.startLesson ? new Date(item.startLesson) : null,
            endLesson: item.endLesson ? new Date(item.endLesson) : null,
            nowLevel: item.nowLevel || 0,
            lessonDuration: item.lessonDuration || null,
            timeLinesArray: item.timeLinesArray || {},
            userId: userId,
            group: {
              connect: {
                id: createdGroup.id,
              },
            },
          },
        })
      )
    );

    for (const item of createdItems) {
      // Определяем диапазон дат
      const startDate = item.startLesson;
      const endDate = item.endLesson;
      const daysToAdd = differenceInDays(endDate, startDate);

      // Создаем массив дат в заданном диапазоне
      const dateRange = Array.from({ length: daysToAdd + 1 }, (_, i) =>
        addDays(startDate, i)
      );

      // Для каждой даты проверяем наличие активных записей в расписании
      for (const date of dateRange) {
        const dayOfWeek = getDay(date);
        const scheduleForDay = item.timeLinesArray[dayOfWeek]; // Здесь укажите переменную, содержащую ваше недельное расписание

        const cond =
          scheduleForDay.startTime.hour === 0 &&
          scheduleForDay.startTime.minute === 0 &&
          scheduleForDay.endTime.hour === 0 &&
          scheduleForDay.endTime.minute === 0;

        //get lessonPrice
        const costOneLesson = await db.group.findUnique({
          where: {
            id: createdGroup.id,
          },
          select: {
            students: {
              where: {
                userId: userId,
              },
              select: {
                costOneLesson: true,
              },
            },
          },
        });

        //get day of month (number)
        const dayOfMonth = date.getDate();

        if (!cond) {
          // Создаем запись в базе данных только для активных дней
          console.log(
            "Создаем запись в базе данных только для активных дней",
            costOneLesson.students[0].costOneLesson,
            "group",
            createdGroup
          );
          await db.studentSchedule.create({
            data: {
              day: dayOfMonth.toString(),
              groupId: createdGroup.id,
              workCount: item.workCount || 0, // Здесь укажите данные, которые нужно добавить в запись
              lessonsCount: 1,
              lessonsPrice: Number(costOneLesson.students[0].costOneLesson),
              workPrice: item.workPrice || 0,
              month: (date.getMonth() + 1).toString(),
              timeLinesArray: item.timeLinesArray,
              isChecked: false,
              itemName: item.itemName,
              studentName: nameStudent,
              typeLesson: item.typeLesson,
              year: date.getFullYear().toString(),
              itemId: item.id, // Пример подключения к созданному элементу, замените на нужный вам
              userId: userId,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error("Error creating group:", error);
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
        email: true,
      },
    });

    console.log(students);
    io.emit("getStudentList", students);
    return students;
  } catch (error) {
    console.error("Error fetching student list:", error);
    io.emit("getStudentList", {
      error: "Error fetching student list",
    });
  }
}

export async function getStudentWithItems(studentId: string) {
  try {
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        group: {
          include: {
            items: true,
          },
        },
      },
    });

    return student;
  } catch (error) {
    console.error("Error fetching student with items:", error);
    io.emit("getStudentWithItems", {
      error: "Error fetching student with items",
    });
  }
}

export async function getStudentsByDate(data: {
  day: string;
  month: string;
  year: string;
  token: string;
}) {
  const { day, month, year, token } = data;

  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });

  const userId = token_.userId;

  console.log(day, month, year, userId);

  if (!userId) {
    io.emit("getStudentsByDate", {
      error: "Invalid token",
    });
  }

  const dayOfWeekIndex = getDay(
    new Date(Number(year), Number(month) - 1, Number(day))
  );

  //get students names, and item for this day, month, year by studentSchedule
  const studentSchedules = await db.studentSchedule.findMany({
    where: {
      day,
      month,
      year,
      userId,
    },

    include: {
      item: {
        select: {
          itemName: true,
          timeLinesArray: true,
          tryLessonCheck: true,
          typeLesson: true,
          group: {
            include: {
              students: {
                select: {
                  nameStudent: true,
                  costOneLesson: true,
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const dataToEmit = studentSchedules.map((schedule) => {
    const { item } = schedule;
    const student = item.group.students[0]; // Assuming there's only one student per group
    const timeLinesArray = schedule.timeLinesArray;

    const daySchedule = timeLinesArray[dayOfWeekIndex];
    console.log(" daySchedule", daySchedule, "dayOfWeekIndex", dayOfWeekIndex);

    return {
      id: schedule.id,
      nameStudent: student.nameStudent,
      costOneLesson: schedule.lessonsPrice,
      studentId: student.id,
      itemName: schedule.itemName,
      typeLesson: schedule.typeLesson,
      isCheck: schedule.isChecked,
      tryLessonCheck: item.tryLessonCheck,
      startTime: daySchedule?.startTime,
      endTime: daySchedule?.endTime,
    };
  });

  console.log(studentSchedules);
  console.log(dataToEmit);

  io.emit("getStudentsByDate", dataToEmit);
}

export async function updateStudentSchedule(data: {
  id: string;
  day: string;
  month: string;
  year: string;
  lessonsPrice?: number;
  itemName?: string;
  typeLesson?: number;
  isChecked?: boolean;
  studentName?: string;
  startTime?: { hour: number; minute: number };
  endTime?: { hour: number; minute: number };
}) {
  const {
    id,
    day,
    month,
    year,
    lessonsPrice,
    itemName,
    typeLesson,
    isChecked,
    studentName,
    startTime,
    endTime,
  } = data;

  const updatedFields: {
    lessonsPrice?: number;
    itemName?: string;
    typeLesson?: number;
    isChecked?: boolean;
    studentName?: string;
    timeLinesArray?: {
      [key: number]: {
        id: number;
        day: string;
        active: boolean;
        endTime: { hour: number; minute: number };
        startTime: { hour: number; minute: number };
        editingEnd: boolean;
        editingStart: boolean;
      };
    };
  } = {};

  if (lessonsPrice !== undefined)
    updatedFields.lessonsPrice = Number(lessonsPrice);
  if (itemName !== undefined) updatedFields.itemName = itemName;
  if (typeLesson !== undefined) updatedFields.typeLesson = typeLesson;
  if (isChecked !== undefined) updatedFields.isChecked = isChecked;
  if (studentName !== undefined) updatedFields.studentName = studentName;

  const dayOfWeekIndex = getDay(
    new Date(Number(year), Number(month) - 1, Number(day))
  );

  if (startTime !== undefined || endTime !== undefined) {
    const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    updatedFields.timeLinesArray = dayNames.map((dayName, index) => ({
      id: index + 1,
      day: dayName,
      active: false,
      endTime:
        index === dayOfWeekIndex && endTime ? endTime : { hour: 0, minute: 0 },
      startTime:
        index === dayOfWeekIndex && startTime
          ? startTime
          : { hour: 0, minute: 0 },
      editingEnd: false,
      editingStart: false,
    }));
  }

  const updatedSchedule = await db.studentSchedule.update({
    where: { id, day, month, year },
    data: updatedFields,
  });

  console.log(updatedSchedule);
  return updatedSchedule;
}

export async function getGroupByStudentId(data: any) {
  const { token, studentId } = data;

  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });

  const userId = token_.userId;

  try {
    const group = await db.student.findUnique({
      where: {
        id: studentId,
        userId: userId,
      },
      select: {
        group: {
          select: {
            id: true,
            items: true,
            students: true,
          },
        },
      },
    });

    io.emit("getGroupByStudentId", group);
    return group.group;
  } catch (error) {
    console.error("Error retrieving group:", error);
    throw error;
  }
}

export async function updateStudentAndItems(data: any) {
  const { id, items } = data;

  try {
    const updatedStudent = await db.student.update({
      where: {
        id: id,
      },
      data: {
        commentStudent: data.commentStudent,
        prePayCost: data.prePayCost,
        prePayDate: data.prePayDate,
        costOneLesson: data.costOneLesson,
        linkStudent: data.link,
        costStudent: data.costStudent,
        phoneNumber: data.phoneNumber,
        contactFace: data.contactFace,
        email: data.email,
        nameStudent: data.nameStudent,
      },
    });

    const group = await db.group.findUnique({
      where: {
        id: updatedStudent.groupId,
      },
    });

    const items_ = db.item.updateMany({
      where: {
        groupId: group.id,
      },
      data: items.map((itemData) => ({
        ...itemData,
      })),
    });

    io.emit("updateStudentAndItems", updatedStudent);

    return updatedStudent;
  } catch (error) {
    console.error("Error updating student and items:", error);
    throw error;
  }
}
