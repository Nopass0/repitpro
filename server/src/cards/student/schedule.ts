import db from "db";
import { upload } from "files/files";
import { z } from "zod";
import { Socket } from "socket.io";
import { Prisma, StudentSchedule } from "@prisma/client";

// Base schema definitions
const TimeSchema = z.object({
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59),
});

const StudentPointSchema = z.object({
  studentId: z.string(),
  studentName: z.string().optional(),
  points: z.number().min(0).max(5),
});

// Schema for creating a new student schedule
export const createStudentScheduleSchema = z.object({
  token: z.string(),
  day: z.string(),
  month: z.string(),
  year: z.string(),
  studentId: z.string(),
  itemName: z.string(),
  lessonsPrice: z.string(),
  studentName: z.string(),
  // copyBy теперь опционально – если передано, значит копируем существующее расписание,
  // иначе создаём новое расписание с нуля.
  copyBy: z.string().optional(),
  // можно добавить и typeLesson, startTime, endTime, если они нужны при создании
  typeLesson: z.union([z.string(), z.number()]).optional(),
  startTime: TimeSchema.optional(),
  endTime: TimeSchema.optional(),
  itemId: z.string().optional(),
});

// Schema for updating student schedule
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
export type CreateStudentScheduleSchemaType = z.infer<typeof createStudentScheduleSchema>;

// Helper function to compare dates
function compareOnlyDates(date1: string | Date, date2: string | Date): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Helper function to handle file uploads
async function handleFileUploads(
  files: any[],
  userId: string,
  type: string,
): Promise<string[]> {
  if (!files?.length) return [];
  return await upload(files, userId, type);
}

// Helper function to ensure valid time object
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

// Helper function to get files for schedule
async function getFilesForSchedule(fileIds: string[], extraType: string) {
  if (!fileIds?.length) return [];
  return await db.file.findMany({
    where: {
      id: { in: fileIds },
      extraType,
    },
  });
}

// Main function to create student schedule
export async function createStudentSchedule(
  data: CreateStudentScheduleSchemaType,
  socket: Socket,
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
    typeLesson,
    startTime,
    endTime,
    itemId,
  } = data;

  try {
    // Verify token
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

    if (copyBy) {
      // Если указан параметр copyBy – копируем существующее расписание
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

      // Create new schedule based on original
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
          isPaid: false,
        },
      });

      socket.emit("createStudentSchedule", {
        message: "student schedule created successfully",
        created: studentSchedule.id,
        nameStudent: studentName,
        costOneLesson: lessonsPrice,
        itemName: itemName,
      });

      return studentSchedule.id;
    } else {
      // Если copyBy не указан – создаём новое расписание с нуля
      const studentSchedule = await db.studentSchedule.create({
        data: {
          day,
          month,
          year,
          userId,
          groupId: null, // можно задать группу, если требуется
          workCount: 0,
          lessonsCount: 0,
          workPrice: 0,
          itemId: itemId || "", // если есть переданный itemId, иначе пустая строка
          lessonsPrice: Number(lessonsPrice),
          itemName,
          studentName,
          typeLesson: typeLesson ? String(typeLesson) : "1", // по умолчанию тип "1"
          startTime: startTime ? startTime : null,
          endTime: endTime ? endTime : null,
          isChecked: false,
          isCancel: false,
          isTrial: false,
          isPaid: false,
          timeLinesArray: [],
        },
      });

      socket.emit("createStudentSchedule", {
        message: "student schedule created successfully",
        created: studentSchedule.id,
        nameStudent: studentName,
        costOneLesson: lessonsPrice,
        itemName: itemName,
      });

      return studentSchedule.id;
    }
  } catch (error) {
    console.error("Error creating student schedule:", error);
    socket.emit("createStudentSchedule", {
      ok: false,
      error: "Error creating student schedule",
    });
    return;
  }
}

// Function to process schedule for group
async function processScheduleForGroup(
  schedule: any,
  dayOfWeekIndex: number,
  currentDate: Date,
) {
  const { item } = schedule;
  const timeLinesArray = Array.isArray(schedule.timeLinesArray)
    ? schedule.timeLinesArray
    : [];

  // Get time values
  const startTime = ensureValidTimeObject(schedule.startTime);
  const endTime = ensureValidTimeObject(schedule.endTime);

  // Get files
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

  // Get students with payment status
  const studentsWithPaymentStatus = await Promise.all(
    students.map(async (student) => {
      // Get individual student schedule
      const studentSchedule = await db.studentSchedule.findFirst({
        where: {
          groupId: realGroup.id,
          studentId: student.id,
          day: currentDate.getDate().toString(),
          month: (currentDate.getMonth() + 1).toString(),
          year: currentDate.getFullYear().toString(),
        },
      });

      return {
        id: student.id,
        nameStudent: student.nameStudent || "",
        costOneLesson: student.costOneLesson || "0",
        prePay: Array.isArray(student.prePay) ? student.prePay : [],
        targetLessonStudent: student.targetLessonStudent || "",
        todayProgramStudent: student.todayProgramStudent || "",
        isPaid: studentSchedule?.isPaid || false,
      };
    }),
  );

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
    isPaid: Boolean(schedule.isPaid),
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

// Function to process schedule for individual student
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

  const startTime = ensureValidTimeObject(schedule.startTime);
  const endTime = ensureValidTimeObject(schedule.endTime);

  const [homeFiles, classFiles, homeAudios, classAudios] = await Promise.all([
    getFilesForSchedule(schedule.homeFiles || [], "home"),
    getFilesForSchedule(schedule.classFiles || [], "class"),
    getFilesForSchedule(schedule.homeAudios || [], "home/audio"),
    getFilesForSchedule(schedule.classAudios || [], "class/audio"),
  ]);

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
    startTime,
    endTime,
    groupName: item.group?.groupName || "",
    groupId: schedule.groupId || "",
    type: "student",
    isPaid: Boolean(schedule.isPaid),
  };
}

// Function to get students by date
export async function getStudentsByDate(
  data: any,
  socket: Socket,
): Promise<void> {
  try {
    const { day, month, year, token } = data;

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

    // Send processed data
    socket.emit("getStudentsByDate", processedData);
  } catch (error) {
    console.error("Error in getStudentsByDate:", error);
    socket.emit("getStudentsByDate", { error: "Failed to get students" });
  }
}

// Function to update student schedule
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

    // Get current schedule with all relations
    const currentSchedule = await db.studentSchedule.findUnique({
      where: { id: data.id },
      include: {
        item: {
          include: {
            group: true,
          },
        },
      },
    });

    if (!currentSchedule) {
      throw new Error("Schedule not found");
    }

    let updateData: Prisma.StudentScheduleUpdateInput = {};

    switch (data.action) {
      case "updateCompletion":
        updateData = {
          isChecked: data.isChecked,
          isPaid: data.isChecked,
          isAutoChecked: false,
        };
        break;

      case "updateStudent":
        updateData = {
          studentId: data.studentId,
          studentName: data.studentName,
        };
        break;

      case "updatePrice":
        updateData = {
          lessonsPrice: parseFloat(data.lessonsPrice),
        };
        break;

      case "updateSubject":
        updateData = {
          itemName: data.itemName,
        };
        break;

      case "updateTime":
        updateData = {
          startTime: data.startTime,
          endTime: data.endTime,
        };
        break;
    }

    // Update the schedule
    const updatedSchedule = await db.studentSchedule.update({
      where: { id: data.id },
      data: updateData,
    });

    socket.emit(`updateStudentSchedule_${data.id}`, {
      success: true,
      schedule: updatedSchedule,
    });
  } catch (error) {
    console.error("Error updating schedule:", error);
    socket.emit(`updateStudentSchedule_${data.id}`, {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

// Function to update lesson payment status
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

    // Update payment status
    await db.studentSchedule.update({
      where: { id: data.id },
      data: {
        isChecked: data.isPaid,
        isPaid: data.isPaid,
      },
    });

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

// Function to get schedule suggestions
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

// Function to cancel lesson
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

    socket.emit("cancelLesson", { success: true, lessonId: data.id });
  } catch (error) {
    console.error("Error in cancelLesson:", error);
    socket.emit("cancelLesson", {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

// Function to get all student schedules
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

// Function to get student suggestions
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

// Function to get subject suggestions
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

    // Get unique subjects from schedules
    const schedules = await db.studentSchedule.findMany({
      where: {
        userId: token_.userId,
      },
      select: {
        itemName: true,
      },
      distinct: ["itemName"],
    });

    // Get unique subjects from items
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

    // Combine and remove duplicates
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
