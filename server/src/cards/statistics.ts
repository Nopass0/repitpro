import { IStudentCardResponse, ITimeLine, IItemCard } from "../types";
import db from "../db";
import io from "../socket";
import { differenceInDays, isWithinInterval } from "date-fns";
import { format } from "date-fns/locale/ru";

// Function to hash a string using a custom hash function
const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash); // Ensure positive integer
};

// Function to convert a hash value to a hexadecimal color code with fixed saturation and brightness
const hashToColor = (hash: number) => {
  const saturation = 0.6; // Fixed saturation
  const brightness = 0.7; // Fixed brightness

  // Vary hue based on hash
  const hue = hash % 360;

  // Convert HSB to RGB
  const h = hue / 60;
  const c = brightness * saturation;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = brightness - c;
  let r, g, b;
  if (h >= 0 && h < 1) {
    [r, g, b] = [c, x, 0];
  } else if (h >= 1 && h < 2) {
    [r, g, b] = [x, c, 0];
  } else if (h >= 2 && h < 3) {
    [r, g, b] = [0, c, x];
  } else if (h >= 3 && h < 4) {
    [r, g, b] = [0, x, c];
  } else if (h >= 4 && h < 5) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  // Convert RGB to hexadecimal color code
  const rgb = [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  const hexColor = rgb
    .map((value) => Math.round(value).toString(16).padStart(2, "0"))
    .join("");
  return `#${hexColor}`;
};

const formatDate = (date: Date, startDate: Date, endDate: Date) => {
  const dayDiff = differenceInDays(endDate, startDate);
  if (dayDiff > 365) {
    return date.getFullYear().toString(); // year
  } else if (dayDiff > 30) {
    return date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" }); // month-year
  } else {
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }); // day-month
  }
};

const parseDateFromSchedule = (day: string, month: string, year: string) => {
  return new Date(Number(year), Number(month) - 1, Number(day));
};

// Функция для получения данных для графика "Ученики-Финансы"
export async function getStudentFinanceData(data: {
  startDate: Date;
  endDate: Date;
  subjectIds: string[];
  token: string;
}) {
  const { startDate, endDate, subjectIds, token } = data;
  try {
    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    if (!token_) {
      console.error("Invalid token");
      return;
    }

    const userId = token_.userId;

    const whereClause = {
      userId: userId,
      ...(subjectIds.length > 0 && {
        itemId: { in: subjectIds },
      }),
    };

    const data_ = await db.studentSchedule.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        lessonsPrice: true,
        lessonsCount: true,
        itemName: true,
        day: true,
        month: true,
        year: true,
      },
    });

    // Создадим объект, где ключом будет комбинация года, месяца и дня
    const combinedData: {
      [date: string]: {
        lessonsPrice: { [itemName: string]: number };
        lessonsCount: number[];
      };
    } = {};

    // Обходим полученные данные
    for (const item of data_) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      // Формируем строку, представляющую комбинацию года, месяца и дня
      const dateKey = `${item.year}-${item.month}-${item.day}`;

      // Если такой комбинации еще нет в объекте, добавляем ее и инициализируем значения lessonsPrice и lessonsCount
      if (!combinedData[dateKey]) {
        combinedData[dateKey] = {
          lessonsPrice: {},
          lessonsCount: [],
        };
      }

      // Если itemName еще не добавлен в объект lessonsPrice, добавляем его со значением 0
      if (!combinedData[dateKey].lessonsPrice[item.itemName]) {
        combinedData[dateKey].lessonsPrice[item.itemName] = 0;
      }

      // Увеличиваем значение lessonsPrice для соответствующего itemName и добавляем значение lessonsCount в массив
      combinedData[dateKey].lessonsPrice[item.itemName] += item.lessonsPrice;
      combinedData[dateKey].lessonsCount.push(item.lessonsCount);
    }

    // Преобразуем объединенные данные в массив объектов
    const combinedDataArray = Object.keys(combinedData).map((dateKey) => ({
      date: new Date(dateKey),
      lessonsPrice: combinedData[dateKey].lessonsPrice,
      lessonsCount: combinedData[dateKey].lessonsCount,
    }));

    if (combinedDataArray.length === 0) {
      console.log("No data found for the given date range and subject IDs.");
      return;
    }

    const labels = combinedDataArray.map((item) =>
      formatDate(item.date, startDate, endDate)
    );

    const uniqueItemNames = [...new Set(data_.map((item) => item.itemName))];

    const datasets = uniqueItemNames.map((itemName) => ({
      label: itemName,
      data: combinedDataArray.map((item) => item.lessonsPrice[itemName] || 0),
      fill: false,
      backgroundColor: hashToColor(hashString(itemName)),
      borderColor: hashToColor(hashString(itemName)),
    }));

    console.log(labels, datasets);

    if (labels.length === 0 || datasets.length === 0) {
      console.log("No data available for the chart.");
      return;
    }

    io.emit("getStudentFinanceData", { labels, datasets });
    return { labels, datasets };
  } catch (error) {
    console.error("Error fetching student finance data:", error);
  }
}

// Функция для получения данных для графика "Ученики-Количество"
export async function getStudentCountData(data: {
  startDate: Date;
  endDate: Date;
  subjectIds: string[];
  token: string;
}) {
  const { startDate, endDate, subjectIds, token } = data;
  try {
    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    if (!token_) {
      console.error("Invalid token");
      return;
    }

    const userId = token_.userId;

    const whereClause = {
      userId: userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(subjectIds.length > 0 && {
        itemId: { in: subjectIds },
      }),
    };

    const data_ = await db.studentSchedule.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        lessonsCount: true,
        day: true,
        month: true,
        year: true,
        itemName: true,
      },
    });

    // Создадим объект, где ключом будет комбинация года, месяца и дня
    const combinedData: {
      [date: string]: {
        lessonsCount: { [itemName: string]: number[] };
      };
    } = {};

    // Обходим полученные данные
    for (const item of data_) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      // Формируем строку, представляющую комбинацию года, месяца и дня
      const dateKey = `${item.year}-${item.month}-${item.day}`;

      // Если такой комбинации еще нет в объекте, добавляем ее и инициализируем значение lessonsCount
      if (!combinedData[dateKey]) {
        combinedData[dateKey] = {
          lessonsCount: {},
        };
      }

      // Если itemName еще не добавлен в объект lessonsCount, добавляем его с пустым массивом
      if (!combinedData[dateKey].lessonsCount[item.itemName]) {
        combinedData[dateKey].lessonsCount[item.itemName] = [];
      }

      // Добавляем значение lessonsCount в массив для соответствующего itemName
      combinedData[dateKey].lessonsCount[item.itemName].push(item.lessonsCount);
    }

    // Преобразуем объединенные данные в массив объектов
    const combinedDataArray = Object.keys(combinedData).map((dateKey) => ({
      date: new Date(dateKey),
      lessonsCount: combinedData[dateKey].lessonsCount,
    }));

    if (combinedDataArray.length === 0) {
      console.log("No data found for the given date range and subject IDs.");
      return;
    }

    const labels = combinedDataArray.map((item) =>
      formatDate(item.date, startDate, endDate)
    );

    const uniqueItemNames = [...new Set(data_.map((item) => item.itemName))];

    const datasets = uniqueItemNames.map((itemName) => ({
      label: itemName,
      data: combinedDataArray.map(
        (item) => item.lessonsCount[itemName]?.reduce((a, b) => a + b, 0) || 0
      ),
      fill: false,
      backgroundColor: hashToColor(hashString(itemName)),
      borderColor: hashToColor(hashString(itemName)),
    }));

    console.log(labels, datasets);

    if (labels.length === 0 || datasets.length === 0) {
      console.log("No data available for the chart.");
      return;
    }

    io.emit("getStudentCountData", { labels, datasets });
    return { labels, datasets };
  } catch (error) {
    console.error("Error fetching student count data:", error);
  }
}

// Функция для получения данных для графика "Ученики-Занятия"
export async function getStudentLessonsData(data: {
  startDate: Date;
  endDate: Date;
  subjectIds: string[];
  token: string;
}) {
  const { startDate, endDate, subjectIds, token } = data;
  try {
    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    if (!token_) {
      console.error("Invalid token");
      return;
    }

    const userId = token_.userId;

    const whereClause = {
      userId: userId,
      ...(subjectIds.length > 0 && {
        itemId: { in: subjectIds },
      }),
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const data_ = await db.studentSchedule.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        lessonsCount: true,
        day: true,
        month: true,
        year: true,
        itemName: true,
      },
    });

    // Создадим объект, где ключом будет комбинация года, месяца и дня
    const combinedData: {
      [date: string]: {
        lessonsCount: { [itemName: string]: number[] };
      };
    } = {};

    // Обходим полученные данные
    for (const item of data_) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      // Формируем строку, представляющую комбинацию года, месяца и дня
      const dateKey = `${item.year}-${item.month}-${item.day}`;

      // Если такой комбинации еще нет в объекте, добавляем ее и инициализируем значение lessonsCount
      if (!combinedData[dateKey]) {
        combinedData[dateKey] = {
          lessonsCount: {},
        };
      }

      // Если itemName еще не добавлен в объект lessonsCount, добавляем его с пустым массивом
      if (!combinedData[dateKey].lessonsCount[item.itemName]) {
        combinedData[dateKey].lessonsCount[item.itemName] = [];
      }

      // Добавляем значение lessonsCount в массив для соответствующего itemName
      combinedData[dateKey].lessonsCount[item.itemName].push(item.lessonsCount);
    }

    // Преобразуем объединенные данные в массив объектов
    const combinedDataArray = Object.keys(combinedData).map((dateKey) => ({
      date: new Date(dateKey),
      lessonsCount: combinedData[dateKey].lessonsCount,
    }));

    if (combinedDataArray.length === 0) {
      console.log("No data found for the given date range and subject IDs.");
      return;
    }

    const labels = combinedDataArray.map((item) =>
      formatDate(item.date, startDate, endDate)
    );

    const uniqueItemNames = [...new Set(data_.map((item) => item.itemName))];

    const datasets = uniqueItemNames.map((itemName) => ({
      label: itemName,
      data: combinedDataArray.map(
        (item) => item.lessonsCount[itemName]?.reduce((a, b) => a + b, 0) || 0
      ),
      fill: false,
      backgroundColor: hashToColor(hashString(itemName)),
      borderColor: hashToColor(hashString(itemName)),
    }));

    console.log(labels, datasets);

    if (labels.length === 0 || datasets.length === 0) {
      console.log("No data available for the chart.");
      return;
    }

    io.emit("getStudentLessonsData", { labels, datasets });
    return { labels, datasets };
  } catch (error) {
    console.error("Error fetching student lessons data:", error);
  }
}

// Функция для получения данных для графика "Заказчики-Финансы"
export async function getClientFinanceData(data: {
  startDate: Date;
  endDate: Date;
  token: string;
}) {
  const { startDate, endDate, token } = data;
  try {
    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    if (!token_) {
      console.error("Invalid token");
      return;
    }

    const userId = token_.userId;

    const whereClause = {
      userId: userId,
      clientId: {
        not: null,
      },
      isArchived: false,
    };

    const data_ = await db.studentSchedule.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        workPrice: true,
        day: true,
        month: true,
        year: true,
        itemName: true,
        clientId: true,
      },
    });

    // Создадим объект, где ключом будет clientId
    const combinedData: {
      [clientId: string]: {
        workPrice: number;
      };
    } = {};

    // Обходим полученные данные
    for (const item of data_) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      // Если clientId еще нет в объекте, добавляем его и инициализируем значение workPrice
      if (!combinedData[item.clientId]) {
        combinedData[item.clientId] = {
          workPrice: 0,
        };
      }

      // Увеличиваем значение workPrice для соответствующего clientId
      combinedData[item.clientId].workPrice += item.workPrice;
    }

    // Преобразуем объединенные данные в массив объектов
    const combinedDataArray = Object.keys(combinedData).map((clientId) => ({
      clientId,
      workPrice: combinedData[clientId].workPrice,
    }));

    if (combinedDataArray.length === 0) {
      console.log("No data found for the given date range.");
      return;
    }

    const labels = combinedDataArray.map((item) => `Client ${item.clientId}`);
    const datasets = [
      {
        label: "Work Price",
        data: combinedDataArray.map((item) => item.workPrice),
        fill: false,
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: "rgba(75,192,192,1)",
      },
    ];

    console.log(labels, datasets);

    if (labels.length === 0 || datasets.length === 0) {
      console.log("No data available for the chart.");
      return;
    }

    io.emit("getClientFinanceData", { labels, datasets });
    return { labels, datasets };
  } catch (error) {
    console.error("Error fetching client finance data:", error);
  }
}

// Функция для получения данных для графика "Заказчики-Количество"
export async function getClientCountData(data: {
  startDate: Date;
  endDate: Date;
  token: string;
}) {
  const { startDate, endDate, token } = data;
  try {
    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    if (!token_) {
      console.error("Invalid token");
      return;
    }

    const userId = token_.userId;

    const whereClause = {
      userId: userId,
      clientId: {
        not: null,
      },
      isArchived: false,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const data_ = await db.studentSchedule.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        workCount: true,
        day: true,
        month: true,
        year: true,
        clientId: true,
      },
    });

    // Создадим объект, где ключом будет clientId
    const combinedData: {
      [clientId: string]: {
        workCount: number;
      };
    } = {};

    // Обходим полученные данные
    for (const item of data_) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      // Если clientId еще нет в объекте, добавляем его и инициализируем значение workCount
      if (!combinedData[item.clientId]) {
        combinedData[item.clientId] = {
          workCount: 0,
        };
      }

      // Увеличиваем значение workCount для соответствующего clientId
      combinedData[item.clientId].workCount += item.workCount;
    }

    // Преобразуем объединенные данные в массив объектов
    const combinedDataArray = Object.keys(combinedData).map((clientId) => ({
      clientId,
      workCount: combinedData[clientId].workCount,
    }));

    if (combinedDataArray.length === 0) {
      console.log("No data found for the given date range.");
      return;
    }

    const labels = combinedDataArray.map((item) => `Client ${item.clientId}`);
    const datasets = [
      {
        label: "Work Count",
        data: combinedDataArray.map((item) => item.workCount),
        fill: false,
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: "rgba(75,192,192,1)",
      },
    ];

    console.log(labels, datasets);

    if (labels.length === 0 || datasets.length === 0) {
      console.log("No data available for the chart.");
      return;
    }

    io.emit("getClientCountData", { labels, datasets });
    return { labels, datasets };
  } catch (error) {
    console.error("Error fetching client count data:", error);
  }
}

// Функция для получения данных для графика "Заказчики-Работы"
export async function getClientWorksData(data: {
  startDate: Date;
  endDate: Date;
  token: string;
}) {
  const { startDate, endDate, token } = data;
  try {
    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    if (!token_) {
      console.error("Invalid token");
      return;
    }

    const userId = token_.userId;

    const whereClause = {
      userId: userId,
      clientId: {
        not: null,
      },
      isArchived: false,
    };

    const data_ = await db.studentSchedule.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        itemName: true,
        studentName: true,
        day: true,
        month: true,
        year: true,
        clientId: true,
      },
    });

    // Создадим объект, где ключом будет комбинация clientId и itemName
    const combinedData: {
      [key: string]: {
        studentNames: string[];
      };
    } = {};

    // Обходим полученные данные
    for (const item of data_) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      const key = `${item.clientId}-${item.itemName}`;

      // Если такая комбинация еще нет в объекте, добавляем ее и инициализируем массив studentNames
      if (!combinedData[key]) {
        combinedData[key] = {
          studentNames: [],
        };
      }

      // Добавляем studentName в массив studentNames для соответствующей комбинации clientId и itemName
      combinedData[key].studentNames.push(item.studentName);
    }

    // Преобразуем объединенные данные в массив объектов
    const combinedDataArray = Object.keys(combinedData).map((key) => ({
      clientId: key.split("-")[0],
      itemName: key.split("-")[1],
      studentNames: combinedData[key].studentNames,
    }));

    if (combinedDataArray.length === 0) {
      console.log("No data found for the given date range.");
      return;
    }

    const labels = Array.from(
      new Set(combinedDataArray.map((item) => `Client ${item.clientId}`))
    );
    const datasets = Array.from(
      new Set(combinedDataArray.map((item) => item.itemName))
    ).map((itemName) => ({
      label: itemName,
      data: labels.map((label) => {
        const clientId = label.split(" ")[1];
        const data = combinedDataArray.find(
          (item) => item.clientId === clientId && item.itemName === itemName
        );
        return data ? data.studentNames.length : 0;
      }),
      fill: false,
      backgroundColor: hashToColor(hashString(itemName)),
      borderColor: hashToColor(hashString(itemName)),
    }));

    console.log(labels, datasets);

    if (labels.length === 0 || datasets.length === 0) {
      console.log("No data available for the chart.");
      return;
    }

    io.emit("getClientWorksData", { labels, datasets });
    return { labels, datasets };
  } catch (error) {
    console.error("Error fetching client works data:", error);
  }
}

// Функция для получения данных для графика "Ученики - Заказчики сравнительный график"
export async function getStudentClientComparisonData(data: {
  startDate: Date;
  endDate: Date;
  token: string;
}) {
  const { startDate, endDate, token } = data;
  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });

  if (!token_) {
    console.error("Invalid token");
    return;
  }

  const userId = token_.userId;

  try {
    const studentData = await db.studentSchedule.findMany({
      where: {
        clientId: null,
        isArchived: false,
        userId: userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        lessonsCount: true,
        lessonsPrice: true,
        day: true,
        month: true,
        year: true,
        itemName: true,
      },
    });

    const clientData = await db.studentSchedule.findMany({
      where: {
        clientId: {
          not: null,
        },
        userId: userId,
        isArchived: false,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        workCount: true,
        workPrice: true,
        lessonsCount: true,
        lessonsPrice: true,
        day: true,
        month: true,
        year: true,
        itemName: true,
      },
    });

    const combinedData = [...studentData, ...clientData];

    // Создадим объект, где ключом будет комбинация года, месяца и дня
    const groupedData: {
      [date: string]: {
        studentData: {
          lessonsCount: number;
          lessonsPrice: number;
          itemName: string;
        }[];
        clientData: {
          workCount: number;
          workPrice: number;
          itemName: string;
        }[];
      };
    } = {};

    // Обходим полученные данные
    for (const item of combinedData) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      // Формируем строку, представляющую комбинацию года, месяца и дня
      const dateKey = `${item.year}-${item.month}-${item.day}`;

      // Если такой комбинации еще нет в объекте, добавляем ее и инициализируем значения
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          studentData: [],
          clientData: [],
        };
      }

      // Обновляем значения для студентов и клиентов
      if (item.clientId === null) {
        groupedData[dateKey].studentData.push({
          lessonsCount: item.lessonsCount || 0,
          lessonsPrice: item.lessonsPrice || 0,
          itemName: item.itemName,
        });
      } else {
        groupedData[dateKey].clientData.push({
          workCount: item.workCount || 0,
          workPrice: item.workPrice || 0,
          itemName: item.itemName,
        });
      }
    }

    // Удалим все записи с нулевыми значениями
    const nonZeroData = Object.entries(groupedData).filter(
      ([_, value]) =>
        value.studentData.length > 0 || value.clientData.length > 0
    );

    if (nonZeroData.length === 0) {
      console.log("No non-zero data available for the chart.");
      return;
    }

    // Преобразуем объединенные данные в массивы
    const labels = nonZeroData.map(([dateKey]) =>
      formatDate(new Date(dateKey), startDate, endDate)
    );

    const datasets = [
      {
        label: "Ученики",
        data: labels.map((_, index) => {
          const [dateKey, value] = nonZeroData[index];
          const lessonsCount = value.studentData.reduce(
            (total, item) => total + item.lessonsCount,
            0
          );
          return isNaN(lessonsCount) || lessonsCount === null
            ? 0
            : lessonsCount;
        }),
        fill: false,
        backgroundColor: "rgba(75, 192, 192, 0.4)",
        borderColor: "rgba(75, 192, 192, 1)",
      },
      {
        label: "Заказчики",
        data: labels.map((_, index) => {
          const [dateKey, value] = nonZeroData[index];
          const workCount = value.clientData.reduce(
            (total, item) => total + item.workCount,
            0
          );
          return isNaN(workCount) || workCount === null ? 0 : workCount;
        }),
        fill: false,
        backgroundColor: "rgba(255, 99, 132, 0.4)",
        borderColor: "rgba(255, 99, 132, 1)",
      },
    ];

    console.log(labels, datasets);

    io.emit("getStudentClientComparisonData", { labels, datasets });
    return { labels, datasets };
  } catch (error) {
    console.error("Error fetching student-client comparison data:", error);
  }
}

export async function getAllItemsIdsAndNames(token: string) {
  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });

  const userId = token_.userId;

  try {
    const items = await db.item.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        itemName: true,
      },
    });

    io.emit("getAllItemsIdsAndNames", items);
    return items;
  } catch (error) {
    console.error("Error fetching items:", error);
  }
}
