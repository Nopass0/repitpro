import io from "./socket";
import { login } from "./auth/login";
import { register } from "./auth/register";
import db from "./db";
import { upload } from "./files/files";
import { calendar } from "./calendar/calendar";
import {
  addStudent,
  deleteStudent,
  getAllIdStudents,
  getGroupByStudentId,
  getStudentList,
  getStudentsByDate,
  getTableData,
  studentToArhive,
  updateStudentAndItems,
  updateStudentSchedule,
  // updateStudents,
} from "./cards/student";
import { getUserData, setUserData } from "./auth/user";
import { addGroup, getGroupList } from "./cards/group";
import { addClient } from "./cards/client";

io.on("connection", (socket) => {
  console.log("a user connected");

  //hooks
  socket.on("login", (data) => login(data));
  socket.on("register", (data) => register(data));
  socket.on("upload", (file, callback) => upload(file, callback));
  socket.on("getMonth", (data) => calendar(data));

  socket.on("addStudent", (data) => addStudent(data));
  socket.on("addGroup", (data) => addGroup(data));
  socket.on("addClient", (data) => addClient(data));

  socket.on("getStudentList", (token) => getStudentList(token));
  socket.on("getStudentsByDate", (token) => getStudentsByDate(token));
  socket.on("getUserData", (token) => getUserData(token));
  socket.on("getGroupByStudentId", (data) => getGroupByStudentId(data));
  socket.on("getAllIdStudents", (data) => getAllIdStudents(data));
  socket.on("getGroupList", (data) => getGroupList(data));
  socket.on("getTableData", (data) => getTableData(data));
  socket.on("deleteStudent", (data) => deleteStudent(data));
  socket.on("studentToArhive", (data) => studentToArhive(data));

  socket.on("updateStudentSchedule", (data) => updateStudentSchedule(data));
  // socket.on("updateStudents", (data) => updateStudents(data));
  socket.on("updateStudentAndItems", (data) => updateStudentAndItems(data));

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
