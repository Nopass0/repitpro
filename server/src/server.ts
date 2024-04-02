import io from "./socket";
import { login } from "./auth/login";
import { register } from "./auth/register";
import db from "./db";
import { upload } from "./files/files";
import { calendar } from "./calendar/calendar";
import { addStudent, getStudentList } from "./cards/student";
import { getUserData, setUserData } from "./auth/user";

io.on("connection", (socket) => {
  console.log("a user connected");

  //hooks
  socket.on("login", (data) => login(data));
  socket.on("register", (data) => register(data));
  socket.on("upload", (file, callback) => upload(file, callback));
  socket.on("getMonth", (data) => calendar(data));
  socket.on("addStudent", (data) => addStudent(data));
  socket.on("getStudentList", (token) => getStudentList(token));
  socket.on("getUserData", (token) => getUserData(token));
  socket.on("setUserData", (data) => setUserData(data));

  //check account
  socket.on("checkAccount", async (data) => {
    let token = await db.token.findFirst({
      where: {
        token: data,
      },
    });

    if (!token) return socket.emit("checkAccount", { status: "error" });

    return socket.emit("checkAccount", { status: "ok" });
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
