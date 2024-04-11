import { Prisma, PrismaClient } from "@prisma/client";
import { IStudentCardResponse, ITimeLine, IItemCard } from "../types";
import db from "../db";
import io from "../socket";
import { addDays, differenceInDays } from "date-fns";

function getDay(date) {
  const dayIndex = date.getDay() - 1;
  return dayIndex === -1 ? 6 : dayIndex;
}

export async function addGroup(data) {
  try {
    const { groupName, items, students, token } = data;

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
        groupName,
        userId,
        items: {
          create: items.map((item) => ({
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
          })),
        },
        students: {
          create: students.map((student) => ({
            nameStudent: student.nameStudent,
            contactFace: student.contactFace,
            phoneNumber: student.phoneNumber,
            email: student.email,
            address: student.address || "",
            linkStudent: student.linkStudent || "",
            costStudent: student.costStudent || "",
            commentStudent: student.commentStudent || "",
            prePayCost: student.prePayCost || "",
            prePayDate: student.prePayDate
              ? new Date(student.prePayDate)
              : null,
            selectedDate: null,
            storyLesson: student.storyLesson || "",
            costOneLesson: student.costOneLesson || "",
            targetLessonStudent: student.targetLessonStudent || "",
            todayProgramStudent: student.todayProgramStudent || "",
            userId: userId,
          })),
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
        const scheduleForDay = item.timeLinesArray[dayOfWeek];

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
              workCount: item.workCount || 0,
              lessonsCount: 1,
              lessonsPrice: Number(costOneLesson.students[0].costOneLesson),
              workPrice: item.workPrice || 0,
              month: (date.getMonth() + 1).toString(),
              timeLinesArray: item.timeLinesArray,
              isChecked: false,
              itemName: item.itemName,
              typeLesson: item.typeLesson,
              year: date.getFullYear().toString(),
              itemId: item.id,
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

export async function getGroupList(token) {
  try {
    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    if (!token_) {
      throw new Error("Invalid token");
    }

    const userId = token_.userId;

    const groups = await db.group.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        groupName: true,
        isArchived: true,
        items: {
          select: {
            itemName: true,
          },
        },
        students: {
          select: {
            nameStudent: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    });

    const groupsWithName = groups.filter((group) => group.groupName !== "");


    console.log(groups);
    io.emit("getGroupList", groupsWithName);
    return groups;
  } catch (error) {
    console.error("Error fetching group list:", error);
    io.emit("getGroupList", { error: "Error fetching group list" });
  }
}
