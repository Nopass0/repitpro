import {
  IStudentCardResponse,
  ITimeLine,
  IItemCard,
  IUploadFiles,
} from "../types";
import db from "../db";
import io from "../socket";
import { Prisma, Job } from "@prisma/client";
import { differenceInDays, addDays, getDay } from "date-fns";
import { upload } from "files/files";

export async function addClient(data: any, socket: any) {
  const {
    nameStudent,
    phoneNumber,
    email,
    costStudent,
    commentClient,
    files,
    audios,
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

  console.log("\n---------itemName---------\n", jobs, "\n---------\n");

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
                costOneLesson: "",
                typeLesson: 3,
                tryLessonCheck: false,
                tryLessonCost: "",
                valueMuiSelectArchive: 1,
                timeLinesArray: [],
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

    let filesIds = [];
    if (files.length > 0) {
      filesIds = await upload(files, userId, "client", (ids: string[]) => {
        filesIds = ids;
      });
    }

    let audioIds = [];

    if (audios.length > 0) {
      audioIds = await upload(
        audios,
        userId,
        "client/audio",
        (ids: string[]) => {
          audioIds = ids;
        }
      );
    }

    console.log("Files:", files, "FileIDS", filesIds);

    const updateClient = await db.client.update({
      where: {
        id: newClient.id,
      },
      data: {
        files: [...filesIds, ...audioIds],
      },
    });

    return updateClient;
  } catch (error) {
    console.error("Error creating client:", error);
    socket.emit("addClient", { error: error.message });
  }
}

export async function getClientById(
  data: { clientId: string; token: string },
  socket: any
) {
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
        files: true,
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

    const dbFiles = await db.file.findMany({
      where: {
        id: {
          in: client.files,
        },
      },
      select: {
        id: true,
        name: true,
        path: true,
        userId: true,
        extraType: true,
        size: true,
        type: true,
      },
    });

    const dbFilesJson = JSON.parse(JSON.stringify(dbFiles));

    //filtr extraType client
    const filesDB = dbFilesJson.filter((file) => file.extraType === "client");

    //filter extraType client/audio
    const audiosDB = dbFilesJson.filter(
      (file) => file.extraType === "client/audio"
    );

    const client_ = JSON.parse(JSON.stringify(client));
    client_.files = filesDB;
    client_.audios = audiosDB;

    socket.emit("getClientById", client_);
    return client;
  } catch (error) {
    console.error("Error fetching client:", error);
  }
}

export async function updateClient(
  data: {
    id: string;
    nameStudent: string;
    phoneNumber: string;
    email: string;
    costStudent: string;
    commentClient: string;
    files: IUploadFiles[];
    audios: IUploadFiles[];
    jobs: any;
    token: string;
  },
  socket: any
) {
  try {
    const {
      id,
      nameStudent,
      phoneNumber,
      email,
      commentClient,
      token,
      files,
      audios,
      jobs,
      costStudent,
    } = data;

    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    if (!token_) {
      console.log("Invalid token");
      throw new Error("Invalid token");
    }

    const userId = token_.userId;

    // Получение существующих файлов
    const existingClient = await db.client.findUnique({
      where: { id, userId },
      select: { files: true },
    });

    let updatedFiles = existingClient.files || [];

    if (files.length > 0) {
      const fileIds = await upload(files, userId, "client");
      updatedFiles = [...updatedFiles, ...fileIds];
    }

    if (audios.length > 0) {
      const audioIds = await upload(audios, userId, "client/audio");
      updatedFiles = [...updatedFiles, ...audioIds];
    }

    for (const newJob of jobs) {
      const existingJob = await db.job.findUnique({
        where: { id: newJob.id },
        include: { stages: true },
      });

      if (existingJob) {
        // Обновление существующей job
        await db.job.update({
          where: { id: newJob.id },
          data: {
            jobName: newJob.jobName,
            itemName: newJob.itemName,
            cost: newJob.cost,
            clientId: newJob.clientId,
            userId: newJob.userId,
          },
        });

        // Обновление существующих stages
        for (const newStage of newJob.stages) {
          if (newStage.id) {
            // Обновление существующего stage
            await db.stage.update({
              where: { id: newStage.id },
              data: {
                totalCost: String(newStage.totalCost),
                name: newStage.name,
                typePayment: newStage.typePayment,
                dateStart: newStage.dateStart
                  ? new Date(newStage.dateStart)
                  : null,
                cost: newStage.cost,
                prePay: newStage.prePay,
                postPay: newStage.postPay,
                payment: newStage.payment,
                payed: newStage.payed,
                date: newStage.date ? new Date(newStage.date) : null,
                workStarted: newStage.workStarted,
                paymentDate: newStage.paymentDate
                  ? new Date(newStage.paymentDate)
                  : null,
                endPaymentPrice: newStage.endPaymentPrice,
                endPaymentDate: newStage.endPaymentDate
                  ? new Date(newStage.endPaymentDate)
                  : null,
                firstPaymentPayed: newStage.firstPaymentPayed,
                startWorkDate: newStage.startWorkDate
                  ? new Date(newStage.startWorkDate)
                  : null,
                isStartWork: newStage.isStartWork,
                firstPaymentDate: newStage.firstPaymentDate
                  ? new Date(newStage.firstPaymentDate)
                  : null,
                fisrtPaymentPrice: newStage.fisrtPaymentPrice,
                endPaymentPayed: newStage.endPaymentPayed,
                endWorkDate: newStage.endWorkDate
                  ? new Date(newStage.endWorkDate)
                  : null,
                isEndWork: newStage.isEndWork,
              },
            });
          } else {
            // Создание нового stage
            await db.stage.create({
              data: {
                totalCost: String(newStage.totalCost),
                name: newStage.name,
                typePayment: newStage.typePayment,
                dateStart: newStage.dateStart
                  ? new Date(newStage.dateStart)
                  : null,
                cost: newStage.cost,
                prePay: newStage.prePay,
                postPay: newStage.postPay,
                payment: newStage.payment,
                payed: newStage.payed,
                date: newStage.date ? new Date(newStage.date) : null,
                workStarted: newStage.workStarted,
                paymentDate: newStage.paymentDate
                  ? new Date(newStage.paymentDate)
                  : null,
                endPaymentPrice: newStage.endPaymentPrice,
                endPaymentDate: newStage.endPaymentDate
                  ? new Date(newStage.endPaymentDate)
                  : null,
                firstPaymentPayed: newStage.firstPaymentPayed,
                startWorkDate: newStage.startWorkDate
                  ? new Date(newStage.startWorkDate)
                  : null,
                isStartWork: newStage.isStartWork,
                firstPaymentDate: newStage.firstPaymentDate
                  ? new Date(newStage.firstPaymentDate)
                  : null,
                fisrtPaymentPrice: newStage.fisrtPaymentPrice,
                endPaymentPayed: newStage.endPaymentPayed,
                endWorkDate: newStage.endWorkDate
                  ? new Date(newStage.endWorkDate)
                  : null,
                isEndWork: newStage.isEndWork,
                jobId: newJob.id,
                userId: newJob.userId, // Ensure userId is passed correctly
                clientId: newJob.clientId, // Ensure clientId is passed correctly
              },
            });
          }
        }
      } else {
        // Создание новой job и stages
        await db.job.create({
          data: {
            id: newJob.id, // Assuming you have id in the new jobs data
            jobName: newJob.jobName,
            itemName: newJob.itemName,
            cost: newJob.cost,
            clientId: newJob.clientId,
            userId: newJob.userId,
            stages: {
              create: newJob.stages.map((stage) => ({
                totalCost: stage.totalCost,
                name: stage.name,
                typePayment: stage.typePayment,
                dateStart: stage.dateStart ? new Date(stage.dateStart) : null,
                cost: stage.cost,
                prePay: stage.prePay,
                postPay: stage.postPay,
                payment: stage.payment,
                payed: stage.payed,
                date: stage.date ? new Date(stage.date) : null,
                workStarted: stage.workStarted,
                paymentDate: stage.paymentDate
                  ? new Date(stage.paymentDate)
                  : null,
                endPaymentPrice: stage.endPaymentPrice,
                endPaymentDate: stage.endPaymentDate
                  ? new Date(stage.endPaymentDate)
                  : null,
                firstPaymentPayed: stage.firstPaymentPayed,
                startWorkDate: stage.startWorkDate
                  ? new Date(stage.startWorkDate)
                  : null,
                isStartWork: stage.isStartWork,
                firstPaymentDate: stage.firstPaymentDate
                  ? new Date(stage.firstPaymentDate)
                  : null,
                fisrtPaymentPrice: stage.fisrtPaymentPrice,
                endPaymentPayed: stage.endPaymentPayed,
                endWorkDate: stage.endWorkDate
                  ? new Date(stage.endWorkDate)
                  : null,
                isEndWork: stage.isEndWork,
                userId: newJob.userId, // Ensure userId is passed correctly
                clientId: newJob.clientId, // Ensure clientId is passed correctly
              })),
            },
          },
        });
      }
    }

    const updatedClient = await db.client.update({
      where: {
        id,
        userId,
      },
      data: {
        nameStudent,
        phoneNumber,
        email,
        commentClient,

        costStudent,
        files: updatedFiles,
      },
    });

    socket.emit("updateClient", updatedClient);
    console.log("Updated client:", updatedClient, nameStudent);
    return updatedClient;
  } catch (error) {
    console.error("Error updating client:", error);
    socket.emit("updateClient", { error: error.message });
  }
}

export async function getClientList(token, socket: any) {
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

    socket.emit("getClientList", clients);

    return clients;
  } catch (error) {
    console.error("Error fetching client list:", error);
  }
}

export async function getClientsByDate(data: any, socket: any) {
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

  console.log("\n--------clients--------\n", clients, "\n--------\n");

  socket.emit("getClientsByDate", clients);

  return clients;
}

export async function getClientTableData(data: any, socket: any) {
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

    socket.emit("getClientTableData", clientTableData);
    return clientTableData;
  } catch (error) {
    console.error("Error fetching client table data:", error);
    throw error;
  }
}

export async function clientToArhive(data: any, socket: any) {
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

export async function deleteClient(data: any, socket: any) {
  const { token, id } = data;

  try {
    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    if (!token_) {
      throw new Error("Invalid token");
    }

    const userId = token_.userId;

    if (!userId) {
      throw new Error("Invalid token");
    }

    // Получаем все работы, связанные с клиентом
    const jobs = await db.job.findMany({
      where: {
        clientId: id,
      },
    });

    // Удаляем все стадии, связанные с каждой работой
    for (const job of jobs) {
      await db.stage.deleteMany({
        where: {
          jobId: job.id,
        },
      });
    }

    // Удаляем все работы, связанные с клиентом
    await db.job.deleteMany({
      where: {
        clientId: id,
      },
    });

    // Удаляем все записи расписания, связанные с клиентом
    await db.studentSchedule.deleteMany({
      where: {
        clientId: id,
      },
    });

    // Удаляем клиента
    const client = await db.client.delete({
      where: {
        id,
        userId,
      },
    });

    console.log("Client deleted:", client);
  } catch (error) {
    console.error("Error deleting client:", error);
  }
}
