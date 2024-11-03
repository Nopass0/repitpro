import {
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  isWithinInterval,
  format,
  parse,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
} from "date-fns";
import { ru } from "date-fns/locale";
import db from "../db";

function determineGroupingInterval(startDate: Date, endDate: Date) {
  const daysDiff = differenceInDays(endDate, startDate);
  const monthsDiff = differenceInMonths(endDate, startDate);
  const yearsDiff = differenceInYears(endDate, startDate);

  if (daysDiff <= 31) {
    return {
      interval: "day",
      format: "d",
      generator: eachDayOfInterval,
    };
  } else if (monthsDiff < 24) {
    return {
      interval: "month",
      format: "LLL",
      generator: eachMonthOfInterval,
    };
  } else {
    return {
      interval: "year",
      format: "yyyy",
      generator: eachYearOfInterval,
    };
  }
}

function groupDataByInterval(
  data: any[],
  startDate: Date,
  endDate: Date,
  itemNames: string[],
) {
  const {
    interval,
    format: dateFormat,
    generator,
  } = determineGroupingInterval(startDate, endDate);

  // Generate all periods in range
  const periods = generator({ start: startDate, end: endDate });

  // Initialize grouped data with zeros
  const groupedData: { [key: string]: { [key: string]: number } } = {};
  periods.forEach((period) => {
    const periodKey = format(period, dateFormat, { locale: ru });
    groupedData[periodKey] = {};
    itemNames.forEach((itemName) => {
      groupedData[periodKey][itemName] = 0;
    });
  });

  // Group data according to interval
  data.forEach((item) => {
    const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

    if (!isWithinInterval(itemDate, { start: startDate, end: endDate })) {
      return;
    }

    let periodKey: string;
    if (interval === "day") {
      periodKey = format(itemDate, "d", { locale: ru });
    } else if (interval === "month") {
      periodKey = format(itemDate, "LLL", { locale: ru });
    } else {
      periodKey = format(itemDate, "yyyy", { locale: ru });
    }

    if (!groupedData[periodKey][item.itemName]) {
      groupedData[periodKey][item.itemName] = 0;
    }

    groupedData[periodKey][item.itemName] += item.lessonsPrice || 0;
  });

  return {
    groupedData,
    labels: periods.map((period) => format(period, dateFormat, { locale: ru })),
  };
}

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
  year: string,
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
  socket: any,
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

    // Fetch schedules and items in parallel
    const [schedules, items] = await Promise.all([
      db.studentSchedule.findMany({
        where: whereClause,
        select: {
          lessonsPrice: true,
          itemName: true,
          day: true,
          month: true,
          year: true,
        },
      }),
      db.item.findMany({
        where: {
          userId: userId,
          ...(subjectIds.length > 0 && {
            id: { in: subjectIds },
          }),
        },
        select: {
          itemName: true,
        },
      }),
    ]);

    // Get all unique item names
    const uniqueItemNames = [
      ...new Set([
        ...items.map((item) => item.itemName),
        ...schedules.map((schedule) => schedule.itemName),
      ]),
    ];

    // Group data by appropriate interval
    const { groupedData, labels } = groupDataByInterval(
      schedules,
      startDate,
      endDate,
      uniqueItemNames,
    );

    // Create datasets with continuous data for each item
    const datasets = uniqueItemNames.map((itemName) => ({
      label: itemName,
      data: labels.map((label) => groupedData[label][itemName] || 0),
      backgroundColor: hashToColor(hashString(itemName)),
      borderColor: hashToColor(hashString(itemName)),
    }));

    // Calculate max value across all datasets
    const maxValue = Math.max(...datasets.flatMap((dataset) => dataset.data));

    socket.emit("getStudentFinanceData", {
      labels,
      datasets,
      maxValue,
    });
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

// export async function getStudentCountData(
//   data: {
//     startDate: Date;
//     endDate: Date;
//     subjectIds: string[];
//     token: string;
//   },
//   socket: any
// ) {
//   let { startDate, endDate, subjectIds, token } = data;
//   startDate = new Date(startDate);
//   endDate = new Date(endDate);

//   try {
//     const userId = await getUserId(token);

//     console.log("Fetching data for userId:", userId);
//     console.log("Date range:", startDate, "to", endDate);
//     console.log("Subject IDs:", subjectIds);

//     const schedules = await db.studentSchedule.findMany({
//       where: {
//         userId: userId,
//         isArchived: false,
//         isCancel: false,
//         itemId: {
//           in: subjectIds,
//         },
//         year: {
//           gte: startDate.getFullYear().toString(),
//           lte: endDate.getFullYear().toString(),
//         },
//         month: {
//           gte: (startDate.getMonth() + 1).toString(),
//           lte: (endDate.getMonth() + 1).toString(),
//         },
//         day: {
//           gte: startDate.getDate().toString(),
//           lte: endDate.getDate().toString(),
//         },
//       },
//       select: {
//         day: true,
//         month: true,
//         year: true,
//         itemName: true,
//       },
//     });

//     console.log("Fetched schedules count:", schedules.length);

//     const groupedData: { [key: string]: { [itemName: string]: number } } = {};

//     for (const schedule of schedules) {
//       const date = new Date(
//         parseInt(schedule.year),
//         parseInt(schedule.month) - 1,
//         parseInt(schedule.day)
//       );
//       const dateKey = formatDate(date, startDate, endDate);

//       if (!groupedData[dateKey]) {
//         groupedData[dateKey] = {};
//       }

//       if (!groupedData[dateKey][schedule.itemName]) {
//         groupedData[dateKey][schedule.itemName] = 0;
//       }

//       groupedData[dateKey][schedule.itemName]++;
//     }

//     console.log("Grouped data:", groupedData);

//     const labels = Object.keys(groupedData).sort((a, b) => {
//       const dateA = parse(a, "d LLL yyyy", new Date(), { locale: ru });
//       const dateB = parse(b, "d LLL yyyy", new Date(), { locale: ru });
//       return dateA.getTime() - dateB.getTime();
//     });
//     const uniqueItemNames = [
//       ...new Set(schedules.map((schedule) => schedule.itemName)),
//     ];

//     console.log("Unique item names:", uniqueItemNames);

//     const datasets = uniqueItemNames.map((itemName) => ({
//       label: itemName,
//       data: labels.map((date) => groupedData[date][itemName] || 0),
//       backgroundColor: hashToColor(hashString(itemName)),
//       borderColor: hashToColor(hashString(itemName)),
//     }));

//     const maxValue = Math.max(...datasets.flatMap((dataset) => dataset.data));

//     console.log("Prepared datasets:", datasets);
//     console.log("Max value:", maxValue);

//     socket.emit("getStudentCountData", { labels, datasets, maxValue });
//   } catch (error) {
//     console.error("Error fetching student count data:", error);
//     socket.emit("error", { message: "Failed to fetch student count data" });
//   }
// }

export async function getStudentCountData(
  data: {
    startDate: Date;
    endDate: Date;
    subjectIds: string[];
    token: string;
  },
  socket: any,
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
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        itemName: true,
      },
    });

    console.log("Fetched schedules count:", schedules.length);

    const { groupedData, dateFormat } = groupDataByDateRange(
      schedules,
      startDate,
      endDate,
    );

    console.log("Grouped data:", groupedData);

    const labels = generateDateLabels(startDate, endDate, dateFormat);
    const uniqueItemNames = [
      ...new Set(schedules.map((schedule) => schedule.itemName)),
    ];

    console.log("Unique item names:", uniqueItemNames);

    const datasets = uniqueItemNames.map((itemName) => ({
      label: itemName,
      data: labels.map((date) => groupedData[date]?.[itemName] || 0),
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

function groupDataByDateRange(schedules, startDate, endDate) {
  const monthsDiff = differenceInMonths(endDate, startDate);
  const yearsDiff = differenceInYears(endDate, startDate);

  let dateFormat: string;
  let formatFunc: (date: Date) => string;

  if (monthsDiff < 2) {
    dateFormat = "d";
    formatFunc = (date) => format(date, "d", { locale: ru });
  } else if (yearsDiff < 2) {
    dateFormat = "LLL";
    formatFunc = (date) => format(date, "LLL", { locale: ru });
  } else {
    dateFormat = "yyyy";
    formatFunc = (date) => format(date, "yyyy", { locale: ru });
  }

  const groupedData: { [key: string]: { [itemName: string]: number } } = {};

  for (const schedule of schedules) {
    const dateKey = formatFunc(schedule.createdAt);

    if (!groupedData[dateKey]) {
      groupedData[dateKey] = {};
    }

    if (!groupedData[dateKey][schedule.itemName]) {
      groupedData[dateKey][schedule.itemName] = 0;
    }

    groupedData[dateKey][schedule.itemName]++;
  }

  return { groupedData, dateFormat };
}

function generateDateLabels(
  startDate: Date,
  endDate: Date,
  dateFormat: string,
): string[] {
  let interval;
  let formatFunc;

  if (dateFormat === "d") {
    interval = eachDayOfInterval({ start: startDate, end: endDate });
    formatFunc = (date) => format(date, "d", { locale: ru });
  } else if (dateFormat === "LLL") {
    interval = eachMonthOfInterval({ start: startDate, end: endDate });
    formatFunc = (date) => format(date, "LLL", { locale: ru });
  } else {
    interval = eachYearOfInterval({ start: startDate, end: endDate });
    formatFunc = (date) => format(date, "yyyy", { locale: ru });
  }

  return interval.map(formatFunc);
}
export async function getStudentLessonsData(
  data: {
    startDate: Date;
    endDate: Date;
    subjectIds: string[];
    token: string;
  },
  socket: any,
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

    // Fetch schedules and items in parallel
    const [schedules, items] = await Promise.all([
      db.studentSchedule.findMany({
        where: whereClause,
        select: {
          lessonsCount: true,
          itemName: true,
          day: true,
          month: true,
          year: true,
        },
      }),
      db.item.findMany({
        where: {
          userId: userId,
          ...(subjectIds.length > 0 && {
            id: { in: subjectIds },
          }),
        },
        select: {
          itemName: true,
        },
      }),
    ]);

    // Get all unique item names
    const uniqueItemNames = [
      ...new Set([
        ...items.map((item) => item.itemName),
        ...schedules.map((schedule) => schedule.itemName),
      ]),
    ];

    // Group data by appropriate interval
    const { groupedData, labels } = groupDataByInterval(
      schedules,
      startDate,
      endDate,
      uniqueItemNames,
      "lessonsCount", // указываем поле для агрегации
    );

    // Create datasets with continuous data for each item
    const datasets = uniqueItemNames.map((itemName) => ({
      label: itemName,
      data: labels.map((label) => groupedData[label][itemName] || 0),
      backgroundColor: hashToColor(hashString(itemName)),
      borderColor: hashToColor(hashString(itemName)),
    }));

    // Calculate max value across all datasets
    const maxValue = Math.max(...datasets.flatMap((dataset) => dataset.data));

    socket.emit("getStudentLessonsData", {
      labels,
      datasets,
      maxValue,
    });
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
    subjectIds: string[];
  },
  socket: any,
) {
  let { startDate, endDate, token, subjectIds } = data;
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
      ...(subjectIds.length > 0 && {
        itemId: { in: subjectIds },
      }),
    };

    // Fetch schedules and items in parallel
    const [schedules, items] = await Promise.all([
      db.studentSchedule.findMany({
        where: whereClause,
        select: {
          workPrice: true,
          day: true,
          month: true,
          year: true,
          itemName: true,
          clientId: true,
        },
      }),
      db.item.findMany({
        where: {
          userId: userId,
          ...(subjectIds.length > 0 && {
            id: { in: subjectIds },
          }),
        },
        select: {
          itemName: true,
        },
      }),
    ]);

    // Get all unique item names
    const uniqueItemNames = [
      ...new Set([
        ...items.map((item) => item.itemName),
        ...schedules.map((schedule) => schedule.itemName),
      ]),
    ];

    // Group data by appropriate interval
    const { groupedData, labels } = groupDataByInterval(
      schedules,
      startDate,
      endDate,
      uniqueItemNames,
      "workPrice", // используем workPrice для заказчиков
    );

    // Create datasets with continuous data for each item
    const datasets = uniqueItemNames.map((itemName) => ({
      label: itemName,
      data: labels.map((label) => groupedData[label][itemName] || 0),
      backgroundColor: hashToColor(hashString(itemName)),
      borderColor: hashToColor(hashString(itemName)),
    }));

    // Calculate max value across all datasets
    const maxValue = Math.max(...datasets.flatMap((dataset) => dataset.data));

    socket.emit("getClientFinanceData", {
      labels,
      datasets,
      maxValue,
    });
  } catch (error) {
    console.error("Error fetching client finance data:", error);
    socket.emit("error", { message: "Failed to fetch client finance data" });
  }
}

// export async function getClientCountData(
//   data: {
//     startDate: Date;
//     endDate: Date;
//     token: string;
//   },
//   socket: any
// ) {
//   let { startDate, endDate, token } = data;
//   startDate = new Date(startDate);
//   endDate = new Date(endDate);

//   try {
//     const userId = await getUserId(token);

//     const clients = await db.client.findMany({
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

//     for (const client of clients) {
//       const dateKey = formatDate(client.createdAt, startDate, endDate);
//       groupedData[dateKey] = (groupedData[dateKey] || 0) + 1;
//     }

//     const labels = Object.keys(groupedData);
//     const data = Object.values(groupedData);

//     const datasets = [
//       {
//         label: "Количество заказчиков",
//         data: data,
//         backgroundColor: hashToColor(hashString("clients")),
//         borderColor: hashToColor(hashString("clients")),
//       },
//     ];

//     const maxValue = Math.max(...data);

//     socket.emit("getClientCountData", { labels, datasets, maxValue });
//   } catch (error) {
//     console.error("Error fetching client count data:", error);
//     socket.emit("error", { message: "Failed to fetch client count data" });
//   }
// }

export async function getClientCountData(
  data: {
    startDate: Date;
    endDate: Date;
    token: string;
  },
  socket: any,
) {
  let { startDate, endDate, token } = data;
  startDate = new Date(startDate);
  endDate = new Date(endDate);

  try {
    const userId = await getUserId(token);

    console.log("Fetching client data for userId:", userId);
    console.log("Date range:", startDate, "to", endDate);

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

    console.log("Fetched clients count:", clients.length);

    const { groupedData, dateFormat } = groupClientsByDateRange(
      clients,
      startDate,
      endDate,
    );

    console.log("Grouped client data:", groupedData);

    const labels = generateDateLabels(startDate, endDate, dateFormat);

    const datasets = [
      {
        label: "Количество заказчиков",
        data: labels.map((label) => groupedData[label] || 0),
        backgroundColor: hashToColor(hashString("clients")),
        borderColor: hashToColor(hashString("clients")),
      },
    ];

    const maxValue = Math.max(...datasets[0].data);

    console.log("Prepared datasets:", datasets);
    console.log("Max value:", maxValue);

    socket.emit("getClientCountData", { labels, datasets, maxValue });
  } catch (error) {
    console.error("Error fetching client count data:", error);
    socket.emit("error", { message: "Failed to fetch client count data" });
  }
}

function groupClientsByDateRange(clients, startDate, endDate) {
  const monthsDiff = differenceInMonths(endDate, startDate);
  const yearsDiff = differenceInYears(endDate, startDate);

  let dateFormat: string;
  let formatFunc: (date: Date) => string;

  if (monthsDiff < 2) {
    dateFormat = "d";
    formatFunc = (date) => format(date, "d", { locale: ru });
  } else if (yearsDiff < 2) {
    dateFormat = "LLL";
    formatFunc = (date) => format(date, "LLL", { locale: ru });
  } else {
    dateFormat = "yyyy";
    formatFunc = (date) => format(date, "yyyy", { locale: ru });
  }

  const groupedData: { [key: string]: number } = {};

  for (const client of clients) {
    const dateKey = formatFunc(client.createdAt);
    groupedData[dateKey] = (groupedData[dateKey] || 0) + 1;
  }

  return { groupedData, dateFormat };
}

export async function getClientWorksData(
  data: {
    startDate: Date;
    endDate: Date;
    token: string;
  },
  socket: any,
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

    // Fetch schedules and items in parallel
    const [schedules, items] = await Promise.all([
      db.studentSchedule.findMany({
        where: whereClause,
        select: {
          workCount: true,
          day: true,
          month: true,
          year: true,
          itemName: true,
        },
      }),
      db.item.findMany({
        where: {
          userId: userId,
        },
        select: {
          itemName: true,
        },
      }),
    ]);

    // Get all unique item names
    const uniqueItemNames = [
      ...new Set([
        ...items.map((item) => item.itemName),
        ...schedules.map((schedule) => schedule.itemName),
      ]),
    ];

    // Group data by appropriate interval
    const { groupedData, labels } = groupDataByInterval(
      schedules,
      startDate,
      endDate,
      uniqueItemNames,
      "workCount", // используем workCount для подсчета работ
    );

    // Create datasets with continuous data for each item
    const datasets = uniqueItemNames.map((itemName) => ({
      label: itemName,
      data: labels.map((label) => groupedData[label][itemName] || 0),
      backgroundColor: hashToColor(hashString(itemName)),
      borderColor: hashToColor(hashString(itemName)),
    }));

    // Calculate max value across all datasets
    const maxValue = Math.max(...datasets.flatMap((dataset) => dataset.data));

    socket.emit("getClientWorksData", {
      labels,
      datasets,
      maxValue,
    });
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
    showStudents?: boolean;
    showClients?: boolean;
  },
  socket: any,
) {
  let {
    startDate,
    endDate,
    token,
    showStudents = true,
    showClients = true,
  } = data;
  startDate = new Date(startDate);
  endDate = new Date(endDate);

  try {
    const userId = await getUserId(token);

    // Determine grouping interval
    const {
      interval,
      format: dateFormat,
      generator,
    } = determineGroupingInterval(startDate, endDate);
    const periods = generator({ start: startDate, end: endDate });
    const labels = periods.map((period) =>
      format(period, dateFormat, { locale: ru }),
    );

    // Initialize grouped data with zeros
    const groupedData: {
      [key: string]: { students: number; clients: number };
    } = {};
    labels.forEach((label) => {
      groupedData[label] = { students: 0, clients: 0 };
    });

    // Fetch student data if needed
    if (showStudents) {
      const studentSchedules = await db.studentSchedule.findMany({
        where: {
          userId: userId,
          clientId: null,
          isArchived: false,
          isCancel: false,
          day: { not: null },
          month: { not: null },
          year: { not: null },
        },
        select: {
          lessonsCount: true,
          day: true,
          month: true,
          year: true,
        },
      });

      // Process student data
      studentSchedules.forEach((schedule) => {
        const itemDate = parseDateFromSchedule(
          schedule.day,
          schedule.month,
          schedule.year,
        );

        if (!isWithinInterval(itemDate, { start: startDate, end: endDate })) {
          return;
        }

        let periodKey: string;
        if (interval === "day") {
          periodKey = format(itemDate, "d", { locale: ru });
        } else if (interval === "month") {
          periodKey = format(itemDate, "LLL", { locale: ru });
        } else {
          periodKey = format(itemDate, "yyyy", { locale: ru });
        }

        groupedData[periodKey].students += schedule.lessonsCount || 0;
      });
    }

    // Fetch client data if needed
    if (showClients) {
      const clientSchedules = await db.studentSchedule.findMany({
        where: {
          userId: userId,
          clientId: { not: null },
          isArchived: false,
          isCancel: false,
          day: { not: null },
          month: { not: null },
          year: { not: null },
        },
        select: {
          workCount: true,
          day: true,
          month: true,
          year: true,
        },
      });

      // Process client data
      clientSchedules.forEach((schedule) => {
        const itemDate = parseDateFromSchedule(
          schedule.day,
          schedule.month,
          schedule.year,
        );

        if (!isWithinInterval(itemDate, { start: startDate, end: endDate })) {
          return;
        }

        let periodKey: string;
        if (interval === "day") {
          periodKey = format(itemDate, "d", { locale: ru });
        } else if (interval === "month") {
          periodKey = format(itemDate, "LLL", { locale: ru });
        } else {
          periodKey = format(itemDate, "yyyy", { locale: ru });
        }

        groupedData[periodKey].clients += schedule.workCount || 0;
      });
    }

    // Prepare datasets
    const datasets = [];

    if (showStudents) {
      datasets.push({
        label: "Ученики",
        data: labels.map((label) => groupedData[label].students),
        backgroundColor: hashToColor(hashString("students")),
        borderColor: hashToColor(hashString("students")),
      });
    }

    if (showClients) {
      datasets.push({
        label: "Заказчики",
        data: labels.map((label) => groupedData[label].clients),
        backgroundColor: hashToColor(hashString("clients")),
        borderColor: hashToColor(hashString("clients")),
      });
    }

    // Calculate max value across all datasets
    const maxValue = Math.max(...datasets.flatMap((dataset) => dataset.data));

    console.log("Comparison Data:", {
      labels,
      datasets,
      groupedData,
      maxValue,
    });

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
      (item) => item.itemName && item.itemName.toLowerCase() !== "void",
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
