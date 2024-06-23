import { Prisma, PrismaClient } from "@prisma/client";
import { IStudentCardResponse, ITimeLine, IItemCard } from "../types";
import db from "../db";
import io from "../socket";
import { addDays, differenceInDays } from "date-fns";
import { upload } from "files/files";
import { cache } from "utils/Cache";

function getDay(date) {
  const dayIndex = date.getDay() - 1;
  return dayIndex === -1 ? 6 : dayIndex;
}

export async function addGroup(data: any, socket: any) {
  try {
    const {
      groupName,
      items,
      students,
      token,
      files = [],
      filesItems = [],
      audiosItems = [],
      audiosStudents = [],
      historyLessons,
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
          if (!schedule.timeLinesArray || !schedule.timeLinesArray[dayOfWeek]) {
            return false;
          }
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
            "Воскресенье",
            "Понедельник",
            "Вторник",
            "Среда",
            "Четверг",
            "Пятница",
            "Суббота",
          ];
          const dayName = daysOfWeek[dayOfWeek];
          const startTime = `${scheduleForDay.startTime.hour}:${scheduleForDay.startTime.minute}`;
          const endTime = `${scheduleForDay.endTime.hour}:${scheduleForDay.endTime.minute}`;

          let errorMessage = `В ${dayName} на данное время ${startTime}-${endTime} уже есть занятие`;

          const freeTimeSlots = [];
          for (const schedule of existingSchedules) {
            if (schedule.timeLinesArray && schedule.timeLinesArray[dayOfWeek]) {
              const scheduleStartTime =
                schedule.timeLinesArray[dayOfWeek].startTime;
              const scheduleEndTime =
                schedule.timeLinesArray[dayOfWeek].endTime;
              freeTimeSlots.push(
                `${scheduleEndTime.hour}:${scheduleEndTime.minute}-${scheduleStartTime.hour}:${scheduleStartTime.minute}`
              );
            }
          }

          if (freeTimeSlots.length > 0) {
            errorMessage += `, в этот день есть свободные промежутки: ${freeTimeSlots.join(
              ", "
            )}`;
          }

          io.emit("addGroup", { error: errorMessage, ok: false });
          return;
        }
      }
    }

    const createdGroup = await db.group.create({
      data: {
        groupName,
        userId,
        historyLessons: historyLessons,
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
            costOneLesson: "",

            valueMuiSelectArchive: item.valueMuiSelectArchive || 1,
            startLesson: item.startLesson ? new Date(item.startLesson) : null,
            endLesson: item.endLesson ? new Date(item.endLesson) : null,
            nowLevel: item.nowLevel || 0,
            lessonDuration: Number(item.lessonDuration) || null,
            timeLinesArray: item.timeLinesArray || {},
            userId,
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
            costOneLesson: String(student.costOneLesson) || "",
            targetLessonStudent: student.targetLessonStudent || "",
            todayProgramStudent: student.todayProgramStudent || "",
            startLesson: student.startLesson ? new Date(student.startLesson) : null,
            endLesson: student.endLesson ? new Date(student.endLesson) : null,
            nowLevel: student.nowLevel || 0,
            tryLessonCost: student.tryLessonCost || "",
            tryLessonCheck: student.tryLessonCheck || false,
            userId,
          })),
        },
      },
      select: {
        _count: true,
        id: true,
        groupName: true,
        userId: true,
        items: true,
        isArchived: true,
        students: true,
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

        const costOneLesson = await db.group.findUnique({
          where: { id: createdGroup.id },
          select: {
            students: {
              where: { userId },
              select: { costOneLesson: true },
            },
          },
        });

        if (!cond) {
          await db.studentSchedule.create({
            data: {
              day: dayOfMonth.toString(),
              groupId: createdGroup.id,
              workCount: 0,
              lessonsCount: 1,
              lessonsPrice: Number(costOneLesson.students[0].costOneLesson),
              workPrice: 0,
              month: (date.getMonth() + 1).toString(),
              timeLinesArray: item.timeLinesArray,
              isChecked: false,
              itemName: item.itemName,
              typeLesson: item.typeLesson,
              year: date.getFullYear().toString(),
              itemId: item.id,
              userId,
            },
          });
        }
      }
    }

    let filesIds = [];
    let filesItemsIds = [];

    if (files.length > 0) {
      filesIds = await upload(files, userId, "group/files", (ids) => {
        filesIds = ids;
      });
    }

    if (filesItems.length > 0) {
      filesItemsIds = await upload(
        filesItems,
        userId,
        "group/filesItems",
        (ids) => {
          filesItemsIds = ids;
        }
      );
    }

    let audiosItemsIds = [];
    let audiosStudentsIds = [];

    if (audiosItems.length > 0) {
      audiosItemsIds = await upload(
        audiosItems,
        userId,
        "group/audioItems",
        (ids) => {
          audiosItemsIds = ids;
        }
      );
    }

    if (audiosStudents.length > 0) {
      audiosStudentsIds = await upload(
        audiosStudents,
        userId,
        "group/audioStudents",
        (ids) => {
          audiosStudentsIds = ids;
        }
      );
    }

    await db.group.update({
      where: { id: createdGroup.id },
      data: {
        files: [
          ...filesIds,
          ...filesItemsIds,
          ...audiosItemsIds,
          ...audiosStudentsIds,
        ],
      },
    });

    socket.emit("addGroup", { ok: true });
  } catch (error) {
    console.error("Error creating group:", error);
    socket.emit("addGroup", { error: error.message, ok: false });
  }
}

export async function getGroupList(token, socket: any) {
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
        NOT: {
          groupName: "",
        },
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
            contactFace: true,
          },
        },
      },
    });

    const groupsWithName = groups.filter((group) => group.groupName !== "");

    console.log(groups);
    socket.emit("getGroupList", groupsWithName);
    return groups;
  } catch (error) {
    console.error("Error fetching group list:", error);
    socket.emit("getGroupList", { error: "Error fetching group list" });
  }
}

export async function deleteGroup(data: any, socket: any) {
  const { token, id } = data;
  let groupId = id;
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

    if (!userId) {
      throw new Error("Invalid token");
    }

    const group = await db.group.findUnique({
      where: {
        id: groupId,
        userId,
      },
    });

    // Получаем студентов группы
    const groupStudents = await db.student.findMany({
      where: {
        groupId: groupId,
      },
      select: {
        id: true,
      },
    });

    // Удаляем все расписания студентов, связанные с данной группой
    await db.studentSchedule.deleteMany({
      where: {
        studentId: {
          in: groupStudents.map((student) => student.id),
        },
      },
    });

    // Удаляем все записи в расписании, связанные с студентами группы
    await db.studentSchedule.deleteMany({
      where: {
        groupId,
      },
    });
    // Удаляем все элементы группы
    await db.item.deleteMany({
      where: {
        groupId,
      },
    });

    // Удаляем всех студентов группы
    await db.student.deleteMany({
      where: {
        groupId,
      },
    });

    // Удаляем группу
    await db.group.delete({
      where: {
        id: groupId,
        userId,
      },
    });

    console.log("Group deleted:", group);
  } catch (error) {
    console.error("Error deleting group:", error);
  }
}

export async function groupToArchive(data: any, socket: any) {
  const { token, id, isArchived } = data;
  let groupId = id;
  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });

  const userId = token_.userId;

  try {
    const group = await db.group.update({
      where: {
        id: groupId,
        userId,
      },
      data: {
        isArchived: isArchived,
      },
    });

    //update all StudentSchedule with this groupId
    await db.studentSchedule.updateMany({
      where: {
        groupId: groupId,
      },
      data: {
        isArchived: isArchived,
      },
    });
  } catch (error) {
    console.error("Error archiving group:", error);
  }
}

export async function getGroupsByDate(data: any, socket: any) {
  const { day, month, year, userId, dayOfWeekIndex } = data;
  const groupSchedules = await db.studentSchedule.findMany({
    where: {
      day,
      month,
      year,
      userId,
      clientId: null,
      item: {
        group: {
          groupName: { not: "" }, // Условие для включения только групп
        },
      },
    },
    include: {
      item: {
        include: {
          group: true,
        },
      },
    },
  });

  return groupSchedules.reduce((groups, schedule) => {
    const { item, groupId } = schedule;
    const groupName = item.group.groupName;

    const existingGroup = groups.find((group) => group.groupName === groupName);

    if (existingGroup) {
      existingGroup.studentSchedules.push(schedule);
    } else {
      const newGroup = {
        groupName,
        studentSchedules: [schedule],
      };
      groups.push(newGroup);
    }

    return groups;
  }, []);
}

//get group by id
export async function getGroupById(data: any, socket: any) {
  const { token, groupId } = data;

  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });

  const userId = token_.userId;

  try {
    const group = await db.group.findUnique({
      where: {
        id: groupId,
        userId,
      },
      select: {
        id: true,
        isArchived: true,
        items: true,
        groupName: true,
        files: true,
        students: true,
        historyLessons: true,
      },
    });

    console.log(group, "getGroupById", group.files, "files");

    const files = await db.file.findMany({
      where: {
        id: {
          in: group.files,
        },
      },
      select: {
        id: true,
        name: true,
        extraType: true,
        size: true,
        type: true,
      },
    });

    console.log(files, "files");

    //with extra type 'group/files'
    const etFiles = files.filter((file) => file.extraType === "group/files");

    //with extra type 'group/filesItems'
    const etGroupItems = files.filter(
      (item) => item.extraType === "group/filesItems"
    );

    const etAudioItems = files.filter(
      (item) => item.extraType === "group/audioItems"
    );

    const etAudioStudents = files.filter(
      (item) => item.extraType === "group/audioStudents"
    );

    const group_ = JSON.parse(JSON.stringify(group));
    group_.files = etFiles;
    group_.filesItems = etGroupItems;
    group_.audioItems = etAudioItems;
    group_.audioStudents = etAudioStudents;

    socket.emit("getGroupById", group_);
    return group;
  } catch (error) {
    console.error("Error getting group by id:", error);
  }
}

//update group (if data exist)
export async function updateGroup(data, socket: any) {
  try {
    const {
      id,
      groupName,
      items,
      students,
      token,
      files,
      filesItems,
      audiosItems,
      audiosStudents,
      historyLessons,
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

    const existingGroup = await db.group.findUnique({
      where: {
        id,
      },
      include: {
        items: true,
        students: true,
      },
    });

    if (!existingGroup) {
      throw new Error("Group not found");
    }

    // Update group name
    await db.group.update({
      where: {
        id,
      },
      data: {
        groupName,
        historyLessons,
      },
    });

    // Update group items
    for (const newItem of items) {
      const existingItem = existingGroup.items.find(
        (item) => item.id === newItem.id
      );
      if (existingItem) {
        // Update existing item
        await db.item.update({
          where: {
            id: newItem.id,
          },
          data: {
            itemName: newItem.itemName,
            tryLessonCheck: newItem.tryLessonCheck || false,
            tryLessonCost: newItem.tryLessonCost || "",
            todayProgramStudent: newItem.todayProgramStudent || "",
            targetLesson: newItem.targetLesson || "",
            programLesson: newItem.programLesson || "",
            typeLesson: Number(newItem.typeLesson) || 1,
            placeLesson: newItem.placeLesson || "",
            timeLesson: newItem.timeLesson || "",
            valueMuiSelectArchive: newItem.valueMuiSelectArchive || 1,
            startLesson: newItem.startLesson
              ? new Date(newItem.startLesson)
              : null,
            endLesson: newItem.endLesson ? new Date(newItem.endLesson) : null,
            nowLevel: newItem.nowLevel || 0,
            lessonDuration: Number(newItem.lessonDuration) || null,
            timeLinesArray: newItem.timeLinesArray || {},
            userId,
          },
        });
      } else {
        // Create new item
        await db.item.create({
          data: {
            itemName: newItem.itemName,
            tryLessonCheck: newItem.tryLessonCheck || false,
            tryLessonCost: newItem.tryLessonCost || "",
            todayProgramStudent: newItem.todayProgramStudent || "",
            targetLesson: newItem.targetLesson || "",
            programLesson: newItem.programLesson || "",
            typeLesson: Number(newItem.typeLesson) || 1,
            placeLesson: newItem.placeLesson || "",
            timeLesson: newItem.timeLesson || "",
            costOneLesson: newItem.costOneLesson || "",
            valueMuiSelectArchive: newItem.valueMuiSelectArchive || 1,
            startLesson: newItem.startLesson
              ? new Date(newItem.startLesson)
              : null,
            endLesson: newItem.endLesson ? new Date(newItem.endLesson) : null,
            nowLevel: newItem.nowLevel || 0,
            lessonDuration: Number(newItem.lessonDuration) || null,
            timeLinesArray: newItem.timeLinesArray || {},
            userId,
            groupId: id,
          },
        });
      }
    }

    // Update group students
    for (const newStudent of students) {
      const existingStudent = existingGroup.students.find(
        (student) => student.id === newStudent.id
      );
      if (existingStudent) {
        // Update existing student
        await db.student.update({
          where: {
            id: newStudent.id,
          },
          data: {
            nameStudent: newStudent.nameStudent,
            contactFace: newStudent.contactFace,
            phoneNumber: newStudent.phoneNumber,
            email: newStudent.email,
            address: newStudent.address || "",
            linkStudent: newStudent.linkStudent || "",
            costStudent: newStudent.costStudent || "",
            commentStudent: newStudent.commentStudent || "",
            prePayCost: newStudent.prePayCost || "",
            prePayDate: newStudent.prePayDate
              ? new Date(newStudent.prePayDate)
              : null,
            todayProgramStudent: newStudent.todayProgramStudent || "",
            startLesson: newStudent.startLesson ? new Date(student.startLesson) : null,
            endLesson: student.endLesson ? new Date(newStudent.endLesson) : null,
            nowLevel: newStudent.nowLevel || 0,
            tryLessonCost: newStudent.tryLessonCost || "",
            tryLessonCheck: newStudent.tryLessonCheck || false,
            userId,
            groupId: id,
          },
        });
      } else {
        // Create new student
        await db.student.create({
          data: {
            nameStudent: newStudent.nameStudent,
            contactFace: newStudent.contactFace,
            phoneNumber: newStudent.phoneNumber,
            email: newStudent.email,
            address: newStudent.address || "",
            storyLesson: newStudent.storyLesson || "",
            costOneLesson: newStudent.costOneLesson || "",
            targetLessonStudent: newStudent.targetLessonStudent || "",
            linkStudent: newStudent.linkStudent || "",
            costStudent: newStudent.costStudent || "",
            commentStudent: newStudent.commentStudent || "",
            prePayCost: newStudent.prePayCost || "",
            prePayDate: newStudent.prePayDate
              ? new Date(newStudent.prePayDate)
              : null,
            todayProgramStudent: newStudent.todayProgramStudent || "",
            startLesson: newStudent.startLesson ? new Date(newStudent.startLesson) : null,
            endLesson: newStudent.endLesson ? new Date(newStudent.endLesson) : null,
            nowLevel: newStudent.nowLevel || 0,
            tryLessonCost: newStudent.tryLessonCost || "",
            tryLessonCheck: newStudent.tryLessonCheck || false,
            userId,
            groupId: id,
          },
        });
      }
    }

    // Upload and update files
    let uploadedFiles = [];
    if (files.length > 0) {
      uploadedFiles = await upload(
        files,
        userId,
        "group/files",
        (ids) => (uploadedFiles = ids)
      );
    }

    // Upload and update filesItems
    let uploadedFilesItems = [];
    if (filesItems.length > 0) {
      uploadedFilesItems = await upload(
        filesItems,
        userId,
        "group/filesItems",
        (ids) => (uploadedFilesItems = ids)
      );
    }

    // Upload and update audiosItems
    let uploadedAudiosItems = [];
    if (audiosItems.length > 0) {
      uploadedAudiosItems = await upload(
        audiosItems,
        userId,
        "group/audioItems",
        (ids) => (uploadedAudiosItems = ids)
      );
    }

    // Upload and update audiosStudents
    let uploadedAudiosStudents = [];
    if (audiosStudents.length > 0) {
      uploadedAudiosStudents = await upload(
        audiosStudents,
        userId,
        "group/audioStudents",
        (ids) => (uploadedAudiosStudents = ids)
      );
    }

    const groupExt = await db.group.findUnique({
      where: {
        id: id,
      },
      select: {
        files: true,
      },
    });

    const existingFiles = JSON.parse(JSON.stringify(groupExt)).files;
    console.log(
      "\n-----------------existing-files--------------------\n",
      groupExt,
      "\n--------------------------\n"
    );
    // Combine all uploaded files and update group
    const allUploadedFiles = [
      ...uploadedFiles,
      ...uploadedFilesItems,
      ...uploadedAudiosItems,
      ...uploadedAudiosStudents,
      ...existingFiles,
    ];

    await db.group.update({
      where: {
        id,
      },
      data: {
        files: allUploadedFiles,
      },
    });

    // Emit success event
    socket.emit("updateGroup", { ok: true });
  } catch (error) {
    console.error("Error updating group:", error);
    socket.emit("updateGroup", { error: error.message, ok: false });
  }
}

export async function deleteGroupFiles(data: any, socket: any) {
  const { token, groupId, fileIds } = data;
  try {
    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    if (!token_) {
      console.error("Invalid token");
    }

    const userId = token_.userId;
    // Проверить, имеет ли пользователь права на удаление файлов
    const group = await db.group.findUnique({
      where: {
        id: groupId,
        userId: userId,
      },
      select: {
        files: true,
      },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    // Проверить, есть ли удаляемые файлы в группе
    const existingFiles = group.files;
    const filesToDelete = existingFiles.filter((file) =>
      fileIds.includes(file)
    );

    if (filesToDelete.length === 0) {
      throw new Error("Files not found in the group");
    }

    // Обновить запись группы, удалив удаленные файлы
    await db.group.update({
      where: {
        id: groupId,
      },
      data: {
        files: {
          set: existingFiles.filter((file) => !filesToDelete.includes(file)),
        },
      },
    });

    // Вернуть успешный результат
    return { ok: true };
  } catch (error) {
    console.error("Error deleting group files:", error);
    return { error: error.message, ok: false };
  }
}

export async function fetchGroupsByDate(
  data: {
    day: string;
    month: string;
    year: string;
    token: string;
  },
  socket: any
) {
  const { day, month, year, token } = data;
  const token_ = await db.token.findFirst({ where: { token } });
  const userId = token_?.userId;

  if (!userId) {
    socket.emit("fetchGroupsByDate", { error: "Invalid token" });
    return;
  }

  const dayOfWeekIndex = getDay(
    new Date(Number(year), Number(month) - 1, Number(day))
  );

  const groupSchedules = await db.group.findMany({
    where: {
      userId: userId,
      isArchived: false,
      items: {
        some: {
          studentSchedules: {
            some: {
              day: day,
              month: month,
              year: year,
            },
          },
        },
      },
    },
    include: {
      items: {
        include: {
          studentSchedules: true,
        },
      },
      students: true,
    },
  });

  const groupsData = [];

  for (const group of groupSchedules) {
    const groupData = {
      id: group.id,
      groupName: group.groupName,
      items: group.items.map((item) => ({
        id: item.id,
        itemName: item.itemName,
        tryLessonCheck: item.tryLessonCheck,
        tryLessonCost: item.tryLessonCost,
        todayProgramStudent: item.todayProgramStudent,
        targetLesson: item.targetLesson,
        programLesson: item.programLesson,
        typeLesson: item.typeLesson,
        placeLesson: item.placeLesson,
        timeLesson: item.timeLesson,
        costOneLesson: item.costOneLesson,
        valueMuiSelectArchive: item.valueMuiSelectArchive,
        startLesson: item.startLesson,
        endLesson: item.endLesson,
        nowLevel: item.nowLevel,
        lessonDuration: item.lessonDuration,
        timeLinesArray: item.timeLinesArray,
        studentSchedules: item.studentSchedules.map((schedule) => ({
          id: schedule.id,
          studentId: schedule.studentId,
          homeStudentsPoints: schedule.homeStudentsPoints,
          classStudentsPoints: schedule.classStudentsPoints,
        })),
      })),
      students: group.students.map((student) => ({
        id: student.id,
        nameStudent: student.nameStudent,
        contactFace: student.contactFace,
        phoneNumber: student.phoneNumber,
        email: student.email,
        address: student.address,
        linkStudent: student.linkStudent,
        costStudent: student.costStudent,
        commentStudent: student.commentStudent,
        prePayCost: student.prePayCost,
        prePayDate: student.prePayDate,
        selectedDate: student.selectedDate,
        storyLesson: student.storyLesson,
        costOneLesson: student.costOneLesson,
        targetLessonStudent: student.targetLessonStudent,
        todayProgramStudent: student.todayProgramStudent,
        
      })),
    };

    groupsData.push(groupData);
  }

  socket.emit("fetchGroupsByDate", groupsData);
}

export async function modifyGroupSchedule(
  data: {
    groupId: string;
    items: any[];
    students: any[];
    token: string;
  },
  socket: any
) {
  const { groupId, items, students, token } = data;
  const token_ = await db.token.findFirst({ where: { token } });
  const userId = token_?.userId;

  if (!userId) {
    socket.emit("modifyGroupSchedule", { error: "Invalid token" });
    return;
  }

  try {
    for (const item of items) {
      await db.item.update({
        where: { id: item.id },
        data: {
          tryLessonCheck: item.tryLessonCheck,
          tryLessonCost: item.tryLessonCost,
          todayProgramStudent: item.todayProgramStudent,
          targetLesson: item.targetLesson,
          programLesson: item.programLesson,
          typeLesson: item.typeLesson,
          placeLesson: item.placeLesson,
          timeLesson: item.timeLesson,
          costOneLesson: item.costOneLesson,
          valueMuiSelectArchive: item.valueMuiSelectArchive,
          startLesson: item.startLesson,
          endLesson: item.endLesson,
          nowLevel: item.nowLevel,
          lessonDuration: item.lessonDuration,
          timeLinesArray: item.timeLinesArray,
        },
      });

      for (const schedule of item.studentSchedules) {
        await db.studentSchedule.update({
          where: { id: schedule.id },
          data: {
            homeStudentsPoints: schedule.homeStudentsPoints,
            classStudentsPoints: schedule.classStudentsPoints,
          },
        });
      }
    }

    for (const student of students) {
      await db.student.update({
        where: { id: student.id },
        data: {
          nameStudent: student.nameStudent,
          contactFace: student.contactFace,
          phoneNumber: student.phoneNumber,
          email: student.email,
          address: student.address,
          linkStudent: student.linkStudent,
          costStudent: student.costStudent,
          commentStudent: student.commentStudent,
          prePayCost: student.prePayCost,
          prePayDate: student.prePayDate,
          selectedDate: student.selectedDate,
          storyLesson: student.storyLesson,
          costOneLesson: student.costOneLesson,
          targetLessonStudent: student.targetLessonStudent,
          todayProgramStudent: student.todayProgramStudent,
        },
      });
    }

    socket.emit("modifyGroupSchedule", { ok: true });
  } catch (error) {
    console.error("Error updating group schedule:", error);
    socket.emit("modifyGroupSchedule", { error: error.message, ok: false });
  }
}
