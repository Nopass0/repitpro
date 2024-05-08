import { Prisma, PrismaClient } from "@prisma/client";
import { IStudentCardResponse, ITimeLine, IItemCard } from "../types";
import db from "../db";
import io from "../socket";
import { addDays, differenceInDays } from "date-fns";
import { upload } from "files/files";

function getDay(date) {
  const dayIndex = date.getDay() - 1;
  return dayIndex === -1 ? 6 : dayIndex;
}

export async function addGroup(data) {
  try {
    const {
      groupName,
      items,
      students,
      token,
      files,
      filesItems,
      audiosItems,
      audiosStudents,
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
            costOneLesson: "",
            valueMuiSelectArchive: item.valueMuiSelectArchive || 1,
            startLesson: item.startLesson ? new Date(item.startLesson) : null,
            endLesson: item.endLesson ? new Date(item.endLesson) : null,
            nowLevel: item.nowLevel || 0,
            lessonDuration: Number(item.lessonDuration) || null,
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
            costOneLesson: String(student.costOneLesson) || "",
            targetLessonStudent: student.targetLessonStudent || "",
            todayProgramStudent: student.todayProgramStudent || "",
            userId: userId,
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
              userId: userId,
            },
          });
        }
      }
    }

    let filesIds = [];
    let filesItemsIds = [];

    if (files.length > 0) {
      filesIds = await upload(files, userId, "group/files", (ids: string[]) => {
        filesIds = ids;
      });
    }

    if (filesItems.length > 0) {
      filesItemsIds = await upload(
        filesItems,
        userId,
        "group/filesItems",
        (ids: string[]) => {
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
        (ids: string[]) => {
          audiosItemsIds = ids;
        }
      );
    }

    if (audiosStudents.length > 0) {
      audiosStudentsIds = await upload(
        audiosStudents,
        userId,
        "group/audioStudents",
        (ids: string[]) => {
          audiosStudentsIds = ids;
        }
      );
    }

    await db.group.update({
      where: {
        id: createdGroup.id,
      },
      data: {
        files: Object.assign(
          filesIds,
          filesItemsIds,
          audiosItemsIds,
          audiosStudentsIds
        ),
      },
    });
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
    io.emit("getGroupList", groupsWithName);
    return groups;
  } catch (error) {
    console.error("Error fetching group list:", error);
    io.emit("getGroupList", { error: "Error fetching group list" });
  }
}

export async function deleteGroup(data: any) {
  const { token, groupId } = data;

  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });

  const userId = token_.userId;

  try {
    //get group students
    const groupStudents = await db.student.findMany({
      where: {
        groupId: groupId,
      },
      select: {
        id: true,
      },
    });

    //delete all StudentSchedule with this groupId
    await db.studentSchedule.deleteMany({
      where: {
        groupId: groupId,
      },
    });

    //delete group items
    await db.item.deleteMany({
      where: {
        groupId: groupId,
      },
    });

    //delete group students
    await db.student.deleteMany({
      where: {
        id: {
          in: groupStudents.map((student) => student.id),
        },
      },
    });

    const group = await db.group.delete({
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

export async function groupToArchive(data: any) {
  const { token, groupId, isArchived } = data;

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

export async function getGroupsByDate(data: any) {
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
export async function getGroupById(data: any) {
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

    io.emit("getGroupById", group_);
    return group;
  } catch (error) {
    console.error("Error getting group by id:", error);
  }
}

//update group (if data exist)
export async function updateGroup(data: any) {
  const { token, groupId, groupName, isArchived } = data;
}
