import db from "../db";
import { Request, Response } from "express";
import api from "../api";
import { mockData } from "./mock";
import { ICell } from "types";

// Контроллер для получения календаря по токену и датам
api.post("/getCalendar", async (req: Request, res: Response) => {
  try {
    const { token, currentYear, currentMonth } = req.body;
    const tokenData = await db.token.findFirst({ where: { token } });
    const userId = tokenData?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Определение начальной и конечной даты месяца
    const currentDate = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // Получение данных из таблицы StudentSchedule
    const studentSchedules = await db.studentSchedule.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Преобразование данных в формат ICell и суммирование при совпадении дня, месяца и года
    const result: ICell[] = studentSchedules.reduce(
      (acc: ICell[], schedule) => {
        const date = new Date(
          parseInt(schedule.year),
          parseInt(schedule.month) - 1,
          parseInt(schedule.day)
        );
        const existingCell = acc.find(
          (cell) =>
            cell.day === schedule.day &&
            cell.month === schedule.month &&
            cell.year === schedule.year
        );

        if (existingCell) {
          existingCell.workCount += schedule.workCount;
          existingCell.lessonsCount += schedule.lessonsCount;
          existingCell.lessonsPrice += schedule.lessonsPrice;
          existingCell.workPrice += schedule.workPrice;
        } else {
          acc.push({
            workCount: schedule.workCount,
            id: schedule.id,
            day: schedule.day,
            month: schedule.month,
            year: schedule.year,
            lessonsCount: schedule.lessonsCount,
            lessonsPrice: schedule.lessonsPrice,
            workPrice: schedule.workPrice,
            date,
          });
        }

        return acc;
      },
      []
    );

    // Сортировка по дате
    result.sort((a, b) => a.date.getTime() - b.date.getTime());

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Контроллер для получения расписания по ID группы
api.post("/getByGroupScheduleId", async (req: Request, res: Response) => {
  try {
    const { token, groupId } = req.body;
    const tokenData = await db.token.findFirst({ where: { token } });
    const userId = tokenData?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const studentSchedules = await db.studentSchedule.findMany({
      where: {
        userId,
        groupId,
      },
    });

    const studentScheduleJSON = JSON.parse(JSON.stringify(studentSchedules));
    studentScheduleJSON.forEach((schedule: any) => {
      schedule.date = new Date(
        parseInt(schedule.year),
        parseInt(schedule.month) - 1,
        parseInt(schedule.day)
      );
    });
    studentScheduleJSON.sort((a, b) => a.date.getTime() - b.date.getTime());

    res.status(200).json(studentScheduleJSON);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Контроллер для получения расписания по ID клиента
api.post("/getByClientScheduleId", async (req: Request, res: Response) => {
  try {
    const { token, clientId } = req.body;
    const tokenData = await db.token.findFirst({ where: { token } });
    const userId = tokenData?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const clientSchedules = await db.studentSchedule.findMany({
      where: {
        userId,
        clientId,
      },
    });

    const clientScheduleJSON = JSON.parse(JSON.stringify(clientSchedules));
    clientScheduleJSON.forEach((schedule: any) => {
      schedule.date = new Date(
        parseInt(schedule.year),
        parseInt(schedule.month) - 1,
        parseInt(schedule.day)
      );
    });
    clientScheduleJSON.sort((a, b) => a.date.getTime() - b.date.getTime());

    res.status(200).json(clientScheduleJSON);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Контроллер для получения расписания по ID группы
api.post("/getByGroupScheduleId", async (req: Request, res: Response) => {
  try {
    const { token, groupId } = req.body;
    const tokenData = await db.token.findFirst({ where: { token } });
    const userId = tokenData?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const groupSchedules = await db.studentSchedule.findMany({
      where: {
        userId,
        groupId,
      },
    });

    const groupScheduleJSON = JSON.parse(JSON.stringify(groupSchedules));
    groupScheduleJSON.forEach((schedule: any) => {
      schedule.date = new Date(
        parseInt(schedule.year),
        parseInt(schedule.month) - 1,
        parseInt(schedule.day)
      );
    });
    groupScheduleJSON.sort((a, b) => a.date.getTime() - b.date.getTime());

    res.status(200).json(groupScheduleJSON);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
