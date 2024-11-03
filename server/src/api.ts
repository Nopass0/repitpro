import {
  parseISO,
  eachDayOfInterval,
  format,
  isWithinInterval,
} from "date-fns";
import db from "./db";
import express from "express";
import { join } from "path";
import cors from "cors";
import { z } from "zod";
import { capture } from "./utils/error";

const api = express();
api.use(
  cors({
    origin: ["http://localhost", "http://localhost:80", "https://repitpro.ru"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
api.use(express.static(__dirname + "/public"));
api.use(express.json());

// Схемы валидации
const TimeSchema = z.object({
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59),
});

const TimeSlotSchema = z.object({
  startTime: TimeSchema,
  endTime: TimeSchema,
  day: z.string(),
});

const TimeLinesArraySchema = z.array(TimeSlotSchema);

const FreeSlotsQuerySchema = z.object({
  token: z.string().min(1, "Token is required"),
  startDate: z.string().refine((val) => {
    try {
      parseISO(val);
      return true;
    } catch {
      return false;
    }
  }, "Invalid start date"),
  endDate: z.string().refine((val) => {
    try {
      parseISO(val);
      return true;
    } catch {
      return false;
    }
  }, "Invalid end date"),
});

// Маппинг числовых дней недели в строковые
const dayMapping: Record<number, string> = {
  1: "Пн",
  2: "Вт",
  3: "Ср",
  4: "Чт",
  5: "Пт",
  6: "Сб",
  0: "Вс",
};

// Get files link
api.get("/files/:id", async (req, res) => {
  try {
    const fileId = z.string().parse(req.params.id);

    const file = await db.file.findUnique({
      where: { id: fileId },
      select: { path: true },
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const fullPath = join(__dirname.replace("src", ""), file.path);
    res.sendFile(fullPath);
  } catch (error) {
    capture(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

api.get("/check-free-slots", async (req, res) => {
  try {
    const { token, startDate, endDate } = await FreeSlotsQuerySchema.parseAsync(
      req.query,
    );
    console.log("Query params:", { token, startDate, endDate });

    const tokenRecord = await db.token.findFirst({
      where: { token },
      select: { userId: true },
    });

    if (!tokenRecord?.userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const dateRange = eachDayOfInterval({ start, end });

    // Получаем расписание
    const schedules = await db.studentSchedule.findMany({
      where: {
        userId: tokenRecord.userId,
        OR: dateRange.map((date) => ({
          AND: [
            { year: format(date, "yyyy") },
            { month: format(date, "M") },
            { day: format(date, "d") },
          ],
        })),
      },
    });

    console.log("Found schedules:", schedules.length);

    // Инициализация структуры для хранения занятых слотов по дням недели
    const slotsMap = new Map();
    const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    daysOfWeek.forEach((day, index) => {
      slotsMap.set(index, new Set());
    });

    let totalSlotsFound = 0;

    // Обработка временных слотов
    schedules.forEach((schedule) => {
      let timeLinesArray = schedule.timeLinesArray;

      // Парсинг JSON если необходимо
      if (typeof timeLinesArray === "string") {
        try {
          timeLinesArray = JSON.parse(timeLinesArray);
        } catch (e) {
          console.error("Failed to parse timeLinesArray:", e);
          return;
        }
      }

      // Обрабатываем как массив с индексированными слотами
      if (Array.isArray(timeLinesArray)) {
        timeLinesArray.forEach((slot, index) => {
          if (!slot || !slot.startTime || !slot.endTime) return;

          // Пропускаем пустые слоты
          if (
            slot.startTime.hour === 0 &&
            slot.startTime.minute === 0 &&
            slot.endTime.hour === 0 &&
            slot.endTime.minute === 0
          ) {
            return;
          }

          const slotKey = `${String(slot.startTime.hour).padStart(2, "0")}:${String(
            slot.startTime.minute,
          ).padStart(
            2,
            "0",
          )}-${String(slot.endTime.hour).padStart(2, "0")}:${String(
            slot.endTime.minute,
          ).padStart(2, "0")}`;

          const daySet = slotsMap.get(index);
          if (daySet) {
            daySet.add(slotKey);
            totalSlotsFound++;
            console.log(`Added slot ${slotKey} to day index ${index}`);
          }
        });
      }
    });

    // Формируем ответ
    const occupiedTimeSlots = daysOfWeek.map((day, index) => {
      const slots = Array.from(slotsMap.get(index) || [])
        .map((timeStr: string) => {
          const [start, end] = timeStr.split("-");
          const [startHour, startMinute] = start.split(":").map(Number);
          const [endHour, endMinute] = end.split(":").map(Number);

          return {
            startTime: { hour: startHour, minute: startMinute },
            endTime: { hour: endHour, minute: endMinute },
          };
        })
        .sort((a, b) => {
          const timeA = a.startTime.hour * 60 + a.startTime.minute;
          const timeB = b.startTime.hour * 60 + b.startTime.minute;
          return timeA - timeB;
        });

      return {
        day,
        freeTime: slots, // занятые слоты
      };
    });

    res.json({
      freeSlots: occupiedTimeSlots,
      debug: {
        schedulesCount: schedules.length,
        slotsFound: [...slotsMap.entries()].map(([dayIndex, slots]) => ({
          day: daysOfWeek[dayIndex],
          count: slots.size,
          slots: [...slots],
        })),
        totalSlotsFound,
        sampleTimeLinesArray: schedules[0]?.timeLinesArray,
      },
    });
  } catch (error) {
    console.error("Error in check-free-slots:", error);
    capture(error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation Error",
        details: error.errors,
      });
    }

    res.status(500).json({
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

api.get("/schedule-summary", async (req, res) => {
  try {
    const { token } = await z
      .object({
        token: z.string().min(1, "Token is required"),
      })
      .parseAsync(req.query);

    const tokenRecord = await db.token.findFirst({
      where: { token },
      select: { userId: true },
    });

    if (!tokenRecord?.userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const schedules = await db.studentSchedule.findMany({
      where: { userId: tokenRecord.userId },
      select: { timeLinesArray: true },
    });

    const stats = {
      totalSlots: 0,
      slotsPerDay: {} as Record<string, number>,
      busyHours: 0,
      mostBusyDay: "",
    };

    schedules.forEach((schedule) => {
      if (Array.isArray(schedule.timeLinesArray)) {
        schedule.timeLinesArray.forEach((slot: any) => {
          if (
            slot.startTime?.hour === 0 &&
            slot.startTime?.minute === 0 &&
            slot.endTime?.hour === 0 &&
            slot.endTime?.minute === 0
          ) {
            return;
          }

          if (slot.day && slot.startTime && slot.endTime) {
            stats.totalSlots++;
            stats.slotsPerDay[slot.day] =
              (stats.slotsPerDay[slot.day] || 0) + 1;

            const startMinutes =
              slot.startTime.hour * 60 + slot.startTime.minute;
            const endMinutes = slot.endTime.hour * 60 + slot.endTime.minute;
            stats.busyHours += (endMinutes - startMinutes) / 60;
          }
        });
      }
    });

    stats.mostBusyDay = Object.entries(stats.slotsPerDay).reduce(
      (a, b) => (a[1] > b[1] ? a : b),
      ["", 0],
    )[0];

    res.json({
      summary: stats,
      success: true,
    });
  } catch (error) {
    capture(error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation Error",
        details: error.errors,
      });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

api.post("/check-schedule-conflicts", async (req, res) => {
  try {
    const schema = z.object({
      token: z.string().min(1),
      newSlot: z.object({
        day: z.string(),
        startTime: TimeSchema,
        endTime: TimeSchema,
      }),
    });

    const { token, newSlot } = await schema.parseAsync(req.body);

    const tokenRecord = await db.token.findFirst({
      where: { token },
      select: { userId: true },
    });

    if (!tokenRecord?.userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const schedules = await db.studentSchedule.findMany({
      where: { userId: tokenRecord.userId },
      select: { timeLinesArray: true },
    });

    const conflicts = [];
    schedules.forEach((schedule) => {
      if (Array.isArray(schedule.timeLinesArray)) {
        schedule.timeLinesArray
          .filter((slot: any) => slot.day === newSlot.day)
          .forEach((slot: any) => {
            const newStart =
              newSlot.startTime.hour * 60 + newSlot.startTime.minute;
            const newEnd = newSlot.endTime.hour * 60 + newSlot.endTime.minute;
            const existingStart =
              slot.startTime.hour * 60 + slot.startTime.minute;
            const existingEnd = slot.endTime.hour * 60 + slot.endTime.minute;

            if (
              (newStart >= existingStart && newStart < existingEnd) ||
              (newEnd > existingStart && newEnd <= existingEnd) ||
              (newStart <= existingStart && newEnd >= existingEnd)
            ) {
              conflicts.push({
                day: slot.day,
                conflictingSlot: {
                  start: slot.startTime,
                  end: slot.endTime,
                },
              });
            }
          });
      }
    });

    res.json({
      hasConflicts: conflicts.length > 0,
      conflicts,
      success: true,
    });
  } catch (error) {
    capture(error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation Error",
        details: error.errors,
      });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default api;
