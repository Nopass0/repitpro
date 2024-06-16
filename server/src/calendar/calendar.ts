import db from "../db";
import io from "../socket";
import { mockData } from "./mock";
import { ICell } from "types";

export const calendar = async (data, socket) => {
  try {
    const token = data?.token;

    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    const userId = token_?.userId;

    if (!userId) {
      return socket.emit("calendar", { message: "Invalid token" });
    }

    // Определение начальной и конечной даты месяца
    let currentDate = new Date(data.currentYear, data.currentMonth, 1);
    let startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    let endDate = new Date(
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
    const result = studentSchedules.reduce((acc, schedule) => {
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
    }, []);

    // Сортировка по дате
    result.sort((a, b) => {
      return a.date.getTime() - b.date.getTime();
    });

    // console.log(result);

    // Отправка данных через сокеты
    socket.emit("getMonth", result);
  } catch (error) {
    console.log("ERROR");
    return socket.emit("getMonth", { error: error.message });
  }
};

export const getByGroupId = async (data, socket) => {
  try {
    const token = data?.token;

    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    const userId = token_?.userId;

    if (!userId) {
      return socket.emit("calendar", { message: "Invalid token" });
    }

    let { groupId } = data;
    console.log(data, "groupIdgroupIdgroupIdgroupId");

    const studentSchedules = await db.studentSchedule.findMany({
      where: {
        userId,
        groupId,
      },
    });

    const studentScheduleJSON = JSON.parse(JSON.stringify(studentSchedules));
    studentScheduleJSON.map((schedule) => {
      schedule.date = new Date(
        parseInt(schedule.year),
        parseInt(schedule.month) - 1,
        parseInt(schedule.day)
      );
    });
    studentScheduleJSON.sort((a, b) => {
      return a.date.getTime() - b.date.getTime();
    });
    console.log(studentScheduleJSON, "studentScheduleJSON");

    socket.emit("getByGroupId", studentScheduleJSON);
  } catch (error) {
    console.log("ERROR");
    return socket.emit("getByGroupId", { error: error.message });
  }
};

export const getByClientScheduleId = async (data, socket) => {
  try {
    const token = data?.token;
    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });
    const userId = token_?.userId;
    if (!userId) {
      return socket.emit("calendar", { message: "Invalid token" });
    }

    let { clientId } = data;
    console.log(data, "DATATATATAT");
    const clientSchedules = await db.studentSchedule.findMany({
      where: {
        userId,
        clientId,
      },
    });
    const clientScheduleJSON = JSON.parse(JSON.stringify(clientSchedules));
    clientScheduleJSON.map((schedule) => {
      schedule.date = new Date(
        parseInt(schedule.year),
        parseInt(schedule.month) - 1,
        parseInt(schedule.day)
      );
    });
    clientScheduleJSON.sort((a, b) => {
      return a.date.getTime() - b.date.getTime();
    });
    console.log(clientScheduleJSON, "clientScheduleJSON");
    socket.emit("getByClientScheduleId", clientScheduleJSON);
  } catch (error) {
    console.log("ERROR");
    return socket.emit("getByClientScheduleId", { error: error.message });
  }
};

export const getByGroupScheduleId = async (data, socket) => {
  try {
    const token = data?.token;
    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });
    const userId = token_?.userId;
    if (!userId) {
      return socket.emit("calendar", { message: "Invalid token" });
    }
    let { groupId } = data;
    const groupSchedules = await db.studentSchedule.findMany({
      where: {
        userId,
        groupId,
      },
    });
    const groupScheduleJSON = JSON.parse(JSON.stringify(groupSchedules));
    groupScheduleJSON.map((schedule) => {
      schedule.date = new Date(
        parseInt(schedule.year),
        parseInt(schedule.month) - 1,
        parseInt(schedule.day)
      );
    });
    groupScheduleJSON.sort((a, b) => {
      return a.date.getTime() - b.date.getTime();
    });
    console.log(groupScheduleJSON, "groupScheduleJSON");
    socket.emit("getByGroupScheduleId", groupScheduleJSON);
  } catch (error) {
    console.log("ERROR");
    return socket.emit("getByGroupScheduleId", { error: error.message });
  }
};
