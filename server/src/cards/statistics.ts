import { IStudentCardResponse, ITimeLine, IItemCard } from "../types";
import db from "../db";
import io from "../socket";
import { differenceInDays, addDays, getDay } from "date-fns";

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

// Вспомогательные функции для группировки данных по дням, месяцам и годам
const groupByDay = (data: any[]) => {
  const grouped: { [key: string]: any[] } = {};
  for (const item of data) {
    const day = new Date(
      item.year,
      item.month - 1,
      item.day
    ).toLocaleDateString();
    if (!grouped[day]) {
      grouped[day] = [];
    }
    grouped[day].push(item);
  }
  return grouped;
};

const groupByMonth = (data: any[]) => {
  const grouped: { [key: string]: any[] } = {};
  for (const item of data) {
    const month = new Date(item.year, item.month - 1, item.day).toLocaleString(
      "default",
      { month: "long", year: "numeric" }
    );
    if (!grouped[month]) {
      grouped[month] = [];
    }
    grouped[month].push(item);
  }
  return grouped;
};

const groupByYear = (data: any[]) => {
  const grouped: { [key: string]: any[] } = {};
  for (const item of data) {
    const year = new Date(item.year, item.month - 1, item.day)
      .getFullYear()
      .toString();
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(item);
  }
  return grouped;
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

    const userId = token_.userId;

    const data = await db.studentSchedule.findMany({
      where: {
        year: {
          gte: startDate.getFullYear().toString(),
          lte: endDate.getFullYear().toString(),
        },
        month: {
          gte: (startDate.getMonth() + 1).toString().padStart(2, "0"),
          lte: (endDate.getMonth() + 1).toString().padStart(2, "0"),
        },
        day: {
          gte: startDate.getDate().toString().padStart(2, "0"),
          lte: endDate.getDate().toString().padStart(2, "0"),
        },
        itemId: {
          in: subjectIds.map((id) => id),
        },
        userId: userId,
      },
      select: {
        createdAt: true,
        lessonsPrice: true,
        itemName: true,
        day: true,
        month: true,
        year: true,
      },
    });

    const grouped = groupByMonth(data);
    const labels = Object.keys(grouped);
    const datasets = Object.values(grouped).map((group) => {
      const itemName = group[0].itemName; // Предполагается, что все элементы в группе имеют одинаковое itemName
      const values = group.map((item) => item.lessonsPrice);
      return {
        label: itemName,
        data: values,
        fill: false,
        backgroundColor: hashToColor(hashString(itemName)),
        borderColor: hashToColor(hashString(itemName)),
      };
    });

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

    const userId = token_.userId;

    const data = await db.studentSchedule.findMany({
      where: {
        userId: userId,
        year: {
          gte: startDate.getFullYear().toString(),
          lte: endDate.getFullYear().toString(),
        },
        month: {
          gte: (startDate.getMonth() + 1).toString().padStart(2, "0"),
          lte: (endDate.getMonth() + 1).toString().padStart(2, "0"),
        },
        day: {
          gte: startDate.getDate().toString().padStart(2, "0"),
          lte: endDate.getDate().toString().padStart(2, "0"),
        },
        itemId: {
          in: subjectIds.map((id) => id),
        },
      },
      select: {
        createdAt: true,
        lessonsCount: true,
        day: true,
        month: true,
        year: true,
        itemName: true,
      },
    });

    const grouped = groupByMonth(data);
    const labels = Object.keys(grouped);
    const datasets = Object.values(grouped).map((group) => {
      const itemName = group[0].itemName;
      const hash = hashString(itemName);
      const color = hashToColor(hash);
      const values = group.map((item) => item.lessonsCount);
      return {
        label: itemName,
        data: values,
        fill: false,
        backgroundColor: color,
        borderColor: color,
      };
    });

    io.emit("getStudentCountData", { labels, datasets });
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

    const userId = token_.userId;

    const data = await db.studentSchedule.findMany({
      where: {
        year: {
          gte: startDate.getFullYear().toString(),
          lte: endDate.getFullYear().toString(),
        },
        month: {
          gte: (startDate.getMonth() + 1).toString().padStart(2, "0"),
          lte: (endDate.getMonth() + 1).toString().padStart(2, "0"),
        },
        day: {
          gte: startDate.getDate().toString().padStart(2, "0"),
          lte: endDate.getDate().toString().padStart(2, "0"),
        },
        itemId: {
          in: subjectIds.map((id) => id),
        },
        userId: userId,
      },
      select: {
        createdAt: true,
        lessonsCount: true,
        day: true,
        month: true,
        year: true,
        lessonsPrice: true,
        itemName: true,
      },
    });

    const grouped = groupByMonth(data);
    const labels = Object.keys(grouped);
    const datasets = Object.values(grouped).map((group) => {
      const itemName = group[0].itemName;
      const hash = hashString(itemName);
      const color = hashToColor(hash);
      const values = group.map((item) => item.lessonsCount);
      return {
        label: itemName,
        data: values,
        fill: false,
        backgroundColor: color,
        borderColor: color,
      };
    });

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

    const userId = token_.userId;

    const data = await db.studentSchedule.findMany({
      where: {
        year: {
          gte: startDate.getFullYear().toString(),
          lte: endDate.getFullYear().toString(),
        },
        month: {
          gte: (startDate.getMonth() + 1).toString().padStart(2, "0"),
          lte: (endDate.getMonth() + 1).toString().padStart(2, "0"),
        },
        day: {
          gte: startDate.getDate().toString().padStart(2, "0"),
          lte: endDate.getDate().toString().padStart(2, "0"),
        },
        userId: userId,
        clientId: {
          not: null,
        },
        isArchived: false,
      },
      select: {
        createdAt: true,
        workPrice: true,
        day: true,
        month: true,
        year: true,
        lessonsPrice: true,
        itemName: true,
      },
    });

    const grouped = groupByMonth(data);
    const labels = Object.keys(grouped);
    const datasets = Object.values(grouped).map((group) => {
      const itemName = group[0].itemName;
      const hash = hashString(itemName);
      const color = hashToColor(hash);
      const values = group.map((item) => item.workPrice);
      return {
        label: itemName,
        data: values,
        fill: false,
        backgroundColor: color,
        borderColor: color,
      };
    });

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

    const userId = token_.userId;

    const data = await db.studentSchedule.findMany({
      where: {
        year: {
          gte: startDate.getFullYear().toString(),
          lte: endDate.getFullYear().toString(),
        },
        month: {
          gte: (startDate.getMonth() + 1).toString().padStart(2, "0"),
          lte: (endDate.getMonth() + 1).toString().padStart(2, "0"),
        },
        day: {
          gte: startDate.getDate().toString().padStart(2, "0"),
          lte: endDate.getDate().toString().padStart(2, "0"),
        },
        userId: userId,
        clientId: {
          not: null,
        },
        isArchived: false,
      },
      select: {
        createdAt: true,
        workCount: true,
        day: true,
        month: true,
        year: true,
        lessonsPrice: true,
        itemName: true,
      },
    });

    const grouped = groupByMonth(data);
    const labels = Object.keys(grouped);
    const datasets = Object.values(grouped).map((group) => {
      const itemName = group[0].itemName;
      const hash = hashString(itemName);
      const color = hashToColor(hash);
      const values = group.map((item) => item.workCount);
      return {
        label: itemName,
        data: values,
        fill: false,
        backgroundColor: color,
        borderColor: color,
      };
    });

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
    const token_ = await db.token.findFirst({ where: { token } });

    const userId = token_.userId;

    const data = await db.studentSchedule.findMany({
      where: {
        year: {
          gte: startDate.getFullYear().toString(),
          lte: endDate.getFullYear().toString(),
        },
        month: {
          gte: (startDate.getMonth() + 1).toString().padStart(2, "0"),
          lte: (endDate.getMonth() + 1).toString().padStart(2, "0"),
        },
        day: {
          gte: startDate.getDate().toString().padStart(2, "0"),
          lte: endDate.getDate().toString().padStart(2, "0"),
        },
        clientId: {
          not: null,
        },
        userId: userId,
        isArchived: false,
      },
      select: {
        createdAt: true,
        itemName: true,
        studentName: true,
        day: true,
        month: true,
        year: true,
        lessonsPrice: true,
      },
    });

    const grouped = groupByMonth(data);
    const labels = Object.keys(grouped);
    const datasets = Object.values(grouped).map((group) => {
      const itemName = group[0].itemName;
      const hash = hashString(itemName);
      const color = hashToColor(hash);
      const values = group.map((item) => item.workCount);
      return {
        label: itemName,
        data: values,
        fill: false,
        backgroundColor: color,
        borderColor: color,
      };
    });

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

  const userId = token_.userId;

  try {
    const studentData = await db.studentSchedule.findMany({
      where: {
        year: {
          gte: startDate.getFullYear().toString(),
          lte: endDate.getFullYear().toString(),
        },
        month: {
          gte: (startDate.getMonth() + 1).toString().padStart(2, "0"),
          lte: (endDate.getMonth() + 1).toString().padStart(2, "0"),
        },
        day: {
          gte: startDate.getDate().toString().padStart(2, "0"),
          lte: endDate.getDate().toString().padStart(2, "0"),
        },
        clientId: null,
        isArchived: false,
        userId: userId,
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
        year: {
          gte: startDate.getFullYear().toString(),
          lte: endDate.getFullYear().toString(),
        },
        month: {
          gte: (startDate.getMonth() + 1).toString().padStart(2, "0"),
          lte: (endDate.getMonth() + 1).toString().padStart(2, "0"),
        },
        day: {
          gte: startDate.getDate().toString().padStart(2, "0"),
          lte: endDate.getDate().toString().padStart(2, "0"),
        },
        clientId: {
          not: null,
        },
        userId: userId,
        isArchived: false,
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

    const grouped = groupByMonth([...studentData, ...clientData]);
    const labels = Object.keys(grouped);

    const studentValues = Object.values(grouped).map((group) => {
      const studentGroup = group.filter((item) => item.clientId === null);
      const lessonsCount = studentGroup.reduce(
        (total, item) => total + item.lessonsCount,
        0
      );
      const lessonsPrice = studentGroup.reduce(
        (total, item) => total + item.lessonsPrice,
        0
      );
      return { lessonsCount, lessonsPrice };
    });

    const clientValues = Object.values(grouped).map((group) => {
      const clientGroup = group.filter((item) => item.clientId !== null);
      const workCount = clientGroup.reduce(
        (total, item) => total + item.workCount,
        0
      );
      const workPrice = clientGroup.reduce(
        (total, item) => total + item.workPrice,
        0
      );
      return { workCount, workPrice };
    });

    return { labels, studentValues, clientValues };
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
