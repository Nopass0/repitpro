import {
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  isWithinInterval,
  format,
  parse,
} from "date-fns";
import { ru } from "date-fns/locale";
import db from "../db";

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const hashToColor = (hash: number): string => {
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

const formatDate = (date: Date, startDate: Date, endDate: Date): string => {
  const dayDiff = differenceInDays(endDate, startDate);
  const monthDiff = differenceInMonths(endDate, startDate);
  const yearDiff = differenceInYears(endDate, startDate);

  if (yearDiff > 0 || monthDiff > 11) {
    return format(date, "yyyy", { locale: ru });
  } else if (monthDiff > 0) {
    return format(date, "LLL", { locale: ru });
  } else {
    return format(date, "d", { locale: ru });
  }
};

const parseDateFromSchedule = (
  day: string,
  month: string,
  year: string
): Date => {
  return new Date(Number(year), Number(month) - 1, Number(day));
};

const getUserId = async (token: string): Promise<string> => {
  const tokenRecord = await db.token.findFirst({
    where: { token },
  });

  if (!tokenRecord) {
    throw new Error("Invalid token");
  }

  return tokenRecord.userId;
};

export async function getStudentFinanceData(
  data: {
    startDate: Date;
    endDate: Date;
    subjectIds: string[];
    token: string;
  },
  socket: any
) {
  let { startDate, endDate, subjectIds, token } = data;
  startDate = new Date(startDate);
  endDate = new Date(endDate);

  try {
    const userId = await getUserId(token);

    const whereClause = {
      userId: userId,
      ...(subjectIds.length > 0 && {
        itemId: { in: subjectIds },
      }),
    };

    const schedules = await db.studentSchedule.findMany({
      where: whereClause,
      select: {
        lessonsPrice: true,
        lessonsCount: true,
        itemName: true,
        day: true,
        month: true,
        year: true,
      },
    });

    const groupedData: { [key: string]: { [key: string]: number } } = {};

    for (const item of schedules) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      const dateKey = formatDate(itemDate, startDate, endDate);

      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {};
      }

      if (!groupedData[dateKey][item.itemName]) {
        groupedData[dateKey][item.itemName] = 0;
      }

      groupedData[dateKey][item.itemName] += item.lessonsPrice;
    }

    const labels = Object.keys(groupedData);
    const uniqueItemNames = [
      ...new Set(schedules.map((item) => item.itemName)),
    ];

    const datasets = uniqueItemNames.map((itemName) => ({
      label: itemName,
      data: labels.map((date) => groupedData[date][itemName] || 0),
      backgroundColor: hashToColor(hashString(itemName)),
      borderColor: hashToColor(hashString(itemName)),
    }));

    const maxValue = Math.max(...datasets.flatMap((dataset) => dataset.data));

    socket.emit("getStudentFinanceData", { labels, datasets, maxValue });
  } catch (error) {
    console.error("Error fetching student finance data:", error);
    socket.emit("error", { message: "Failed to fetch student finance data" });
  }
}

// export async function getStudentCountData(
//   data: {
//     startDate: Date;
//     endDate: Date;
//     subjectIds: string[];
//     token: string;
//   },
//   socket: any
// ) {
//   let { startDate, endDate, token } = data;
//   startDate = new Date(startDate);
//   endDate = new Date(endDate);

//   try {
//     const userId = await getUserId(token);

//     const students = await db.student.findMany({
//       where: {
//         userId: userId,
//         createdAt: {
//           gte: startDate,
//           lte: endDate,
//         },
//       },
//       orderBy: {
//         createdAt: "asc",
//       },
//     });

//     const groupedData: { [key: string]: number } = {};

//     for (const student of students) {
//       const dateKey = formatDate(student.createdAt, startDate, endDate);
//       groupedData[dateKey] = (groupedData[dateKey] || 0) + 1;
//     }

//     const labels = Object.keys(groupedData);
//     const data = Object.values(groupedData);

//     const datasets = [
//       {
//         label: "Количество учеников",
//         data: data,
//         backgroundColor: hashToColor(hashString("students")),
//         borderColor: hashToColor(hashString("students")),
//       },
//     ];

//     const maxValue = Math.max(...data);

//     socket.emit("getStudentCountData", { labels, datasets, maxValue });
//   } catch (error) {
//     console.error("Error fetching student count data:", error);
//     socket.emit("error", { message: "Failed to fetch student count data" });
//   }
// }

// import { differenceInDays, differenceInMonths, differenceInYears, parse, format } from 'date-fns';
// import { ru } from 'date-fns/locale';

// const formatDate = (date: Date, startDate: Date, endDate: Date): string => {
//   const dayDiff = differenceInDays(endDate, startDate);
//   const monthDiff = differenceInMonths(endDate, startDate);
//   const yearDiff = differenceInYears(endDate, startDate);

//   if (yearDiff > 0 || monthDiff > 11) {
//     return format(date, 'yyyy', { locale: ru });
//   } else if (monthDiff > 0) {
//     return format(date, 'LLL', { locale: ru });
//   } else {
//     return format(date, 'd', { locale: ru });
//   }
// };

export async function getStudentCountData(
  data: {
    startDate: Date;
    endDate: Date;
    subjectIds: string[];
    token: string;
  },
  socket: any
) {
  let { startDate, endDate, subjectIds, token } = data;
  startDate = new Date(startDate);
  endDate = new Date(endDate);

  try {
    const userId = await getUserId(token);

    console.log("Fetching data for userId:", userId);
    console.log("Date range:", startDate, "to", endDate);
    console.log("Subject IDs:", subjectIds);

    const schedules = await db.studentSchedule.findMany({
      where: {
        userId: userId,
        isArchived: false,
        isCancel: false,
        itemId: {
          in: subjectIds,
        },
        year: {
          gte: startDate.getFullYear().toString(),
          lte: endDate.getFullYear().toString(),
        },
        month: {
          gte: (startDate.getMonth() + 1).toString(),
          lte: (endDate.getMonth() + 1).toString(),
        },
        day: {
          gte: startDate.getDate().toString(),
          lte: endDate.getDate().toString(),
        },
      },
      select: {
        day: true,
        month: true,
        year: true,
        itemName: true,
      },
    });

    console.log("Fetched schedules count:", schedules.length);

    const groupedData: { [key: string]: { [itemName: string]: number } } = {};

    for (const schedule of schedules) {
      const date = new Date(
        parseInt(schedule.year),
        parseInt(schedule.month) - 1,
        parseInt(schedule.day)
      );
      const dateKey = formatDate(date, startDate, endDate);

      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {};
      }

      if (!groupedData[dateKey][schedule.itemName]) {
        groupedData[dateKey][schedule.itemName] = 0;
      }

      groupedData[dateKey][schedule.itemName]++;
    }

    console.log("Grouped data:", groupedData);

    const labels = Object.keys(groupedData).sort((a, b) => {
      const dateA = parse(a, "d LLL yyyy", new Date(), { locale: ru });
      const dateB = parse(b, "d LLL yyyy", new Date(), { locale: ru });
      return dateA.getTime() - dateB.getTime();
    });
    const uniqueItemNames = [
      ...new Set(schedules.map((schedule) => schedule.itemName)),
    ];

    console.log("Unique item names:", uniqueItemNames);

    const datasets = uniqueItemNames.map((itemName) => ({
      label: itemName,
      data: labels.map((date) => groupedData[date][itemName] || 0),
      backgroundColor: hashToColor(hashString(itemName)),
      borderColor: hashToColor(hashString(itemName)),
    }));

    const maxValue = Math.max(...datasets.flatMap((dataset) => dataset.data));

    console.log("Prepared datasets:", datasets);
    console.log("Max value:", maxValue);

    socket.emit("getStudentCountData", { labels, datasets, maxValue });
  } catch (error) {
    console.error("Error fetching student count data:", error);
    socket.emit("error", { message: "Failed to fetch student count data" });
  }
}

export async function getStudentLessonsData(
  data: {
    startDate: Date;
    endDate: Date;
    subjectIds: string[];
    token: string;
  },
  socket: any
) {
  let { startDate, endDate, subjectIds, token } = data;
  startDate = new Date(startDate);
  endDate = new Date(endDate);

  try {
    const userId = await getUserId(token);

    const whereClause = {
      userId: userId,
      ...(subjectIds.length > 0 && {
        itemId: { in: subjectIds },
      }),
    };

    const schedules = await db.studentSchedule.findMany({
      where: whereClause,
      select: {
        lessonsCount: true,
        itemName: true,
        day: true,
        month: true,
        year: true,
      },
    });

    const groupedData: { [key: string]: { [key: string]: number } } = {};

    for (const item of schedules) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      const dateKey = formatDate(itemDate, startDate, endDate);

      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {};
      }

      if (!groupedData[dateKey][item.itemName]) {
        groupedData[dateKey][item.itemName] = 0;
      }

      groupedData[dateKey][item.itemName] += item.lessonsCount;
    }

    const labels = Object.keys(groupedData);
    const uniqueItemNames = [
      ...new Set(schedules.map((item) => item.itemName)),
    ];

    const datasets = uniqueItemNames.map((itemName) => ({
      label: itemName,
      data: labels.map((date) => groupedData[date][itemName] || 0),
      backgroundColor: hashToColor(hashString(itemName)),
      borderColor: hashToColor(hashString(itemName)),
    }));

    const maxValue = Math.max(...datasets.flatMap((dataset) => dataset.data));

    socket.emit("getStudentLessonsData", { labels, datasets, maxValue });
  } catch (error) {
    console.error("Error fetching student lessons data:", error);
    socket.emit("error", { message: "Failed to fetch student lessons data" });
  }
}

export async function getClientFinanceData(
  data: {
    startDate: Date;
    endDate: Date;
    token: string;
  },
  socket: any
) {
  let { startDate, endDate, token } = data;
  startDate = new Date(startDate);
  endDate = new Date(endDate);

  try {
    const userId = await getUserId(token);

    const whereClause = {
      userId: userId,
      clientId: {
        not: null,
      },
      isArchived: false,
    };

    const schedules = await db.studentSchedule.findMany({
      where: whereClause,
      select: {
        workPrice: true,
        day: true,
        month: true,
        year: true,
        itemName: true,
        clientId: true,
      },
    });

    const groupedData: { [key: string]: { [key: string]: number } } = {};

    for (const item of schedules) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      const dateKey = formatDate(itemDate, startDate, endDate);

      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {};
      }

      if (!groupedData[dateKey][item.itemName]) {
        groupedData[dateKey][item.itemName] = 0;
      }

      groupedData[dateKey][item.itemName] += item.workPrice;
    }

    const labels = Object.keys(groupedData);
    const uniqueItemNames = [
      ...new Set(schedules.map((item) => item.itemName)),
    ];

    const datasets = uniqueItemNames.map((itemName) => ({
      label: itemName,
      data: labels.map((date) => groupedData[date][itemName] || 0),
      backgroundColor: hashToColor(hashString(itemName)),
      borderColor: hashToColor(hashString(itemName)),
    }));

    const maxValue = Math.max(...datasets.flatMap((dataset) => dataset.data));

    socket.emit("getClientFinanceData", { labels, datasets, maxValue });
  } catch (error) {
    console.error("Error fetching client finance data:", error);
    socket.emit("error", { message: "Failed to fetch client finance data" });
  }
}

export async function getClientCountData(
  data: {
    startDate: Date;
    endDate: Date;
    token: string;
  },
  socket: any
) {
  let { startDate, endDate, token } = data;
  startDate = new Date(startDate);
  endDate = new Date(endDate);

  try {
    const userId = await getUserId(token);

    const clients = await db.client.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const groupedData: { [key: string]: number } = {};

    for (const client of clients) {
      const dateKey = formatDate(client.createdAt, startDate, endDate);
      groupedData[dateKey] = (groupedData[dateKey] || 0) + 1;
    }

    const labels = Object.keys(groupedData);
    const data = Object.values(groupedData);

    const datasets = [
      {
        label: "Количество заказчиков",
        data: data,
        backgroundColor: hashToColor(hashString("clients")),
        borderColor: hashToColor(hashString("clients")),
      },
    ];

    const maxValue = Math.max(...data);

    socket.emit("getClientCountData", { labels, datasets, maxValue });
  } catch (error) {
    console.error("Error fetching client count data:", error);
    socket.emit("error", { message: "Failed to fetch client count data" });
  }
}

export async function getClientWorksData(
  data: {
    startDate: Date;
    endDate: Date;
    token: string;
  },
  socket: any
) {
  let { startDate, endDate, token } = data;
  startDate = new Date(startDate);
  endDate = new Date(endDate);

  try {
    const userId = await getUserId(token);

    const whereClause = {
      userId: userId,
      clientId: {
        not: null,
      },
      isArchived: false,
    };

    const schedules = await db.studentSchedule.findMany({
      where: whereClause,
      select: {
        workCount: true,
        day: true,
        month: true,
        year: true,
        itemName: true,
      },
    });

    const groupedData: { [key: string]: { [key: string]: number } } = {};

    for (const item of schedules) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      const dateKey = formatDate(itemDate, startDate, endDate);

      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {};
      }

      if (!groupedData[dateKey][item.itemName]) {
        groupedData[dateKey][item.itemName] = 0;
      }

      groupedData[dateKey][item.itemName] += item.workCount;
    }

    const labels = Object.keys(groupedData);
    const uniqueItemNames = [
      ...new Set(schedules.map((item) => item.itemName)),
    ];

    const datasets = uniqueItemNames.map((itemName) => ({
      label: itemName,
      data: labels.map((date) => groupedData[dateKey][item.itemName] || 0),
      backgroundColor: hashToColor(hashString(itemName)),
      borderColor: hashToColor(hashString(itemName)),
    }));

    const maxValue = Math.max(...datasets.flatMap((dataset) => dataset.data));

    socket.emit("getClientWorksData", { labels, datasets, maxValue });
  } catch (error) {
    console.error("Error fetching client works data:", error);
    socket.emit("error", { message: "Failed to fetch client works data" });
  }
}

export async function getStudentClientComparisonData(
  data: {
    startDate: Date;
    endDate: Date;
    token: string;
  },
  socket: any
) {
  let { startDate, endDate, token } = data;
  startDate = new Date(startDate);
  endDate = new Date(endDate);

  try {
    const userId = await getUserId(token);

    const studentData = await db.studentSchedule.findMany({
      where: {
        userId: userId,
        clientId: null,
        isArchived: false,
      },
      select: {
        lessonsCount: true,
        day: true,
        month: true,
        year: true,
      },
    });

    const clientData = await db.studentSchedule.findMany({
      where: {
        userId: userId,
        clientId: {
          not: null,
        },
        isArchived: false,
      },
      select: {
        workCount: true,
        day: true,
        month: true,
        year: true,
      },
    });

    const groupedData: {
      [key: string]: { students: number; clients: number };
    } = {};

    for (const item of [...studentData, ...clientData]) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      const dateKey = formatDate(itemDate, startDate, endDate);

      if (!groupedData[dateKey]) {
        groupedData[dateKey] = { students: 0, clients: 0 };
      }

      if ("lessonsCount" in item) {
        groupedData[dateKey].students += item.lessonsCount;
      } else if ("workCount" in item) {
        groupedData[dateKey].clients += item.workCount;
      }
    }

    const labels = Object.keys(groupedData);
    const datasets = [
      {
        label: "Ученики",
        data: labels.map((date) => groupedData[date].students),
        backgroundColor: hashToColor(hashString("students")),
        borderColor: hashToColor(hashString("students")),
      },
      {
        label: "Заказчики",
        data: labels.map((date) => groupedData[date].clients),
        backgroundColor: hashToColor(hashString("clients")),
        borderColor: hashToColor(hashString("clients")),
      },
    ];

    const maxValue = Math.max(...datasets.flatMap((dataset) => dataset.data));

    socket.emit("getStudentClientComparisonData", {
      labels,
      datasets,
      maxValue,
    });
  } catch (error) {
    console.error("Error fetching student-client comparison data:", error);
    socket.emit("error", {
      message: "Failed to fetch student-client comparison data",
    });
  }
}

export async function getAllItemsIdsAndNames(token: string, socket: any) {
  try {
    const userId = await getUserId(token);

    const items = await db.item.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        itemName: true,
      },
    });

    const filteredItems = items.filter(
      (item) => item.itemName && item.itemName.toLowerCase() !== "void"
    );

    socket.emit("getAllItemsIdsAndNames", filteredItems);
  } catch (error) {
    console.error("Error fetching items:", error);
    socket.emit("error", { message: "Failed to fetch items" });
  }
}

export default {
  getStudentFinanceData,
  getStudentCountData,
  getStudentLessonsData,
  getClientFinanceData,
  getClientCountData,
  getClientWorksData,
  getStudentClientComparisonData,
  getAllItemsIdsAndNames,
};
