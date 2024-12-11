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
  console.log("Starting backend update...");
  const prisma = db;

  try {
    // Get userId from token
    const userId = await getUserId(data.token);
    console.log("Got userId:", userId);

    const existingStudent = await prisma.student.findUnique({
      where: {
        id: data.id,
        userId,
      },
      include: { group: true },
    });

    if (!existingStudent) {
      throw createError(ErrorCode.NOT_FOUND, "Student not found");
    }

    console.log("Processing files...");
    const existingFiles = existingStudent.files || [];
    const newFiles = await handleFileUploads(
      data.files,
      userId,
      "student/file",
    );
    const newAudios = await handleFileUploads(
      data.audios,
      userId,
      "student/audio",
    );
    const allFiles = [
      ...new Set([...existingFiles, ...newFiles, ...newAudios]),
    ];

    console.log("Starting transaction...");
    const result = await prisma.$transaction(async (tx) => {
      // Update student
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
          prePay: data.prePay,
          linkStudent: data.linkStudent,
          costStudent: data.costStudent,
          files: allFiles,
        },
      });

      // Update group
      await tx.group.update({
        where: { id: existingStudent.groupId },
        data: {
          historyLessons: data.historyLessons,
        },
      });

      // Update items
      const updatedItemIds = await updateGroupItems(
        existingStudent.groupId,
        data.items,
        userId, // Используем userId из токена
      );

      // Create schedules from history
      await createScheduleFromHistory(
        existingStudent.groupId,
        existingStudent.id,
        data.combinedHistory,
        data.nameStudent,
        userId, // Используем userId из токена
        data.items,
      );

      // Process payments
      await processPayments(data.combinedHistory, existingStudent.groupId);

      console.log("Transaction completed");
      return updatedStudent;
    });

    console.log("Emitting success response...");
    socket.emit("updateStudentAndItems", {
      success: true,
      data: result,
    });

    return result;
  } catch (error) {
    console.error("Backend error:", error);
    socket.emit("updateStudentAndItems", {
      success: false,
      error: error.message,
    });
  }
}
