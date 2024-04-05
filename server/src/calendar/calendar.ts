import db from "../db";
import io from "../socket";
import { mockData } from "./mock";
import { ICell } from "types";

// export const calendar = async (data) => {
//   let mock = mockData;
//   // console.log(data.currentMonth, data.token);

//   const token = data?.token;

//   const userId = await db.token.findFirst({
//     where: {
//       token,
//     },
//   });

//   // Определение начальной и конечной даты месяца
//   let startDate = new Date(data.currentYear, data.currentMonth, 1);
//   //startDate на десять дней назад
//   startDate.setDate(startDate.getDate() - 10);
//   let endDate = new Date(new Date().getFullYear(), data.currentMonth + 2, 0); // последний день текущего месяца

//   // console.log(startDate.getTime(), endDate.getTime());

//   // const cls = await getCells(userId.userId);
//   // console.log(cls);

//   // //

//   // if (!token) {

//   //   const students = db.student.findMany({
//   //     where: {
//   //       userId: ,
//   //     },
//   //   });

//   // }

//   // Фильтрация данных для текущего месяца
//   let result = mock
//     .filter((item) => {
//       let itemDate = new Date(
//         parseInt(item.year),
//         parseInt(item.month) - 1,
//         parseInt(item.day)
//       ); // item.month - 1, так как в JavaScript месяцы начинаются с 0
//       return (
//         item.userId === "1" && itemDate >= startDate && itemDate <= endDate
//       );
//     })
//     .map((item) => {
//       return {
//         ...item,
//         date: new Date(
//           parseInt(item.year),
//           parseInt(item.month) - 1,
//           parseInt(item.day)
//         ),
//       };
//     });

//   // Получение уникальных дат
//   result = result.filter((item, index) => {
//     return (
//       index ===
//       result.findIndex((t) => t.date.getTime() === item.date.getTime())
//     );
//   });

//   // Преобразование данных в формат ICell
//   let _result = result.map((item) => {
//     return {
//       workCount: item.workCount,
//       id: item.id,
//       day: item.day,
//       month: item.month,
//       year: item.year,
//       lessonsCount: item.lessonsCount,
//       lessonsPrice: item.lessonsPrice,
//       workPrice: item.workPrice,
//     };
//   });

//   // Сортировка по дате
//   _result.sort((a, b) => {
//     return (
//       new Date(`${a.year}-${a.month}-${a.day}`).getTime() -
//       new Date(`${b.year}-${b.month}-${b.day}`).getTime()
//     );
//   });

//   // Отправка данных через сокеты
//   // console.log(_result.length);
//   // console.log(_result);
//   io.emit("getMonth", _result);
// };

export const calendar = async (data) => {
  try {
    const token = data?.token;

    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    const userId = await token_.userId;

    if (!userId) {
      throw new Error("Invalid token");
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

    console.log(result);

    // Отправка данных через сокеты
    io.emit("getMonth", result);
  } catch (error) {
    console.log("ERROR");
    return io.emit("getMonth", { error: error.message });
  }
};
