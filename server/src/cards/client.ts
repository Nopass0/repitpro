import express, { Request, Response } from "express";
import {
  IStudentCardResponse,
  ITimeLine,
  IItemCard,
  IUploadFiles,
} from "../types";
import db from "../db";
import { Prisma, Job } from "@prisma/client";
import { differenceInDays, addDays, getDay } from "date-fns";
import { upload } from "files/files";

// const router = express.Router();

// /**
//  * Adds a new client to the database.
//  *
//  * @param {Request} req - The request object.
//  * @param {Response} res - The response object.
//  */
// router.post("/addClient", async (req: Request, res: Response) => {
//   try {
//     const {
//       nameStudent,
//       phoneNumber,
//       email,
//       costStudent,
//       commentClient,
//       files,
//       audios,
//       jobs,
//       token,
//     } = req.body;

//     const tokenData = await db.token.findFirst({
//       where: { token },
//     });

//     if (!tokenData) {
//       return res.status(400).json({ error: "Invalid token" });
//     }

//     const userId = tokenData.userId;

//     const newClient = await db.client.create({
//       data: {
//         nameStudent,
//         phoneNumber,
//         email,
//         costStudent,
//         commentClient,
//         jobs: {
//           create: jobs.map((job) => ({
//             jobName: job.jobName,
//             itemName: job.itemName,
//             cost: job.cost,
//             stages: {
//               create: job.stages.map((stage) => ({
//                 totalCost: stage.totalCost || "0",
//                 name: stage.name,
//                 typePayment: stage.typePayment,
//                 dateStart: stage.dateStart,
//                 cost: stage.cost,
//                 prePay: stage.prePay,
//                 postPay: stage.postPay,
//                 payment: stage.payment,
//                 payed: stage.payed,
//                 date: stage.date,
//                 workStarted: stage.workStarted,
//                 paymentDate: stage.paymentDate,
//                 endPaymentPrice: stage.endPaymentPrice,
//                 endPaymentDate: stage.endPaymentDate,
//                 firstPaymentPayed: stage.firstPaymentPayed,
//                 startWorkDate: stage.startWorkDate,
//                 isStartWork: stage.isStartWork,
//                 firstPaymentDate: stage.firstPaymentDate,
//                 fisrtPaymentPrice: stage.fisrtPaymentPrice,
//                 endPaymentPayed: stage.endPaymentPayed,
//                 endWorkDate: stage.endWorkDate,
//                 isEndWork: stage.isEndWork,
//                 userId,
//               })),
//             },
//             userId,
//           })),
//         },
//         userId,
//       },
//     });

//     // Additional logic for creating StudentSchedule records
//     // ...

//     const filesIds =
//       files.length > 0 ? await upload(files, userId, "client") : [];
//     const audioIds =
//       audios.length > 0 ? await upload(audios, userId, "client/audio") : [];

//     const updateClient = await db.client.update({
//       where: { id: newClient.id },
//       data: { files: [...filesIds, ...audioIds] },
//     });

//     res.json(updateClient);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// /**
//  * Fetches a client by ID.
//  *
//  * @param {Request} req - The request object.
//  * @param {Response} res - The response object.
//  */
// router.get("/getClientById/:clientId", async (req: Request, res: Response) => {
//   try {
//     const { clientId } = req.params;
//     const { token } = req.query;

//     const tokenData = await db.token.findFirst({
//       where: { token },
//     });

//     if (!tokenData) {
//       return res.status(400).json({ error: "Invalid token" });
//     }

//     const userId = tokenData.userId;

//     const client = await db.client.findUnique({
//       where: { userId, id: clientId },
//       select: {
//         id: true,
//         nameStudent: true,
//         phoneNumber: true,
//         email: true,
//         files: true,
//         commentClient: true,
//         costStudent: true,
//         isArchived: true,
//         jobs: {
//           select: {
//             id: true,
//             jobName: true,
//             stages: true,
//             client: true,
//             clientId: true,
//             cost: true,
//             itemName: true,
//             userId: true,
//           },
//         },
//       },
//     });

//     const dbFiles = await db.file.findMany({
//       where: { id: { in: client.files } },
//       select: {
//         id: true,
//         name: true,
//         path: true,
//         userId: true,
//         extraType: true,
//         size: true,
//         type: true,
//       },
//     });

//     const dbFilesJson = JSON.parse(JSON.stringify(dbFiles));
//     const filesDB = dbFilesJson.filter((file) => file.extraType === "client");
//     const audiosDB = dbFilesJson.filter(
//       (file) => file.extraType === "client/audio"
//     );

//     client.files = filesDB;
//     client.audios = audiosDB;

//     res.json(client);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// /**
//  * Updates a client.
//  *
//  * @param {Request} req - The request object.
//  * @param {Response} res - The response object.
//  */
// router.put("/updateClient/:id", async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const {
//       nameStudent,
//       phoneNumber,
//       email,
//       commentClient,
//       token,
//       files,
//       audios,
//       jobs,
//       costStudent,
//     } = req.body;

//     const tokenData = await db.token.findFirst({
//       where: { token },
//     });

//     if (!tokenData) {
//       return res.status(400).json({ error: "Invalid token" });
//     }

//     const userId = tokenData.userId;

//     const existingClient = await db.client.findUnique({
//       where: { id, userId },
//       select: { files: true },
//     });

//     let updatedFiles = existingClient.files || [];

//     if (files.length > 0) {
//       const fileIds = await upload(files, userId, "client");
//       updatedFiles = [...updatedFiles, ...fileIds];
//     }

//     if (audios.length > 0) {
//       const audioIds = await upload(audios, userId, "client/audio");
//       updatedFiles = [...updatedFiles, ...audioIds];
//     }

//     const updatedClient = await db.client.update({
//       where: { id, userId },
//       data: {
//         nameStudent,
//         phoneNumber,
//         email,
//         commentClient,
//         jobs: { update: jobs },
//         costStudent,
//         files: updatedFiles,
//       },
//     });

//     res.json(updatedClient);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// /**
//  * Fetches the list of clients.
//  *
//  * @param {Request} req - The request object.
//  * @param {Response} res - The response object.
//  */
// router.get("/getClientList", async (req: Request, res: Response) => {
//   try {
//     const { token } = req.query;

//     const tokenData = await db.token.findFirst({
//       where: { token },
//     });

//     if (!tokenData) {
//       return res.status(400).json({ error: "Invalid token" });
//     }

//     const userId = tokenData.userId;

//     const clients = await db.client.findMany({
//       where: { userId },
//       select: {
//         id: true,
//         nameStudent: true,
//         phoneNumber: true,
//         email: true,
//         costStudent: true,
//         isArchived: true,
//         commentClient: true,
//         jobs: {
//           select: {
//             id: true,
//             jobName: true,
//             itemName: true,
//             cost: true,
//             stages: true,
//           },
//         },
//       },
//     });

//     res.json(clients);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// /**
//  * Fetches clients by date.
//  *
//  * @param {Request} req - The request object.
//  * @param {Response} res - The response object.
//  */
// router.get("/getClientsByDate", async (req: Request, res: Response) => {
//   try {
//     const { token, day, month, year } = req.query;

//     const tokenData = await db.token.findFirst({
//       where: { token },
//     });

//     if (!tokenData) {
//       return res.status(400).json({ error: "Invalid token" });
//     }

//     const userId = tokenData.userId;

//     const clients = await db.studentSchedule.findMany({
//       where: {
//         userId,
//         day: day.toString(),
//         month: month.toString(),
//         year: year.toString(),
//         NOT: { clientId: null },
//       },
//       select: {
//         id: true,
//         itemName: true,
//         studentName: true,
//         totalWorkPrice: true,
//         typePayment: true,
//         workTime: true,
//         date: true,
//         day: true,
//         month: true,
//         year: true,
//         studentId: true,
//         client: true,
//       },
//     });

//     res.json(clients);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// export default router;
