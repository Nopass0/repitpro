import io from "./socket";
import { login } from "./auth/login";
import { register } from "./auth/register";
import db from "./db";
import { strongCache, cache } from "utils/Cache";

import {
  calendar,
  getByClientScheduleId,
  getByGroupId,
  getByGroupScheduleId,
} from "./calendar/calendar";
import {
  addStudent,
  createStudentSchedule,
  deleteAudio,
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
import { getUserData, setUserData, uploadUsersFiles } from "./auth/user";
import {
  addGroup,
  deleteGroup,
  fetchGroupsByDate,
  getGroupById,
  getGroupList,
  getGroupsByDate,
  groupToArchive,
  modifyGroupSchedule,
  updateGroup,
} from "./cards/group";
import {
  addClient,
  clientToArhive,
  deleteClient,
  getClientById,
  getClientList,
  getClientsByDate,
  getClientTableData,
  updateClient,
} from "./cards/client";
import {
  getAllItemsIdsAndNames,
  getClientCountData,
  getClientFinanceData,
  getClientWorksData,
  getStudentClientComparisonData,
  getStudentCountData,
  getStudentFinanceData,
  getStudentLessonsData,
} from "./cards/statistics";
import {
  createLink,
  getLinkById,
  getLinksByLinkedId,
  getLinksByTag,
  getLinksByUser,
} from "cards/links";

io.on("connection", (socket) => {
  console.log("a user connected");

  //hooks
  socket.on("login", (data) => login(data));
  socket.on("register", (data) => register(data));
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

  socket.on("clientToArhive", (data) => clientToArhive(data));
  socket.on("deleteClient", (data) => deleteClient(data));
  socket.on("getClientList", (data) => getClientList(data));
  socket.on("groupToArchive", (data) => groupToArchive(data));
  socket.on("deleteGroup", (data) => deleteGroup(data));
  socket.on("getClientsByDate", (data) => getClientsByDate(data));
  socket.on("getGroupById", (data) => getGroupById(data));
  socket.on("updateClient", (data) => updateClient(data));
  socket.on("getClientById", (data) => getClientById(data));
  socket.on("getGroupsByDate", (data) => getGroupsByDate(data));
  socket.on("getClientTableData", (token) => getClientTableData(token));

  socket.on("getStudentFinanceData", (data) => getStudentFinanceData(data));
  socket.on("getStudentCountData", (data) => getStudentCountData(data));
  socket.on("getStudentLessonsData", (data) => getStudentLessonsData(data));
  socket.on("getClientFinanceData", (data) => getClientFinanceData(data));
  socket.on("getClientCountData", (data) => getClientCountData(data));
  socket.on("getClientWorksData", (data) => getClientWorksData(data));
  socket.on("getStudentClientComparisonData", (data) =>
    getStudentClientComparisonData(data)
  );
  socket.on("fetchGroupsByDate", (data) => fetchGroupsByDate(data));
  //modifyGroupSchedule
  socket.on("modifyGroupSchedule", (data) => modifyGroupSchedule(data));

  socket.on("createStudentSchedule", (data) => createStudentSchedule(data));

  socket.on("getAllItemsIdsAndNames", (token) => getAllItemsIdsAndNames(token));

  socket.on("updateStudentSchedule", (data) => updateStudentSchedule(data));

  socket.on("createLink", (data) => createLink(data));
  socket.on("getLinksByTag", (data) => getLinksByTag(data));
  socket.on("getLinkById", (data) => getLinkById(data));
  socket.on("getLinksByUser", (token) => getLinksByUser(token));
  socket.on("getLinksByLinkedId", (data) => getLinksByLinkedId(data));

  // socket.on("updateStudents", (data) => updateStudents(data));
  socket.on("updateStudentAndItems", (data) => updateStudentAndItems(data));
  socket.on("updateGroup", (data) => updateGroup(data));
  socket.on("uploadUsersFiles", (data) => uploadUsersFiles(data));
  socket.on("deleteAudio", (data) => deleteAudio(data)); // files & audio

  socket.on("setUserData", (data) => setUserData(data));

  socket.on("getByGroupId", (data) => getByGroupId(data));
  socket.on("getByClientScheduleId", (data) => getByClientScheduleId(data));
  socket.on("getByGroupScheduleId", (data) => getByGroupScheduleId(data));
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
