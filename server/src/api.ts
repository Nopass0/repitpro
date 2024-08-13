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

api.get("/occupied-time-slots", async (req, res) => {
  try {
    const { token, startDate, endDate } = req.query;

    if (!token || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const _token = await db.token.findFirst({
      where: { token: token as string },
      include: { token: true },
    });

    // Validate token (you may want to implement a more robust authentication system)
    const user = await db.token.findUnique({
      where: { token: _token.token },
      include: { user: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const start = parseISO(startDate as string);
    const end = parseISO(endDate as string);

    // Get all days between start and end dates
    const days = eachDayOfInterval({ start, end });

    // Fetch all items for the user within the date range
    const items = await db.item.findMany({
      where: {
        userId: user.userId,
        startLesson: {
          gte: start,
          lte: end,
        },
      },
      select: {
        timeLinesArray: true,
        startLesson: true,
        endLesson: true,
      },
    });

    // Process the occupied time slots
    const occupiedTimeSlots = days.map((day) => {
      const dayOfWeek = format(day, "EEE").toLowerCase();
      const daySlots = items.flatMap((item) => {
        const timelines = item.timeLinesArray as any[];
        const matchingTimeline = timelines.find(
          (tl) => tl.day.toLowerCase() === dayOfWeek && tl.active
        );

        if (matchingTimeline) {
          return {
            date: format(day, "yyyy-MM-dd"),
            startTime: `${matchingTimeline.startTime.hour}:${matchingTimeline.startTime.minute}`,
            endTime: `${matchingTimeline.endTime.hour}:${matchingTimeline.endTime.minute}`,
          };
        }
        return [];
      });

      return {
        date: format(day, "yyyy-MM-dd"),
        slots: daySlots,
      };
    });

    res.json(occupiedTimeSlots);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default api;
