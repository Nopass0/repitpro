import { PrismaClient } from "@prisma/client";
import { addDays, differenceInDays, getDay } from "date-fns";
import { upload } from "../../files/files";
import { ErrorCode, createError } from "../../utils/error";

const db = new PrismaClient();

interface IUploadFiles {
  name: string;
  file: any;
  type: string;
}

interface TimeSlot {
  startTime: { hour: number; minute: number };
  endTime: { hour: number; minute: number };
}

interface HistoryLesson {
  type: "lesson";
  date: Date;
  itemName: string;
  price: string;
  isCancel?: boolean;
  isDone?: boolean;
  isPaid?: boolean;
  timeSlot?: TimeSlot;
  isTrial?: boolean;
  isAutoChecked?: boolean;
}

interface PrePayment {
  type: "prepayment";
  date: Date;
  cost: string;
  id: number;
  isCancel?: boolean;
  isDone?: boolean;
  isPaid?: boolean;
}

type CombinedHistoryEntry = HistoryLesson | PrePayment;

interface ItemData {
  id?: string;
  itemName: string;
  tryLessonCheck: boolean;
  tryLessonCost: string;
  todayProgramStudent: string;
  targetLesson: string;
  programLesson: string;
  typeLesson: number;
  placeLesson: string;
  timeLesson: string;
  valueMuiSelectArchive: number;
  startLesson: Date | string;
  endLesson: Date | string;
  nowLevel: number;
  costOneLesson: string;
  lessonDuration: number | null;
  timeLinesArray: TimeSlot[];
  commentItem?: string;
  historyLessons?: HistoryLesson[];
}

interface StudentUpdateData {
  id: string;
  nameStudent: string;
  phoneNumber: string;
  contactFace: string;
  email: string;
  prePayCost: string;
  prePayDate: Date | null;
  costOneLesson: string;
  commentStudent: string;
  prePay: any[];
  linkStudent: string;
  costStudent: string;
  historyLessons: HistoryLesson[];
  combinedHistory: CombinedHistoryEntry[];
  files: IUploadFiles[];
  audios: IUploadFiles[];
  items: ItemData[];
  token: string;
  userId: string;
}

/**
 * Validate token and get userId
 */
async function getUserId(token: string): Promise<string> {
  const tokenRecord = await db.token.findFirst({
    where: { token },
  });

  if (!tokenRecord || !tokenRecord.userId) {
    throw createError(ErrorCode.INVALID_TOKEN, "Invalid token");
  }

  return tokenRecord.userId;
}

/**
 * Handle file uploads for both files and audios
 */
async function handleFileUploads(
  files: IUploadFiles[],
  userId: string,
  path: string,
): Promise<string[]> {
  if (!files || files.length === 0) return [];

  try {
    return await upload(files, userId, path);
  } catch (error) {
    console.error(`Error uploading files to ${path}:`, error);
    throw createError(ErrorCode.FILE_UPLOAD_FAILED, "Failed to upload files");
  }
}

/**
 * Update or create items for a group
 */
async function updateGroupItems(
  groupId: string,
  items: ItemData[],
  userId: string,
) {
  const updatedItemIds = [];

  for (const item of items) {
    const itemData = {
      itemName: item.itemName,
      tryLessonCheck: item.tryLessonCheck,
      tryLessonCost: item.tryLessonCost,
      todayProgramStudent: item.todayProgramStudent,
      targetLesson: item.targetLesson,
      programLesson: item.programLesson,
      typeLesson: Number(item.typeLesson),
      placeLesson: item.placeLesson,
      timeLesson: item.timeLesson,
      valueMuiSelectArchive: item.valueMuiSelectArchive,
      startLesson: new Date(item.startLesson),
      endLesson: new Date(item.endLesson),
      nowLevel: item.nowLevel,
      costOneLesson: item.costOneLesson,
      lessonDuration: item.lessonDuration,
      timeLinesArray: item.timeLinesArray,
      commentItem: item.commentItem || "",
      userId,
      groupId,
    };

    let updatedItem;
    if (item.id) {
      updatedItem = await db.item.update({
        where: { id: item.id },
        data: itemData,
      });
    } else {
      updatedItem = await db.item.create({ data: itemData });
    }
    updatedItemIds.push(updatedItem.id);
  }

  // Remove items not in the update list
  await db.item.deleteMany({
    where: {
      groupId,
      id: { notIn: updatedItemIds },
    },
  });

  return updatedItemIds;
}

/**
 * Create schedule from history lessons
 */
async function createScheduleFromHistory(
  groupId: string,
  studentId: string,
  combinedHistory: CombinedHistoryEntry[],
  nameStudent: string,
  userId: string,
  items: ItemData[],
) {
  try {
    console.log("Creating schedules with userId:", userId);

    // Delete existing schedules for this group
    await db.studentSchedule.deleteMany({
      where: {
        groupId,
        userId,
        studentId,
      },
    });

    // Filter only lessons from combined history
    const lessons = combinedHistory.filter(
      (entry): entry is HistoryLesson => entry.type === "lesson",
    );

    console.log(
      `Processing ${lessons.length} lessons for student ${nameStudent}`,
    );

    for (const lesson of lessons) {
      const lessonDate = new Date(lesson.date);
      const item = items.find((i) => i.itemName === lesson.itemName);

      if (!item) {
        console.warn(`Item not found for lesson: ${lesson.itemName}`);
        continue;
      }

      console.log(
        `Creating schedule for lesson on ${lessonDate.toISOString()} - ${lesson.itemName}`,
      );

      await db.studentSchedule.create({
        data: {
          userId,
          day: lessonDate.getDate().toString(),
          groupId,
          studentId: studentId,
          workCount: 0,
          lessonsCount: 1,
          lessonsPrice: Number(lesson.price),
          workPrice: 0,
          month: (lessonDate.getMonth() + 1).toString(),
          year: lessonDate.getFullYear().toString(),
          timeLinesArray: lesson.timeSlot
            ? [
                {
                  startTime: {
                    hour: lesson.timeSlot.startTime.hour,
                    minute: lesson.timeSlot.startTime.minute,
                  },
                  endTime: {
                    hour: lesson.timeSlot.endTime.hour,
                    minute: lesson.timeSlot.endTime.minute,
                  },
                },
              ]
            : [],
          isChecked: lesson.isDone || false,
          itemName: lesson.itemName,
          isPaid: lesson.isPaid || false,
          studentName: nameStudent,
          typeLesson: item.typeLesson,
          homeWork: "",
          classWork: "",
          address: item.placeLesson || "",
          itemId: item.id,
          isAutoChecked: lesson.isAutoChecked || false,
          isTrial: lesson.isTrial || false,
          isCancel: lesson.isCancel || false,
          homeStudentsPoints: [],
          classStudentsPoints: [],
          startTime: lesson.timeSlot
            ? {
                hour: lesson.timeSlot.startTime.hour,
                minute: lesson.timeSlot.startTime.minute,
              }
            : null,
          endTime: lesson.timeSlot
            ? {
                hour: lesson.timeSlot.endTime.hour,
                minute: lesson.timeSlot.endTime.minute,
              }
            : null,
          homeFiles: [],
          classFiles: [],
          homeAudios: [],
          classAudios: [],
          totalWorkPrice: 0,
          workStages: {
            isPaid: lesson.isPaid || false,
            isDone: lesson.isDone || false,
            price: Number(lesson.price),
            date: lessonDate.toISOString(),
            timeSlot: lesson.timeSlot
              ? {
                  startTime: {
                    hour: lesson.timeSlot.startTime.hour,
                    minute: lesson.timeSlot.startTime.minute,
                  },
                  endTime: {
                    hour: lesson.timeSlot.endTime.hour,
                    minute: lesson.timeSlot.endTime.minute,
                  },
                }
              : null,
          },
        },
      });

      console.log(
        `Successfully created schedule for ${lesson.itemName} on ${lessonDate.toISOString()}`,
      );
    }

    console.log(`Completed creating schedules for student ${nameStudent}`);
  } catch (error) {
    console.error("Error in createScheduleFromHistory:", {
      error,
      groupId,
      nameStudent,
      userId,
    });
    throw error;
  }
}

/**
 * Process payments and update lesson statuses
 */
async function processPayments(
  combinedHistory: CombinedHistoryEntry[],
  groupId: string,
) {
  const sortedHistory = [...combinedHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let remainingPayment = 0;

  for (const entry of sortedHistory) {
    if (entry.type === "prepayment") {
      remainingPayment += Number(entry.cost);
    } else if (entry.type === "lesson" && !entry.isCancel) {
      const lessonPrice = Number(entry.price);
      const canPay = remainingPayment >= lessonPrice;

      if (canPay) {
        remainingPayment -= lessonPrice;
        await db.studentSchedule.updateMany({
          where: {
            groupId,
            day: new Date(entry.date).getDate().toString(),
            month: (new Date(entry.date).getMonth() + 1).toString(),
            year: new Date(entry.date).getFullYear().toString(),
            itemName: entry.itemName,
          },
          data: {
            isPaid: true,
          },
        });
      }
    }
  }
}

/**
 * Main function to update student and related data
 */
export async function updateStudentAndItems(
  data: StudentUpdateData,
  socket: any,
) {
  try {
    // Проверяем токен и получаем userId
    const userId = await getUserId(data.token);

    // Получаем существующего студента
    const existingStudent = await db.student.findUnique({
      where: {
        id: data.id,
        userId,
      },
      include: {
        group: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!existingStudent) {
      throw createError(ErrorCode.NOT_FOUND, "Student not found");
    }

    // Обрабатываем файлы
    const existingFiles = existingStudent.files || [];
    const [newFiles, newAudios] = await Promise.all([
      handleFileUploads(data.files, userId, "student/file"),
      handleFileUploads(data.audios, userId, "student/audio"),
    ]);
    const allFiles = [
      ...new Set([...existingFiles, ...newFiles, ...newAudios]),
    ];

    // Выполняем все обновления в транзакции
    const result = await db.$transaction(async (tx) => {
      // 1. Обновляем студента
      const updatedStudent = await tx.student.update({
        where: { id: data.id },
        data: {
          nameStudent: data.nameStudent,
          phoneNumber: data.phoneNumber,
          contactFace: data.contactFace,
          email: data.email,
          prePayCost: data.prePayCost,
          prePayDate: data.prePayDate,
          costOneLesson: data.costOneLesson,
          commentStudent: data.commentStudent,
          prePay: data.combinedHistory
            .filter((item) => item.type === "prepayment")
            .map(({ id, cost, date }) => ({ id, cost, date })),
          linkStudent: data.linkStudent,
          costStudent: data.costStudent,
          files: allFiles,
        },
      });

      // 2. Обновляем предметы
      const itemsToUpdate = data.items.map((item) => ({
        ...item,
        startLesson: new Date(item.startLesson),
        endLesson: new Date(item.endLesson),
      }));

      const existingItemIds = existingStudent.group.items.map(
        (item) => item.id,
      );
      const updatedItemIds = [];

      // Обновляем или создаем предметы
      for (const item of itemsToUpdate) {
        const itemData = {
          itemName: item.itemName,
          tryLessonCheck: item.tryLessonCheck,
          tryLessonCost: item.tryLessonCost,
          todayProgramStudent: item.todayProgramStudent,
          targetLesson: item.targetLesson,
          programLesson: item.programLesson,
          typeLesson: Number(item.typeLesson),
          placeLesson: item.placeLesson,
          timeLesson: item.timeLesson,
          valueMuiSelectArchive: item.valueMuiSelectArchive,
          startLesson: item.startLesson,
          endLesson: item.endLesson,
          nowLevel: item.nowLevel,
          costOneLesson: item.costOneLesson,
          lessonDuration: item.lessonDuration,
          timeLinesArray: item.timeLinesArray,
          commentItem: item.commentItem || "",
          userId,
          groupId: existingStudent.group.id,
        };

        if (item.id && existingItemIds.includes(item.id)) {
          const updated = await tx.item.update({
            where: { id: item.id },
            data: itemData,
          });
          updatedItemIds.push(updated.id);
        } else {
          const created = await tx.item.create({
            data: itemData,
          });
          updatedItemIds.push(created.id);
        }
      }

      // Удаляем неиспользуемые предметы
      if (existingItemIds.length > 0) {
        await tx.item.deleteMany({
          where: {
            id: {
              in: existingItemIds.filter((id) => !updatedItemIds.includes(id)),
            },
          },
        });
      }

      // 3. Обновляем группу и историю
      const historyLessons = data.combinedHistory
        .filter((item) => item.type === "lesson")
        .map((lesson) => ({
          date: new Date(lesson.date),
          itemName: lesson.itemName,
          price: lesson.price,
          isPaid: lesson.isPaid || false,
          isDone: lesson.isDone || false,
          isCancel: lesson.isCancel || false,
          isAutoChecked: lesson.isAutoChecked || false,
          timeSlot: lesson.timeSlot || null,
          isTrial: lesson.isTrial || false,
        }));

      const updatedGroup = await tx.group.update({
        where: { id: existingStudent.group.id },
        data: {
          historyLessons,
        },
        include: { items: true },
      });

      // 4. Обновляем расписание
      const existingSchedules = await tx.studentSchedule.findMany({
        where: {
          OR: [{ studentId: data.id }, { groupId: existingStudent.group.id }],
        },
      });

      // Создаем/обновляем расписания из истории уроков
      for (const lesson of historyLessons) {
        const lessonDate = new Date(lesson.date);
        const scheduleData = {
          day: lessonDate.getDate().toString(),
          month: (lessonDate.getMonth() + 1).toString(),
          year: lessonDate.getFullYear().toString(),
          groupId: existingStudent.group.id,
          studentId: data.id,
          workCount: 0,
          lessonsCount: 1,
          lessonsPrice: Number(lesson.price),
          workPrice: 0,
          itemName: lesson.itemName,
          studentName: data.nameStudent,
          isPaid: lesson.isPaid,
          isCancel: lesson.isCancel,
          isAutoChecked: lesson.isAutoChecked,
          isTrial: lesson.isTrial,
          startTime: lesson.timeSlot?.startTime || null,
          endTime: lesson.timeSlot?.endTime || null,
          userId,
          itemId: updatedItemIds[0], // Привязываем к первому предмету
          isChecked: lesson.isDone,
        };

        const existingSchedule = existingSchedules.find(
          (s) =>
            s.day === scheduleData.day &&
            s.month === scheduleData.month &&
            s.year === scheduleData.year &&
            s.itemName === scheduleData.itemName,
        );

        if (existingSchedule) {
          await tx.studentSchedule.update({
            where: { id: existingSchedule.id },
            data: scheduleData,
          });
        } else {
          await tx.studentSchedule.create({
            data: scheduleData,
          });
        }
      }

      // Возвращаем обновленные данные
      return {
        success: true,
        student: updatedStudent,
        group: updatedGroup,
        combinedHistory: data.combinedHistory,
      };
    });

    socket.emit("updateStudentAndItems", result);
    return result;
  } catch (error) {
    console.error("Error updating student and items:", error);
    socket.emit("updateStudentAndItems", {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
    throw error;
  }
}
