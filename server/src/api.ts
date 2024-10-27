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

const api = express();
api.use(cors());

// Get files link
api.get("/files/:id", async (req, res) => {
  try {
    const file = await db.file.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        path: true,
      },
    });

    if (!file) {
      return res.status(404).send("File not found");
    }

    const fullPath = join(__dirname.replace("src", ""), file.path);
    console.log("Full Path:", fullPath);

    res.sendFile(fullPath);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

api.get("/check-free-slots", async (req, res) => {
  try {
    const { token, startDate, endDate } = req.query;

    console.log("Received request:", token, startDate, endDate);

    if (!token || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Проверяем токен и получаем пользователя
    let tokenRecord = await db.token.findFirst({
      where: {
        token: token as string,
      },
    });

    if (!tokenRecord || !tokenRecord.userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const start = parseISO(startDate as string);
    const end = parseISO(endDate as string);

    // Получаем все даты в диапазоне
    const dateRange = eachDayOfInterval({ start, end });

    // Получаем существующие записи расписания
    const studentSchedules = await db.studentSchedule.findMany({
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

    console.log("Found student schedules:", studentSchedules.length);

    // Получаем все временные слоты
    const occupiedSlots = studentSchedules.flatMap(
      (schedule) => schedule.timeLinesArray
    );
    console.log("Occupied slots:", occupiedSlots.length);

    // Группируем слоты по дням недели
    const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    const occupiedTimeSlots = daysOfWeek.map((day) => {
      // Находим все слоты для текущего дня
      const daySlots = occupiedSlots.filter((slot) => slot.day === day);

      // Для каждого дня создаем массив уникальных занятых слотов
      const uniqueSlots = new Map();

      daySlots.forEach((slot) => {
        // Пропускаем "пустые" слоты
        if (
          slot.startTime.hour === 0 &&
          slot.startTime.minute === 0 &&
          slot.endTime.hour === 0 &&
          slot.endTime.minute === 0
        ) {
          return;
        }

        const key = `${slot.startTime.hour}:${slot.startTime.minute}-${slot.endTime.hour}:${slot.endTime.minute}`;
        if (!uniqueSlots.has(key)) {
          uniqueSlots.set(key, {
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        }
      });

      // Преобразуем Map в массив и сортируем по времени
      const sortedSlots = Array.from(uniqueSlots.values()).sort((a, b) => {
        const timeA = a.startTime.hour * 60 + a.startTime.minute;
        const timeB = b.startTime.hour * 60 + b.startTime.minute;
        return timeA - timeB;
      });

      return {
        day,
        // Переименовываем freeTime в occupiedTime для большей ясности
        freeTime: sortedSlots,
      };
    });

    res.json({ freeSlots: occupiedTimeSlots });
  } catch (error) {
    console.error("Error in check-free-slots:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Дополнительный эндпоинт для получения общей информации о занятости
api.get("/schedule-summary", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const tokenRecord = await db.token.findFirst({
      where: {
        token: token as string,
      },
    });

    if (!tokenRecord || !tokenRecord.userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Получаем все расписание пользователя
    const allSchedules = await db.studentSchedule.findMany({
      where: {
        userId: tokenRecord.userId,
      },
    });

    // Подсчитываем общую статистику
    const stats = {
      totalSlots: 0,
      slotsPerDay: {} as Record<string, number>,
      busyHours: 0,
      mostBusyDay: "",
    };

    allSchedules.forEach((schedule) => {
      schedule.timeLinesArray.forEach((slot) => {
        // Пропускаем пустые слоты
        if (
          slot.startTime.hour === 0 &&
          slot.startTime.minute === 0 &&
          slot.endTime.hour === 0 &&
          slot.endTime.minute === 0
        ) {
          return;
        }

        stats.totalSlots++;
        stats.slotsPerDay[slot.day] = (stats.slotsPerDay[slot.day] || 0) + 1;

        // Подсчитываем часы занятости
        const startMinutes = slot.startTime.hour * 60 + slot.startTime.minute;
        const endMinutes = slot.endTime.hour * 60 + slot.endTime.minute;
        stats.busyHours += (endMinutes - startMinutes) / 60;
      });
    });

    // Находим самый загруженный день
    stats.mostBusyDay = Object.entries(stats.slotsPerDay).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];

    res.json({
      summary: stats,
      success: true,
    });
  } catch (error) {
    console.error("Error in schedule-summary:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Эндпоинт для проверки конфликтов в расписании
api.post("/check-schedule-conflicts", async (req, res) => {
  try {
    const { token, newSlot } = req.body;

    if (!token || !newSlot) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const tokenRecord = await db.token.findFirst({
      where: {
        token: token as string,
      },
    });

    if (!tokenRecord || !tokenRecord.userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const existingSchedules = await db.studentSchedule.findMany({
      where: {
        userId: tokenRecord.userId,
      },
    });

    // Проверяем конфликты с существующими слотами
    const conflicts = [];
    existingSchedules.forEach((schedule) => {
      schedule.timeLinesArray
        .filter((slot) => slot.day === newSlot.day)
        .forEach((slot) => {
          const newSlotStart =
            newSlot.startTime.hour * 60 + newSlot.startTime.minute;
          const newSlotEnd = newSlot.endTime.hour * 60 + newSlot.endTime.minute;
          const existingSlotStart =
            slot.startTime.hour * 60 + slot.startTime.minute;
          const existingSlotEnd = slot.endTime.hour * 60 + slot.endTime.minute;

          if (
            (newSlotStart >= existingSlotStart &&
              newSlotStart < existingSlotEnd) ||
            (newSlotEnd > existingSlotStart && newSlotEnd <= existingSlotEnd) ||
            (newSlotStart <= existingSlotStart && newSlotEnd >= existingSlotEnd)
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
    });

    res.json({
      hasConflicts: conflicts.length > 0,
      conflicts,
      success: true,
    });
  } catch (error) {
    console.error("Error in check-schedule-conflicts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default api;
