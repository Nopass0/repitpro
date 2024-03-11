import io from "../socket";
import { mockData } from "./mock";
import { ICell } from "types";

export const calendar = (data) => {
  let mock = mockData;
  console.log(data.currentMonth, data.token);

  // Определение начальной и конечной даты месяца
  let startDate = new Date(new Date().getFullYear(), data.currentMonth, 1);
  //startDate на десять дней назад
  startDate.setDate(startDate.getDate() - 10);
  let endDate = new Date(new Date().getFullYear(), data.currentMonth + 2, 0); // последний день текущего месяца

  console.log(startDate.getTime(), endDate.getTime());

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
  console.log(_result.length);
  console.log(_result);
  io.emit("getMonth", _result);
};
