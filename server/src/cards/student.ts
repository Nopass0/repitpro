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
            year: date.getFullYear().toString(),
            itemId: item.id, // Пример подключения к созданному элементу, замените на нужный вам
            userId: userId,
          },
        });
      }
    }
  }
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
    const timeLinesArray = item.timeLinesArray;

    const daySchedule = timeLinesArray[dayOfWeekIndex];
    console.log(" daySchedule", daySchedule, "dayOfWeekIndex", dayOfWeekIndex);

    return {
      nameStudent: student.nameStudent,
      costOneLesson: student.costOneLesson,
      studentId: student.id,
      itemName: item.itemName,
      typeLesson: item.typeLesson,
      tryLessonCheck: item.tryLessonCheck,
      startTime: daySchedule?.startTime,
      endTime: daySchedule?.endTime,
    };
  });

  console.log(studentSchedules);
  console.log(dataToEmit);

  io.emit("getStudentsByDate", dataToEmit);
}
