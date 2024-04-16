import { IStudentCardResponse, ITimeLine, IItemCard } from "../types";
import db from "../db";
import io from "../socket";
import { Prisma, Job } from "@prisma/client";
import { differenceInDays, addDays, getDay } from "date-fns";

export async function addClient(data: any) {
  const {
    nameStudent,
    phoneNumber,
    email,
    costStudent,
    commentClient,
    jobs, // Assuming jobs is an array of job objects with nested stages
    token,
  } = data;

  const tokenData = await db.token.findFirst({
    where: {
      token,
    },
  });

  if (!tokenData) {
    throw new Error("Invalid token");
  }

  const userId = tokenData.userId;

  try {
    // Create a new client
    const newClient = await db.client.create({
      data: {
        nameStudent,
        phoneNumber,
        email,
        costStudent,
        commentClient,
        jobs: {
          create: jobs.map((job) => ({
            jobName: job.jobName,
            itemName: job.itemName,
            cost: job.cost,
            stages: {
              create: job.stages.map((stage) => ({
                totalCost: String(stage.totalCost) || "0",
                name: stage.name,
                typePayment: stage.typePayment,
                dateStart: stage.dateStart,
                cost: stage.cost,
                prePay: stage.prePay,
                postPay: stage.postPay,
                payment: stage.payment,
                payed: stage.payed,
                date: stage.date,
                workStarted: stage.workStarted,
                paymentDate: stage.paymentDate,
                endPaymentPrice: stage.endPaymentPrice,
                endPaymentDate: stage.endPaymentDate,
                firstPaymentPayed: stage.firstPaymentPayed,
                startWorkDate: stage.startWorkDate,
                isStartWork: stage.isStartWork,
                firstPaymentDate: stage.firstPaymentDate,
                fisrtPaymentPrice: stage.fisrtPaymentPrice,
                endPaymentPayed: stage.endPaymentPayed,
                endWorkDate: stage.endWorkDate,
                isEndWork: stage.isEndWork,
                userId,
              })),
            },
            userId,
          })),
        },
        userId,
      },
    });

    console.log("New client created:", newClient);

    // Create StudentSchedule records
    const jobsWithStages = await db.job.findMany({
      where: {
        clientId: newClient.id,
      },
      include: {
        client: true,
        stages: true, // Тип для stages должен быть указан явно
      },
    });

    for (const jobWithStages of jobsWithStages) {
      const { client, stages } = jobWithStages;

      for (const stage of stages) {
        const relevantDates = [
          stage.paymentDate,
          stage.endPaymentDate,
          stage.startWorkDate,
          stage.firstPaymentDate,
          stage.endWorkDate,
        ];

        for (const date of relevantDates) {
          if (date) {
            const dayOfMonth = date.getDate();
            const isFirstPayment =
              date.toDateString() === stage.firstPaymentDate.toDateString();
            const isEndPayment =
              date.toDateString() === stage.endPaymentDate.toDateString();
            const workCount = isFirstPayment && isEndPayment ? 2 : 1;
            const workPrice = isFirstPayment
              ? stage.fisrtPaymentPrice
              : isEndPayment
              ? stage.endPaymentPrice
              : 0;

            const totalWorkPrice =
              stage.fisrtPaymentPrice + stage.endPaymentPrice;

            //create void item
            const voidItem = await db.item.create({
              data: {
                itemName: "void",
                userId,
                lessonDuration: 0,

                endLesson: new Date(Date.now()),
                placeLesson: "",
                programLesson: "",
                startLesson: new Date(Date.now()),
                targetLesson: "",
                timeLesson: "",
                todayProgramStudent: "",
                typeLesson: 3,
                tryLessonCheck: false,
                tryLessonCost: "",
                valueMuiSelectArchive: 1,
                timeLinesArray: [],
                // itemName: "void",
                nowLevel: 0,
              },
            });

            await db.studentSchedule.create({
              data: {
                day: dayOfMonth.toString(),
                clientId: client.id,
                workCount,
                lessonsCount: 0,
                lessonsPrice: 0,
                workPrice,
                totalWorkPrice: totalWorkPrice,
                itemName: jobWithStages.jobName,
                studentName: client.nameStudent,
                typeLesson: 0,
                isChecked: false,
                month: (date.getMonth() + 1).toString(),
                year: date.getFullYear().toString(),
                userId,
                groupId: "",
                isArchived: false,
                address: "",
                classAudios: [],
                classFiles: [],
                classStudentsPoints: {},
                classWork: "",
                workStages: stages,
                homeAudios: [],
                homeFiles: [],
                homeWork: "",
                homeStudentsPoints: {},
                studentId: "",
                timeLinesArray: [],
                itemId: voidItem.id,
              },
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error creating client:", error);
  }
}

export async function getClientById(data: { clientId: string; token: string }) {
  try {
    const { clientId, token } = data;

    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    if (!token_) {
      console.log("Invalid token");
    }

    const userId = token_.userId;

    const client = await db.client.findUnique({
      where: {
        userId: userId,
        id: clientId,
      },
      select: {
        id: true,
        nameStudent: true,
        phoneNumber: true,
        email: true,
        commentClient: true,
        costStudent: true,
        isArchived: true,
        jobs: {
          select: {
            id: true,
            jobName: true,
            stages: true,
            client: true,
            clientId: true,
            cost: true,
            itemName: true,
            userId: true,
          },
        },
      },
    });

    io.emit("getClientById", client);
    return client;
  } catch (error) {
    console.error("Error fetching client:", error);
  }
}

export async function updateClient(data: {
  id: string;
  nameStudent: string;
  phoneNumber: string;
  email: string;
  costStudent: number;
  commentClient: string;
  token: string;
}) {
  try {
    const { id, nameStudent, phoneNumber, email, commentClient, token } = data;

    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    if (!token_) {
      console.log("Invalid token");
    }

    const userId = token_.userId;

    const client = await db.client.update({
      where: {
        id,
        userId,
      },
      data: {
        nameStudent,
        phoneNumber,
        email,
        commentClient,
      },
    });

    io.emit("updateClient", client);

    return client;
  } catch (error) {
    console.error("Error updating client:", error);
  }
}

export async function getClientList(token) {
  try {
    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    if (!token_) {
      console.log("Invalid token");
    }

    const userId = token_.userId;

    const clients = await db.client.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        nameStudent: true,
        phoneNumber: true,
        email: true,
        costStudent: true,
        isArchived: true,
        commentClient: true,
        jobs: {
          select: {
            id: true,
            jobName: true,
            itemName: true,
            cost: true,
            stages: true,
          },
        },
      },
    });

    io.emit("getClientList", clients);

    return clients;
  } catch (error) {
    console.error("Error fetching client list:", error);
  }
}

export async function getClientsByDate(data: any) {
  const { token, day, month, year } = data;

  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });

  const userId = token_.userId;

  const clients = await db.studentSchedule.findMany({
    where: {
      userId,
      day: day.toString(),
      month: month.toString(),
      year: year.toString(),
      NOT: {
        clientId: null,
      },
    },
    select: {
      id: true,
      itemName: true,
      studentName: true,
      totalWorkPrice: true,
      workStages: true,
      clientId: true,
      workCount: true,
      workPrice: true,
    
    },
  });

  io.emit("getClientsByDate", clients);

  return clients;
}

export async function getClientTableData(data) {
  const { token, dateRange } = data;
  const token_ = await db.token.findFirst({ where: { token } });
  const userId = token_.userId;

  try {
    // Fetch clients for the user
    const clients = await db.client.findMany({
      where: { userId },
      include: { jobs: { include: { stages: true } } },
    });

    // Fetch client job schedules for the date range
    const clientSchedules = await db.studentSchedule.findMany({
      where: {
        userId,
        day: {
          gte: new Date(dateRange.start).getDate().toString(),
          lte: new Date(dateRange.end).getDate().toString(),
        },
        month: (new Date(dateRange.start).getMonth() + 1).toString(),
        year: new Date(dateRange.start).getFullYear().toString(),
        clientId: { not: null },
      },
    });

    const clientTableData = clients.flatMap((client) => {
      const clientJobs = client.jobs;
      return clientJobs.flatMap((job) => {
        const jobStages = job.stages;
        const jobSchedules = clientSchedules.filter(
          (schedule) => schedule.itemId === job.id
        );

        const lessons = jobSchedules.reduce(
          (count, schedule) => count + schedule.workCount,
          0
        );
        const canceledLessons = jobSchedules.reduce(
          (count, schedule) =>
            count + (schedule.isChecked ? 0 : schedule.workCount),
          0
        );
        const income = jobSchedules.reduce(
          (sum, schedule) => sum + schedule.workPrice,
          0
        );
        const consumption = 0; // Assume no consumption for clients
        const debt = jobStages.reduce(
          (sum, stage) => sum + stage.cost - (stage.payed ? stage.payment : 0),
          0
        );

        return {
          name: client.nameStudent,
          job: job.jobName,
          lessons,
          avgCost: job.cost,
          cancel: canceledLessons,
          income,
          consumption,
          duty: debt,
          total: income - debt,
        };
      });
    });

    io.emit("getClientTableData", clientTableData);
    return clientTableData;
  } catch (error) {
    console.error("Error fetching client table data:", error);
    throw error;
  }
}

export async function clientToArhive(data: any) {
  const { token, id, isArchived } = data;

  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });

  const userId = token_.userId;

  try {
    const client = await db.client.update({
      where: {
        id,
        userId,
      },
      data: {
        isArchived: isArchived,
      },
    });

    console.log("Client archived:", client);
  } catch (error) {
    console.error("Error archiving client:", error);
  }
}

export async function deleteClient(data: any) {
  const { token, id } = data;

  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });

  const userId = token_.userId;

  try {
    const client = await db.client.delete({
      where: {
        id,
        userId,
      },
    });
  } catch (error) {
    console.error("Error deleting client:", error);
  }
}
