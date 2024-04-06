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

//temp
export async function updateStudents(data) {
  try {
    const { students, token } = data;
    const userId = await validateTokenAndGetUserId(token);

    if (!userId) {
      throw new Error("Invalid token");
    }

    const updatedStudents = await Promise.all(
      students.map(async (student) => {
        if (student.isDelete) {
          // Delete student if isDelete is true
          await db.student.delete({
            where: {
              id: student.studentId,
            },
          });
          return null;
        }

        const {
          studentId,
          nameStudent,
          costOneLesson,
          itemName,
          typeLesson,
          tryLessonCheck,
          startTime,
          endTime,
        } = student;

        // Update student and associated item
        const updatedStudent = await db.student.update({
          where: {
            id: studentId,
          },
          data: {
            nameStudent,
            costOneLesson,
          },
          include: {
            group: {
              include: {
                items: true,
              },
            },
          },
        });

        const updatedItem = await db.item.update({
          where: {
            id: updatedStudent.group.items.find(
              (item) => item.itemName === itemName
            )?.id,
          },
          data: {
            itemName,
            typeLesson,
            tryLessonCheck,
            timeLinesArray: {
              [getDay(new Date())]: {
                startTime,
                endTime,
              },
            },
          },
        });

        return {
          ...student,
          updatedItem,
        };
      })
    );

    const filteredStudents = updatedStudents.filter(
      (student) => student !== null
    );
    io.emit("updateStudents", filteredStudents);
  } catch (error) {
    console.error("Error updating students:", error);
    io.emit("updateStudents", {
      error: "Error updating students",
    });
  }
}

// export async function updateStudents(data) {
//   try {
//     const { students, token } = data;
//     const userId = await validateTokenAndGetUserId(token);

//     if (!userId) {
//       throw new Error("Invalid token");
//     }

//     const currentDate = new Date();
//     const day = currentDate.getDate().toString();
//     const month = (currentDate.getMonth() + 1).toString();
//     const year = currentDate.getFullYear().toString();
//     const dayOfWeekIndex = getDay(currentDate);

//     const updatedStudentSchedules = await Promise.all(
//       students.map(async (student) => {
//         if (student.isDelete) {
//           // Delete student schedule if isDelete is true
//           await db.studentSchedule.deleteMany({
//             where: {
//               day,
//               month,
//               year,
//               userId,
//               itemId: student.itemId,
//             },
//           });
//           return null;
//         }

//         const {
//           studentId,
//           nameStudent,
//           costOneLesson,
//           itemName,
//           typeLesson,
//           tryLessonCheck,
//           startTime,
//           endTime,
//           itemId,
//         } = student;

//         // Find or create the item
//         let item = await db.item.findUnique({
//           where: {
//             id: itemId,
//           },
//         });

//         if (!item) {
//           item = await db.item.create({
//             data: {
//               itemName,
//               typeLesson,
//               tryLessonCheck,
//               timeLinesArray: {
//                 [dayOfWeekIndex]: {
//                   startTimeHour: startTime.hour,
//                   startTimeMinute: startTime.minute,
//                   endTimeHour: endTime.hour,
//                   endTimeMinute: endTime.minute,
//                 },
//               },
//               userId,
//             },
//           });
//         } else {
//           item = await db.item.update({
//             where: {
//               id: itemId,
//             },
//             data: {
//               itemName,
//               typeLesson,
//               tryLessonCheck,
//               timeLinesArray: {
//                 [dayOfWeekIndex]: {
//                   startTimeHour: startTime.hour,
//                   startTimeMinute: startTime.minute,
//                   endTimeHour: endTime.hour,
//                   endTimeMinute: endTime.minute,
//                 },
//               },
//             },
//           });
//         }

//         // Update or create student schedule
//         let updatedSchedule = await db.studentSchedule.findUnique({
//           where: {
//             day_month_year_userId_itemId: {
//               day,
//               month,
//               year,
//               userId,
//               itemId: item.id,
//             },
//           },
//         });

//         if (updatedSchedule) {
//           updatedSchedule = await db.studentSchedule.update({
//             where: {
//               id: updatedSchedule.id,
//             },
//             data: {
//               lessonsPrice: parseFloat(costOneLesson),
//               lessonsCount: 1,
//             },
//           });
//         } else {
//           updatedSchedule = await db.studentSchedule.create({
//             data: {
//               day,
//               month,
//               year,
//               userId,
//               itemId: item.id,
//               lessonsPrice: parseFloat(costOneLesson),
//               lessonsCount: 1,

//             },
//           });
//         }

//         // Update student
//         const updatedStudent = await db.student.update({
//           where: {
//             id: studentId,
//           },
//           data: {
//             nameStudent,
//             costOneLesson,
//           },
//         });

//         return {
//           ...student,
//           updatedSchedule,
//           updatedItem: item,
//         };
//       })
//     );

//     const filteredStudents = updatedStudentSchedules.filter(
//       (student) => student !== null
//     );
//     io.emit("updateStudents", filteredStudents);
//   } catch (error) {
//     console.error("Error updating students:", error);
//     io.emit("updateStudents", {
//       error: "Error updating students",
//     });
//   }
// }
