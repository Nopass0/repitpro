import express from "express";
import cors from "cors";
import api from "./api";
import { Server } from "socket.io";

const SOCKET_TIMEOUT = 60000;
const PING_INTERVAL = 25000;
const PING_TIMEOUT = 20000;

// Настройка CORS для Express
// api.use(
//   cors({
//     origin: "*", // Настройте по необходимости
//     methods: ["GET", "POST"],
//     allowedHeaders: ["Content-Type"],
//     credentials: true,
//   })
// );

api.use(express.static(__dirname + "/public"));

const server = api.listen(3000, () => {
  console.log("Application started on port 3000!");
});

// Настройка CORS для Socket.IO
// const io = new Server(server, {
//   cors: {
//     origin: "*", // Настройте по необходимости
//     methods: ["GET", "POST"],
//     allowedHeaders: ["Content-Type"],
//     credentials: true,
//   },
// });

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: ["http://localhost", "http://localhost:80", "https://repitpro.ru"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
  pingInterval: PING_INTERVAL,
  pingTimeout: PING_TIMEOUT,
  connectTimeout: SOCKET_TIMEOUT,
  allowEIO3: true,
  transports: ["websocket", "polling"],
  allowUpgrades: true,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e8, // 100 MB
  path: "/socket.io",
  // Cookie configuration
  cookie: {
    name: "io",
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  },
});

export default io;
