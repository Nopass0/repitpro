import { PrismaClient } from "@prisma/client";
import { addDays, differenceInDays } from "date-fns";
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
  timeSlot?: TimeSlot | null;
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
 * Проверка токена и получение userId
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
 * Обработка загрузки файлов
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
 * Основная функция обновления студента и связанных данных
 */
export async function updateStudentAndItems(
  data: StudentUpdateData,
  socket: any,
) {
  try {
    // 1. Проверка токена и получение userId
    const userId = await getUserId(data.token);

    // 2. Получение существующего студента с группой и предметами
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

    // 3. Обработка файлов
    const existingFiles = existingStudent.files || [];
    const [newFiles, newAudios] = await Promise.all([
      handleFileUploads(data.files, userId, "student/file"),
      handleFileUploads(data.audios, userId, "student/audio"),
    ]);
    const allFiles = Array.from(new Set([...existingFiles, ...newFiles, ...newAudios]));

    // 4. Выполнение обновлений в транзакции
    const result = await db.$transaction(async (tx) => {
      // 4.1 Обновление студента
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

      // 4.2 Обновление или создание предметов
      const itemsToUpdate: ItemData[] = data.items.map((item) => ({
        ...item,
        startLesson: new Date(item.startLesson),
        endLesson: new Date(item.endLesson),
      }));

      const existingItemIds = existingStudent.group.items.map((item) => item.id);
      const updatedItemIds: string[] = [];
      // Маппинг: наименование предмета (в нижнем регистре) → id
      const itemIdMapping: { [itemName: string]: string } = {};

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

        let updatedItem;
        if (item.id && existingItemIds.includes(item.id)) {
          updatedItem = await tx.item.update({
            where: { id: item.id },
            data: itemData,
          });
        } else {
          updatedItem = await tx.item.create({ data: itemData });
        }
        updatedItemIds.push(updatedItem.id);
        itemIdMapping[updatedItem.itemName.toLowerCase()] = updatedItem.id;
      }

      // Удаляем те предметы, которые не попали в обновление
      if (existingItemIds.length > 0) {
        await tx.item.deleteMany({
          where: {
            groupId: existingStudent.group.id,
            id: { notIn: updatedItemIds },
          },
        });
      }

      // 4.3 Обновление группы (история занятий)
      const historyLessons = data.combinedHistory
        .filter((entry) => entry.type === "lesson")
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
          historyLessons: historyLessons,
        },
        include: { items: true },
      });

      // 4.4 Обновление расписания на основе истории занятий
      const existingSchedules = await tx.studentSchedule.findMany({
        where: {
          OR: [{ studentId: data.id }, { groupId: existingStudent.group.id }],
        },
      });

      // Выполняем обновления расписания последовательно, чтобы не пытаться выполнить запросы в закрытой транзакции
      for (const lesson of historyLessons) {
        const lessonDate = new Date(lesson.date);
        // Ищем id предмета по имени (сравнение в нижнем регистре)
        const mappedItemId = itemIdMapping[lesson.itemName.toLowerCase()];
        if (!mappedItemId) {
          console.warn(
            `Предмет "${lesson.itemName}" не найден – пропускаем создание расписания для данного урока`
          );
          continue;
        }
        const scheduleData = {
          day: lessonDate.getDate().toString(),
          month: (lessonDate.getMonth() + 1).toString(),
          year: lessonDate.getFullYear().toString(),
          groupId: existingStudent.group.id,
          studentId: data.id,
          workCount: 0,
          lessonsCount: 1,
          lessonsPrice: Number(lesson.price) || 0,
          workPrice: 0,
          itemName: lesson.itemName,
          studentName: data.nameStudent,
          isPaid: lesson.isPaid || false,
          isCancel: lesson.isCancel || false,
          isAutoChecked: lesson.isAutoChecked || false,
          isTrial: lesson.isTrial || false,
          startTime: lesson.timeSlot?.startTime || null,
          endTime: lesson.timeSlot?.endTime || null,
          userId,
          itemId: mappedItemId,
          isChecked: lesson.isDone || false,
        };

        const existingSchedule = existingSchedules.find(
          (s) =>
            s.day === scheduleData.day &&
            s.month === scheduleData.month &&
            s.year === scheduleData.year &&
            s.itemName === scheduleData.itemName
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
