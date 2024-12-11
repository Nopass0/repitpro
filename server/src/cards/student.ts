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
import { getDay } from "../utils/date.ts";

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
              schedules[i].endTime,
            )}`,
            conflictB: `${formatTime(schedules[j].startTime)}-${formatTime(
              schedules[j].endTime,
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
        { date: new Date(0), cost: "0" },
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
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
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

// export async function getGroupByStudentId(data: any, socket: any) {
//   const { token, studentId } = data;

//   const token_ = await db.token.findFirst({
//     where: {
//       token,
//     },
//   });

//   const userId = token_.userId;

//   try {
//     const group = await db.student.findUnique({
//       where: {
//         id: studentId,
//         userId: userId,
//       },
//       select: {
//         group: {
//           select: {
//             id: true,
//             items: true,
//             students: true,
//             historyLessons: true,
//           },
//         },
//       },
//     });

//     const files = await db.file.findMany({
//       where: {
//         id: {
//           in: group.group.students[0].files,
//         },
//         extraType: "",
//       },
//       select: {
//         id: true,
//         name: true,
//         path: true,
//         type: true,
//       },
//     });

//     const audios = await db.file.findMany({
//       where: {
//         id: {
//           in: group.group.students[0].files,
//         },
//         extraType: "student/audio",
//       },
//       select: {
//         id: true,
//         name: true,
//         path: true,
//         type: true,
//       },
//     });

//     // console.log(files, "files");
//     //group to object
//     const group_ = JSON.parse(JSON.stringify(group));
//     group_.group.students[0].filesData = files;
//     group_.group.students[0].audiosData = audios;

//     //get audios buffers
//     const audiosBuffers = await JSON.parse(JSON.stringify(audios)).map(
//       (audio) => {
//         return getBufferByFilePath(audio.path);
//       },
//     );

//     // console.log(audiosBuffers, "audiosBuffers");

//     //add audios buffers to every audio object

//     await group_.group.students[0].audiosData.forEach(async (audio, index) => {
//       audio.buffer = await audiosBuffers[index];
//     });

//     socket.emit("getGroupByStudentId", group_);
//     return group.group;
//   } catch (error) {
//     console.error("Error retrieving group:", error);
//     console.log(error);
//   }
// }

export async function getGroupByStudentId(data: any, socket: any) {
  const { token, studentId } = data;

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

    // Get student with group data
    const student = await db.student.findUnique({
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

    if (!student) {
      throw new Error("Student not found");
    }

    // Get all schedules for this student
    const schedules = await db.studentSchedule.findMany({
      where: {
        studentId: studentId,
        userId: userId,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { day: "desc" }],
      include: {
        item: true,
      },
    });

    // Convert schedules to history lessons format
    const historyLessons = schedules.map((schedule) => {
      const lessonDate = new Date(
        Number(schedule.year),
        Number(schedule.month) - 1,
        Number(schedule.day),
      );

      return {
        date: lessonDate,
        itemName: schedule.itemName || "",
        isDone: new Date() > lessonDate,
        price: schedule.lessonsPrice.toString(),
        isPaid: schedule.isPaid || false,
        isCancel: schedule.isCancel || false,
        isAutoChecked: schedule.isAutoChecked || false,
        timeSlot: {
          startTime: schedule.startTime || { hour: 0, minute: 0 },
          endTime: schedule.endTime || { hour: 0, minute: 0 },
        },
        isTrial: schedule.isTrial || false,
      };
    });

    // Get files
    const files = await db.file.findMany({
      where: {
        id: {
          in: student.group.students[0].files,
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

    // Get audio files
    const audios = await db.file.findMany({
      where: {
        id: {
          in: student.group.students[0].files,
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

    // Get audio buffers
    const audiosBuffers = await Promise.all(
      audios.map((audio) => getBufferByFilePath(audio.path)),
    );

    // Add buffers to audio objects
    const audiosWithBuffers = audios.map((audio, index) => ({
      ...audio,
      buffer: audiosBuffers[index],
    }));

    // Преобразуем items для правильной передачи
    const transformedItems = student.group.items.map(item => ({
      ...item,
      startLesson: new Date(item.startLesson),
      endLesson: new Date(item.endLesson),
      timeLinesArray: Array.isArray(item.timeLinesArray)
        ? item.timeLinesArray
        : []
    }));

    // Prepare final group object
    const group = {
      ...student.group,
      items: transformedItems,
      students: [
        {
          ...student.group.students[0],
          filesData: files,
          audiosData: audiosWithBuffers,
          prePay: student.group.students[0].prePay?.map(prepay => ({
            id: prepay.id,
            cost: String(prepay.cost),
            date: new Date(prepay.date)
          })) || [],
          historyLessons: historyLessons,
        },
      ],
    };

    console.log('Sending group data:', JSON.stringify(group, null, 2));
    socket.emit("getGroupByStudentId", { group });
    return { group };
  } catch (error) {
    console.error("Error retrieving group:", error);
    socket.emit("getGroupByStudentId", { error: error.message });
  }
}

// Helper function to handle file uploads
async function handleFileUploads(
  files: IUploadFiles[],
  userId: string,
  extraType: string,
): Promise<string[]> {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return [];
  }

  try {
    return await upload(files, userId, extraType, (ids) => {
      console.log(
        `Uploaded ${files.length} files with type ${extraType}. File IDs:`,
        ids,
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
      "student/audio",
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
      userId,
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
      existingStudent.group.id,
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
        }),
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
  userId: string,
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

async function updateStudentSchedules(
  studentId: string,
  items: any[],
  userId: string,
  studentName: string,
  groupId: string,
) {
  console.log(
    "\n----------------updateStudentSchedules--------------------\n",
    studentId,
    items,
    userId,
    studentName,
    groupId,
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
      addDays(startDate, i),
    );

    for (const date of dateRange) {
      const dayOfWeek = getDay(date);
      const scheduleForDay = itemData.timeLinesArray[dayOfWeek];

      if (!scheduleForDay) {
        console.warn(
          `No schedule defined for day of week: ${dayOfWeek} on date: ${date}`,
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
      `Date range: ${startDate.toISOString()} - ${endDate.toISOString()}`,
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
        (schedule) => schedule.groupId === student.groupId,
      );

      console.log(
        `Found ${studentSchedules_.length} schedules for student ${student.nameStudent}`,
      );

      const lessons = studentSchedules_.length;

      const canceledLessons = studentSchedules_.filter(
        (schedule) => schedule.isCancel,
      ).length;
      const income = studentSchedules_.reduce(
        (sum, schedule) =>
          sum + (schedule.lessonsPrice || 0) * (schedule.lessonsCount || 0),
        0,
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
        `\n-----------\n${student.nameStudent}\nLessons: ${lessons}\nAvg Cost: ${avgCost}\nCanceled: ${canceledLessons}\nIncome: ${income}\nConsumption: ${consumption}\nDebt: ${debt}\n----------\n`,
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
  socket: any,
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
  socket: any,
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

export async function deleteAudio(
  data: {
    token: string;
    id: string;
    type: "student" | "client" | "group";
  },
  socket: any,
) {
  try {
    const { token, id, type } = data; // token is the user's token. id is the file's id

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
          (fileId) => fileId !== id,
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

// Modified getLinksByLinkedId function with optional links handling
export async function getLinksByLinkedId(data: any, socket: any) {
  try {
    const { linkedId, token } = data;

    const token_ = await db.token.findFirst({
      where: { token },
    });

    if (!token_) {
      throw new Error("Invalid token");
    }

    const userId = token_.userId;

    const links = await db.link.findFirst({
      where: { linkedId, userId },
    });

    // Handle case where no links exist
    socket.emit("getLinksByLinkedId", {
      links: links ? JSON.parse(JSON.stringify(links)).links : [],
    });
  } catch (error) {
    console.error("Error in getLinksByLinkedId:", error);
    socket.emit("getLinksByLinkedId", {
      error: error.message,
      links: [],
    });
  }
}

export async function cancelLesson(
  data: { id: string; token: string },
  socket,
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
      schedule.day,
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
