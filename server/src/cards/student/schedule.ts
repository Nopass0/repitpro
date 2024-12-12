import db from "db";
import { upload } from "files/files";
import { z } from "zod";
import { Socket } from "socket.io";
import { Prisma, StudentSchedule } from "@prisma/client";

export const createStudentScheduleSchema = z.object({
  token: z.string(),
  day: z.string(),
  month: z.string(),
  year: z.string(),
  studentId: z.string(),
  itemName: z.string(),
  lessonsPrice: z.string(),
  studentName: z.string(),
  copyBy: z.string(),
});

export type CreateStudentScheduleSchemaType = z.infer<
  typeof createStudentScheduleSchema
>;

// Schema definitions
const TimeSchema = z.object({
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59),
});

const StudentPointSchema = z.object({
  studentId: z.string(),
  studentName: z.string().optional(),
  points: z.number().min(0).max(5),
});

const UpdateStudentScheduleSchema = z.object({
  id: z.string(),
  day: z.string(),
  month: z.string(),
  year: z.string(),
  lessonsPrice: z.union([z.string(), z.number()]).transform(String).optional(),
  itemName: z.string().optional(),
  typeLesson: z.union([z.string(), z.number()]).transform(String).optional(),
  homeFiles: z.array(z.any()).optional(),
  classFiles: z.array(z.any()).optional(),
  homeWork: z.string().optional(),
  classWork: z.string().optional(),
  homeStudentsPoints: z.array(StudentPointSchema).optional(),
  classStudentsPoints: z.array(StudentPointSchema).optional(),
  address: z.string().optional(),
  homeAudios: z.array(z.any()).optional(),
  classAudios: z.array(z.any()).optional(),
  token: z.string(),
  isChecked: z.boolean().optional(),
  studentName: z.string().optional(),
  startTime: TimeSchema.optional(),
  endTime: TimeSchema.optional(),
  studentId: z.string().optional(),
});

type StudentScheduleUpdateInput = Prisma.StudentScheduleUpdateInput;
type UpdateStudentScheduleInput = z.infer<typeof UpdateStudentScheduleSchema>;

export async function createStudentSchedule(
  data: CreateStudentScheduleSchemaType,
  socket: any,
) {
  const {
    token,
    day,
    month,
    year,
    studentId,
    itemName,
    lessonsPrice,
    studentName,
    copyBy,
  } = data;

  try {
    // Verify token and get userId
    const token_ = await db.token.findFirst({
      where: { token },
    });

    if (!token_) {
      socket.emit("createStudentSchedule", {
        ok: false,
        error: "Token not found",
      });
      return;
    }
    const userId = token_.userId;

    // Get the original schedule to copy from
    const originalSchedule = await db.studentSchedule.findFirst({
      where: {
        id: copyBy,
        userId,
      },
      include: {
        item: {
          include: {
            group: true,
          },
        },
      },
    });

    if (!originalSchedule) {
      socket.emit("createStudentSchedule", {
        ok: false,
        error: "Original schedule not found",
      });
      return;
    }

    // Create new schedule with copied data
    const studentSchedule = await db.studentSchedule.create({
      data: {
        day,
        month,
        year,
        userId,
        groupId: originalSchedule.groupId,
        workCount: 0,
        lessonsCount: 0,
        workPrice: 0,
        itemId: originalSchedule.itemId,
        lessonsPrice: Number(lessonsPrice),
        itemName,
        studentName,
        typeLesson: originalSchedule.typeLesson,
        timeLinesArray: originalSchedule.timeLinesArray,
        isChecked: false,
        isCancel: false,
        isTrial: originalSchedule.isTrial,
      },
    });

    // Update history lessons in the group
    if (originalSchedule.item?.group) {
      const group = originalSchedule.item.group;
      const lessonDate = new Date(Number(year), Number(month) - 1, Number(day));

      let updatedHistoryLessons = group.historyLessons;
      const newHistoryEntry = {
        date: lessonDate,
        price: Number(lessonsPrice),
        itemName,
        isPaid: false,
        studentId,
        studentName,
      };

      // Handle both array formats (nested arrays for groups, flat array for individual students)
      if (Array.isArray(group.historyLessons[0])) {
        // Group format - find appropriate subarray or create new one
        const studentArrayIndex = updatedHistoryLessons.findIndex(
          (arr: any[]) =>
            arr.some((lesson: any) => lesson.studentId === studentId),
        );

        if (studentArrayIndex !== -1) {
          updatedHistoryLessons[studentArrayIndex].push(newHistoryEntry);
        } else {
          updatedHistoryLessons.push([newHistoryEntry]);
        }
      } else {
        // Individual student format
        updatedHistoryLessons.push(newHistoryEntry);
      }

      // Update group with new history
      await db.group.update({
        where: { id: group.id },
        data: { historyLessons: updatedHistoryLessons },
      });
    }

    // Send success response with required data
    socket.emit("createStudentSchedule", {
      message: "student schedule created successfully",
      created: studentSchedule.id,
      nameStudent: studentName,
      costOneLesson: lessonsPrice,
      itemName: itemName,
    });

    return studentSchedule.id;
  } catch (error) {
    console.error("Error creating student schedule:", error);
    socket.emit("createStudentSchedule", {
      ok: false,
      error: "Error creating student schedule",
    });
    return;
  }
}

// Helper functions
function compareOnlyDates(date1: string | Date, date2: string | Date): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

async function handleFileUploads(
  files: any[],
  userId: string,
  type: string,
): Promise<string[]> {
  if (!files?.length) return [];
  return await upload(files, userId, type);
}

async function updateHistoryInGroup(
  group: any,
  data: UpdateStudentScheduleInput,
  updateDate: Date,
) {
  if (!Array.isArray(group.historyLessons)) return group.historyLessons;

  // Обработка массива или массива массивов
  const processLessons = (lesson: any) => {
    const shouldUpdate =
      compareOnlyDates(lesson.date, updateDate) &&
      (data.studentId ? lesson.studentId === data.studentId : true);

    if (!shouldUpdate) return lesson;

    const updates: any = { ...lesson };

    if (data.lessonsPrice !== undefined) {
      updates.price = Number(data.lessonsPrice);
    }
    if (data.itemName !== undefined) {
      updates.itemName = data.itemName;
    }
    if (data.isChecked !== undefined) {
      updates.isPaid = data.isChecked;
    }

    return updates;
  };

  if (Array.isArray(group.historyLessons[0])) {
    return group.historyLessons.map((subArray) => subArray.map(processLessons));
  }

  return group.historyLessons.map(processLessons);
}

async function createTimeLineArray(data: UpdateStudentScheduleInput) {
  const dayOfWeekIndex = new Date(
    Number(data.year),
    Number(data.month) - 1,
    Number(data.day),
  ).getDay();

  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return dayNames.map((dayName, index) => ({
    id: index + 1,
    day: dayName,
    active: false,
    endTime:
      index === dayOfWeekIndex && data.endTime
        ? data.endTime
        : { hour: 0, minute: 0 },
    startTime:
      index === dayOfWeekIndex && data.startTime
        ? data.startTime
        : { hour: 0, minute: 0 },
    editingEnd: false,
    editingStart: false,
  }));
}

export async function updateStudentSchedule(
  data: any,
  socket: Socket,
): Promise<void> {
  try {
    const token_ = await db.token.findFirst({
      where: { token: data.token },
    });

    if (!token_?.userId) {
      throw new Error("Invalid token");
    }

    // Получаем текущее расписание
    const currentSchedule = await db.studentSchedule.findUnique({
      where: { id: data.id },
      include: {
        item: {
          include: { group: true },
        },
      },
    });

    if (!currentSchedule) {
      throw new Error("Schedule not found");
    }

    // Обновляем только конкретное занятие в зависимости от типа действия
    let updateData: any = {};
    let needRecalculateHistory = false;

    switch (data.action) {
      case "updateStudent":
        // При смене студента обновляем только связи
        updateData = {
          studentId: data.studentId,
          studentName: data.studentName,
        };
        break;

      case "updatePrice":
        // При изменении цены обновляем цену и флаг для пересчета
        updateData = {
          lessonsPrice: Number(data.lessonsPrice),
        };
        needRecalculateHistory = true;
        break;

      case "updateSubject":
        // При смене предмета обновляем только для текущего занятия
        updateData = {
          itemName: data.itemName,
        };
        break;

      case "updateCompletion":
        // При изменении статуса выполнения
        updateData = {
          isChecked: data.isChecked,
        };
        needRecalculateHistory = true;
        break;
    }

    // Обновляем расписание
    const updatedSchedule = await db.studentSchedule.update({
      where: { id: data.id },
      data: updateData,
    });

    // Если нужно пересчитать историю
    if (needRecalculateHistory && currentSchedule.item?.group) {
      // Получаем всю группу с историей
      const group = await db.group.findUnique({
        where: { id: currentSchedule.item.group.id },
        include: {
          students: true,
        },
      });

      if (group) {
        // Получаем все предоплаты
        const prepayments = group.students[0]?.prePay || [];

        // Получаем все занятия из истории
        let historyLessons = group.historyLessons || [];

        // Обновляем конкретное занятие в истории
        const lessonDate = new Date(
          Number(currentSchedule.year),
          Number(currentSchedule.month) - 1,
          Number(currentSchedule.day),
        );

        historyLessons = historyLessons.map((lesson) => {
          if (
            new Date(lesson.date).getTime() === lessonDate.getTime() &&
            lesson.itemName === currentSchedule.itemName
          ) {
            return {
              ...lesson,
              ...updateData,
            };
          }
          return lesson;
        });

        // Пересчитываем статусы оплаты для всех занятий
        let remainingPrePayment = 0;
        const sortedPrepayments = prepayments.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

        historyLessons = historyLessons.map((lesson) => {
          const lessonDate = new Date(lesson.date);

          // Добавляем все предоплаты до текущего занятия
          while (
            sortedPrepayments.length > 0 &&
            new Date(sortedPrepayments[0].date) <= lessonDate
          ) {
            remainingPrePayment += Number(sortedPrepayments.shift().cost);
          }

          // Проверяем, можем ли оплатить занятие
          if (remainingPrePayment >= Number(lesson.price) && !lesson.isCancel) {
            remainingPrePayment -= Number(lesson.price);
            return { ...lesson, isPaid: true };
          }
          return { ...lesson, isPaid: false };
        });

        // Обновляем историю группы
        await db.group.update({
          where: { id: group.id },
          data: { historyLessons },
        });

        // Отправляем обновленные данные в открытую карточку студента
        if (currentSchedule.studentId) {
          socket.emit("getGroupByStudentId", {
            token: data.token,
            studentId: currentSchedule.studentId,
          });
        }
      }
    }

    socket.emit(`updateStudentSchedule_${data.id}`, {
      success: true,
      schedule: updatedSchedule,
    });
  } catch (error) {
    console.error("Error updating schedule:", error);
    socket.emit(`updateStudentSchedule_${data.id}`, {
      success: false,
      error: error.message,
    });
  }
}

async function getFilesForSchedule(fileIds: string[], extraType: string) {
  if (!fileIds?.length) return [];
  return await db.file.findMany({
    where: {
      id: { in: fileIds },
      extraType,
    },
  });
}

function getIsPaidStatusForDate(
  historyLessons: any[] | any[][],
  targetDate: Date,
  studentId?: string,
  itemName?: string,
): boolean {
  if (!Array.isArray(historyLessons)) return false;

  const matchLesson = (lesson: any): boolean => {
    const dateMatches = compareOnlyDates(lesson.date, targetDate);
    if (!dateMatches) return false;

    if (itemName && lesson.itemName !== itemName) return false;
    if (studentId && lesson.studentId !== studentId) return false;

    return lesson.isPaid;
  };

  // Для групп
  if (Array.isArray(historyLessons[0])) {
    return historyLessons.some((subArray) => subArray.some(matchLesson));
  }

  // Для индивидуальных занятий
  return historyLessons.some(matchLesson);
}

// Функция для валидации объекта времени
function ensureValidTimeObject(timeObj: any): { hour: number; minute: number } {
  if (!timeObj || typeof timeObj !== "object") {
    return { hour: 0, minute: 0 };
  }

  const hour =
    typeof timeObj.hour === "number"
      ? Math.min(Math.max(0, timeObj.hour), 23)
      : 0;
  const minute =
    typeof timeObj.minute === "number"
      ? Math.min(Math.max(0, timeObj.minute), 59)
      : 0;

  return { hour, minute };
}

async function processScheduleForGroup(
  schedule: any,
  dayOfWeekIndex: number,
  currentDate: Date,
) {
  const { item } = schedule;
  const timeLinesArray = Array.isArray(schedule.timeLinesArray)
    ? schedule.timeLinesArray
    : [];
  const daySchedule = timeLinesArray[dayOfWeekIndex] || {};

  // Берем время напрямую из полей startTime и endTime
  const startTime = ensureValidTimeObject(schedule.startTime);
  const endTime = ensureValidTimeObject(schedule.endTime);

  const [homeFiles, classFiles, homeAudios, classAudios] = await Promise.all([
    getFilesForSchedule(schedule.homeFiles || [], "home"),
    getFilesForSchedule(schedule.classFiles || [], "class"),
    getFilesForSchedule(schedule.homeAudios || [], "home/audio"),
    getFilesForSchedule(schedule.classAudios || [], "class/audio"),
  ]);

  const realGroup = await db.group.findFirst({
    where: { id: item.group?.id },
    include: { students: true },
  });

  if (!realGroup) {
    throw new Error("Group not found");
  }

  const students = realGroup.students || [];
  let homeStudentsPoints = Array.isArray(schedule.homeStudentsPoints)
    ? schedule.homeStudentsPoints
    : [];
  let classStudentsPoints = Array.isArray(schedule.classStudentsPoints)
    ? schedule.classStudentsPoints
    : [];

  // Ensure points arrays match students
  if (students.length !== homeStudentsPoints.length) {
    homeStudentsPoints = students.map((student) => ({
      studentId: student.id,
      studentName: student.nameStudent,
      points: 0,
    }));
  }

  if (students.length !== classStudentsPoints.length) {
    classStudentsPoints = students.map((student) => ({
      studentId: student.id,
      studentName: student.nameStudent,
      points: 0,
    }));
  }

  // Get payment status for students
  const studentsWithPaymentStatus = students.map((student) => {
    const isPaid = getIsPaidStatusForDate(
      realGroup.historyLessons || [],
      currentDate,
      student.id,
      schedule.itemName,
    );

    return {
      id: student.id,
      nameStudent: student.nameStudent || "",
      costOneLesson: student.costOneLesson || "0",
      prePay: Array.isArray(student.prePay) ? student.prePay : [],
      targetLessonStudent: student.targetLessonStudent || "",
      todayProgramStudent: student.todayProgramStudent || "",
      isPaid,
    };
  });

  return {
    id: schedule.id || "",
    itemName: schedule.itemName || "",
    nameStudent: item.group?.groupName || "",
    typeLesson: schedule.typeLesson || 0,
    homeFiles: homeFiles || [],
    classFiles: classFiles || [],
    homeAudios: homeAudios || [],
    classAudios: classAudios || [],
    homeWork: schedule.homeWork || "",
    lessonPrice: schedule.lessonsPrice || 0,
    lessonCount: schedule.lessonsCount || 0,
    place: item.placeLesson || "",
    isCancel: Boolean(schedule.isCancel),
    classWork: schedule.classWork || "",
    isCheck: Boolean(schedule.isChecked),
    tryLessonCheck: Boolean(item.tryLessonCheck),
    startTime,
    endTime,
    isAutoChecked: schedule.isAutoChecked || false,
    tryLessonCost: item.tryLessonCost || "0",
    homeStudentsPoints,
    classStudentsPoints,
    groupName: item.group?.groupName || "",
    groupId: schedule.groupId || "",
    students: studentsWithPaymentStatus,
    type: "group",
  };
}

async function processScheduleForIndividual(
  schedule: any,
  dayOfWeekIndex: number,
  currentDate: Date,
) {
  const { item } = schedule;
  const student = item.group?.students?.[0];
  const timeLinesArray = Array.isArray(schedule.timeLinesArray)
    ? schedule.timeLinesArray
    : [];
  const daySchedule = timeLinesArray[dayOfWeekIndex] || {};

  // Берем время напрямую из полей startTime и endTime
  const startTime = ensureValidTimeObject(schedule.startTime);
  const endTime = ensureValidTimeObject(schedule.endTime);

  const [homeFiles, classFiles, homeAudios, classAudios] = await Promise.all([
    getFilesForSchedule(schedule.homeFiles || [], "home"),
    getFilesForSchedule(schedule.classFiles || [], "class"),
    getFilesForSchedule(schedule.homeAudios || [], "home/audio"),
    getFilesForSchedule(schedule.classAudios || [], "class/audio"),
  ]);

  const history = await db.group.findMany({
    where: { id: item.group?.id },
    select: { historyLessons: true },
  });

  // Initialize points arrays with proper structure
  let homeStudentsPoints = [];
  let classStudentsPoints = [];

  if (student) {
    const studentPoint = {
      studentId: student.id,
      studentName: student.nameStudent || "",
      points: 0,
    };

    if (
      !Array.isArray(schedule.homeStudentsPoints) ||
      schedule.homeStudentsPoints.length !== 1
    ) {
      homeStudentsPoints = [studentPoint];
    } else {
      homeStudentsPoints = schedule.homeStudentsPoints;
    }

    if (
      !Array.isArray(schedule.classStudentsPoints) ||
      schedule.classStudentsPoints.length !== 1
    ) {
      classStudentsPoints = [studentPoint];
    } else {
      classStudentsPoints = schedule.classStudentsPoints;
    }
  }

  const isPaid = history?.[0]
    ? getIsPaidStatusForDate(
        history[0].historyLessons || [],
        currentDate,
        undefined,
        schedule.itemName,
      )
    : false;

  console.log("StartTime/EndTime/Schedule", startTime, endTime, schedule);

  return {
    id: schedule.id || "",
    nameStudent: student
      ? student.nameStudent || ""
      : schedule.studentName || "",
    costOneLesson: schedule.lessonsPrice || "0",
    studentId: student?.id || "",
    itemName: schedule.itemName || "",
    typeLesson: schedule.typeLesson || 0,
    homeFiles: homeFiles || [],
    classFiles: classFiles || [],
    homeAudios: homeAudios || [],
    classAudios: classAudios || [],
    homeWork: schedule.homeWork || "",
    place: item.placeLesson || "",
    prePayDate: student?.prePayDate || null,
    prePayCost: student?.prePayCost || null,
    lessonPrice: schedule.lessonsPrice || 0,
    lessonCount: schedule.lessonsCount || 0,
    isTrial: Boolean(schedule.isTrial),
    isAutoChecked: schedule.isAutoChecked || false,

    classWork: schedule.classWork || "",
    homeStudentsPoints,
    classStudentsPoints,
    isCheck: Boolean(schedule.isChecked),
    isCancel: Boolean(schedule.isCancel),
    tryLessonCheck: Boolean(item.tryLessonCheck),
    tryLessonCost: item.tryLessonCost || "0",
    prePay: Array.isArray(student?.prePay) ? student.prePay : [],
    history: history || null,
    startTime,
    endTime,
    groupName: item.group?.groupName || "",
    groupId: schedule.groupId || "",
    type: "student",
    isPaid,
  };
}

export async function getStudentsByDate(
  data: any,
  socket: Socket,
): Promise<void> {
  try {
    const { day, month, year, token } = data;

    // Проверяем токен
    const token_ = await db.token.findFirst({ where: { token } });
    if (!token_?.userId) {
      socket.emit("getStudentsByDate", { error: "Invalid token" });
      return;
    }

    const currentDate = new Date(Number(year), Number(month) - 1, Number(day));
    const dayOfWeekIndex = currentDate.getDay();

    const studentSchedules = await db.studentSchedule.findMany({
      where: {
        day,
        month,
        year,
        userId: token_.userId,
        clientId: null,
      },
      include: {
        item: {
          include: {
            group: {
              include: {
                students: true,
              },
            },
          },
        },
      },
    });

    // Обработка данных
    const processedData = await Promise.all(
      studentSchedules.map(async (schedule) => {
        if (schedule.item?.group?.students?.length > 1) {
          return processScheduleForGroup(schedule, dayOfWeekIndex, currentDate);
        } else {
          return processScheduleForIndividual(
            schedule,
            dayOfWeekIndex,
            currentDate,
          );
        }
      }),
    );

    // Отправляем обработанные данные
    socket.emit("getStudentsByDate", processedData);
  } catch (error) {
    console.error("Error in getStudentsByDate:", error);
    socket.emit("getStudentsByDate", { error: "Failed to get students" });
  }
}

export async function getScheduleSuggestions(
  data: { token: string },
  socket: Socket,
): Promise<void> {
  try {
    const token_ = await db.token.findFirst({
      where: { token: data.token },
    });

    if (!token_?.userId) {
      socket.emit("getScheduleSuggestions", { error: "Invalid token" });
      return;
    }

    // Get all unique students
    const students = await db.student.findMany({
      where: {
        userId: token_.userId,
        isArchived: false,
      },
      select: {
        id: true,
        nameStudent: true,
        costOneLesson: true,
        items: {
          select: {
            itemName: true,
          },
        },
      },
    });

    // Get all unique subjects
    const schedules = await db.studentSchedule.findMany({
      where: {
        userId: token_.userId,
      },
      select: {
        itemName: true,
      },
      distinct: ["itemName"],
    });

    const uniqueSubjects = new Set<string>();

    // Add subjects from schedules
    schedules.forEach((schedule) => {
      if (schedule.itemName) {
        uniqueSubjects.add(schedule.itemName);
      }
    });

    // Add subjects from student items
    students.forEach((student) => {
      student.items?.forEach((item) => {
        if (item.itemName) {
          uniqueSubjects.add(item.itemName);
        }
      });
    });

    socket.emit("getScheduleSuggestions", {
      students: students.map((s) => ({
        id: s.id,
        name: s.nameStudent,
        costOneLesson: s.costOneLesson,
      })),
      subjects: Array.from(uniqueSubjects),
    });
  } catch (error) {
    console.error("Error in getScheduleSuggestions:", error);
    socket.emit("getScheduleSuggestions", {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

export async function cancelLesson(
  data: { id: string; token: string },
  socket: Socket,
): Promise<void> {
  try {
    const token_ = await db.token.findFirst({
      where: { token: data.token },
    });

    if (!token_?.userId) {
      socket.emit("cancelLesson", { error: "Invalid token" });
      return;
    }

    const lesson = await db.studentSchedule.update({
      where: {
        id: data.id,
        userId: token_.userId,
      },
      data: {
        isCancel: true,
      },
    });

    if (lesson.groupId) {
      // Update group history
      const group = await db.group.findUnique({
        where: { id: lesson.groupId },
      });

      if (group && group.historyLessons) {
        const historyLessons = Array.isArray(group.historyLessons)
          ? group.historyLessons
          : [];
        const lessonDate = new Date(
          Number(lesson.year),
          Number(lesson.month) - 1,
          Number(lesson.day),
        );

        const updatedHistory = historyLessons.map((lessonHistory) => {
          if (Array.isArray(lessonHistory)) {
            return lessonHistory.map((entry) => {
              if (compareOnlyDates(entry.date, lessonDate)) {
                return { ...entry, isCancel: true };
              }
              return entry;
            });
          }
          if (compareOnlyDates(lessonHistory.date, lessonDate)) {
            return { ...lessonHistory, isCancel: true };
          }
          return lessonHistory;
        });

        await db.group.update({
          where: { id: group.id },
          data: { historyLessons: updatedHistory },
        });
      }
    }

    socket.emit("cancelLesson", { success: true, lessonId: data.id });
  } catch (error) {
    console.error("Error in cancelLesson:", error);
    socket.emit("cancelLesson", {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

export async function updateLessonPaymentStatus(
  data: { id: string; token: string; isPaid: boolean },
  socket: Socket,
): Promise<void> {
  try {
    const token_ = await db.token.findFirst({
      where: { token: data.token },
    });

    if (!token_?.userId) {
      socket.emit("updateLessonPaymentStatus", { error: "Invalid token" });
      return;
    }

    const lesson = await db.studentSchedule.findFirst({
      where: {
        id: data.id,
        userId: token_.userId,
      },
      include: {
        item: {
          include: {
            group: true,
          },
        },
      },
    });

    if (!lesson) {
      socket.emit("updateLessonPaymentStatus", { error: "Lesson not found" });
      return;
    }

    // Update the lesson payment status
    await db.studentSchedule.update({
      where: { id: data.id },
      data: { isChecked: data.isPaid },
    });

    // Update history lessons if group exists
    if (lesson.item?.group) {
      const lessonDate = new Date(
        Number(lesson.year),
        Number(lesson.month) - 1,
        Number(lesson.day),
      );
      const updatedHistory = await updateHistoryInGroup(
        lesson.item.group,
        { id: data.id, isChecked: data.isPaid, token: data.token },
        lessonDate,
      );

      await db.group.update({
        where: { id: lesson.item.group.id },
        data: { historyLessons: updatedHistory },
      });
    }

    socket.emit("updateLessonPaymentStatus", {
      success: true,
      lessonId: data.id,
      isPaid: data.isPaid,
    });
  } catch (error) {
    console.error("Error in updateLessonPaymentStatus:", error);
    socket.emit("updateLessonPaymentStatus", {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

export async function getAllStudentSchedules(
  data: { studentId: string; token: string },
  socket: Socket,
): Promise<void> {
  try {
    const token_ = await db.token.findFirst({
      where: { token: data.token },
    });

    if (!token_) {
      throw new Error("Invalid token");
    }

    const schedules = await db.studentSchedule.findMany({
      where: {
        studentId: data.studentId,
        userId: token_.userId,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { day: "desc" }],
      // Добавляем включение связанных данных, если они нужны
      include: {
        item: true,
      },
    });

    socket.emit("getAllStudentSchedules", schedules);
  } catch (error) {
    console.error("Error getting student schedules:", error);
    socket.emit("getAllStudentSchedules", { error: "Failed to get schedules" });
  }
}

// Эндпоинт для получения списка студентов
export async function getStudentSuggestions(
  data: { token: string },
  socket: Socket,
): Promise<void> {
  try {
    const token_ = await db.token.findFirst({
      where: { token: data.token },
    });

    if (!token_?.userId) {
      socket.emit("getStudentSuggestions", { error: "Invalid token" });
      return;
    }

    // Получаем всех активных студентов
    const students = await db.student.findMany({
      where: {
        userId: token_.userId,
        isArchived: false,
      },
      select: {
        id: true,
        nameStudent: true,
        costOneLesson: true,
      },
    });

    socket.emit("getStudentSuggestions", { students });
  } catch (error) {
    console.error("Error getting student suggestions:", error);
    socket.emit("getStudentSuggestions", {
      error: "Failed to get suggestions",
    });
  }
}

// Эндпоинт для получения списка предметов
export async function getSubjectSuggestions(
  data: { token: string },
  socket: Socket,
): Promise<void> {
  try {
    const token_ = await db.token.findFirst({
      where: { token: data.token },
    });

    if (!token_?.userId) {
      socket.emit("getSubjectSuggestions", { error: "Invalid token" });
      return;
    }

    // Получаем все уникальные предметы из расписаний
    const schedules = await db.studentSchedule.findMany({
      where: {
        userId: token_.userId,
      },
      select: {
        itemName: true,
      },
      distinct: ["itemName"],
    });

    // Получаем все уникальные предметы из items
    const items = await db.item.findMany({
      where: {
        userId: token_.userId,
      },
      select: {
        itemName: true,
        costOneLesson: true,
      },
      distinct: ["itemName"],
    });

    // Объединяем и удаляем дубликаты
    const subjects = Array.from(
      new Set([
        ...schedules.map((s) => s.itemName),
        ...items.map((i) => i.itemName),
      ]),
    ).filter(Boolean);

    socket.emit("getSubjectSuggestions", { subjects });
  } catch (error) {
    console.error("Error getting subject suggestions:", error);
    socket.emit("getSubjectSuggestions", {
      error: "Failed to get suggestions",
    });
  }
}
