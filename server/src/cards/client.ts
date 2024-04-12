import { Prisma, PrismaClient } from "@prisma/client";
import { IStudentCardResponse, ITimeLine, IItemCard } from "../types";
import db from "../db";
import io from "../socket";

const prisma = new PrismaClient();

export async function addClient(data: any) {
  const {
    nameStudent,
    phoneNumber,
    email,
    costStudent,
    commentClient,
    jobs,
    stages,
    token,
  } = data;

  console.log(data);

  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });

  const userId = token_.userId;

  try {
    // Create a new client
    const newClient = await prisma.client.create({
      data: {
        nameStudent,
        phoneNumber,
        email,
        costStudent,
        commentClient,
        jobs: {
          create: jobs.map((job: any) => ({
            jobName: job.jobName,
            itemName: job.itemName,
            cost: job.cost,
            stages: job.stages,
            userId: userId,
          })),
        },
        userId: userId,
        // payments: {
        //   create: stages.map((payment: any) => ({
        //     totalCost: payment.totalCost,
        //     name: payment.name,
        //     typePayment: payment.typePayment,
        //     dateStart: payment.dateStart,
        //     cost: payment.cost,
        //     prePay: payment.prePay,
        //     postPay: payment.postPay,
        //     payment: payment.payment,
        //     payed: payment.payed,
        //     date: payment.date,
        //     workStarted: payment.workStarted,
        //     paymentDate: payment.paymentDate,
        //     userId: userId,
        //   })),
        // },
      },
    });

    console.log("New client created:", newClient);
  } catch (error) {
    console.error("Error creating client:", error);
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

    const clients = await prisma.client.findMany({
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

export async function clientToArhive(data: any) {
  const { token, id, isArchived } = data;

  const token_ = await db.token.findFirst({
    where: {
      token,
    },
  });

  const userId = token_.userId;

  try {
    const client = await prisma.client.update({
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
    const client = await prisma.client.delete({
      where: {
        id,
        userId,
      },
    });
  } catch (error) {
    console.error("Error deleting client:", error);
  }
}
