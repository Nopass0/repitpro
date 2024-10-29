import { Prisma } from "@prisma/client";
import db from "../../db";
import { addDays, differenceInDays } from "date-fns";
import { upload } from "../../files/files";
import { cache } from "../../utils/Cache";
import { getDay } from "../../utils/date";
import { z } from "zod";
import { ErrorCode, createError, capture } from "../../utils/error";
import { IUploadFiles } from "types";

// Константы
const CACHE_TTL = 300000; // 5 минут
const STUDENT_CHECK_TTL = 5000; // 5 секунд
const TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Типы
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

type PrismaTransaction = Prisma.TransactionClient;

interface GroupWithRelations
  extends Prisma.GroupGetPayload<{
    include: {
      students: true;
      items: true;
    };
  }> {}

const toNumber = (val: any): number => {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const num = Number(val);
    if (!isNaN(num)) return num;
  }
  return 0;
};

// Схемы валидации
const TimeSchema = z.object({
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59),
});

const DayTimeSlotSchema = z.object({
  startTime: TimeSchema,
  endTime: TimeSchema,
});

const TimeLineSchema = z.object({
  startTime: TimeSchema,
  endTime: TimeSchema,
});

const TimeSlotSchema = z.object({
  startTime: TimeSchema,
  endTime: TimeSchema,
});

// Схема для дней недели (0-6)
const TimeLinesArraySchema = z
  .union([
    z.array(TimeSlotSchema), // массив объектов со startTime и endTime
    z.record(z.string(), TimeSlotSchema), // или объект с числовыми ключами
    z.object({}).optional(), // или пустой объект
  ])
  .transform((data) => {
    // Если это массив, сразу возвращаем его
    if (Array.isArray(data)) {
      return data.map((slot) => ({
        startTime: {
          hour: slot.startTime?.hour || 0,
          minute: slot.startTime?.minute || 0,
        },
        endTime: {
          hour: slot.endTime?.hour || 0,
          minute: slot.endTime?.minute || 0,
        },
      }));
    }

    // Если это объект, конвертируем его в массив
    if (typeof data === "object" && data !== null) {
      const result = new Array(7).fill(null).map(() => ({
        startTime: { hour: 0, minute: 0 },
        endTime: { hour: 0, minute: 0 },
      }));

      // Заполняем существующими данными
      Object.entries(data).forEach(([key, value]) => {
        const index = parseInt(key);
        if (!isNaN(index) && index >= 0 && index < 7) {
          result[index] = {
            startTime: {
              hour: value.startTime?.hour || 0,
              minute: value.startTime?.minute || 0,
            },
            endTime: {
              hour: value.endTime?.hour || 0,
              minute: value.endTime?.minute || 0,
            },
          };
        }
      });

      return result;
    }

    // По умолчанию возвращаем массив с пустыми слотами
    return new Array(7).fill(null).map(() => ({
      startTime: { hour: 0, minute: 0 },
      endTime: { hour: 0, minute: 0 },
    }));
  });

const UploadFileSchema = z.object({
  name: z.string(),
  file: z.any(),
  type: z.any(),
});

const ItemSchema = z
  .object({
    itemName: z.string(),
    tryLessonCheck: z.boolean().optional().default(false),
    tryLessonCost: z.string().optional().default(""),
    todayProgramStudent: z.string().optional().default(""),
    targetLesson: z.string().optional().default(""),
    programLesson: z.string().optional().default(""),
    typeLesson: z
      .union([z.number(), z.string().transform((val) => toNumber(val))])
      .default(1),
    placeLesson: z.string().optional().default(""),
    timeLesson: z.string().optional().default(""),
    valueMuiSelectArchive: z
      .union([z.number(), z.string().transform((val) => toNumber(val))])
      .default(1),
    startLesson: z.string().datetime().nullable(),
    endLesson: z.string().datetime().nullable(),
    nowLevel: z
      .union([z.number(), z.string().transform((val) => toNumber(val))])
      .default(0),
    costOneLesson: z.string().optional().default(""),
    lessonDuration: z
      .union([z.number(), z.string().transform((val) => toNumber(val))])
      .nullable(),
    timeLinesArray: TimeLinesArraySchema,
  })
  .transform((data) => ({
    ...data,
    typeLesson: toNumber(data.typeLesson),
    valueMuiSelectArchive: toNumber(data.valueMuiSelectArchive),
    nowLevel: toNumber(data.nowLevel),
    lessonDuration:
      data.lessonDuration !== null ? toNumber(data.lessonDuration) : null,
  }));

const AddStudentSchema = z
  .object({
    nameStudent: z.string().min(1, "Имя студента обязательно"),
    phoneNumber: z
      .string()
      .regex(/^\+?[\d\s-()]+$/, "Некорректный формат телефона"),
    contactFace: z.string(),
    email: z.string().email("Некорректный email").or(z.literal("")),
    prePayCost: z.string(),
    prePayDate: z.string().datetime().nullable(),
    costOneLesson: z.string(),
    commentStudent: z.string(),
    prePay: z.array(z.any()).optional().default([]),
    linkStudent: z.string().optional().default(""),
    costStudent: z.string().optional().default(""),
    audios: z.array(UploadFileSchema).optional().default([]),
    historyLessons: z.array(z.any()).optional().default([]),
    files: z.array(UploadFileSchema).optional().default([]),
    items: z.array(ItemSchema),
    token: z.string().min(1, "Токен обязателен"),
    links: z.array(z.string()).optional().default([]),
  })
  .transform((data) => ({
    ...data,
    items: data.items.map((item) => ({
      ...item,
      timeLinesArray: normalizeTimeLinesArray(item.timeLinesArray),
    })),
  }));

type AddStudentInput = z.infer<typeof AddStudentSchema>;

// Функции преобразования
function normalizeTimeLinesArray(data: any) {
  // Если данные отсутствуют, возвращаем массив пустых слотов
  if (!data) {
    return new Array(7).fill(null).map(() => ({
      startTime: { hour: 0, minute: 0 },
      endTime: { hour: 0, minute: 0 },
    }));
  }

  // Если это уже массив
  if (Array.isArray(data)) {
    // Убеждаемся, что у нас 7 элементов
    const result = new Array(7).fill(null).map(() => ({
      startTime: { hour: 0, minute: 0 },
      endTime: { hour: 0, minute: 0 },
    }));

    // Копируем существующие данные
    data.forEach((slot, index) => {
      if (index < 7) {
        result[index] = {
          startTime: {
            hour: slot.startTime?.hour || 0,
            minute: slot.startTime?.minute || 0,
          },
          endTime: {
            hour: slot.endTime?.hour || 0,
            minute: slot.endTime?.minute || 0,
          },
        };
      }
    });

    return result;
  }

  // Если это объект
  if (typeof data === "object" && data !== null) {
    const result = new Array(7).fill(null).map(() => ({
      startTime: { hour: 0, minute: 0 },
      endTime: { hour: 0, minute: 0 },
    }));

    Object.entries(data).forEach(([key, value]: any) => {
      const index = parseInt(key);
      if (!isNaN(index) && index >= 0 && index < 7) {
        result[index] = {
          startTime: {
            hour: value.startTime?.hour || 0,
            minute: value.startTime?.minute || 0,
          },
          endTime: {
            hour: value.endTime?.hour || 0,
            minute: value.endTime?.minute || 0,
          },
        };
      }
    });

    return result;
  }

  // По умолчанию возвращаем массив пустых слотов
  return new Array(7).fill(null).map(() => ({
    startTime: { hour: 0, minute: 0 },
    endTime: { hour: 0, minute: 0 },
  }));
}

// Утилита для повторных попыток
const retry = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
};

// Валидация токена
async function validateToken(token: string): Promise<string> {
  try {
    const cacheKey = `token:${token}`;
    let userId = cache.get(cacheKey);

    if (!userId) {
      const token_ = await db.token.findFirst({
        where: { token },
        select: { userId: true },
      });

      if (!token_ || !token_.userId) {
        throw createError(ErrorCode.INVALID_TOKEN, "Недействительный токен");
      }

      userId = token_.userId;
      cache.set(cacheKey, userId, CACHE_TTL);
    }

    return userId;
  } catch (error) {
    capture(error);
    throw createError(ErrorCode.INVALID_TOKEN, "Ошибка проверки токена");
  }
}

// Проверка существующего студента
async function checkExistingStudent(
  data: AddStudentInput,
  userId: string
): Promise<void> {
  try {
    const cacheKey = `student:${userId}:${data.nameStudent}:${data.phoneNumber}:${data.email}`;

    if (cache.get(cacheKey)) {
      throw createError(ErrorCode.STUDENT_EXISTS, "Студент уже создается");
    }

    const existingStudent = await db.student.findFirst({
      where: {
        nameStudent: data.nameStudent,
        phoneNumber: data.phoneNumber,
        email: data.email,
        userId,
        createdAt: { gte: new Date(Date.now() - STUDENT_CHECK_TTL) },
      },
      select: { id: true },
    });

    if (existingStudent) {
      cache.set(cacheKey, true, STUDENT_CHECK_TTL);
      throw createError(ErrorCode.STUDENT_EXISTS, "Студент уже существует");
    }
  } catch (error) {
    capture(error);
    if (error instanceof Error && "code" in error) throw error;
    throw createError(
      ErrorCode.DATABASE,
      "Ошибка проверки существующего студента"
    );
  }
}

// Создание расписания
async function createSchedule(
  prisma: PrismaTransaction,
  group: GroupWithRelations,
  nameStudent: string,
  userId: string
): Promise<void> {
  try {
    const scheduleData = [];

    for (const item of group.items) {
      if (!item.startLesson || !item.endLesson) continue;

      const startDate = new Date(item.startLesson);
      const endDate = new Date(item.endLesson);
      const daysToAdd = differenceInDays(endDate, startDate);

      if (daysToAdd < 0) continue;

      const dateRange = Array.from({ length: daysToAdd + 1 }, (_, i) =>
        addDays(startDate, i)
      );

      for (const date of dateRange) {
        const dayOfWeek = getDay(date);
        const scheduleForDay = item.timeLinesArray[dayOfWeek];

        if (!scheduleForDay) continue;

        const { startTime, endTime } = scheduleForDay;
        if (
          startTime.hour === 0 &&
          startTime.minute === 0 &&
          endTime.hour === 0 &&
          endTime.minute === 0
        )
          continue;

        scheduleData.push({
          day: date.getDate().toString(),
          groupId: group.id,
          workCount: 0,
          lessonsCount: 1,
          lessonsPrice: Number(item.costOneLesson) || 0,
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
        });
      }
    }

    if (scheduleData.length > 0) {
      await prisma.studentSchedule.createMany({ data: scheduleData });
    }
  } catch (error) {
    capture(error);
    throw createError(
      ErrorCode.SCHEDULE_CREATION_FAILED,
      "Ошибка создания расписания"
    );
  }
}

// Обработка файлов
async function processFiles(
  files: IUploadFiles[],
  audios: IUploadFiles[],
  userId: string,
  studentId: string
): Promise<void> {
  if (files.length === 0 && audios.length === 0) return;

  try {
    const [filePaths, audiosIds] = await Promise.all([
      files.length > 0 ? retry(() => upload(files, userId, "")) : [],
      audios.length > 0
        ? retry(() => upload(audios, userId, "student/audio"))
        : [],
    ]);

    const allFiles = [...filePaths, ...audiosIds];
    if (allFiles.length > 0) {
      await db.student.update({
        where: { id: studentId },
        data: { files: allFiles },
      });
    }
  } catch (error) {
    capture(error);
    console.error("Warning: File processing failed", error);
  }
}

// Обработка ссылок
async function processLinks(
  links: string[],
  studentId: string,
  userId: string
): Promise<void> {
  if (!links?.length) return;

  try {
    await retry(async () => {
      const linkId = `${userId}-addStudent`;
      await db.link.upsert({
        where: { id: linkId },
        update: {
          links,
          linkedId: studentId,
        },
        create: {
          id: linkId,
          tag: "addStudent",
          linkedId: studentId,
          links,
          userId,
        },
      });
    });
  } catch (error) {
    capture(error);
    console.error("Warning: Links processing failed", error);
  }
}

// Основная функция добавления студента
export async function addStudent(
  data: unknown,
  socket: any
): Promise<GroupWithRelations | void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
  let operationCompleted = false;

  try {
    const validatedData = await AddStudentSchema.parseAsync(data);

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        if (!operationCompleted) {
          reject(createError(ErrorCode.TIMEOUT, "Операция превысила таймаут"));
        }
      }, TIMEOUT);
    });

    const addStudentPromise = async (): Promise<GroupWithRelations> => {
      const userId = await validateToken(validatedData.token);
      await checkExistingStudent(validatedData, userId);

      const createdGroup = await db.$transaction(async (prisma) => {
        try {
          const group = await prisma.group.create({
            data: {
              groupName: "",
              userId,
              historyLessons: validatedData.historyLessons,
              items: {
                create: validatedData.items.map((item) => ({
                  itemName: item.itemName,
                  userId,
                  startLesson: item.startLesson
                    ? new Date(item.startLesson)
                    : null,
                  endLesson: item.endLesson ? new Date(item.endLesson) : null,
                  tryLessonCheck: item.tryLessonCheck,
                  tryLessonCost: item.tryLessonCost,
                  todayProgramStudent: item.todayProgramStudent,
                  targetLesson: item.targetLesson,
                  programLesson: item.programLesson,
                  typeLesson: item.typeLesson,
                  placeLesson: item.placeLesson,
                  timeLesson: item.timeLesson,
                  valueMuiSelectArchive: item.valueMuiSelectArchive,
                  nowLevel: item.nowLevel,
                  costOneLesson: item.costOneLesson,
                  lessonDuration: item.lessonDuration,
                  timeLinesArray: item.timeLinesArray,
                })),
              },
              students: {
                create: [
                  {
                    nameStudent: validatedData.nameStudent,
                    contactFace: validatedData.contactFace,
                    phoneNumber: validatedData.phoneNumber,
                    email: validatedData.email,
                    prePay: validatedData.prePay,
                    address: "",
                    linkStudent: validatedData.linkStudent,
                    costStudent: validatedData.costStudent,
                    commentStudent: validatedData.commentStudent,
                    prePayCost: validatedData.prePayCost,
                    prePayDate: validatedData.prePayDate
                      ? new Date(validatedData.prePayDate)
                      : null,
                    selectedDate: null,
                    storyLesson: "",
                    costOneLesson: validatedData.costOneLesson,
                    targetLessonStudent: "",
                    todayProgramStudent: "",
                    userId,
                  },
                ],
              },
            },
            include: {
              students: true,
              items: true,
            },
          });

          await createSchedule(
            prisma,
            group,
            validatedData.nameStudent,
            userId
          );
          return group;
        } catch (error) {
          capture(error);
          throw createError(
            ErrorCode.GROUP_CREATION_FAILED,
            "Ошибка создания группы"
          );
        }
      });

      if (createdGroup.students?.[0]?.id) {
        await Promise.allSettled([
          processFiles(
            validatedData.files as IUploadFiles[],
            validatedData.audios as IUploadFiles[],
            userId,
            createdGroup.students[0].id
          ),
          processLinks(
            validatedData.links,
            createdGroup.students[0].id,
            userId
          ),
        ]);
      }

      operationCompleted = true;
      return createdGroup;
    };

    const result = await Promise.race([addStudentPromise(), timeoutPromise]);

    socket.emit("addStudent", { ok: true });
    return result;
  } catch (error) {
    capture(error);

    let errorMessage = "Неизвестная ошибка";
    if (error instanceof z.ZodError) {
      errorMessage = error.errors.map((e) => e.message).join(", ");
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    socket.emit("addStudent", {
      error: errorMessage,
      ok: false,
    });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
