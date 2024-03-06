import api from "./api";
import { Server } from "socket.io";

const server = api.listen(3000, () => {
  console.log("Application started on port 3000!");
});

const io = new Server().listen(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

export default io;
