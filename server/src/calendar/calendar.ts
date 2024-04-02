import db from "../db";
import io from "../socket";
import { mockData } from "./mock";
import { ICell } from "types";

export async function getCells(userId: string): Promise<ICell[]> {
  try {
    // Получаем данные о студентах
    const students = await db.student.findMany({
      where: {
        userId: userId,
      },
    });

    const cells: ICell[] = [];

    // Для каждого студента получаем данные о его предметах
    for (const student of students) {
      const costOneLesson = parseFloat(student.costOneLesson || "0");

      // Фильтруем предметы по идентификаторам, содержащимся в массиве предметов студента
      const items = await db.item.findMany({
        where: {
          id: {
            in: student.items,
          },
        },
        select: {
          id: true,
          lessonDuration: true,
          startLesson: true,
          endLesson: true,
        },
      });

      for (const item of items) {
        const startDate = new Date(item.startLesson);
        const endDate = new Date(item.endLesson);

        const lessonDuration = item.lessonDuration || 0;

        const daysInRange = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        for (let i = 0; i < daysInRange; i++) {
          const date = new Date(
            startDate.getTime() + i * (24 * 60 * 60 * 1000)
          ); // Исправлено вычисление даты
          const workCount = lessonDuration;
          const lessonsCount = 1;
          const lessonsPrice = costOneLesson;
          const workPrice = workCount * lessonsPrice;

          cells.push({
            workCount,
            id: item.id.charCodeAt(0),
            day: date.getDate(),
            month: date.getMonth() + 1,
            year: date.getFullYear(),
            lessonsCount,
            lessonsPrice,
            workPrice,
          });
        }
      }
    }

    return cells;
  } catch (error) {
    console.error("Error fetching cells:", error);
    throw error;
  }
}

export const calendar = async (data) => {
  let mock = mockData;
  // console.log(data.currentMonth, data.token);

  const token = data?.token;

  const userId = await db.token.findFirst({
    where: {
      token,
    },
  });

  // Определение начальной и конечной даты месяца
  let startDate = new Date(data.currentYear, data.currentMonth, 1);
  //startDate на десять дней назад
  startDate.setDate(startDate.getDate() - 10);
  let endDate = new Date(new Date().getFullYear(), data.currentMonth + 2, 0); // последний день текущего месяца

  // console.log(startDate.getTime(), endDate.getTime());
  const cls = await getCells(userId.userId);
  // console.log(cls);

  // //

  // if (!token) {

  //   const students = db.student.findMany({
  //     where: {
  //       userId: ,
  //     },
  //   });

  // }

  // Фильтрация данных для текущего месяца
  let result = mock
    .filter((item) => {
      let itemDate = new Date(
        parseInt(item.year),
        parseInt(item.month) - 1,
        parseInt(item.day)
      ); // item.month - 1, так как в JavaScript месяцы начинаются с 0
      return (
        item.userId === "1" && itemDate >= startDate && itemDate <= endDate
      );
    })
    .map((item) => {
      return {
        ...item,
        date: new Date(
          parseInt(item.year),
          parseInt(item.month) - 1,
          parseInt(item.day)
        ),
      };
    });

  // Получение уникальных дат
  result = result.filter((item, index) => {
    return (
      index ===
      result.findIndex((t) => t.date.getTime() === item.date.getTime())
    );
  });

  // Преобразование данных в формат ICell
  let _result = result.map((item) => {
    return {
      workCount: item.workCount,
      id: item.id,
      day: item.day,
      month: item.month,
      year: item.year,
      lessonsCount: item.lessonsCount,
      lessonsPrice: item.lessonsPrice,
      workPrice: item.workPrice,
    };
  });

  // Сортировка по дате
  _result.sort((a, b) => {
    return (
      new Date(`${a.year}-${a.month}-${a.day}`).getTime() -
      new Date(`${b.year}-${b.month}-${b.day}`).getTime()
    );
  });

  // Отправка данных через сокеты
  // console.log(_result.length);
  // console.log(_result);
  io.emit("getMonth", _result);
};
