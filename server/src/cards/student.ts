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
      audios,
      cost,
      files,
      items,
      token,
    } = data;

    const token_ = await db.token.findFirst({
      where: { token },
    });

    if (!token_) {
      throw new Error("Invalid token");
    }

    const userId = token_.userId;

    if (!userId) {
      throw new Error("Invalid token");
    }

    const conflicts = [];

    for (const item of items) {
      const startDate = new Date(item.startLesson);
      const endDate = new Date(item.endLesson);
      const daysToAdd = differenceInDays(endDate, startDate);
      const dateRange = Array.from({ length: daysToAdd + 1 }, (_, i) =>
        addDays(startDate, i)
      );

      for (const date of dateRange) {
        const dayOfWeek = getDay(date);
        const scheduleForDay = item.timeLinesArray[dayOfWeek];
        const dayOfMonth = date.getDate();

        const cacheKey = `${userId}-${dayOfMonth}-${
          date.getMonth() + 1
        }-${date.getFullYear()}`;
        let existingSchedules = cache.get(cacheKey);

        if (!existingSchedules) {
          existingSchedules = await db.studentSchedule.findMany({
            where: {
              day: dayOfMonth.toString(),
              month: (date.getMonth() + 1).toString(),
              year: date.getFullYear().toString(),
              userId,
            },
          });
          cache.set(cacheKey, existingSchedules, 3600000); // 1 час TTL
        }

        const conflictingSchedules = existingSchedules.filter((schedule) => {
          const scheduleStartTime =
            schedule.timeLinesArray[dayOfWeek].startTime;
          const scheduleEndTime = schedule.timeLinesArray[dayOfWeek].endTime;

          const newStartTime = scheduleForDay.startTime;
          const newEndTime = scheduleForDay.endTime;

          return (
            (newStartTime.hour < scheduleEndTime.hour ||
              (newStartTime.hour === scheduleEndTime.hour &&
                newStartTime.minute <= scheduleEndTime.minute)) &&
            (newEndTime.hour > scheduleStartTime.hour ||
              (newEndTime.hour === scheduleStartTime.hour &&
                newEndTime.minute >= scheduleStartTime.minute))
          );
        });

        if (conflictingSchedules.length > 0) {
          const daysOfWeek = [
            "Понедельник",
            "Вторник",
            "Среда",
            "Четверг",
            "Пятница",
            "Суббота",
            "Воскресенье",
          ];
          const dayName = daysOfWeek[dayOfWeek];
          const startTime = `${scheduleForDay.startTime.hour}:${scheduleForDay.startTime.minute}`;
          const endTime = `${scheduleForDay.endTime.hour}:${scheduleForDay.endTime.minute}`;

          let conflict = {
            day: dayName,
            timeLines: conflictingSchedules.map((schedule) => {
              const scheduleStartTime =
                schedule.timeLinesArray[dayOfWeek].startTime;
              const scheduleEndTime =
                schedule.timeLinesArray[dayOfWeek].endTime;
              return {
                time: `${scheduleStartTime.hour}:${scheduleStartTime.minute}-${scheduleEndTime.hour}:${scheduleEndTime.minute}`,
              };
            }),
          };

          conflicts.push(conflict);
        }
      }
    }

    if (conflicts.length > 0) {
      io.emit("addStudent", { error: conflicts, ok: false });
      return;
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
        const dayOfMonth = date.getDate();

        const cond =
          scheduleForDay.startTime.hour === 0 &&
          scheduleForDay.startTime.minute === 0 &&
          scheduleForDay.endTime.hour === 0 &&
          scheduleForDay.endTime.minute === 0;

        if (!cond) {
          await db.studentSchedule.create({
            data: {
              day: dayOfMonth.toString(),
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

    let filePaths: string[] = [];

    if (files.length > 0) {
      filePaths = await upload(files, userId, "", (ids: string[]) => {
        filePaths = ids;
      });
    }

    let audiosIds: string[] = [];

    if (audios.length > 0) {
      audiosIds = await upload(
        audios,
        userId,
        "student/audio",
        (ids: string[]) => {
          audiosIds = ids;
        }
      );
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

    io.emit("addStudent", { ok: true });
  } catch (error) {
    console.error("Error creating group:", error);
    io.emit("addStudent", { error: error.message, ok: false });
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
        contactFace: true,
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
  isGroup: boolean;
}) {
  const { day, month, year, token, isGroup } = data;
  const token_ = await db.token.findFirst({ where: { token } });
  const userId = token_?.userId;

  if (!userId) {
    io.emit("getStudentsByDate", { error: "Invalid token" });
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
      homeWork: true,
      classWork: true,
      homeStudentsPoints: true,
      classStudentsPoints: true,
      groupId: true,
      clientId: true,
      item: {
        select: {
          tryLessonCheck: true,
          todayProgramStudent: true,
          targetLesson: true,
          programLesson: true,
          placeLesson: true,
          timeLesson: true,
          group: {
            include: {
              students: {
                select: {
                  nameStudent: true,
                  costOneLesson: true,
                  id: true,
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

  if (isGroup) {
    const groupsData = [];

    for (const schedule of studentSchedules) {
      const { item } = schedule;
      const students = item.group.students;
      const timeLinesArray = schedule.timeLinesArray;
      const daySchedule = timeLinesArray[dayOfWeekIndex];
      const homeFiles = await db.file.findMany({
        where: { id: { in: schedule.homeFiles }, extraType: "home" },
      });
      const classFiles = await db.file.findMany({
        where: { id: { in: schedule.classFiles }, extraType: "class" },
      });
      const groupStudentSchedule = schedule.item.group.groupName;

      const groupData = {
        id: schedule.id,
        itemName: schedule.itemName,
        typeLesson: schedule.typeLesson,
        homeFiles,
        classFiles,
        homeWork: schedule.homeWork,
        place: item.placeLesson,
        classWork: schedule.classWork,
        isCheck: schedule.isChecked,
        tryLessonCheck: item.tryLessonCheck,
        startTime: daySchedule?.startTime,
        endTime: daySchedule?.endTime,
        homeStudentsPoints: JSON.parse(JSON.stringify(schedule))
          .homeStudentsPoints.points,
        classStudentsPoints: JSON.parse(JSON.stringify(schedule))
          .classStudentsPoints.points,
        groupName: groupStudentSchedule,
        groupId: schedule.groupId,
        students: students.map((student) => ({
          id: student.id,
          nameStudent: student.nameStudent,
          costOneLesson: student.costOneLesson,
          targetLessonStudent: student.targetLessonStudent,
          todayProgramStudent: student.todayProgramStudent,
          homeStudentsPoints: schedule.homeStudentsPoints,
          classStudentsPoints: schedule.classStudentsPoints,
        })),
      };

      groupsData.push(groupData);
    }

    io.emit("getStudentsByDate", groupsData);
  } else {
    const dataToEmit = [];

    for (const schedule of studentSchedules) {
      const { item } = schedule;
      const student = item.group.students[0] || null;
      const timeLinesArray = schedule.timeLinesArray;
      const daySchedule = timeLinesArray[dayOfWeekIndex];
      const homeFiles = await db.file.findMany({
        where: { id: { in: schedule.homeFiles }, extraType: "home" },
      });
      const classFiles = await db.file.findMany({
        where: { id: { in: schedule.classFiles }, extraType: "class" },
      });
      const groupStudentSchedule = schedule.item.group.groupName;

      const scheduleData = {
        id: schedule.id,
        nameStudent: schedule.studentName,
        costOneLesson: schedule.lessonsPrice,
        studentId: student ? student.id : "",
        itemName: schedule.itemName,
        typeLesson: schedule.typeLesson,
        homeFiles,
        classFiles,
        homeWork: schedule.homeWork,
        place: item.placeLesson,
        classWork: schedule.classWork,
        homeStudentsPoints: schedule.homeStudentsPoints,
        classStudentsPoints: schedule.classStudentsPoints,
        isCheck: schedule.isChecked,
        tryLessonCheck: item.tryLessonCheck,
        startTime: daySchedule?.startTime,
        endTime: daySchedule?.endTime,
        groupName: groupStudentSchedule ? groupStudentSchedule : "",
        groupId: schedule.groupId,
        type: groupStudentSchedule ? "group" : "student",
      };

      dataToEmit.push(scheduleData);
    }

    io.emit("getStudentsByDate", dataToEmit);
  }
}

export async function updateStudentSchedule(data: {
  id: string;
  day: string;
  month: string;
  year: string;
  lessonsPrice?: number;
  itemName?: string;
  typeLesson?: number;
  homeFiles?: IUploadFiles[];
  classFiles?: IUploadFiles[];
  homeWork?: string;
  classWork?: string;
  audios?: IUploadFiles[];
  classAudios?: IUploadFiles[];
  isChecked?: boolean;
  homeStudentsPoints?: { studentId: string; points: number }[];
  classStudentsPoints?: { studentId: string; points: number }[];
  address?: string;
  studentName?: string;
  token: string;
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
    homeFiles,
    classFiles,
    homeWork,
    classWork,
    homeStudentsPoints,
    classStudentsPoints,
    address,
    audios,
    classAudios,
    token,
    isChecked,
    studentName,
    startTime,
    endTime,
  } = data;

  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });

  const userId = token_.userId;

  console.log("data", data);

  let homeFilePaths: string[] = [];
  let classFilePaths: string[] = [];

  // Save home files
  if (homeFiles.length > 0) {
    homeFilePaths = await upload(
      homeFiles,
      userId,
      "home",
      (paths: string[]) => {
        homeFilePaths = paths;
      }
    );
  }

  // Save class files
  if (classFiles.length > 0) {
    classFilePaths = await upload(
      classFiles,
      userId,
      "class",
      (paths: string[]) => {
        classFilePaths = paths;
      }
    );
  }

  // const onjAudios = JSON.parse(JSON.stringify(audios));
  // const onjClassAudios = JSON.parse(JSON.stringify(classAudios));

  // // Save audios
  // //check if audio.name in strongCache, then not filter
  // let audios_ = onjAudios.filter((audio) => {
  //   return !strongCache.has(audio.name);
  // });

  // let classAudios_ = onjClassAudios.filter((audio) => {
  //   return !strongCache.has(audio.name);
  // });

  // let homeAudiosPaths: string[] = [];
  // let classAudiosPaths: string[] = [];

  // if (audios_.length > 0) {
  //   homeAudiosPaths = await upload(
  //     audios_,
  //     userId,
  //     "home/audio",
  //     (paths: string[]) => {
  //       homeAudiosPaths = paths;
  //     }
  //   );
  // }

  // //add to strong cache
  // audios_.forEach((audio) => strongCache.add(audio.name));

  // if (classAudios_.length > 0) {
  //   classAudiosPaths = await upload(
  //     classAudios_,
  //     userId,
  //     "class/audio",
  //     (paths: string[]) => {
  //       classAudiosPaths = paths;
  //     }
  //   );
  // }

  // //add to strong cache
  // classAudios_.forEach((audio) => strongCache.add(audio.name));

  console.log("homeFiles", homeFiles, "classFiles", classFiles);

  const updatedFields: {
    lessonsPrice?: number;
    itemName?: string;
    typeLesson?: number;
    isChecked?: boolean;
    homeFiles?: string[]; //ids
    classFiles?: string[]; //ids
    // homeAudios?: string[]; //ids
    // classAudios?: string[]; //ids
    address?: string;
    studentName?: string;
    homeWork?: string;
    classWork?: string;
    homeStudentsPoints?: { studentId: string; points: number }[];
    classStudentsPoints?: { studentId: string; points: number }[];
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
  if (typeLesson !== undefined) updatedFields.typeLesson = Number(typeLesson);
  if (isChecked !== undefined) updatedFields.isChecked = isChecked;
  if (studentName !== undefined) updatedFields.studentName = studentName;
  if (homeWork !== undefined) updatedFields.homeWork = homeWork;
  if (classWork !== undefined) updatedFields.classWork = classWork;
  if (homeStudentsPoints !== undefined)
    updatedFields.homeStudentsPoints = homeStudentsPoints;
  if (classStudentsPoints !== undefined)
    updatedFields.classStudentsPoints = classStudentsPoints;
  if (address !== undefined) updatedFields.address = address;
  if (
    homeFilePaths !== undefined &&
    homeFilePaths.length > 0 &&
    homeFiles !== undefined
  )
    updatedFields.homeFiles = homeFilePaths;
  if (
    classFilePaths !== undefined &&
    classFilePaths.length > 0 &&
    classFiles !== undefined
  )
    updatedFields.classFiles = classFilePaths;
  // if (homeAudiosPaths !== undefined && homeAudiosPaths.length > 0)
  //   updatedFields.homeAudios = homeAudiosPaths;
  // if (classAudiosPaths !== undefined && classAudiosPaths.length > 0)
  //   updatedFields.classAudios = classAudiosPaths;

  const dayOfWeekIndex = getDay(
    new Date(Number(year), Number(month) - 1, Number(day))
  );

  // if (homeFiles) {
  //   const uploadPromises = homeFiles.map(async (file: Buffer) => {
  //     const filePath = await upload(file).catch((err) => {
  //       console.log(err);
  //       return null;
  //     });
  //     return filePath;
  //   });
  //   const uploadedHomeFiles = await Promise.all(uploadPromises);
  //   updatedFields.homeFiles = homeFilePaths.concat(
  //     uploadedHomeFiles.filter(Boolean)
  //   );
  // }

  // if (classFiles) {
  //   const uploadPromises = classFiles.map(async (file: Buffer) => {
  //     const filePath = await upload(file).catch((err) => {
  //       console.log(err);
  //       return null;
  //     });
  //     return filePath;
  //   });
  //   const uploadedClassFiles = await Promise.all(uploadPromises);
  //   updatedFields.classFiles = classFilePaths.concat(
  //     uploadedClassFiles.filter(Boolean)
  //   );
  // }

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

  if (id?.startsWith("-")) {
    const newStudentSchedule = await db.studentSchedule.create({
      data: {
        ...updatedFields,
        day,
        month,
        year,
        userId: userId,
        // Add the required fields here
        groupId: "", // Provide a valid groupId or choose a suitable default value
        workCount: 0, // Choose a suitable default value
        lessonsCount: 0, // Choose a suitable default value
        workPrice: 0, // Choose a suitable default value
        itemId: "", // Provide a valid itemId or choose a suitable default value
        lessonsPrice: 0, // Choose a suitable default value
        typeLesson: 1, // Choose a suitable default value
      },
    });

    //update new student schedule fields
    const _updateStudentSchedule = await db.studentSchedule.update({
      where: { id: newStudentSchedule.id },
      data: {
        ...updatedFields,
        day,
        month,
        year,
        userId: userId,
      },
    });
  }

  const updatedSchedule = await db.studentSchedule.update({
    where: { id, day, month, year, userId: userId },
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

    console.log(files, "files");
    //group to object
    const group_ = JSON.parse(JSON.stringify(group));
    group_.group.students[0].filesData = files;
    group_.group.students[0].audiosData = audios;

    // //get audios buffers
    // const audiosBuffers = await JSON.parse(JSON.stringify(audios)).map(
    //   (audio) => {
    //     return getBufferByFilePath(audio.path);
    //   }
    // );

    // console.log(audiosBuffers, "audiosBuffers");

    // //add audios buffers to every audio object

    // await group_.group.students[0].audiosData.forEach(async (audio, index) => {
    //   audio.buffer = await audiosBuffers[index];
    // });

    io.emit("getGroupByStudentId", group_);
    return group.group;
  } catch (error) {
    console.error("Error retrieving group:", error);
    console.log(error);
  }
}

export async function updateStudentAndItems(data: any) {
  const { id, items, audios, files, token } = data;

  try {
    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    const userId = token_.userId;

    const existFiles = await db.student.findUnique({
      where: {
        id,
      },
      select: {
        files: true,
      },
    });

    const existFilesIds = JSON.parse(JSON.stringify(existFiles)).files;

    // const isDeleted = await deleteFileById(, existFilesIds);

    let justFilesIds = [];

    justFilesIds = await upload(
      files,
      userId,
      "student/file",
      (paths: string[]) => {
        justFilesIds = paths;
      }
    );

    let justAudiosIds = [];

    justAudiosIds = await upload(
      audios,
      userId,
      "student/audio",
      (paths: string[]) => {
        justAudiosIds = paths;
      }
    );

    const AllFiles = Object.assign(justFilesIds, justAudiosIds, existFilesIds);

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
        files: AllFiles,
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
    console.log(error);
  }
}

export async function getAllIdStudents(data: any) {
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

  io.emit("getAllIdStudents", students);
  console.log(students, "students");

  return students;
}

export async function getTableData(data) {
  const { token, dateRange } = data;

  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });

  const userId = token_.userId;

  try {
    // Fetch groups for the user
    const groups = await db.group.findMany({
      where: {
        userId,
      },
      include: {
        students: true,
        items: true,
      },
    });

    // Fetch student schedules for the date range
    const studentSchedules = await db.studentSchedule.findMany({
      where: {
        userId,
        day: {
          gte: new Date(dateRange.start).getDate().toString(),
          lte: new Date(dateRange.end).getDate().toString(),
        },
        month: (new Date(dateRange.start).getMonth() + 1).toString(),
        year: new Date(dateRange.start).getFullYear().toString(),
      },
    });

    const tableData = groups.flatMap((group) => {
      const groupStudents = group.students;
      const groupItems = group.items;

      return groupStudents.map((student) => {
        const studentSchedules_ = studentSchedules.filter(
          (schedule) =>
            schedule.groupId === group.id &&
            schedule.studentName === student.nameStudent
        );

        const lessons = studentSchedules_.reduce(
          (count, schedule) => count + schedule.lessonsCount,
          0
        );
        const canceledLessons = studentSchedules_.reduce(
          (count, schedule) =>
            count + (schedule.isChecked ? 0 : schedule.lessonsCount),
          0
        );
        const income = studentSchedules_.reduce(
          (sum, schedule) =>
            sum + schedule.lessonsPrice * schedule.lessonsCount,
          0
        );
        const consumption = studentSchedules_.reduce(
          (sum, schedule) => sum + schedule.workPrice,
          0
        );
        const debt = studentSchedules_.reduce(
          (sum, schedule) =>
            sum +
            groupItems.find((item) => item.id === schedule.itemId)
              ?.lessonDuration *
              schedule.lessonsCount *
              Number(student.costOneLesson),
          0
        );

        return {
          name: student.nameStudent,
          lessons,
          avgCost: student.costOneLesson,
          cancel: canceledLessons,
          income,
          consumption,
          duty: debt,
          total: income - debt - consumption,
        };
      });
    });

    io.emit("getTableData", tableData);
    return tableData;
  } catch (error) {
    console.error("Error fetching table data:", error);
    console.log(error);
  }
}

export async function deleteStudent(data: { token: string; id: string }) {
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

    io.emit("deleteStudent", {
      message: "student deleted successfully",
      deleted: deletedStudent,
    });
    return deletedStudent;
  } catch (error) {
    console.error("Error deleting student:", error);
  }

  return null;
}

export async function studentToArhive(data: {
  token: string;
  id: string;
  isArchived: boolean;
}) {
  const { token, id, isArchived } = data; // token is the user's token. id is the student's id

  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });
  console.log(
    data,
    "------------------------------------------------------------------------------------------------"
  );

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

    io.emit("studentToArhive", {
      message: "student archived successfully",
      archived: student,
    });

    return student;
  } catch (error) {
    console.error("Error deleting student:", error);
  }

  return null;
}

export async function createStudentSchedule(data: any) {
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

    io.emit("createStudentSchedule", {
      message: "student schedule created successfully",
      created: studentSchedule.id,
    });
    return studentSchedule.id;
  } catch (error) {
    console.error("Error deleting student:", error);
  }
}

export async function deleteAudio(data: {
  token: string;
  id: string;
  type: "student" | "client" | "group";
}) {
  try {
    const { token, id, type } = data; // token is the user's token. id is the file's id
    console.log(
      `\n-----------------------delete-Audio-----------------\n${JSON.stringify(
        data
      )}\n------------------------------------\n`
    );
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
    ];

    for (const model of models) {
      const items = await db[model.name.toLowerCase()].findMany({
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
        await db[model.name.toLowerCase()].update({
          where: { id: item.id },
          data: { [model.field]: updatedFiles },
        });
      }
    }

    io.emit("deleteAudio", {
      message: "Audio deleted successfully",
    });
    console.log("Audio deleted successfully");
  } catch (error) {
    io.emit("deleteAudio", {
      message: "Error deleting audio",
      error: error.message,
    });
    console.error("Error deleting audio:", error);
  }
}
