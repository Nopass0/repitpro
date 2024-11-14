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
  rawData: any,
  socket: Socket,
): Promise<StudentSchedule | null> {
  try {
    // 1. Validate input data
    const data = await UpdateStudentScheduleSchema.parseAsync({
      ...rawData,
      lessonsPrice:
        rawData.lessonsPrice !== undefined
          ? String(rawData.lessonsPrice)
          : undefined,
      typeLesson:
        rawData.typeLesson !== undefined
          ? String(rawData.typeLesson)
          : undefined,
      isChecked:
        rawData.isChecked !== undefined
          ? typeof rawData.isChecked === "string"
            ? rawData.isChecked === "true"
            : Boolean(rawData.isChecked)
          : undefined,
    });

    // 2. Verify token
    const token_ = await db.token.findFirst({
      where: { token: data.token },
    });

    if (!token_) {
      throw new Error("Invalid token");
    }

    // 3. Get current schedule
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

    // 4. Prepare update data
    const updateData: StudentScheduleUpdateInput = {};

    // Handle files
    if (data.homeFiles?.length) {
      updateData.homeFiles = await handleFileUploads(
        data.homeFiles,
        token_.userId,
        "home",
      );
    }
    if (data.classFiles?.length) {
      updateData.classFiles = await handleFileUploads(
        data.classFiles,
        token_.userId,
        "class",
      );
    }
    if (data.homeAudios?.length) {
      updateData.homeAudios = await handleFileUploads(
        data.homeAudios,
        token_.userId,
        "home/audio",
      );
    }
    if (data.classAudios?.length) {
      updateData.classAudios = await handleFileUploads(
        data.classAudios,
        token_.userId,
        "class/audio",
      );
    }

    // Handle other fields
    const fieldsToUpdate = {
      lessonsPrice:
        data.lessonsPrice !== undefined ? Number(data.lessonsPrice) : undefined,
      typeLesson:
        data.typeLesson !== undefined ? Number(data.typeLesson) : undefined,
      isChecked: data.isChecked,
      itemName: data.itemName,
      studentName: data.studentName,
      homeWork: data.homeWork,
      classWork: data.classWork,
      address: data.address,
      homeStudentsPoints: data.homeStudentsPoints,
      classStudentsPoints: data.classStudentsPoints,
    };

    // Add only defined fields to updateData
    Object.entries(fieldsToUpdate).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    // Handle timelines
    if (data.startTime || data.endTime) {
      updateData.timeLinesArray = await createTimeLineArray(data);
    }

    // 5. Update schedule
    const updatedSchedule = await db.studentSchedule.update({
      where: { id: data.id },
      data: updateData,
      include: {
        item: {
          include: {
            group: true,
          },
        },
      },
    });

    // 6. Update history if needed
    if (updatedSchedule.item?.group) {
      const updateDate = new Date(
        Number(data.year),
        Number(data.month) - 1,
        Number(data.day),
      );
      const updatedHistory = await updateHistoryInGroup(
        updatedSchedule.item.group,
        data,
        updateDate,
      );

      await db.group.update({
        where: { id: updatedSchedule.item.group.id },
        data: { historyLessons: updatedHistory },
      });
    }

    // 7. Send response
    socket.emit(`updateStudentSchedule_${data.id}`, {
      success: true,
      updatedSchedule,
    });

    return updatedSchedule;
  } catch (error) {
    console.error("Error in updateStudentSchedule:", error);
    socket.emit(`updateStudentSchedule_${rawData.id}`, {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : error instanceof z.ZodError
            ? error.errors
            : "Unknown error occurred",
    });
    throw error;
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

async function processScheduleForGroup(
  schedule: any,
  dayOfWeekIndex: number,
  currentDate: Date,
) {
  const { item } = schedule;
  const timeLinesArray = schedule.timeLinesArray;
  const daySchedule = timeLinesArray[dayOfWeekIndex];

  const [homeFiles, classFiles, homeAudios, classAudios] = await Promise.all([
    getFilesForSchedule(schedule.homeFiles, "home"),
    getFilesForSchedule(schedule.classFiles, "class"),
    getFilesForSchedule(schedule.homeAudios, "home/audio"),
    getFilesForSchedule(schedule.classAudios, "class/audio"),
  ]);

  const realGroup = await db.group.findFirst({
    where: { id: item.group.id },
    include: { students: true },
  });

  if (!realGroup) {
    throw new Error("Group not found");
  }

  const students = realGroup.students;
  let homeStudentsPoints = schedule.homeStudentsPoints;
  let classStudentsPoints = schedule.classStudentsPoints;

  // Обработка points
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

  // Получаем isPaid для каждого студента
  const studentsWithPaymentStatus = students.map((student) => {
    const isPaid = getIsPaidStatusForDate(
      realGroup.historyLessons,
      currentDate,
      student.id,
      schedule.itemName,
    );

    return {
      id: student.id,
      nameStudent: student.nameStudent,
      costOneLesson: student.costOneLesson,
      prePay: student.prePay || [],
      targetLessonStudent: student.targetLessonStudent,
      todayProgramStudent: student.todayProgramStudent,
      isPaid,
    };
  });

  return {
    id: schedule.id,
    itemName: schedule.itemName,
    nameStudent: item.group.groupName,
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
    groupName: item.group.groupName,
    groupId: schedule.groupId,
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
  const timeLinesArray = schedule.timeLinesArray;
  const daySchedule = timeLinesArray[dayOfWeekIndex];

  const [homeFiles, classFiles, homeAudios, classAudios] = await Promise.all([
    getFilesForSchedule(schedule.homeFiles, "home"),
    getFilesForSchedule(schedule.classFiles, "class"),
    getFilesForSchedule(schedule.homeAudios, "home/audio"),
    getFilesForSchedule(schedule.classAudios, "class/audio"),
  ]);

  const history = await db.group.findMany({
    where: { id: item.group?.id },
    select: { historyLessons: true },
  });

  let homeStudentsPoints = [];
  let classStudentsPoints = [];

  if (student) {
    const studentPoint = {
      studentId: student.id,
      studentName: student.nameStudent,
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
        history[0].historyLessons,
        currentDate,
        undefined,
        schedule.itemName,
      )
    : false;

  return {
    id: schedule.id,
    nameStudent: student ? student.nameStudent : schedule.studentName,
    costOneLesson: schedule.lessonsPrice,
    studentId: student?.id || "",
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
    isTrial: schedule.isTrial,
    classWork: schedule.classWork,
    homeStudentsPoints,
    classStudentsPoints,
    isCheck: schedule.isChecked,
    isCancel: schedule.isCancel,
    tryLessonCheck: item.tryLessonCheck,
    tryLessonCost: item.tryLessonCost,
    prePay: student?.prePay || [],
    history: history || null,
    startTime: daySchedule?.startTime,
    endTime: daySchedule?.endTime,
    groupName: item.group?.groupName || "",
    groupId: schedule.groupId,
    type: "student",
    isPaid,
  };
}

export async function getStudentsByDate(
  data: any,
  socket: Socket,
): Promise<void> {
  try {
    const { day, month, year, token, isGroup } = data;

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
        isTrial: true,
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

    if (isGroup) {
      const groupsData = [];
      let totalPrice = 0;

      for (const schedule of studentSchedules) {
        const groupData = await processScheduleForGroup(
          schedule,
          dayOfWeekIndex,
          currentDate,
        );
        totalPrice += schedule.lessonsPrice;
        groupsData.push(groupData);
      }

      groupsData.push({ totalPrice });
      socket.emit("getStudentsByDate", groupsData);
    } else {
      const results = await Promise.all(
        studentSchedules.map((schedule) =>
          processScheduleForIndividual(schedule, dayOfWeekIndex, currentDate),
        ),
      );
      socket.emit("getStudentsByDate", results);
    }
  } catch (error) {
    console.error("Error in getStudentsByDate:", error);
    socket.emit("getStudentsByDate", {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
