import express from "express";
import cors from "cors";
import api from "./api";
import { Server } from "socket.io";

// Настройка CORS для Express
api.use(
  cors({
    origin: "*", // Настройте по необходимости
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

api.use(express.static(__dirname + "/public"));

const server = api.listen(3000, () => {
  console.log("Application started on port 3000!");
});

// Настройка CORS для Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Настройте по необходимости
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

export default io;
