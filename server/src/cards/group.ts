import { Prisma, PrismaClient } from "@prisma/client";
import { IStudentCardResponse, ITimeLine, IItemCard } from "../types";
import db from "../db";
import io from "../socket";
import { addDays, differenceInDays } from "date-fns";

function getDay(date) {
  const dayIndex = date.getDay() - 1;
  return dayIndex === -1 ? 6 : dayIndex;
}

export async function addGroup(data: any) {
  console.log(data);
  const token = await db.token.findFirst({
    where: {
      token: data.token,
    },
  });

  const userId = token.userId;

  const group = await db.group.create({
    data: {
      groupName: data.groupName,
      items: {
        create: data.items.map((item: any) => ({
          itemName: item.itemName,
          tryLessonCheck: item.tryLessonCheck,
          tryLessonCost: item.tryLessonCost,
          todayProgramStudent: item.todayProgramStudent,
          targetLesson: item.targetLesson,
          programLesson: item.programLesson,
          typeLesson: Number(item.typeLesson) || 1,
          placeLesson: item.placeLesson,
          timeLesson: item.timeLesson,
          startLesson: item.startLesson ? new Date(item.startLesson) : null,
          endLesson: item.endLesson ? new Date(item.endLesson) : null,
          lessonDuration: item.lessonDuration,
          nowLevel: item.nowLevel,
          valueMuiSelectArchive: item.valueMuiSelectArchive,
          timeLinesArray: item.timeLinesArray,
          userId: userId,
        })),
      },
      students: {
        create: data.students.map((student: any) => ({
          nameStudent: student.nameStudent,
          contactFace: student.contactFace,
          phoneNumber: student.phoneNumber,
          email: student.email,
          address: student.address,
          linkStudent: student.linkStudent,
          commentStudent: student.commentStudent,
          prePayCost: student.prePayCost,
          prePayDate: student.prePayDate,
          selectedDate: student.selectedDate,
          storyLesson: student.storyLesson,
          costOneLesson: student.costOneLesson,
          targetLessonStudent: student.targetLessonStudent,
          todayProgramStudent: student.todayProgramStudent,
          userId: userId,
          costStudent: student.costStudent,
        })),
      },
      userId: userId,
    },
    include: {
      students: true, // Включаем студентов в возвращаемый результат
    },
  });

  const createdItems = await Promise.all(
    data.items.map((item) =>
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
              id: group.id,
            },
          },
        },
      })
    )
  );

  // Создаем записи в studentSchedule для каждого студента
  for (const student of group.students) {
    for (const item of data.items) {
      for (const [index, day] of item.timeLinesArray.entries()) {
        if (day.active) {
          const startDate = item.startLesson;
          const date = addDays(startDate, index);
          const dayOfMonth = date.getDate();

          await db.studentSchedule.create({
            data: {
              day: dayOfMonth.toString(),
              groupId: group.id,
              studentId: student.id,
              workCount: item.workCount || 0,
              lessonsCount: 1,
              lessonsPrice: Number(student.costStudent),
              workPrice: item.workPrice || 0,
              month: (date.getMonth() + 1).toString(),
              year: date.getFullYear().toString(),
              itemId: item.id,
              userId: userId,
            },
          });
        }
      }
    }
  }

  return group;
}

// for (const item of createdItems) {
//   if (item.startLesson && item.endLesson) {
//     const startDate = new Date(item.startLesson);
//     const endDate = new Date(item.endLesson);
//     const diffInDays = differenceInDays(endDate, startDate);

//     const studentSchedules = [];
//     const students = group.students; // Получаем всех студентов из возвращаемого результата
//     const totalLessonPrice = students.reduce(
//       (sum, student) => sum + Number(student.costOneLesson),
//       0
//     );

//     for (let i = 0; i <= diffInDays; i++) {
//       const currentDate = addDays(startDate, i);
//       const day = currentDate.getDate().toString().padStart(2, "0");
//       const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
//       const year = currentDate.getFullYear().toString();

//       studentSchedules.push({
//         day,
//         groupId: group.id,
//         workCount: 0,
//         lessonsCount: 1,
//         lessonsPrice: totalLessonPrice,
//         workPrice: 0,
//         userId,
//         month,
//         year,
//         itemId: item.id,
//       });
//     }

//     await db.studentSchedule.createMany({
//       data: studentSchedules,
//     });
//   }
// }
