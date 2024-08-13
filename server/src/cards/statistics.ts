import { differenceInDays, isWithinInterval, format, parse } from "date-fns";
import { ru } from "date-fns/locale";
import db from "../db";

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash); // Ensure positive integer
};

const hashToColor = (hash: number): string => {
  const saturation = 0.6;
  const brightness = 0.7;
  const hue = hash % 360;
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
  const rgb = [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  return `#${rgb
    .map((value) => Math.round(value).toString(16).padStart(2, "0"))
    .join("")}`;
};

const formatDate = (date: Date, startDate: Date, endDate: Date): string => {
  const dayDiff = differenceInDays(endDate, startDate);
  if (dayDiff > 365) {
    return date.getFullYear().toString();
  } else if (dayDiff > 30) {
    return format(date, "MMMM yyyy", { locale: ru });
  } else {
    return format(date, "d MMM", { locale: ru });
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
  const token_ = await db.token.findFirst({
    where: { token },
  });

  if (!token_) {
    throw new Error("Invalid token");
  }

  return token_.userId;
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

    const data_ = await db.studentSchedule.findMany({
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

    data_.sort((a, b) => {
      const dateA = new Date(`${a.year}-${a.month}-${a.day}`);
      const dateB = new Date(`${b.year}-${b.month}-${b.day}`);
      return dateA.getTime() - dateB.getTime();
    });

    const combinedData: { [key: string]: { [key: string]: number } } = {};

    for (const item of data_) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      const dateKey = `${item.year}-${item.month}-${item.day}`;

      if (!combinedData[dateKey]) {
        combinedData[dateKey] = {};
      }

      if (!combinedData[dateKey][item.itemName]) {
        combinedData[dateKey][item.itemName] = 0;
      }

      combinedData[dateKey][item.itemName] += item.lessonsPrice;
    }

    const combinedDataArray = Object.keys(combinedData).map((dateKey) => ({
      date: new Date(dateKey),
      ...combinedData[dateKey],
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
      data: combinedDataArray.map((item) => item[itemName] || 0),
      fill: false,
      backgroundColor: hashToColor(hashString(itemName)),
      borderColor: hashToColor(hashString(itemName)),
    }));

    const maxValue = Math.max(...datasets.flatMap((dataset) => dataset.data));

    socket.emit("getStudentFinanceData", { labels, datasets, maxValue });
    return { labels, datasets, maxValue };
  } catch (error) {
    console.error("Error fetching student finance data:", error);
  }
}

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

    const students = await db.student.findMany({
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

    const labels = students.map((student) =>
      formatDate(student.createdAt, startDate, endDate)
    );
    const data = students.map((_, index) => index + 1);

    const datasets = [
      {
        label: "Количество учеников",
        data: data,
        fill: false,
        backgroundColor: hashToColor(hashString("students")),
        borderColor: hashToColor(hashString("students")),
      },
    ];

    const maxValue = Math.max(...data);

    socket.emit("getStudentCountData", { labels, datasets, maxValue });
    return { labels, datasets, maxValue };
  } catch (error) {
    console.error("Error fetching student count data:", error);
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

    const data_ = await db.studentSchedule.findMany({
      where: whereClause,
      select: {
        lessonsCount: true,
        itemName: true,
        day: true,
        month: true,
        year: true,
        student: {
          select: {
            id: true,
            nameStudent: true,
          },
        },
      },
    });

    data_.sort((a, b) => {
      const dateA = new Date(`${a.year}-${a.month}-${a.day}`);
      const dateB = new Date(`${b.year}-${b.month}-${b.day}`);
      return dateA.getTime() - dateB.getTime();
    });

    const combinedData: { [key: string]: { [key: string]: number } } = {};

    for (const item of data_) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      const dateKey = `${item.year}-${item.month}-${a.day}`;

      if (!combinedData[dateKey]) {
        combinedData[dateKey] = {};
      }

      if (!combinedData[dateKey][item.itemName]) {
        combinedData[dateKey][item.itemName] = 0;
      }

      combinedData[dateKey][item.itemName] += item.lessonsCount;
    }

    const combinedDataArray = Object.keys(combinedData).map((dateKey) => ({
      date: new Date(dateKey),
      ...combinedData[dateKey],
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
      data: combinedDataArray.map((item) => item[itemName] || 0),
      fill: false,
      backgroundColor: hashToColor(hashString(itemName)),
      borderColor: hashToColor(hashString(itemName)),
    }));

    const maxValue = Math.max(...datasets.flatMap((dataset) => dataset.data));

    socket.emit("getStudentLessonsData", { labels, datasets, maxValue });
    return { labels, datasets, maxValue };
  } catch (error) {
    console.error("Error fetching student lessons data:", error);
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

    const data_ = await db.studentSchedule.findMany({
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

    data_.sort((a, b) => {
      const dateA = new Date(`${a.year}-${a.month}-${a.day}`);
      const dateB = new Date(`${b.year}-${b.month}-${b.day}`);
      return dateA.getTime() - dateB.getTime();
    });

    const combinedData: { [key: string]: number } = {};

    for (const item of data_) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      if (!combinedData[item.clientId]) {
        combinedData[item.clientId] = 0;
      }

      combinedData[item.clientId] += item.workPrice;
    }

    const combinedDataArray = Object.entries(combinedData).map(
      ([clientId, workPrice]) => ({
        clientId,
        workPrice,
      })
    );

    if (combinedDataArray.length === 0) {
      console.log("No data found for the given date range.");
      return;
    }

    let clients = await db.client.findMany({
      where: {
        id: {
          in: combinedDataArray.map((item) => item.clientId),
        },
      },
      select: {
        id: true,
        nameStudent: true,
      },
    });

    const labels = combinedDataArray.map((item) => {
      const client = clients.find((c) => c.id === item.clientId);
      return `Клиент ${client ? client.nameStudent : "Unknown"}`;
    });

    const datasets = [
      {
        label: "Цена работ",
        data: combinedDataArray.map((item) => item.workPrice),
        fill: false,
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: "rgba(75,192,192,1)",
      },
    ];

    const maxValue = Math.max(...datasets[0].data);

    socket.emit("getClientFinanceData", { labels, datasets, maxValue });
    return { labels, datasets, maxValue };
  } catch (error) {
    console.error("Error fetching client finance data:", error);
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
        workCount: true,
        day: true,
        month: true,
        year: true,
        clientId: true,
      },
    });

    data_.sort((a, b) => {
      const dateA = new Date(`${a.year}-${a.month}-${a.day}`);
      const dateB = new Date(`${b.year}-${b.month}-${b.day}`);
      return dateA.getTime() - dateB.getTime();
    });

    const combinedData: { [key: string]: number } = {};

    for (const item of data_) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      if (!combinedData[item.clientId]) {
        combinedData[item.clientId] = 0;
      }

      combinedData[item.clientId] += item.workCount;
    }

    const combinedDataArray = Object.entries(combinedData).map(
      ([clientId, workCount]) => ({
        clientId,
        workCount,
      })
    );

    if (combinedDataArray.length === 0) {
      console.log("No data found for the given date range.");
      return;
    }

    let clients = await db.client.findMany({
      where: {
        id: {
          in: combinedDataArray.map((item) => item.clientId),
        },
      },
      select: {
        id: true,
        nameStudent: true,
      },
    });

    const labels = combinedDataArray.map((item) => {
      const client = clients.find((c) => c.id === item.clientId);
      return `Клиент ${client ? client.nameStudent : "Unknown"}`;
    });

    const datasets = [
      {
        label: "Количество работ",
        data: combinedDataArray.map((item) => item.workCount),
        fill: false,
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: "rgba(75,192,192,1)",
      },
    ];

    const maxValue = Math.max(...datasets[0].data);

    socket.emit("getClientCountData", { labels, datasets, maxValue });
    return { labels, datasets, maxValue };
  } catch (error) {
    console.error("Error fetching client count data:", error);
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

    const data_ = await db.studentSchedule.findMany({
      where: whereClause,
      select: {
        itemName: true,
        studentName: true,
        day: true,
        month: true,
        year: true,
        clientId: true,
      },
    });

    data_.sort((a, b) => {
      const dateA = new Date(`${a.year}-${a.month}-${a.day}`);
      const dateB = new Date(`${b.year}-${b.month}-${b.day}`);
      return dateA.getTime() - dateB.getTime();
    });

    const combinedData: { [key: string]: { [key: string]: string[] } } = {};

    for (const item of data_) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      if (!combinedData[item.clientId]) {
        combinedData[item.clientId] = {};
      }

      if (!combinedData[item.clientId][item.itemName]) {
        combinedData[item.clientId][item.itemName] = [];
      }

      combinedData[item.clientId][item.itemName].push(item.studentName);
    }

    const combinedDataArray = Object.entries(combinedData).map(
      ([clientId, items]) => ({
        clientId,
        items,
      })
    );

    if (combinedDataArray.length === 0) {
      console.log("No data found for the given date range.");
      return;
    }

    let clients = await db.client.findMany({
      where: {
        id: {
          in: combinedDataArray.map((item) => item.clientId),
        },
      },
      select: {
        id: true,
        nameStudent: true,
      },
    });

    const labels = combinedDataArray.map((item) => {
      const client = clients.find((c) => c.id === item.clientId);
      return `Клиент ${client ? client.nameStudent : "Unknown"}`;
    });

    const uniqueItemNames = [...new Set(data_.map((item) => item.itemName))];

    const datasets = uniqueItemNames.map((itemName) => ({
      label: itemName,
      data: combinedDataArray.map((item) =>
        item.items[itemName] ? item.items[itemName].length : 0
      ),
      fill: false,
      backgroundColor: hashToColor(hashString(itemName)),
      borderColor: hashToColor(hashString(itemName)),
    }));

    const maxValue = Math.max(...datasets.flatMap((dataset) => dataset.data));

    socket.emit("getClientWorksData", { labels, datasets, maxValue });
    return { labels, datasets, maxValue };
  } catch (error) {
    console.error("Error fetching client works data:", error);
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
        clientId: null,
        isArchived: false,
        userId: userId,
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
        clientId: {
          not: null,
        },
        userId: userId,
        isArchived: false,
      },
      select: {
        workCount: true,
        day: true,
        month: true,
        year: true,
      },
    });

    const combinedData = [...studentData, ...clientData];

    combinedData.sort((a, b) => {
      const dateA = new Date(`${a.year}-${a.month}-${a.day}`);
      const dateB = new Date(`${b.year}-${b.month}-${b.day}`);
      return dateA.getTime() - dateB.getTime();
    });

    const groupedData: {
      [key: string]: { students: number; clients: number };
    } = {};

    for (const item of combinedData) {
      const itemDate = parseDateFromSchedule(item.day, item.month, item.year);

      if (!isWithinInterval(itemDate, { start: startDate, end: endDate }))
        continue;

      const dateKey = `${item.year}-${item.month}-${item.day}`;

      if (!groupedData[dateKey]) {
        groupedData[dateKey] = { students: 0, clients: 0 };
      }

      if ("lessonsCount" in item) {
        groupedData[dateKey].students += item.lessonsCount;
      } else if ("workCount" in item) {
        groupedData[dateKey].clients += item.workCount;
      }
    }

    const labels = Object.keys(groupedData).map((dateKey) =>
      formatDate(new Date(dateKey), startDate, endDate)
    );

    const datasets = [
      {
        label: "Ученики",
        data: Object.values(groupedData).map((item) => item.students),
        fill: false,
        backgroundColor: "rgba(75, 192, 192, 0.4)",
        borderColor: "rgba(75, 192, 192, 1)",
      },
      {
        label: "Заказчики",
        data: Object.values(groupedData).map((item) => item.clients),
        fill: false,
        backgroundColor: "rgba(255, 99, 132, 0.4)",
        borderColor: "rgba(255, 99, 132, 1)",
      },
    ];

    const maxValue = Math.max(...datasets.flatMap((dataset) => dataset.data));

    socket.emit("getStudentClientComparisonData", {
      labels,
      datasets,
      maxValue,
    });
    return { labels, datasets, maxValue };
  } catch (error) {
    console.error("Error fetching student-client comparison data:", error);
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

    const groupedItems = filteredItems.reduce((acc, item) => {
      const lowerCaseName = item.itemName.toLowerCase();
      if (!acc[lowerCaseName]) {
        acc[lowerCaseName] = [];
      }
      acc[lowerCaseName].push(item);
      return acc;
    }, {} as { [key: string]: typeof items });

    const result = Object.values(groupedItems).map((group) => {
      if (group.length === 1) {
        return group[0];
      } else {
        return {
          id: group.map((item) => item.id),
          itemName: group[0].itemName,
        };
      }
    });

    socket.emit("getAllItemsIdsAndNames", result);
    return result;
  } catch (error) {
    console.error("Error fetching items:", error);
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
