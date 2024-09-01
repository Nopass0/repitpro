import {
  parseISO,
  eachDayOfInterval,
  format,
  isWithinInterval,
} from "date-fns";
import db from "./db";
import express from "express";
import { join } from "path";
import cors from "cors";

const api = express();
api.use(cors());

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

api.get("/check-free-slots", async (req, res) => {
  try {
    const { token, startDate, endDate } = req.query;

    console.log("Received request:", token, startDate, endDate);

    if (!token || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    let tokenRecord;
    try {
      tokenRecord = await db.token.findFirst({
        where: {
          token: token as string,
        },
      });
      console.log("Token record:", tokenRecord);

      if (!tokenRecord || !tokenRecord.userId) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const start = parseISO(startDate as string);
      const end = parseISO(endDate as string);

      const studentSchedules = await db.studentSchedule.findMany({
        where: {
          userId: tokenRecord.userId,
          OR: [
            {
              year: {
                gte: start.getFullYear().toString(),
                lte: end.getFullYear().toString(),
              },
              month: {
                gte: (start.getMonth() + 1).toString(),
                lte: (end.getMonth() + 1).toString(),
              },
              day: {
                gte: start.getDate().toString(),
                lte: end.getDate().toString(),
              },
            },
            {
              createdAt: {
                gte: start,
                lte: end,
              },
            },
          ],
        },
      });

      console.log("Found student schedules:", studentSchedules.length);

      const occupiedSlots = studentSchedules.flatMap(
        (schedule) => schedule.timeLinesArray
      );

      console.log("Occupied slots:", occupiedSlots.length);

      const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
      const freeSlots = daysOfWeek.map((day) => ({
        day,
        freeTime: calculateFreeTime(
          occupiedSlots.filter((slot) => slot.day === day)
        ),
      }));

      res.json({ freeSlots });
    } catch (error) {
      console.error("Error processing request:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } catch (error) {
    console.error("Error in check-free-slots:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

function calculateFreeTime(occupiedSlots) {
  // Convert occupied slots to minutes for easier calculation
  const occupiedMinutes = occupiedSlots
    .map((slot) => ({
      start: slot.startTime.hour * 60 + slot.startTime.minute,
      end: slot.endTime.hour * 60 + slot.endTime.minute,
    }))
    .sort((a, b) => a.start - b.start);

  // Initialize the day as completely free
  let freeMinutes = [{ start: 0, end: 24 * 60 - 1 }];

  // Remove occupied time from free time
  for (let occupied of occupiedMinutes) {
    freeMinutes = freeMinutes.flatMap((free) => {
      if (occupied.start <= free.start && occupied.end >= free.end) {
        // Occupied slot completely covers free slot
        return [];
      } else if (occupied.start > free.start && occupied.end < free.end) {
        // Occupied slot splits free slot
        return [
          { start: free.start, end: occupied.start - 1 },
          { start: occupied.end + 1, end: free.end },
        ];
      } else if (occupied.start <= free.start && occupied.end > free.start) {
        // Occupied slot covers start of free slot
        return [{ start: occupied.end + 1, end: free.end }];
      } else if (occupied.start < free.end && occupied.end >= free.end) {
        // Occupied slot covers end of free slot
        return [{ start: free.start, end: occupied.start - 1 }];
      } else {
        // Occupied slot doesn't overlap with this free slot
        return [free];
      }
    });
  }

  // Convert minutes back to hour/minute format
  return freeMinutes.map((slot) => ({
    start: {
      hour: Math.floor(slot.start / 60),
      minute: slot.start % 60,
    },
    end: {
      hour: Math.floor(slot.end / 60),
      minute: slot.end % 60,
    },
  }));
}

export default api;
