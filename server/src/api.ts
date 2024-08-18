import { parseISO, eachDayOfInterval, format } from "date-fns";
import db from "./db";
import express from "express";
import { join } from "path";

const api = express();

// Get files link
api.get("/files/:id", async (req, res) => {
  try {
    const file = await db.file.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        path: true,
      },
    });

    if (!file) {
      return res.status(404).send("File not found");
    }

    const fullPath = join(__dirname.replace("src", ""), file.path); // Using absolute path
    console.log("Full Path:", fullPath);

    res.sendFile(fullPath);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// api.get("/check-occupied-slots", async (req, res) => {
//   try {
//     const { token, startDate, endDate, itemId } = req.query;

//     if (!token || !startDate || !endDate) {
//       return res.status(400).json({ error: "Missing required parameters" });
//     }

//     const tokenRecord = await db.token.findUnique({
//       where: { token: token as string },
//       include: { user: true },
//     });

//     if (!tokenRecord || !tokenRecord.user) {
//       return res.status(401).json({ error: "Invalid token" });
//     }

//     const start = parseISO(startDate as string);
//     const end = parseISO(endDate as string);

//     // Fetch all StudentSchedule entries for the user within the date range
//     const schedules = await db.studentSchedule.findMany({
//       where: {
//         userId: tokenRecord.user.id,
//         isArchived: false,
//         isCancel: false,
//         OR: [
//           {
//             day: { in: eachDayOfInterval({ start, end }).map(d => format(d, 'dd')) },
//             month: { in: eachDayOfInterval({ start, end }).map(d => format(d, 'MM')) },
//             year: { in: eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy')) },
//           }
//         ],
//       },
//       select: {
//         id: true,
//         day: true,
//         month: true,
//         year: true,
//         studentName: true,
//         itemName: true,
//         timeLinesArray: true,
//         typeLesson: true,
//         itemId: true,
//       }
//     });

//     // Process the occupied time slots
//     const occupiedTimeSlots = schedules.map(schedule => {
//       const scheduleDate = new Date(`${schedule.year}-${schedule.month}-${schedule.day}`);
//       return {
//         id: schedule.id,
//         date: format(scheduleDate, 'yyyy-MM-dd'),
//         studentName: schedule.studentName,
//         itemName: schedule.itemName,
//         typeLesson: schedule.typeLesson,
//         timelines: schedule.timeLinesArray,
//         itemId: schedule.itemId,
//       };
//     });

//     res.json(occupiedTimeSlots);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

export default api;
