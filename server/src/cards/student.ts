import { Prisma, PrismaClient } from "@prisma/client";
import {
  IStudentCardResponse,
  ITimeLine,
  IItemCard,
  IUploadFiles,
} from "../types";
import db from "../db";
import io from "../socket";
import { addDays, differenceInDays, isWithinInterval } from "date-fns";
import { randomBytes } from "crypto";
import { join } from "path";
import { mkdir, mkdirSync, writeFileSync } from "fs";
import { promises as fsPromises } from "fs";
import mime from "mime-types";
import { getBufferByFilePath, upload, uploadFiles } from "../files/files";
import { cache, strongCache } from "utils/Cache";
import { deleteFileById } from "utils/filesystem";

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

// export async function addStudent(data, socket: any) {
//   try {
//     // console.log(data, "Schedule", data.items[0].timeLinesArray[0]?.startTime); // Safe access with ?

//     const {
//       nameStudent,
//       phoneNumber,
//       contactFace,
//       email,
//       prePayCost,
//       prePayDate,
//       costOneLesson,
//       commentStudent,
//       linkStudent,
//       costStudent,
//       audios,
//       cost,
//       historyLessons,
//       files,
//       items,
//       token,
//     } = data;

//     const token_ = await db.token.findFirst({ where: { token } });

//     if (!token_) {
//       throw new Error("Invalid token");
//     }

//     const userId = token_.userId;

//     if (!userId) {
//       throw new Error("Invalid token");
//     }

//     const conflicts = [];

//     for (const item of items) {
//       const startDate = new Date(item.startLesson);
//       const endDate = new Date(item.endLesson);
//       const daysToAdd = differenceInDays(endDate, startDate);
//       const dateRange = Array.from({ length: daysToAdd + 1 }, (_, i) =>
//         addDays(startDate, i)
//       );

//       for (const date of dateRange) {
//         const dayOfWeek = getDay(date);
//         const scheduleForDay = item.timeLinesArray[dayOfWeek];

//         if (!scheduleForDay) {
//           console.warn(
//             `No schedule defined for day of week: ${dayOfWeek} on date: ${date}`
//           );
//           continue; // Skip this iteration if no schedule is defined for the day
//         }

//         const dayOfMonth = date.getDate();
//         const cacheKey = `${userId}-${dayOfMonth}-${
//           date.getMonth() + 1
//         }-${date.getFullYear()}`;
//         let existingSchedules = cache.get(cacheKey);

//         if (!existingSchedules) {
//           existingSchedules = await db.studentSchedule.findMany({
//             where: {
//               day: dayOfMonth.toString(),
//               month: (date.getMonth() + 1).toString(),
//               year: date.getFullYear().toString(),
//               userId,
//             },
//           });
//           cache.set(cacheKey, existingSchedules, 3600000); // 1 hour TTL
//         }

//         const conflictingSchedules = existingSchedules.filter((schedule) => {
//           const scheduleStartTime =
//             schedule.timeLinesArray[dayOfWeek]?.startTime;
//           const scheduleEndTime = schedule.timeLinesArray[dayOfWeek]?.endTime;

//           if (!scheduleStartTime || !scheduleEndTime) {
//             console.warn(
//               `Incomplete schedule found for day of week: ${dayOfWeek} in existing schedules`
//             );
//             return false;
//           }

//           const newStartTime = scheduleForDay.startTime;
//           const newEndTime = scheduleForDay.endTime;

//           return (
//             (newStartTime.hour < scheduleEndTime.hour ||
//               (newStartTime.hour === scheduleEndTime.hour &&
//                 newStartTime.minute <= scheduleEndTime.minute)) &&
//             (newEndTime.hour > scheduleStartTime.hour ||
//               (newEndTime.hour === scheduleStartTime.hour &&
//                 newEndTime.minute >= scheduleStartTime.minute))
//           );
//         });

//         if (conflictingSchedules.length > 0) {
//           const daysOfWeek = [
//             "Понедельник",
//             "Вторник",
//             "Среда",
//             "Четверг",
//             "Пятница",
//             "Суббота",
//             "Воскресенье",
//           ];
//           const dayName = daysOfWeek[dayOfWeek];
//           const startTime = `${scheduleForDay.startTime.hour}:${scheduleForDay.startTime.minute}`;
//           const endTime = `${scheduleForDay.endTime.hour}:${scheduleForDay.endTime.minute}`;

//           let conflict = {
//             day: dayName,
//             timeLines: conflictingSchedules.map((schedule) => {
//               const scheduleStartTime =
//                 schedule.timeLinesArray[dayOfWeek]?.startTime;
//               const scheduleEndTime =
//                 schedule.timeLinesArray[dayOfWeek]?.endTime;
//               return {
//                 time: `${scheduleStartTime.hour}:${scheduleStartTime.minute}-${scheduleEndTime.hour}:${scheduleEndTime.minute}`,
//               };
//             }),
//           };

//           conflicts.push(conflict);
//         }
//       }
//     }

//     if (conflicts.length > 0) {
//       socket.emit("addStudent", { error: conflicts, ok: false });
//       return;
//     }

//     const createdGroup = await db.group.create({
//       data: {
//         groupName: "",
//         userId,
//         historyLessons: JSON.parse(JSON.stringify(historyLessons)),
//         items: {
//           create: items.map((item) => ({
//             itemName: item.itemName,
//             tryLessonCheck: item.tryLessonCheck || false,
//             tryLessonCost: item.tryLessonCost || "",
//             todayProgramStudent: item.todayProgramStudent || "",
//             targetLesson: item.targetLesson || "",
//             programLesson: item.programLesson || "",
//             typeLesson: Number(item.typeLesson) || 1,
//             placeLesson: item.placeLesson || "",
//             timeLesson: item.timeLesson || "",
//             valueMuiSelectArchive: item.valueMuiSelectArchive || 1,
//             startLesson: item.startLesson ? new Date(item.startLesson) : null,
//             endLesson: item.endLesson ? new Date(item.endLesson) : null,
//             nowLevel: item.nowLevel || 0,
//             costOneLesson: item.costOneLesson || "",
//             lessonDuration: item.lessonDuration || null,
//             timeLinesArray: item.timeLinesArray || {},
//             userId,
//           })),
//         },
//         students: {
//           create: [
//             {
//               nameStudent,
//               contactFace,
//               phoneNumber,
//               email,
//               address: "",
//               linkStudent: linkStudent || "",
//               costStudent: costStudent || "",
//               commentStudent,
//               prePayCost,
//               prePayDate: prePayDate ? new Date(prePayDate) : null,
//               selectedDate: null,
//               storyLesson: "",
//               costOneLesson,
//               targetLessonStudent: "",
//               todayProgramStudent: "",
//               userId,
//             },
//           ],
//         },
//       },
//       select: {
//         id: true,
//         _count: true,
//         isArchived: true,
//         groupName: true,
//         students: true,
//         userId: true,
//         items: true,
//       },
//     });

//     for (const item of createdGroup.items) {
//       const startDate = new Date(item.startLesson);
//       const endDate = new Date(item.endLesson);
//       const daysToAdd = differenceInDays(endDate, startDate);
//       const dateRange = Array.from({ length: daysToAdd + 1 }, (_, i) =>
//         addDays(startDate, i)
//       );

//       for (const date of dateRange) {
//         const dayOfWeek = getDay(date);
//         const scheduleForDay = item.timeLinesArray[dayOfWeek];

//         if (!scheduleForDay) {
//           console.warn(
//             `No schedule defined for day of week: ${dayOfWeek} on date: ${date}`
//           );
//           continue;
//         }

//         const cond =
//           scheduleForDay.startTime.hour === 0 &&
//           scheduleForDay.startTime.minute === 0 &&
//           scheduleForDay.endTime.hour === 0 &&
//           scheduleForDay.endTime.minute === 0;

//         if (!cond) {
//           await db.studentSchedule.create({
//             data: {
//               day: date.getDate().toString(),
//               groupId: createdGroup.id,
//               workCount: 0,
//               lessonsCount: 1,
//               lessonsPrice: Number(item.costOneLesson),
//               workPrice: 0,
//               month: (date.getMonth() + 1).toString(),
//               timeLinesArray: item.timeLinesArray,
//               isChecked: false,
//               itemName: item.itemName,
//               studentName: nameStudent,
//               typeLesson: item.typeLesson,
//               year: date.getFullYear().toString(),
//               itemId: item.id,
//               userId,
//             },
//           });
//         }
//       }
//     }

//     let filePaths = [];

//     if (files.length > 0) {
//       filePaths = await upload(files, userId, "", (ids) => {
//         filePaths = ids;
//       });
//     }

//     let audiosIds = [];

//     if (audios.length > 0) {
//       audiosIds = await upload(audios, userId, "student/audio", (ids) => {
//         audiosIds = ids;
//       });
//     }

//     filePaths = [...filePaths, ...audiosIds];

//     await db.student.update({
//       where: {
//         id: createdGroup.students[0].id,
//       },
//       data: {
//         files: filePaths,
//       },
//     });

//     socket.emit("addStudent", { ok: true });
//   } catch (error) {
//     console.error("Error creating group:", error);
//     socket.emit("addStudent", { error: error.message, ok: false });
//   }
// }

function checkTimeConflicts(schedules) {
  const conflicts = [];

  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      if (schedules[i].day === schedules[j].day) {
        const startA = timeToMinutes(schedules[i].startTime);
        const endA = timeToMinutes(schedules[i].endTime);
        const startB = timeToMinutes(schedules[j].startTime);
        const endB = timeToMinutes(schedules[j].endTime);

        if (
          (startA < endB && endA > startB) ||
          (startB < endA && endB > startA)
        ) {
          conflicts.push({
            day: schedules[i].day,
            conflictA: `${formatTime(schedules[i].startTime)}-${formatTime(
              schedules[i].endTime
            )}`,
            conflictB: `${formatTime(schedules[j].startTime)}-${formatTime(
              schedules[j].endTime
            )}`,
          });
        }
      }
    }
  }

  return conflicts;
}

function timeToMinutes(time) {
  return time.hour * 60 + time.minute;
}

function formatTime(time) {
  return `${time.hour.toString().padStart(2, "0")}:${time.minute
    .toString()
    .padStart(2, "0")}`;
}

// export async function addStudent(data, socket: any) {
//   try {
//     const {
//       nameStudent,
//       phoneNumber,
//       contactFace,
//       email,
//       prePayCost,
//       prePayDate,
//       costOneLesson,
//       commentStudent,
//       prePay,
//       linkStudent,
//       costStudent,
//       audios,
//       cost,
//       historyLessons,
//       files,
//       items,
//       token,
//     } = data;

//     const token_ = await db.token.findFirst({ where: { token } });

//     if (!token_) {
//       throw new Error("Invalid token");
//     }

//     const userId = token_.userId;

//     if (!userId) {
//       throw new Error("Invalid token");
//     }

//     const conflicts = [];
//     const freeSlots = {};

//     for (const item of items) {
//       const startDate = new Date(item.startLesson);
//       const endDate = new Date(item.endLesson);
//       const daysToAdd = differenceInDays(endDate, startDate);
//       const dateRange = Array.from({ length: daysToAdd + 1 }, (_, i) =>
//         addDays(startDate, i)
//       );

//       for (const date of dateRange) {
//         const dayOfWeek = getDay(date);
//         const scheduleForDay = item.timeLinesArray[dayOfWeek];

//         if (!scheduleForDay) {
//           console.warn(
//             `No schedule defined for day of week: ${dayOfWeek} on date: ${date}`
//           );
//           continue; // Skip this iteration if no schedule is defined for the day
//         }

//         const dayOfMonth = date.getDate();
//         const cacheKey = `${userId}-${dayOfMonth}-${
//           date.getMonth() + 1
//         }-${date.getFullYear()}`;
//         let existingSchedules;
//         // let existingSchedules = cache.get(cacheKey);

//         // if (!existingSchedules) {
//         existingSchedules = await db.studentSchedule.findMany({
//           where: {
//             day: dayOfMonth.toString(),
//             month: (date.getMonth() + 1).toString(),
//             year: date.getFullYear().toString(),
//             userId,
//           },
//         });
//         // cache.set(cacheKey, existingSchedules, 3600000); // 1 hour TTL
//         // }

//         const conflictingSchedules = existingSchedules.filter((schedule) => {
//           const scheduleStartTime =
//             schedule.timeLinesArray[dayOfWeek]?.startTime;
//           const scheduleEndTime = schedule.timeLinesArray[dayOfWeek]?.endTime;

//           if (!scheduleStartTime || !scheduleEndTime) {
//             console.warn(
//               `Incomplete schedule found for day of week: ${dayOfWeek} in existing schedules`
//             );
//             return false;
//           }

//           const newStartTime = scheduleForDay.startTime;
//           const newEndTime = scheduleForDay.endTime;

//           return (
//             (newStartTime.hour < scheduleEndTime.hour ||
//               (newStartTime.hour === scheduleEndTime.hour &&
//                 newStartTime.minute <= scheduleEndTime.minute)) &&
//             (newEndTime.hour > scheduleStartTime.hour ||
//               (newEndTime.hour === scheduleStartTime.hour &&
//                 newEndTime.minute >= scheduleStartTime.minute))
//           );
//         });

//         if (conflictingSchedules.length > 0) {
//           const daysOfWeek = [
//             "Понедельник",
//             "Вторник",
//             "Среда",
//             "Четверг",
//             "Пятница",
//             "Суббота",
//             "Воскресенье",
//           ];
//           const dayName = daysOfWeek[dayOfWeek];
//           const startTime = `${scheduleForDay.startTime.hour}:${scheduleForDay.startTime.minute}`;
//           const endTime = `${scheduleForDay.endTime.hour}:${scheduleForDay.endTime.minute}`;

//           let conflict = {
//             day: dayName,
//             timeLines: conflictingSchedules.map((schedule) => {
//               const scheduleStartTime =
//                 schedule.timeLinesArray[dayOfWeek]?.startTime;
//               const scheduleEndTime =
//                 schedule.timeLinesArray[dayOfWeek]?.endTime;
//               return {
//                 time: `${scheduleStartTime.hour}:${scheduleStartTime.minute}-${scheduleEndTime.hour}:${scheduleEndTime.minute}`,
//               };
//             }),
//           };

//           conflicts.push(conflict);
//         } else {
//           const freeSlot = {
//             startTime: `${scheduleForDay.startTime.hour}:${scheduleForDay.startTime.minute}`,
//             endTime: `${scheduleForDay.endTime.hour}:${scheduleForDay.endTime.minute}`,
//           };
//           if (!freeSlots[dayOfWeek]) {
//             freeSlots[dayOfWeek] = [];
//           }
//           freeSlots[dayOfWeek].push(freeSlot);
//         }
//       }
//     }

//     if (conflicts.length > 0) {
//       socket.emit("addStudent", { error: conflicts, freeSlots, ok: false });
//       return;
//     }

//     const createdGroup = await db.group.create({
//       data: {
//         groupName: "",
//         userId,
//         historyLessons: JSON.parse(JSON.stringify(historyLessons)),
//         items: {
//           create: items.map((item) => ({
//             itemName: item.itemName,
//             tryLessonCheck: item.tryLessonCheck || false,
//             tryLessonCost: item.tryLessonCost || "",
//             todayProgramStudent: item.todayProgramStudent || "",
//             targetLesson: item.targetLesson || "",
//             programLesson: item.programLesson || "",
//             typeLesson: Number(item.typeLesson) || 1,
//             placeLesson: item.placeLesson || "",
//             timeLesson: item.timeLesson || "",
//             valueMuiSelectArchive: item.valueMuiSelectArchive || 1,
//             startLesson: item.startLesson ? new Date(item.startLesson) : null,
//             endLesson: item.endLesson ? new Date(item.endLesson) : null,
//             nowLevel: item.nowLevel || 0,
//             costOneLesson: item.costOneLesson || "",
//             lessonDuration: item.lessonDuration || null,
//             timeLinesArray: item.timeLinesArray || {},
//             userId,
//           })),
//         },
//         students: {
//           create: [
//             {
//               nameStudent,
//               contactFace,
//               phoneNumber,
//               email,
//               prePay: prePay || [],
//               address: "",
//               linkStudent: linkStudent || "",
//               costStudent: costStudent || "",
//               commentStudent,
//               prePayCost,
//               prePayDate: prePayDate ? new Date(prePayDate) : null,
//               selectedDate: null,
//               storyLesson: "",
//               costOneLesson,
//               targetLessonStudent: "",
//               todayProgramStudent: "",
//               userId,
//             },
//           ],
//         },
//       },
//       select: {
//         id: true,
//         _count: true,
//         isArchived: true,
//         groupName: true,
//         students: true,
//         userId: true,
//         items: true,
//       },
//     });

//     for (const item of createdGroup.items) {
//       const startDate = new Date(item.startLesson);
//       const endDate = new Date(item.endLesson);
//       const daysToAdd = differenceInDays(endDate, startDate);
//       const dateRange = Array.from({ length: daysToAdd + 1 }, (_, i) =>
//         addDays(startDate, i)
//       );

//       for (const date of dateRange) {
//         const dayOfWeek = getDay(date);
//         const scheduleForDay = item.timeLinesArray[dayOfWeek];

//         if (!scheduleForDay) {
//           console.warn(
//             `No schedule defined for day of week: ${dayOfWeek} on date: ${date}`
//           );
//           continue;
//         }

//         const cond =
//           scheduleForDay.startTime.hour === 0 &&
//           scheduleForDay.startTime.minute === 0 &&
//           scheduleForDay.endTime.hour === 0 &&
//           scheduleForDay.endTime.minute === 0;

//         if (!cond) {
//           await db.studentSchedule.create({
//             data: {
//               day: date.getDate().toString(),
//               groupId: createdGroup.id,
//               workCount: 0,
//               lessonsCount: 1,
//               lessonsPrice: Number(item.costOneLesson),
//               workPrice: 0,
//               month: (date.getMonth() + 1).toString(),
//               timeLinesArray: item.timeLinesArray,
//               isChecked: false,
//               itemName: item.itemName,
//               studentName: nameStudent,
//               typeLesson: item.typeLesson,
//               year: date.getFullYear().toString(),
//               itemId: item.id,
//               userId,
//             },
//           });
//         }
//       }
//     }

//     let filePaths = [];

//     if (files.length > 0) {
//       filePaths = await upload(files, userId, "", (ids) => {
//         filePaths = ids;
//       });
//     }

//     let audiosIds = [];

//     if (audios.length > 0) {
//       audiosIds = await upload(audios, userId, "student/audio", (ids) => {
//         audiosIds = ids;
//       });
//     }

//     filePaths = [...filePaths, ...audiosIds];

//     await db.student.update({
//       where: {
//         id: createdGroup.students[0].id,
//       },
//       data: {
//         files: filePaths,
//       },
//     });

//     socket.emit("addStudent", { ok: true });
//   } catch (error) {
//     console.error("Error creating group:", error);
//     socket.emit("addStudent", { error: error.message, ok: false });
//   }
// }

// export async function addStudent(data, socket: any) {
//   try {
//     const {
//       nameStudent,
//       phoneNumber,
//       contactFace,
//       email,
//       prePayCost,
//       prePayDate,
//       costOneLesson,
//       commentStudent,
//       prePay,
//       linkStudent,
//       costStudent,
//       audios,
//       cost,
//       historyLessons,
//       files,
//       items,
//       token,
//     } = data;

//     const token_ = await db.token.findFirst({ where: { token } });

//     if (!token_) {
//       throw new Error("Invalid token");
//     }

//     const userId = token_.userId;

//     if (!userId) {
//       throw new Error("Invalid token");
//     }

//     function timeToMinutes(time) {
//       return time.hour * 60 + time.minute;
//     }

//     function formatTime(time) {
//       return `${time.hour.toString().padStart(2, "0")}:${time.minute
//         .toString()
//         .padStart(2, "0")}`;
//     }

//     const conflicts = [];
//     const freeSlots = {};

//     for (const item of items) {
//       const startDate = new Date(item.startLesson);
//       const endDate = new Date(item.endLesson);
//       const daysToAdd = differenceInDays(endDate, startDate);
//       const dateRange = Array.from({ length: daysToAdd + 1 }, (_, i) =>
//         addDays(startDate, i)
//       );

//       for (const date of dateRange) {
//         const dayOfWeek = getDay(date);
//         const scheduleForDay = item.timeLinesArray[dayOfWeek];

//         if (
//           !scheduleForDay ||
//           (scheduleForDay.startTime.hour === 0 &&
//             scheduleForDay.startTime.minute === 0 &&
//             scheduleForDay.endTime.hour === 0 &&
//             scheduleForDay.endTime.minute === 0)
//         ) {
//           continue;
//         }

//         const dayOfMonth = date.getDate();
//         const month = (date.getMonth() + 1).toString();
//         const year = date.getFullYear().toString();

//         const existingSchedules = await db.studentSchedule.findMany({
//           where: {
//             day: dayOfMonth.toString(),
//             month: month,
//             year: year,
//             userId,
//           },
//         });

//         const newStartTime = timeToMinutes(scheduleForDay.startTime);
//         const newEndTime = timeToMinutes(scheduleForDay.endTime);

//         const conflictingSchedules = existingSchedules.filter((schedule) => {
//           const scheduleStartTime =
//             schedule.timeLinesArray[dayOfWeek]?.startTime;
//           const scheduleEndTime = schedule.timeLinesArray[dayOfWeek]?.endTime;

//           if (!scheduleStartTime || !scheduleEndTime) {
//             return false;
//           }

//           const existingStartTime = timeToMinutes(scheduleStartTime);
//           const existingEndTime = timeToMinutes(scheduleEndTime);

//           return (
//             newStartTime < existingEndTime && newEndTime > existingStartTime
//           );
//         });

//         if (conflictingSchedules.length > 0) {
//           const daysOfWeek = [
//             "Понедельник",
//             "Вторник",
//             "Среда",
//             "Четверг",
//             "Пятница",
//             "Суббота",
//             "Воскресенье",
//           ];
//           const dayName = daysOfWeek[dayOfWeek];

//           conflictingSchedules.forEach((schedule) => {
//             const conflictStartTime =
//               schedule.timeLinesArray[dayOfWeek].startTime;
//             const conflictEndTime = schedule.timeLinesArray[dayOfWeek].endTime;
//             conflicts.push({
//               day: dayName,
//               timeLines: [
//                 {
//                   time: `${formatTime(conflictStartTime)}-${formatTime(
//                     conflictEndTime
//                   )}`,
//                 },
//               ],
//             });
//           });
//         } else {
//           const freeSlot = {
//             startTime: formatTime(scheduleForDay.startTime),
//             endTime: formatTime(scheduleForDay.endTime),
//           };
//           if (!freeSlots[dayOfWeek]) {
//             freeSlots[dayOfWeek] = [];
//           }
//           freeSlots[dayOfWeek].push(freeSlot);
//         }
//       }
//     }

//     if (conflicts.length > 0) {
//       socket.emit("addStudent", { error: conflicts, freeSlots, ok: false });
//       return;
//     }

//     // Остальной код функции остается без изменений
//     // ...

//     socket.emit("addStudent", { ok: true });
//   } catch (error) {
//     console.error("Error creating group:", error);
//     socket.emit("addStudent", { error: error.message, ok: false });
//   }
// }

export async function addStudent(data, socket: any) {
  try {
    const {
      nameStudent,
      phoneNumber,
      contactFace,
      email,
      prePayCost,
      prePayDate,
      costOneLesson,
      commentStudent,
      prePay,
      linkStudent,
      costStudent,
      audios,
      cost,
      historyLessons,
      files,
      items,
      token,
    } = data;

    const token_ = await db.token.findFirst({ where: { token } });

    if (!token_) {
      throw new Error("Invalid token");
    }

    const userId = token_.userId;

    if (!userId) {
      throw new Error("Invalid token");
    }

    const createdGroup = await db.group.create({
      data: {
        groupName: "",
        userId,
        historyLessons: JSON.parse(JSON.stringify(historyLessons)),
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
            costOneLesson: item.costOneLesson || "",
            lessonDuration: item.lessonDuration || null,
            timeLinesArray: item.timeLinesArray || {},
            userId,
          })),
        },
        students: {
          create: [
            {
              nameStudent,
              contactFace,
              phoneNumber,
              email,
              prePay: prePay || [],
              address: "",
              linkStudent: linkStudent || "",
              costStudent: costStudent || "",
              commentStudent,
              prePayCost,
              prePayDate: prePayDate ? new Date(prePayDate) : null,
              selectedDate: null,
              storyLesson: "",
              costOneLesson,
              targetLessonStudent: "",
              todayProgramStudent: "",
              userId,
            },
          ],
        },
      },
      select: {
        id: true,
        _count: true,
        isArchived: true,
        groupName: true,
        students: true,
        userId: true,
        items: true,
      },
    });

    for (const item of createdGroup.items) {
      const startDate = new Date(item.startLesson);
      const endDate = new Date(item.endLesson);
      const daysToAdd = differenceInDays(endDate, startDate);
      const dateRange = Array.from({ length: daysToAdd + 1 }, (_, i) =>
        addDays(startDate, i)
      );

      for (const date of dateRange) {
        const dayOfWeek = getDay(date);
        const scheduleForDay = item.timeLinesArray[dayOfWeek];

        if (!scheduleForDay) {
          console.warn(
            `No schedule defined for day of week: ${dayOfWeek} on date: ${date}`
          );
          continue;
        }

        const cond =
          scheduleForDay.startTime.hour === 0 &&
          scheduleForDay.startTime.minute === 0 &&
          scheduleForDay.endTime.hour === 0 &&
          scheduleForDay.endTime.minute === 0;

        if (!cond) {
          await db.studentSchedule.create({
            data: {
              day: date.getDate().toString(),
              groupId: createdGroup.id,
              workCount: 0,
              lessonsCount: 1,
              lessonsPrice: Number(item.costOneLesson),
              workPrice: 0,
              month: (date.getMonth() + 1).toString(),
              timeLinesArray: item.timeLinesArray,
              isChecked: false,
              itemName: item.itemName,
              studentName: nameStudent,
              typeLesson: item.typeLesson,
              year: date.getFullYear().toString(),
              itemId: item.id,
              userId,
            },
          });
        }
      }
    }

    let filePaths = [];

    if (files.length > 0) {
      filePaths = await upload(files, userId, "", (ids) => {
        filePaths = ids;
      });
    }

    let audiosIds = [];

    if (audios.length > 0) {
      audiosIds = await upload(audios, userId, "student/audio", (ids) => {
        audiosIds = ids;
      });
    }

    filePaths = [...filePaths, ...audiosIds];

    await db.student.update({
      where: {
        id: createdGroup.students[0].id,
      },
      data: {
        files: filePaths,
      },
    });

    socket.emit("addStudent", { ok: true });
  } catch (error) {
    console.error("Error creating group:", error);
    socket.emit("addStudent", { error: error.message, ok: false });
  }
}

export async function getStudentList(token, socket: any) {
  try {
    const userId = await db.token.findFirst({
      where: {
        token,
      },
    });

    const students = await db.student.findMany({
      where: {
        userId: userId.userId,
        group: {
          groupName: "",
        },
      },
      select: {
        id: true,
        nameStudent: true,
        phoneNumber: true,
        isArchived: true,
        email: true,
        prePay: true,
        contactFace: true,
      },
    });

    // console.log(students);
    socket.emit("getStudentList", students);
    return students;
  } catch (error) {
    console.error("Error fetching student list:", error);
    socket.emit("getStudentList", {
      error: "Error fetching student list",
    });
  }
}

export async function getStudentWithItems(studentId: string, socket: any) {
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

    if (student) {
      const currentDate = new Date();
      const remainingPrePay = calculateRemainingPrePay(student, currentDate);

      // Находим последнюю предоплату
      const lastPrePay = student.prePay.reduce(
        (latest, current) => {
          return new Date(current.date) > new Date(latest.date)
            ? current
            : latest;
        },
        { date: new Date(0), cost: "0" }
      );

      const enrichedStudent = {
        ...student,
        remainingPrePay,
        prePayCost: lastPrePay.cost,
        formattedPrePay: `${
          lastPrePay.cost
        } - (Остаток: ${remainingPrePay.toFixed(0)}) ₽`,
        historyLessons:
          student.group.historyLessons[0]?.map((lesson) => ({
            ...lesson,
            isPaid:
              new Date(lesson.date) <= currentDate &&
              parseFloat(lesson.price) <= remainingPrePay,
          })) || [],
      };

      socket.emit("getStudentWithItems", enrichedStudent);
      return enrichedStudent;
    } else {
      socket.emit("getStudentWithItems", { error: "Student not found" });
    }
  } catch (error) {
    console.error("Error fetching student with items:", error);
    socket.emit("getStudentWithItems", {
      error: "Error fetching student with items",
    });
  }
}

function calculateRemainingPrePay(student: any, currentDate: Date): number {
  let remainingPrePay = 0;
  let lastPrePayDate = new Date(0);

  // Находим последнюю предоплату перед или равную текущей дате
  const sortedPrePay = student.prePay.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  for (const pay of sortedPrePay) {
    const payDate = new Date(pay.date);
    if (payDate <= currentDate) {
      remainingPrePay = parseFloat(pay.cost);
      lastPrePayDate = payDate;
      break;
    }
  }

  // Вычитаем стоимость уроков между последней предоплатой и текущей датой
  const historyLessons = student.group.historyLessons[0];
  for (const lesson of historyLessons) {
    const lessonDate = new Date(lesson.date);
    if (lessonDate > lastPrePayDate && lessonDate <= currentDate) {
      remainingPrePay -= parseFloat(lesson.price);
    }
  }

  return Math.max(remainingPrePay, 0);
}
function calculateRemainingPrePay(student: any, currentDate: Date): number {
  let remainingPrePay = 0;
  let lastPrePayDate = new Date(0);

  // Находим последнюю предоплату перед или равную текущей дате
  const sortedPrePay = student.prePay.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  for (const pay of sortedPrePay) {
    const payDate = new Date(pay.date);
    if (payDate <= currentDate) {
      remainingPrePay = parseFloat(pay.cost);
      lastPrePayDate = payDate;
      break;
    }
  }

  // Вычитаем стоимость уроков между последней предоплатой и текущей датой
  const historyLessons = student.group.historyLessons[0];
  for (const lesson of historyLessons) {
    const lessonDate = new Date(lesson.date);
    if (lessonDate > lastPrePayDate && lessonDate <= currentDate) {
      remainingPrePay -= parseFloat(lesson.price);
    }
  }

  return Math.max(remainingPrePay, 0);
}

export async function getStudentsByDate(
  data: {
    day: string;
    month: string;
    year: string;
    token: string;
    isGroup: boolean;
    studentId: string;
  },
  socket: any
) {
  const { day, month, year, token, isGroup, studentId } = data;
  const token_ = await db.token.findFirst({ where: { token } });
  const userId = token_?.userId;

  // console.log(
  //   "getStudentsByDate-------------------------",
  //   data,
  //   "------------------------------------------------------------"
  // );

  if (!userId) {
    socket.emit("getStudentsByDate", { error: "Invalid token" });
    return;
  }

  const dayOfWeekIndex = getDay(
    new Date(Number(year), Number(month) - 1, Number(day))
  );

  const studentSchedules = await db.studentSchedule.findMany({
    where: { day, month, year, userId, clientId: null },
    select: {
      id: true,
      studentName: true,
      lessonsPrice: true,
      itemName: true,
      timeLinesArray: true,
      typeLesson: true,
      isChecked: true,
      homeFiles: true,
      classFiles: true,
      lessonsCount: true,
      homeWork: true,
      classWork: true,

      isCancel: true,
      homeStudentsPoints: true,
      classStudentsPoints: true,
      groupId: true,
      clientId: true,
      homeAudios: true,
      classAudios: true,
      item: {
        select: {
          tryLessonCheck: true,
          tryLessonCost: true,

          todayProgramStudent: true,
          targetLesson: true,
          programLesson: true,
          placeLesson: true,
          timeLesson: true,
          group: {
            include: {
              students: {
                select: {
                  id: true,
                  nameStudent: true,
                  costOneLesson: true,
                  tryLessonCheck: true,
                  prePay: true,
                  prePayCost: true,
                  prePayDate: true,
                  tryLessonCost: true,
                  targetLessonStudent: true,
                  todayProgramStudent: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // console.log("This is isGroup", isGroup);
  if (isGroup) {
    const groupsData = [];
    // console.log("This is GROUP");
    let totalPrice = 0;
    for (const schedule of studentSchedules) {
      const { item } = schedule;
      const timeLinesArray = schedule.timeLinesArray;
      const daySchedule = timeLinesArray[dayOfWeekIndex];
      const homeFiles = await db.file.findMany({
        where: { id: { in: schedule.homeFiles }, extraType: "home" },
      });
      const classFiles = await db.file.findMany({
        where: { id: { in: schedule.classFiles }, extraType: "class" },
      });
      const homeAudios = await db.file.findMany({
        where: { id: { in: schedule.homeAudios }, extraType: "home/audio" },
      });
      const classAudios = await db.file.findMany({
        where: { id: { in: schedule.classAudios }, extraType: "class/audio" },
      });
      const groupStudentSchedule = schedule.item.group.groupName;

      const realGroup = await db.group.findFirst({
        where: {
          id: item.group.id,
        },
        include: {
          students: true,
        },
      });
      const students = JSON.parse(JSON.stringify(realGroup.students));

      let homeStudentsPoints = schedule.homeStudentsPoints;
      let classStudentsPoints = schedule.classStudentsPoints;

      totalPrice += schedule.lessonsPrice;
      // Приведение данных к нужному формату
      if (
        !Array.isArray(homeStudentsPoints) ||
        students.length !== homeStudentsPoints.length
      ) {
        homeStudentsPoints = students.map((student) => ({
          studentId: student.id,
          studentName: student.nameStudent,
          points: 0,
        }));
      }

      if (
        !Array.isArray(classStudentsPoints) ||
        students.length !== classStudentsPoints.length
      ) {
        classStudentsPoints = students.map((student) => ({
          studentId: student.id,
          studentName: student.nameStudent,
          points: 0,
        }));
      }

      const groupData = {
        id: schedule.id,
        itemName: schedule.itemName,
        nameStudent: groupStudentSchedule,
        typeLesson: schedule.typeLesson,
        homeFiles,
        classFiles,
        homeAudios,
        classAudios,
        homeWork: schedule.homeWork,
        lessonPrice: schedule.lessonsPrice,
        lessonCount: schedule.lessonsCount,
        place: item.placeLesson,
        isCancel: schedule.isCancel,
        classWork: schedule.classWork,
        isCheck: schedule.isChecked,
        tryLessonCheck: item.tryLessonCheck,
        startTime: daySchedule?.startTime,
        endTime: daySchedule?.endTime,
        tryLessonCost: item.tryLessonCost,
        homeStudentsPoints,
        classStudentsPoints,
        groupName: groupStudentSchedule,
        groupId: schedule.groupId,
        students: students.map((student) => ({
          id: student.id,
          nameStudent: student.nameStudent,
          costOneLesson: student.costOneLesson,
          prePay: student.prePay || [],
          targetLessonStudent: student.targetLessonStudent,
          todayProgramStudent: student.todayProgramStudent,
        })),
      };

      groupsData.push(groupData);
    }

    groupsData.push({ totalPrice });
    // console.log(groupsData, "\n-----groupsData");
    socket.emit("getStudentsByDate", groupsData);
  } else {
    const dataToEmit = [];

    for (const schedule of studentSchedules) {
      const { item } = schedule;
      const student = item.group?.students?.[0];

      const timeLinesArray = schedule.timeLinesArray;
      const daySchedule = timeLinesArray[dayOfWeekIndex];
      const homeFiles = await db.file.findMany({
        where: { id: { in: schedule.homeFiles }, extraType: "home" },
      });
      const classFiles = await db.file.findMany({
        where: { id: { in: schedule.classFiles }, extraType: "class" },
      });
      const homeAudios = await db.file.findMany({
        where: { id: { in: schedule.homeAudios }, extraType: "home/audio" },
      });
      const classAudios = await db.file.findMany({
        where: { id: { in: schedule.classAudios }, extraType: "class/audio" },
      });
      const groupStudentSchedule = item.group?.groupName;

      let homeStudentsPoints = schedule.homeStudentsPoints;
      let classStudentsPoints = schedule.classStudentsPoints;

      const History = await db.group.findMany({
        where: {
          id: item.group?.id,
        },
        select: {
          historyLessons: true,
        },
      });

      // Приведение данных к нужному формату
      if (
        (!Array.isArray(homeStudentsPoints) ||
          homeStudentsPoints.length !== 1) &&
        student
      ) {
        homeStudentsPoints = [
          {
            studentId: student.id,
            studentName: student.nameStudent,
            points: 0,
          },
        ];
      }

      if (
        (!Array.isArray(classStudentsPoints) ||
          classStudentsPoints.length !== 1) &&
        student
      ) {
        classStudentsPoints = [
          {
            studentId: student.id,
            studentName: student.nameStudent,
            points: 0,
          },
        ];
      }

      const scheduleData = {
        id: schedule.id,
        nameStudent: student ? student.nameStudent : schedule.studentName,
        costOneLesson: schedule.lessonsPrice,
        studentId: student ? student.id : "",
        itemName: schedule.itemName,
        typeLesson: schedule.typeLesson,
        homeFiles,
        classFiles,
        homeAudios,
        classAudios,
        homeWork: schedule.homeWork,
        place: item.placeLesson,
        prePayDate: student?.prePayDate ?? null,
        prePayCost: student?.prePayCost ?? null,
        lessonPrice: schedule.lessonsPrice,
        lessonCount: schedule.lessonsCount,
        classWork: schedule.classWork,
        homeStudentsPoints: Array.isArray(homeStudentsPoints)
          ? homeStudentsPoints
          : [],
        classStudentsPoints: Array.isArray(classStudentsPoints)
          ? classStudentsPoints
          : [],
        isCheck: schedule.isChecked,
        isCancel: schedule.isCancel,
        tryLessonCheck: item.tryLessonCheck,
        tryLessonCost: item.tryLessonCost,
        prePay: student ? student.prePay : [],
        history: History || null,
        startTime: daySchedule?.startTime,
        endTime: daySchedule?.endTime,
        groupName: groupStudentSchedule ? groupStudentSchedule : "",
        groupId: schedule.groupId,
        type: groupStudentSchedule ? "group" : "student",
      };

      dataToEmit.push(scheduleData);
    }

    socket.emit("getStudentsByDate", dataToEmit);
  }
}

// export async function updateStudentSchedule(data, socket: any) {
//   const {
//     id,
//     day,
//     month,
//     year,
//     lessonsPrice,
//     itemName,
//     typeLesson,
//     homeFiles,
//     classFiles,
//     homeWork,
//     classWork,
//     homeStudentsPoints,
//     classStudentsPoints,
//     address,
//     homeAudios,
//     classAudios,
//     token,
//     isChecked,
//     isCancel,
//     studentName,
//     startTime,
//     endTime,
//   } = data;

//   const token_ = await db.token.findFirst({
//     where: {
//       token,
//     },
//   });

//   const userId = token_.userId;

//   console.log("data HOME FILES", data);

//   let homeFilePaths = [];
//   let classFilePaths = [];
//   let homeAudiosPaths = [];
//   let classAudiosPaths = [];

//   // Save home files
//   console.log(homeFiles, "HOME FILES");
//   if (homeFiles?.length > 0) {
//     homeFilePaths = await upload(homeFiles, userId, "home");
//   }

//   // Save class files
//   if (classFiles?.length > 0) {
//     classFilePaths = await upload(classFiles, userId, "class");
//   }

//   // Save home audios
//   if (homeAudios?.length > 0) {
//     homeAudiosPaths = await upload(homeAudios, userId, "home/audio");
//   }

//   // Save class audios
//   if (classAudios?.length > 0) {
//     classAudiosPaths = await upload(classAudios, userId, "class/audio");
//   }

//   // console.log("homeFiles", homeFiles, "classFiles", classFiles);

//   const updatedFields: any = {};

//   let studentIds = [];
//   let studentNames = [];

//   if (homeStudentsPoints !== undefined) {
//     homeStudentsPoints.map((obj) => {
//       studentIds.push(obj.studentId);
//     });
//   }

//   let students = await db.student.findMany({
//     where: {
//       id: {
//         in: studentIds,
//       },
//     },
//   });

//   if (students.length > 0) {
//     students.map((student) => {
//       studentNames.push(student.nameStudent);
//     });
//   }

//   if (lessonsPrice !== undefined)
//     updatedFields.lessonsPrice = Number(lessonsPrice);
//   if (itemName !== undefined) updatedFields.itemName = itemName;
//   if (typeLesson !== undefined) updatedFields.typeLesson = Number(typeLesson);
//   if (isChecked !== undefined) updatedFields.isChecked = isChecked;
//   if (studentName !== undefined) updatedFields.studentName = studentName;
//   if (homeWork !== undefined) updatedFields.homeWork = homeWork;
//   if (classWork !== undefined) updatedFields.classWork = classWork;
//   if (homeStudentsPoints !== undefined)
//     updatedFields.homeStudentsPoints = Array.isArray(homeStudentsPoints)
//       ? homeStudentsPoints.map((obj, i) => ({
//           ...obj,
//           studentName: studentNames[i],
//         }))
//       : [];
//   if (classStudentsPoints !== undefined)
//     updatedFields.classStudentsPoints = Array.isArray(classStudentsPoints)
//       ? classStudentsPoints.map((obj, i) => ({
//           ...obj,
//           studentName: studentNames[i],
//         }))
//       : [];
//   if (address !== undefined) updatedFields.address = address;
//   if (homeFilePaths.length > 0) updatedFields.homeFiles = homeFilePaths;
//   if (classFilePaths.length > 0) updatedFields.classFiles = classFilePaths;
//   if (homeAudiosPaths.length > 0) updatedFields.homeAudios = homeAudiosPaths;
//   if (classAudiosPaths.length > 0) updatedFields.classAudios = classAudiosPaths;

//   if (isCancel !== undefined) {
//     updatedFields.isCancel = isCancel;
//   }

//   const dayOfWeekIndex = getDay(
//     new Date(Number(year), Number(month) - 1, Number(day))
//   );

//   if (startTime !== undefined || endTime !== undefined) {
//     const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
//     updatedFields.timeLinesArray = dayNames.map((dayName, index) => ({
//       id: index + 1,
//       day: dayName,
//       active: false,
//       endTime:
//         index === dayOfWeekIndex && endTime ? endTime : { hour: 0, minute: 0 },
//       startTime:
//         index === dayOfWeekIndex && startTime
//           ? startTime
//           : { hour: 0, minute: 0 },
//       editingEnd: false,
//       editingStart: false,
//     }));
//   }

//   if (id?.startsWith("-")) {
//     const newStudentSchedule = await db.studentSchedule.create({
//       data: {
//         ...updatedFields,
//         day,
//         month,
//         year,
//         userId: userId,
//         groupId: "",
//         workCount: 0,
//         lessonsCount: 0,
//         workPrice: 0,
//         itemId: "",
//         lessonsPrice: 0,
//         typeLesson: 1,
//       },
//     });

//     const _updateStudentSchedule = await db.studentSchedule.update({
//       where: { id: newStudentSchedule.id },
//       data: {
//         ...updatedFields,
//         day,
//         month,
//         year,
//         userId: userId,
//       },
//     });
//   }

//   const updatedSchedule = await db.studentSchedule.update({
//     where: { id, day, month, year, userId: userId },
//     data: updatedFields,
//   });

//   console.log(
//     "\n----------------student-schedule---------------------\n",
//     studentIds,
//     updatedSchedule,
//     "\n--------------------------------------\n"
//   );
//   return updatedSchedule;
// }

export async function updateStudentSchedule(data, socket: any) {
  const {
    id,
    day,
    month,
    year,
    lessonsPrice,
    itemName,
    typeLesson,
    homeFiles,
    classFiles,
    homeWork,
    classWork,
    homeStudentsPoints,
    classStudentsPoints,
    address,
    homeAudios,
    classAudios,
    token,
    isChecked,
    isCancel,
    studentName,
    prePay,
    startTime,
    endTime,
  } = data;

  try {
    const token_ = await db.token.findFirst({
      where: { token },
    });

    if (!token_) {
      throw new Error("Invalid token");
    }

    const userId = token_.userId;

    let homeFilePaths = [];
    let classFilePaths = [];
    let homeAudiosPaths = [];
    let classAudiosPaths = [];

    if (homeFiles?.length > 0) {
      homeFilePaths = await upload(homeFiles, userId, "home");
    }
    if (classFiles?.length > 0) {
      classFilePaths = await upload(classFiles, userId, "class");
    }
    if (homeAudios?.length > 0) {
      homeAudiosPaths = await upload(homeAudios, userId, "home/audio");
    }
    if (classAudios?.length > 0) {
      classAudiosPaths = await upload(classAudios, userId, "class/audio");
    }

    const updatedFields: any = {};

    if (lessonsPrice !== undefined) {
      updatedFields.lessonsPrice = Number(lessonsPrice);
    } else {
      // If lessonsPrice is not provided in the update, we need to fetch the current value
      const currentSchedule = await db.studentSchedule.findUnique({
        where: { id, day, month, year, userId },
        select: { lessonsPrice: true },
      });

      if (currentSchedule) {
        updatedFields.lessonsPrice = currentSchedule.lessonsPrice;
      } else {
        throw new Error("StudentSchedule record not found");
      }
    }
    if (itemName !== undefined) updatedFields.itemName = itemName;
    if (typeLesson !== undefined) updatedFields.typeLesson = Number(typeLesson);
    if (isChecked !== undefined) updatedFields.isChecked = isChecked;
    if (studentName !== undefined) updatedFields.studentName = studentName;
    if (homeWork !== undefined) updatedFields.homeWork = homeWork;
    if (classWork !== undefined) updatedFields.classWork = classWork;
    if (address !== undefined) updatedFields.address = address;
    if (homeFilePaths.length > 0) updatedFields.homeFiles = homeFilePaths;
    if (classFilePaths.length > 0) updatedFields.classFiles = classFilePaths;
    if (homeAudiosPaths.length > 0) updatedFields.homeAudios = homeAudiosPaths;
    if (classAudiosPaths.length > 0)
      updatedFields.classAudios = classAudiosPaths;
    if (isCancel !== undefined) updatedFields.isCancel = isCancel;

    if (prePay !== undefined) updatedFields.prePay = prePay;

    if (homeStudentsPoints !== undefined) {
      const studentIds = homeStudentsPoints.map((obj) => obj.studentId);
      const students = await db.student.findMany({
        where: { id: { in: studentIds } },
      });
      const studentNames = students.map((student) => student.nameStudent);

      updatedFields.homeStudentsPoints = homeStudentsPoints.map((obj, i) => ({
        ...obj,
        studentName: studentNames[i] || obj.studentName,
      }));
    }

    if (classStudentsPoints !== undefined) {
      const studentIds = classStudentsPoints.map((obj) => obj.studentId);
      const students = await db.student.findMany({
        where: { id: { in: studentIds } },
      });
      const studentNames = students.map((student) => student.nameStudent);

      updatedFields.classStudentsPoints = classStudentsPoints.map((obj, i) => ({
        ...obj,
        studentName: studentNames[i] || obj.studentName,
      }));
    }

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
          index === dayOfWeekIndex && endTime
            ? endTime
            : { hour: 0, minute: 0 },
        startTime:
          index === dayOfWeekIndex && startTime
            ? startTime
            : { hour: 0, minute: 0 },
        editingEnd: false,
        editingStart: false,
      }));
    }

    let updatedSchedule;
    if (id?.startsWith("-")) {
      updatedSchedule = await db.studentSchedule.create({
        data: {
          ...updatedFields,
          day,
          month,
          year,
          userId,
          groupId: "",
          workCount: 0,
          lessonsCount: 0,
          workPrice: 0,
          itemId: "",
          lessonsPrice: lessonsPrice ? Number(lessonsPrice) : 0,
          typeLesson: typeLesson ? Number(typeLesson) : 1,
        },
      });
    } else {
      updatedSchedule = await db.studentSchedule.update({
        where: { id, day, month, year, userId },
        data: updatedFields,
      });
    }

    // Update historyLesson
    try {
      const schedule = await db.studentSchedule.findUnique({
        where: { id: updatedSchedule.id },
        include: { item: { include: { group: true } } },
      });

      if (schedule && schedule.item && schedule.item.group) {
        const group = schedule.item.group;
        const updateDate = new Date(
          Number(year),
          Number(month) - 1,
          Number(day)
        );

        let updatedHistoryLesson;
        if (Array.isArray(group.historyLessons)) {
          if (Array.isArray(group.historyLessons[0])) {
            // Group historyLesson
            updatedHistoryLesson = (group.historyLessons as any[][]).map(
              (subArray) =>
                subArray.map((lesson) => {
                  if (
                    new Date(lesson.date).toDateString() ===
                    updateDate.toDateString()
                  ) {
                    return {
                      ...lesson,
                      price: lessonsPrice ? Number(lessonsPrice) : lesson.price,
                      itemName: itemName || lesson.itemName,
                    };
                  }
                  return lesson;
                })
            );
          } else {
            // Student historyLesson
            updatedHistoryLesson = (group.historyLessons as any[]).map(
              (lesson) => {
                if (
                  new Date(lesson.date).toDateString() ===
                  updateDate.toDateString()
                ) {
                  return {
                    ...lesson,
                    price: lessonsPrice ? Number(lessonsPrice) : lesson.price,
                    itemName: itemName || lesson.itemName,
                  };
                }
                return lesson;
              }
            );
          }

          await db.group.update({
            where: { id: group.id },
            data: { historyLessons: updatedHistoryLesson },
          });
        } else {
          console.error(
            "historyLessons is not an array:",
            group.historyLessons
          );
        }
      }
    } catch (historyError) {
      console.error("Error updating historyLesson:", historyError);
    }

    // console.log(
    //   "\n----------------student-schedule---------------------\n",
    //   updatedSchedule,
    //   "\n--------------------------------------\n"
    // );
    return updatedSchedule;
  } catch (error) {
    console.error("Error in updateStudentSchedule:", error);
    return null;
  }
}

export async function getGroupByStudentId(data: any, socket: any) {
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
            historyLessons: true,
          },
        },
      },
    });

    const files = await db.file.findMany({
      where: {
        id: {
          in: group.group.students[0].files,
        },
        extraType: "",
      },
      select: {
        id: true,
        name: true,
        path: true,
        type: true,
      },
    });

    const audios = await db.file.findMany({
      where: {
        id: {
          in: group.group.students[0].files,
        },
        extraType: "student/audio",
      },
      select: {
        id: true,
        name: true,
        path: true,
        type: true,
      },
    });

    // console.log(files, "files");
    //group to object
    const group_ = JSON.parse(JSON.stringify(group));
    group_.group.students[0].filesData = files;
    group_.group.students[0].audiosData = audios;

    //get audios buffers
    const audiosBuffers = await JSON.parse(JSON.stringify(audios)).map(
      (audio) => {
        return getBufferByFilePath(audio.path);
      }
    );

    // console.log(audiosBuffers, "audiosBuffers");

    //add audios buffers to every audio object

    await group_.group.students[0].audiosData.forEach(async (audio, index) => {
      audio.buffer = await audiosBuffers[index];
    });

    socket.emit("getGroupByStudentId", group_);
    return group.group;
  } catch (error) {
    console.error("Error retrieving group:", error);
    console.log(error);
  }
}

// export async function updateStudentAndItems(data: any, socket: any) {
//   const { id, items, audios, files, token } = data;

//   try {
//     const token_ = await db.token.findFirst({
//       where: {
//         token,
//       },
//     });

//     const userId = token_.userId;

//     const existFiles = await db.student.findUnique({
//       where: {
//         id,
//       },
//       select: {
//         files: true,
//       },
//     });

//     const existFilesIds = JSON.parse(JSON.stringify(existFiles)).files;

//     // const isDeleted = await deleteFileById(, existFilesIds);

//     let justFilesIds = [];

//     justFilesIds = await upload(
//       files,
//       userId,
//       "student/file",
//       (paths: string[]) => {
//         justFilesIds = paths;
//       }
//     );

//     let justAudiosIds = [];

//     justAudiosIds = await upload(
//       audios,
//       userId,
//       "student/audio",
//       (paths: string[]) => {
//         justAudiosIds = paths;
//       }
//     );

//     const AllFiles = Object.assign(justFilesIds, justAudiosIds, existFilesIds);

//     const updatedStudent = await db.student.update({
//       where: {
//         id: id,
//       },
//       data: {
//         commentStudent: data.commentStudent,
//         prePayCost: data.prePayCost,
//         prePayDate: data.prePayDate,
//         costOneLesson: data.costOneLesson,
//         linkStudent: data.linkStudent,
//         files: AllFiles,
//         costStudent: data.costStudent,
//         phoneNumber: data.phoneNumber,
//         contactFace: data.contactFace,
//         email: data.email,
//         nameStudent: data.nameStudent,
//       },
//     });

//     const group = await db.group.findUnique({
//       where: {
//         id: updatedStudent.groupId,
//       },
//     });

//     const groupUpdated = await db.group.update({
//       where: {
//         id: group.id,
//       },
//       data: {
//         historyLessons: data.historyLessons,
//       },
//     })
//     // !! TODO НЕ ОБНОВЛЯЕТСЯ ПРЕДМЕТ В УЧЕНИКЕ
//     const items_ = db.item.updateMany({
//       where: {
//         groupId: group.id,
//       },
//       data: items.map((itemData) => ({
//         ...itemData,
//       })),
//     });

//     socket.emit("updateStudentAndItems", updatedStudent);

//     return updatedStudent;
//   } catch (error) {
//     console.error("Error updating student and items:", error);
//     console.log(error);
//   }
// }

// export async function updateStudentAndItems(data: any, socket: any) {
//   const { id, items, audios, files, token } = data;

//   try {
//     const token_ = await db.token.findFirst({
//       where: {
//         token,
//       },
//     });

//     if (!token_) {
//       throw new Error("Invalid token");
//     }

//     const userId = token_.userId;

//     const existingStudent = await db.student.findUnique({
//       where: {
//         id,
//       },
//       select: {
//         files: true,
//         groupId: true,
//       },
//     });

//     if (!existingStudent) {
//       throw new Error("Student not found");
//     }

//     const existFilesIds = existingStudent.files;

//     // Upload new files and audios
//     let justFilesIds = [];
//     if (files && files.length > 0) {
//       justFilesIds = await upload(
//         files,
//         userId,
//         "student/file",
//         (paths: string[]) => {
//           justFilesIds = paths;
//         }
//       );
//     }

//     let justAudiosIds = [];
//     if (audios && audios.length > 0) {
//       justAudiosIds = await upload(
//         audios,
//         userId,
//         "student/audio",
//         (paths: string[]) => {
//           justAudiosIds = paths;
//         }
//       );
//     }

//     const AllFiles = [
//       ...new Set([...justFilesIds, ...justAudiosIds, ...existFilesIds]),
//     ];

//     const updatedStudent = await db.student.update({
//       where: {
//         id,
//       },
//       data: {
//         commentStudent: data.commentStudent,
//         prePayCost: data.prePayCost,
//         prePayDate: data.prePayDate ? new Date(data.prePayDate) : null,
//         costOneLesson: data.costOneLesson,
//         linkStudent: data.linkStudent,
//         files: AllFiles,
//         costStudent: data.costStudent,
//         phoneNumber: data.phoneNumber,
//         contactFace: data.contactFace,
//         email: data.email,
//         nameStudent: data.nameStudent,
//       },
//     });

//     const group = await db.group.findUnique({
//       where: {
//         id: updatedStudent.groupId,
//       },
//     });

//     if (!group) {
//       throw new Error("Group not found");
//     }

//     await db.group.update({
//       where: {
//         id: group.id,
//       },
//       data: {
//         historyLessons: data.historyLessons,
//       },
//     });

//     // Update or create items
//     for (const itemData of items) {
//       const existingItem = await db.item.findUnique({
//         where: {
//           id: itemData.id,
//         },
//       });

//       if (existingItem) {
//         await db.item.update({
//           where: {
//             id: itemData.id,
//           },
//           data: {
//             itemName: itemData.itemName,
//             tryLessonCheck: itemData.tryLessonCheck || false,
//             tryLessonCost: itemData.tryLessonCost || "",
//             todayProgramStudent: itemData.todayProgramStudent || "",
//             targetLesson: itemData.targetLesson || "",
//             programLesson: itemData.programLesson || "",
//             typeLesson: Number(itemData.typeLesson) || 1,
//             placeLesson: itemData.placeLesson || "",
//             timeLesson: itemData.timeLesson || "",
//             valueMuiSelectArchive: itemData.valueMuiSelectArchive || 1,
//             startLesson: itemData.startLesson
//               ? new Date(itemData.startLesson)
//               : null,
//             endLesson: itemData.endLesson ? new Date(itemData.endLesson) : null,
//             nowLevel: itemData.nowLevel || 0,
//             lessonDuration: Number(itemData.lessonDuration) || null,
//             timeLinesArray: itemData.timeLinesArray || {},
//             commentItem: itemData.commentItem || "",
//             userId,
//             groupId: group.id,
//           },
//         });
//       } else {
//         await db.item.create({
//           data: {
//             itemName: itemData.itemName,
//             tryLessonCheck: itemData.tryLessonCheck || false,
//             tryLessonCost: itemData.tryLessonCost || "",
//             todayProgramStudent: itemData.todayProgramStudent || "",
//             targetLesson: itemData.targetLesson || "",
//             programLesson: itemData.programLesson || "",
//             typeLesson: Number(itemData.typeLesson) || 1,
//             placeLesson: itemData.placeLesson || "",
//             timeLesson: itemData.timeLesson || "",
//             costOneLesson: itemData.costOneLesson || "",
//             valueMuiSelectArchive: itemData.valueMuiSelectArchive || 1,
//             startLesson: itemData.startLesson
//               ? new Date(itemData.startLesson)
//               : null,
//             endLesson: itemData.endLesson ? new Date(itemData.endLesson) : null,
//             nowLevel: itemData.nowLevel || 0,
//             lessonDuration: Number(itemData.lessonDuration) || null,
//             timeLinesArray: itemData.timeLinesArray || {},
//             commentItem: itemData.commentItem || "",
//             userId,
//             groupId: group.id,
//           },
//         });
//       }
//     }

//     socket.emit("updateStudentAndItems", updatedStudent);

//     return updatedStudent;
//   } catch (error) {
//     console.error("Error updating student and items:", error);
//     socket.emit("updateStudentAndItems", { error: error.message });
//   }
// }

// import { addDays, differenceInDays, getDay } from "date-fns";

// export async function updateStudentAndItems(data: any, socket: any) {
//   const { id, items, audios, files, token } = data;

//   try {
//     const token_ = await db.token.findFirst({
//       where: {
//         token,
//       },
//     });

//     if (!token_) {
//       throw new Error("Invalid token");
//     }

//     const userId = token_.userId;

//     const existingStudent = await db.student.findUnique({
//       where: {
//         id,
//       },
//       select: {
//         files: true,
//         groupId: true,
//       },
//     });

//     if (!existingStudent) {
//       throw new Error("Student not found");
//     }

//     const existFilesIds = existingStudent.files;

//     // Upload new files and audios
//     let justFilesIds = [];
//     if (files && files.length > 0) {
//       justFilesIds = await upload(
//         files,
//         userId,
//         "student/file",
//         (paths: string[]) => {
//           justFilesIds = paths;
//         }
//       );
//     }

//     let justAudiosIds = [];
//     if (audios && audios.length > 0) {
//       justAudiosIds = await upload(
//         audios,
//         userId,
//         "student/audio",
//         (paths: string[]) => {
//           justAudiosIds = paths;
//         }
//       );
//     }

//     const AllFiles = [
//       ...new Set([...justFilesIds, ...justAudiosIds, ...existFilesIds]),
//     ];

//     const updatedStudent = await db.student.update({
//       where: {
//         id,
//       },
//       data: {
//         commentStudent: data.commentStudent,
//         prePayCost: data.prePayCost,
//         prePayDate: data.prePayDate ? new Date(data.prePayDate) : null,
//         costOneLesson: data.costOneLesson,
//         linkStudent: data.linkStudent,
//         files: AllFiles,
//         costStudent: data.costStudent,
//         prePay: data.prePay || [],
//         phoneNumber: data.phoneNumber,
//         contactFace: data.contactFace,
//         email: data.email,
//         nameStudent: data.nameStudent,
//       },
//     });

//     const group = await db.group.findUnique({
//       where: {
//         id: updatedStudent.groupId,
//       },
//     });

//     if (!group) {
//       throw new Error("Group not found");
//     }

// await db.group.update({
//   where: {
//     id: group.id,
//   },
//   data: {
//     historyLessons: data.historyLessons,
//   },
// });

//     // Delete old studentSchedule records
//     await db.studentSchedule.deleteMany({
//       where: {
//         studentId: id,
//       },
//     });

//     // Create new studentSchedule records
//     for (const itemData of items) {
//       const startDate = new Date(itemData.startLesson);
//       const endDate = new Date(itemData.endLesson);
//       const daysToAdd = differenceInDays(endDate, startDate);
//       const dateRange = Array.from({ length: daysToAdd + 1 }, (_, i) =>
//         addDays(startDate, i)
//       );

//       for (const date of dateRange) {
//         const dayOfWeek = getDay(date);
//         const scheduleForDay = itemData.timeLinesArray[dayOfWeek];

//         if (!scheduleForDay) {
//           console.warn(
//             `No schedule defined for day of week: ${dayOfWeek} on date: ${date}`
//           );
//           continue;
//         }

//         const cond =
//           scheduleForDay.startTime.hour === 0 &&
//           scheduleForDay.startTime.minute === 0 &&
//           scheduleForDay.endTime.hour === 0 &&
//           scheduleForDay.endTime.minute === 0;

//         if (!cond) {
//           await db.studentSchedule.create({
//             data: {
//               day: date.getDate().toString(),
//               groupId: group.id,
//               workCount: 0,
//               lessonsCount: 1,
//               lessonsPrice: Number(itemData.costOneLesson),
//               workPrice: 0,
//               month: (date.getMonth() + 1).toString(),
//               timeLinesArray: itemData.timeLinesArray,
//               isChecked: false,
//               itemName: itemData.itemName,
//               studentName: updatedStudent.nameStudent,
//               typeLesson: itemData.typeLesson,
//               year: date.getFullYear().toString(),
//               itemId: itemData.id,
//               userId,
//             },
//           });
//         }
//       }
//     }

//     socket.emit("updateStudentAndItems", updatedStudent);

//     return updatedStudent;
//   } catch (error) {
//     console.error("Error updating student and items:", error);
//     socket.emit("updateStudentAndItems", { error: error.message });
//   }
// }

// export async function updateStudentAndItems(data: any, socket: any) {
//   const { id, items, audios, files, token } = data;
//   console.log(data.historyLessons, "DataHistory");
//   try {
//     const token_ = await db.token.findFirst({
//       where: { token },
//     });

//     if (!token_) {
//       throw new Error("Invalid token");
//     }

//     const userId = token_.userId;

//     const existingStudent = await db.student.findUnique({
//       where: { id },
//       include: {
//         group: {
//           include: {
//             items: true,
//           },
//         },
//       },
//     });

//     if (!existingStudent) {
//       throw new Error("Student not found");
//     }

//     // Handle file uploads
//     const existFilesIds = existingStudent.files || [];
//     let justFilesIds = await handleFileUploads(files, userId, "student/file");
//     let justAudiosIds = await handleFileUploads(
//       audios,
//       userId,
//       "student/audio"
//     );
//     const AllFiles = [
//       ...new Set([...justFilesIds, ...justAudiosIds, ...existFilesIds]),
//     ];

//     // Update student data
//     const updatedStudent = await db.student.update({
//       where: { id },
//       data: {
//         commentStudent: data.commentStudent,
//         prePayCost: data.prePayCost,
//         prePayDate: data.prePayDate ? new Date(data.prePayDate) : null,
//         costOneLesson: data.costOneLesson,
//         linkStudent: data.linkStudent,
//         files: AllFiles,
//         costStudent: data.costStudent,
//         prePay: data.prePay || [],
//         phoneNumber: data.phoneNumber,
//         contactFace: data.contactFace,
//         email: data.email,
//         nameStudent: data.nameStudent,
//       },
//     });

//     // Update group and items
//     const updatedGroup = await updateGroupAndItems(
//       existingStudent.group.id,
//       items,
//       userId
//     );

//     await db.group.update({
//       where: {
//         id: existingStudent.group.id,
//       },
//       data: {
//         historyLessons: data.historyLessons,
//       },
//     });

//     // Update student schedules
//     await updateStudentSchedules(
//       id,
//       updatedGroup.items,
//       userId,
//       updatedStudent.nameStudent,
//       existingStudent.group.id
//     );

//     // Fetch the final updated student with all related data
//     const finalUpdatedStudent = await db.student.findUnique({
//       where: { id },
//       include: {
//         group: {
//           include: {
//             items: true,
//           },
//         },
//       },
//     });

//     socket.emit("updateStudentAndItems", finalUpdatedStudent);

//     return finalUpdatedStudent;
//   } catch (error) {
//     console.error("Error updating student and items:", error);
//     socket.emit("updateStudentAndItems", { error: error.message });
//   }
// }

// Helper function to handle file uploads
async function handleFileUploads(
  files: IUploadFiles[],
  userId: string,
  extraType: string
): Promise<string[]> {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return [];
  }

  try {
    return await upload(files, userId, extraType, (ids) => {
      console.log(
        `Uploaded ${files.length} files with type ${extraType}. File IDs:`,
        ids
      );
    });
  } catch (error) {
    console.error(`Error uploading ${extraType}:`, error);
    return [];
  }
}

export async function updateStudentAndItems(data: any, socket: any) {
  const { id, items, audios, files, token } = data;
  console.log(data.historyLessons, "DataHistory");

  try {
    // Validate token
    const token_ = await db.token.findFirst({
      where: { token },
    });

    if (!token_) {
      throw new Error("Invalid token");
    }

    const userId = token_.userId;

    // Get existing student
    const existingStudent = await db.student.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!existingStudent) {
      throw new Error("Student not found");
    }

    // Handle file uploads
    const existingFileIds = existingStudent.files || [];
    console.log("Existing file IDs:", existingFileIds);

    // Handle new file uploads
    const newFileIds = await handleFileUploads(files, userId, "student/file");
    console.log("New file IDs:", newFileIds);

    // Handle new audio uploads
    const newAudioIds = await handleFileUploads(
      audios,
      userId,
      "student/audio"
    );
    console.log("New audio IDs:", newAudioIds);

    // Combine all file IDs, removing duplicates
    const allFiles = [
      ...new Set([...existingFileIds, ...newFileIds, ...newAudioIds]),
    ];
    console.log("Combined file IDs:", allFiles);

    // Update student data
    const updatedStudent = await db.student.update({
      where: { id },
      data: {
        commentStudent: data.commentStudent,
        prePayCost: data.prePayCost,
        prePayDate: data.prePayDate ? new Date(data.prePayDate) : null,
        costOneLesson: data.costOneLesson,
        linkStudent: data.linkStudent,
        files: allFiles,
        costStudent: data.costStudent,
        prePay: data.prePay || [],
        phoneNumber: data.phoneNumber,
        contactFace: data.contactFace,
        email: data.email,
        nameStudent: data.nameStudent,
      },
    });

    // Update group and items
    const updatedGroup = await updateGroupAndItems(
      existingStudent.group.id,
      items,
      userId
    );

    // Update history lessons
    await db.group.update({
      where: {
        id: existingStudent.group.id,
      },
      data: {
        historyLessons: data.historyLessons,
      },
    });

    // Update student schedules
    await updateStudentSchedules(
      id,
      updatedGroup.items,
      userId,
      updatedStudent.nameStudent,
      existingStudent.group.id
    );

    // Fetch the final updated student with all related data
    const finalUpdatedStudent = await db.student.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            items: true,
          },
        },
      },
    });

    // Add additional file information to the response
    const enrichedStudent = {
      ...finalUpdatedStudent,
      fileDetails: await Promise.all(
        allFiles.map(async (fileId) => {
          const fileInfo = await db.file.findUnique({
            where: { id: fileId },
            select: {
              id: true,
              name: true,
              type: true,
              size: true,
            },
          });
          return fileInfo;
        })
      ),
    };

    socket.emit("updateStudentAndItems", enrichedStudent);
    return enrichedStudent;
  } catch (error) {
    console.error("Error updating student and items:", error);
    socket.emit("updateStudentAndItems", { error: error.message });
    throw error;
  }
}

async function updateGroupAndItems(
  groupId: string,
  newItems: any[],
  userId: string
) {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { items: true },
  });

  if (!group) throw new Error("Group not found");

  const existingItemIds = group.items.map((item) => item.id);
  const updatedItemIds = [];

  for (const itemData of newItems) {
    let updatedItem;

    // Prepare common data for both update and create operations
    const itemCommonData = {
      itemName: itemData.itemName,
      tryLessonCheck: itemData.tryLessonCheck,
      tryLessonCost: itemData.tryLessonCost,
      todayProgramStudent: itemData.todayProgramStudent,
      targetLesson: itemData.targetLesson,
      programLesson: itemData.programLesson,
      typeLesson: Number(itemData.typeLesson),
      placeLesson: itemData.placeLesson,
      timeLesson: itemData.timeLesson,
      valueMuiSelectArchive: itemData.valueMuiSelectArchive,
      startLesson: new Date(itemData.startLesson),
      endLesson: new Date(itemData.endLesson),
      nowLevel: itemData.nowLevel,
      costOneLesson: itemData.costOneLesson,
      lessonDuration: itemData.lessonDuration,
      timeLinesArray: itemData.timeLinesArray,
      commentItem: itemData.commentItem,
    };

    if (itemData.id && existingItemIds.includes(itemData.id)) {
      // Update existing item
      updatedItem = await db.item.update({
        where: { id: itemData.id },
        data: itemCommonData,
      });
    } else {
      // Add new item
      updatedItem = await db.item.create({
        data: {
          ...itemCommonData,
          groupId: groupId,
          userId: userId,
        },
      });
    }

    updatedItemIds.push(updatedItem.id);
  }

  // Remove items that are no longer present
  await db.item.deleteMany({
    where: {
      groupId: groupId,
      id: { notIn: updatedItemIds },
    },
  });

  // Update group history lessons and connect all items
  await db.group.update({
    where: { id: groupId },
    data: {
      historyLessons: newItems[0].historyLessons,
      items: {
        set: updatedItemIds.map((id) => ({ id })),
      },
    },
  });

  return await db.group.findUnique({
    where: { id: groupId },
    include: { items: true },
  });
}

// async function handleFileUploads(files: any[], userId: string, path: string) {
//   if (!files || files.length === 0) return [];
//   return await upload(files, userId, path, (paths: string[]) => paths);
// }

async function updateStudentSchedules(
  studentId: string,
  items: any[],
  userId: string,
  studentName: string,
  groupId: string
) {
  console.log(
    "\n----------------updateStudentSchedules--------------------\n",
    studentId,
    items,
    userId,
    studentName,
    groupId
  );
  // Delete old studentSchedule records
  await db.studentSchedule.deleteMany({
    where: {
      OR: [{ studentId: studentId }, { groupId: groupId }],
    },
  });
  // Create new studentSchedule records
  for (const itemData of items) {
    const startDate = new Date(itemData.startLesson);
    const endDate = new Date(itemData.endLesson);
    const daysToAdd = differenceInDays(endDate, startDate);
    const dateRange = Array.from({ length: daysToAdd + 1 }, (_, i) =>
      addDays(startDate, i)
    );

    for (const date of dateRange) {
      const dayOfWeek = getDay(date);
      const scheduleForDay = itemData.timeLinesArray[dayOfWeek];

      if (!scheduleForDay) {
        console.warn(
          `No schedule defined for day of week: ${dayOfWeek} on date: ${date}`
        );
        continue;
      }

      const cond =
        scheduleForDay.startTime.hour === 0 &&
        scheduleForDay.startTime.minute === 0 &&
        scheduleForDay.endTime.hour === 0 &&
        scheduleForDay.endTime.minute === 0;

      if (!cond) {
        await db.studentSchedule.create({
          data: {
            day: date.getDate().toString(),
            groupId: itemData.groupId,
            workCount: 0,
            lessonsCount: 1,
            lessonsPrice: Number(itemData.costOneLesson),
            workPrice: 0,
            month: (date.getMonth() + 1).toString(),
            timeLinesArray: itemData.timeLinesArray,
            isChecked: false,
            itemName: itemData.itemName,
            studentName: studentName,
            typeLesson: itemData.typeLesson,
            year: date.getFullYear().toString(),
            itemId: itemData.id,
            userId: userId,
          },
        });
      }
    }
  }
}

// export async function updateStudentAndItems(data: any, socket: any) {
//   const { id, items, audios, files, token, historyLessons, ...studentData } =
//     data;

//   try {
//     const token_ = await db.token.findFirst({ where: { token } });
//     if (!token_) throw new Error("Invalid token");
//     const userId = token_.userId;

//     const existingStudent = await db.student.findUnique({
//       where: { id },
//       include: { group: true },
//     });
//     if (!existingStudent) throw new Error("Student not found");

//     // Process files and audios
//     const existingFiles = existingStudent.files || [];
//     let newFiles = [...existingFiles];
//     if (files?.length > 0) {
//       const uploadedFiles = await upload(files, userId, "student/file");
//       newFiles = [...newFiles, ...uploadedFiles];
//     }
//     if (audios?.length > 0) {
//       const uploadedAudios = await upload(audios, userId, "student/audio");
//       newFiles = [...newFiles, ...uploadedAudios];
//     }

//     // Update student
//     const updatedStudent = await db.student.update({
//       where: { id },
//       data: {
//         ...studentData,
//         files: newFiles,
//         userId,
//         nameStudent: studentData.nameStudent, // Explicitly update student name
//       },
//     });

//     // Update group's name and historyLessons
//     if (existingStudent.group) {
//       const groupStudents = await db.student.count({
//         where: { groupId: existingStudent.group.id },
//       });

//       let groupUpdateData: any = {};

//       if (groupStudents === 1) {
//         groupUpdateData.groupName = studentData.nameStudent;
//       }

//       // Update history lessons
//       if (historyLessons) {
//         const isGroupHistory = Array.isArray(historyLessons[0]);

//         const updateHistoryLesson = (lesson: any) => ({
//           ...lesson,
//           price:
//             items.find((item: any) => item.itemName === lesson.itemName)
//               ?.costOneLesson || lesson.price,
//           itemName:
//             items.find((item: any) => item.itemName === lesson.itemName)
//               ?.itemName || lesson.itemName,
//         });

//         const updatedHistoryLessons = isGroupHistory
//           ? historyLessons.map((subArray: any[]) =>
//               subArray.map(updateHistoryLesson)
//             )
//           : historyLessons.map(updateHistoryLesson);

//         groupUpdateData.historyLessons = updatedHistoryLessons;
//       }

//       await db.group.update({
//         where: { id: existingStudent.group.id },
//         data: groupUpdateData,
//       });
//     }

//     // Update or create items
//     for (const itemData of items) {
//       if (itemData.id) {
//         await db.item.update({
//           where: { id: itemData.id },
//           data: {
//             ...itemData,
//             userId,
//             groupId: existingStudent.groupId,
//           },
//         });
//       } else {
//         await db.item.create({
//           data: {
//             ...itemData,
//             userId,
//             groupId: existingStudent.groupId,
//           },
//         });
//       }
//     }

//     // Update student schedules
//     for (const itemData of items) {
//       const startDate = new Date(itemData.startLesson);
//       const endDate = new Date(itemData.endLesson);
//       const daysToAdd = differenceInDays(endDate, startDate);
//       const dateRange = Array.from({ length: daysToAdd + 1 }, (_, i) =>
//         addDays(startDate, i)
//       );

//       for (const date of dateRange) {
//         const dayOfWeek = getDay(date);
//         const scheduleForDay = itemData.timeLinesArray[dayOfWeek];

//         if (scheduleForDay) {
//           const day = date.getDate().toString();
//           const month = (date.getMonth() + 1).toString();
//           const year = date.getFullYear().toString();

//           const scheduleData = {
//             itemName: itemData.itemName,
//             lessonsPrice: Number(itemData.costOneLesson),
//             typeLesson: itemData.typeLesson,
//             timeLinesArray: itemData.timeLinesArray,
//             studentName: updatedStudent.nameStudent,
//           };

//           const existingSchedule = await db.studentSchedule.findFirst({
//             where: {
//               studentId: updatedStudent.id,
//               day,
//               month,
//               year,
//               itemId: itemData.id,
//             },
//           });

//           if (existingSchedule) {
//             await db.studentSchedule.update({
//               where: { id: existingSchedule.id },
//               data: scheduleData,
//             });
//           } else {
//             await db.studentSchedule.create({
//               data: {
//                 ...scheduleData,
//                 studentId: updatedStudent.id,
//                 day,
//                 month,
//                 year,
//                 groupId: existingStudent.groupId,
//                 itemId: itemData.id,
//                 userId,
//                 workCount: 0,
//                 lessonsCount: 1,
//                 workPrice: 0,
//                 isChecked: false,
//               },
//             });
//           }
//         }
//       }
//     }

//     socket.emit("updateStudentAndItems", {
//       success: true,
//       data: updatedStudent,
//     });
//     return updatedStudent;
//   } catch (error) {
//     console.error("Error updating student and items:", error);
//     socket.emit("updateStudentAndItems", {
//       success: false,
//       error: error.message,
//     });
//     return null;
//   }
// }

export async function getAllIdStudents(data: any, socket: any) {
  const { token } = data;
  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });
  const userId = token_.userId;

  const students = await db.student.findMany({
    where: {
      userId: userId,
      group: {
        groupName: "",
      },
    },
    select: {
      id: true,
    },
  });

  socket.emit("getAllIdStudents", students);
  // console.log(students, "students");

  return students;
}

export async function getTableData(data, socket: any) {
  const { token, dateRange } = data;

  try {
    const token_ = await db.token.findFirst({
      where: { token },
    });

    if (!token_) {
      throw new Error("Invalid token");
    }

    const userId = token_.userId;

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    console.log(
      `Date range: ${startDate.toISOString()} - ${endDate.toISOString()}`
    );

    // Fetch all students for the user
    const students = await db.student.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            items: true,
          },
        },
      },
    });

    console.log(`Found ${students.length} students`);

    // Fetch relevant student schedules
    const studentSchedules = await db.studentSchedule.findMany({
      where: {
        userId,
        OR: [
          {
            year: {
              gte: startDate.getFullYear().toString(),
              lte: endDate.getFullYear().toString(),
            },
            month: {
              gte: (startDate.getMonth() + 1).toString(),
              lte: (endDate.getMonth() + 1).toString(),
            },
            day: {
              gte: startDate.getDate().toString(),
              lte: endDate.getDate().toString(),
            },
          },
          {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        ],
      },
    });

    console.log(`Found ${studentSchedules.length} student schedules`);

    const tableData = students.map((student) => {
      const studentSchedules_ = studentSchedules.filter(
        (schedule) => schedule.groupId === student.groupId
      );

      console.log(
        `Found ${studentSchedules_.length} schedules for student ${student.nameStudent}`
      );

      const lessons = studentSchedules_.length;

      const canceledLessons = studentSchedules_.filter(
        (schedule) => schedule.isCancel || !schedule.isChecked
      ).length;
      const income = studentSchedules_.reduce(
        (sum, schedule) =>
          sum + (schedule.lessonsPrice || 0) * (schedule.lessonsCount || 0),
        0
      );

      let consumption = student.costStudent;

      // Calculate debt (assuming debt is the difference between expected income and actual income)
      const expectedIncome = lessons * Number(student.costOneLesson || 0);
      const debt = Math.max(0, expectedIncome - Number(consumption));

      // Calculate average cost
      const avgCost =
        lessons > 0
          ? (income / lessons).toFixed(2)
          : student.costOneLesson || "0";

      console.log(
        `\n-----------\n${student.nameStudent}\nLessons: ${lessons}\nAvg Cost: ${avgCost}\nCanceled: ${canceledLessons}\nIncome: ${income}\nConsumption: ${consumption}\nDebt: ${debt}\n----------\n`
      );

      return {
        name: student.nameStudent,
        lessons,
        avgCost,
        cancel: canceledLessons,
        income,
        consumption,
        duty: debt,
        total: income - consumption,
      };
    });

    socket.emit("getTableData", tableData);
    return tableData;
  } catch (error) {
    console.error("Error fetching table data:", error);
    socket.emit("error", { message: "Failed to fetch table data" });
  }
}

export async function deleteStudent(
  data: { token: string; id: string },
  socket: any
) {
  const { token, id } = data; // token is the user's token. id is the student's id

  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });

  const userId = token_.userId;

  try {
    const deletedStudent = await db.student.delete({
      where: {
        id,
        userId,
      },
    });

    //Delete group with this student
    const group = await db.group.findFirst({
      where: {
        id: deletedStudent.groupId,
      },
    });

    //Delete student schedule with this student
    await db.studentSchedule.deleteMany({
      where: {
        groupId: group.id,
      },
    });

    if (group) {
      await db.group.update({
        where: {
          id: group.id,
        },
        data: {
          students: {
            disconnect: {
              id: deletedStudent.id,
            },
          },
        },
      });
    }

    socket.emit("deleteStudent", {
      message: "student deleted successfully",
      deleted: deletedStudent,
    });
    return deletedStudent;
  } catch (error) {
    console.error("Error deleting student:", error);
  }

  return null;
}

export async function studentToArhive(
  data: {
    token: string;
    id: string;
    isArchived: boolean;
  },
  socket: any
) {
  const { token, id, isArchived } = data; // token is the user's token. id is the student's id

  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });
  // console.log(
  //   data,
  //   "------------------------------------------------------------------------------------------------"
  // );

  const userId = token_.userId;

  try {
    const student = await db.student.update({
      where: {
        id,
        userId,
      },
      data: {
        isArchived: isArchived,
      },
    });

    //get groupId from student
    const groupId = await db.student.findUnique({
      where: {
        id,
      },
      select: {
        groupId: true,
      },
    });

    //Delete student schedule with this student
    await db.studentSchedule.updateMany({
      where: {
        groupId: groupId.groupId,
      },
      data: {
        isArchived: isArchived,
      },
    });

    socket.emit("studentToArhive", {
      message: "student archived successfully",
      archived: student,
    });

    return student;
  } catch (error) {
    console.error("Error deleting student:", error);
  }

  return null;
}

export async function createStudentSchedule(data: any, socket: any) {
  const { token, day, month, year } = data; // token is the user's token. id is the student's id

  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });

  const userId = token_.userId;

  try {
    //create void item
    const item = await db.item.create({
      data: {
        itemName: "",
        lessonDuration: 0,
        userId,
        endLesson: new Date(),
        startLesson: new Date(),
        nowLevel: 0,
        tryLessonCheck: false,
        todayProgramStudent: "",
        targetLesson: "",
        programLesson: "",

        typeLesson: 0,
        placeLesson: "",
        timeLesson: "",
        costOneLesson: "",
        valueMuiSelectArchive: 0,
        tryLessonCost: "",
        timeLinesArray: [],
      },
    });

    //create void group
    const group = await db.group.create({
      data: {
        groupName: "",
        userId,
        historyLessons: [],
        items: {
          connect: {
            id: item.id,
          },
        },
      },
    });

    //create timelinesArray. Ex: [{"id":1,"day":"Пн","active":false,"endTime":{"hour":3,"minute":25},"startTime":{"hour":3,"minute":0},"editingEnd":false,"editingStart":false},{"id":2,"day":"Вт","active":false,"endTime":{"hour":0,"minute":0},"startTime":{"hour":0,"minute":0},"editingEnd":false,"editingStart":false},{"id":3,"day":"Ср","active":false,"endTime":{"hour":0,"minute":0},"startTime":{"hour":0,"minute":0},"editingEnd":false,"editingStart":false},{"id":4,"day":"Чт","active":false,"endTime":{"hour":2,"minute":25},"startTime":{"hour":2,"minute":0},"editingEnd":false,"editingStart":false},{"id":5,"day":"Пт","active":false,"endTime":{"hour":0,"minute":0},"startTime":{"hour":0,"minute":0},"editingEnd":false,"editingStart":false},{"id":6,"day":"Сб","active":false,"endTime":{"hour":0,"minute":0},"startTime":{"hour":0,"minute":0},"editingEnd":false,"editingStart":false},{"id":7,"day":"Вс","active":false,"endTime":{"hour":0,"minute":0},"startTime":{"hour":0,"minute":0},"editingEnd":false,"editingStart":false}]
    const tla = [];
    const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    for (let i = 0; i < 7; i++) {
      tla.push({
        id: i + 1,
        day: days[i],
        active: false,
        endTime: {
          hour: 0,
          minute: 0,
        },
        startTime: {
          hour: 0,
          minute: 0,
        },
        editingEnd: false,
        editingStart: false,
      });
    }

    const studentSchedule = await db.studentSchedule.create({
      data: {
        studentId: null,
        studentName: "",
        itemName: "",
        lessonsPrice: 0,
        typeLesson: 0,
        day,
        month,
        year,
        userId,
        timeLinesArray: tla,
        lessonsCount: 1,
        workPrice: 0,
        workCount: 0,
        groupId: group.id,
        isArchived: false,
        clientId: null,
        item: {
          connect: {
            id: item.id,
          },
        },
      },
    });

    socket.emit("createStudentSchedule", {
      message: "student schedule created successfully",
      created: studentSchedule.id,
    });
    return studentSchedule.id;
  } catch (error) {
    console.error("Error deleting student:", error);
  }
}

export async function deleteAudio(
  data: {
    token: string;
    id: string;
    type: "student" | "client" | "group";
  },
  socket: any
) {
  try {
    const { token, id, type } = data; // token is the user's token. id is the file's id
    // console.log(
    //   `\n-----------------------delete-Audio-----------------\n${JSON.stringify(
    //     data
    //   )}\n------------------------------------\n`
    // );
    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    if (!token_) {
      throw new Error("Invalid token");
    }

    const userId = token_.userId;

    // Models to update
    const models = [
      { name: "Group", field: "files" },
      { name: "Student", field: "files" },
      { name: "Client", field: "files" },
      { name: "StudentSchedule", field: "homeAudios" },
      { name: "StudentSchedule", field: "classAudios" },
    ];

    for (const model of models) {
      const items = await db[
        model.name.charAt(0).toLowerCase() + model.name.slice(1)
      ].findMany({
        where: {
          userId,
          [model.field]: {
            has: id,
          },
        },
      });

      for (const item of items) {
        const updatedFiles = item[model.field].filter(
          (fileId) => fileId !== id
        );
        await db[
          model.name.charAt(0).toLowerCase() + model.name.slice(1)
        ].update({
          where: { id: item.id },
          data: { [model.field]: updatedFiles },
        });
      }
    }

    socket.emit("deleteAudio", {
      message: "Audio deleted successfully",
    });
    // console.log("Audio deleted successfully");
  } catch (error) {
    socket.emit("deleteAudio", {
      message: "Error deleting audio",
      error: error.message,
    });
    console.error("Error deleting audio:", error);
  }
}

// export async function cancelLesson(
//   data: { id: string; token: string },
//   socket
// ) {
//   try {
//     const { id, token } = data;
//     const tokenRecord = await db.token.findFirst({ where: { token } });
//     if (!tokenRecord) {
//       throw new Error("Invalid token");
//     }

//     const userId = tokenRecord.userId;

//     const updatedSchedule = await db.studentSchedule.update({
//       where: { id, userId },
//       data: { isCancel: true },
//     });

//     //TODO: cancel in history

//     socket.emit("lessonCanceled", { success: true, updatedSchedule });
//   } catch (error) {
//     console.error("Error canceling lesson:", error);
//     socket.emit("lessonCanceled", { success: false, error: error.message });
//   }
// }

export async function cancelLesson(
  data: { id: string; token: string },
  socket
) {
  try {
    const { id, token } = data;
    const tokenRecord = await db.token.findFirst({ where: { token } });
    if (!tokenRecord) {
      throw new Error("Invalid token");
    }

    const userId = tokenRecord.userId;

    // Получаем информацию о занятии
    const schedule = await db.studentSchedule.findUnique({
      where: { id, userId },
      include: { item: true },
    });

    if (!schedule) {
      throw new Error("Schedule not found");
    }

    // Обновляем статус занятия
    const updatedSchedule = await db.studentSchedule.update({
      where: { id, userId },
      data: { isCancel: true },
    });

    const lessonDate = new Date(
      schedule.year,
      schedule.month - 1,
      schedule.day
    );

    // Находим группу по groupId
    const group = await db.group.findUnique({
      where: { id: schedule.groupId },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    // Обновляем историю занятий в группе
    let updatedHistoryLessons = group.historyLessons.map((lesson) => {
      if (
        new Date(lesson.date).toDateString() === lessonDate.toDateString() &&
        lesson.itemName === schedule.item.itemName
      ) {
        return { ...lesson, isCancel: true };
      }
      return lesson;
    });

    await db.group.update({
      where: { id: group.id },
      data: { historyLessons: updatedHistoryLessons },
    });

    socket.emit("lessonCanceled", { success: true, updatedSchedule });
  } catch (error) {
    console.error("Error canceling lesson:", error);
    socket.emit("lessonCanceled", { success: false, error: error.message });
  }
}
