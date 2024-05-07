import db from "db";
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

export default api;
