import io from "./socket";
import { login } from "./auth/login";
import { register } from "./auth/register";
import db from "./db";

import {
  calendar,
  getByClientScheduleId,
  getByGroupId,
  getByGroupScheduleId,
} from "./calendar/calendar";
import {
  cancelLesson,
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
import { addStudent } from "./cards/student/add";
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
  getAllStatisticsData,
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
  deleteLink,
  getLinkById,
  getLinksByLinkedId,
  getLinksByTag,
  getLinksByUser,
} from "./cards/links";

io.on("connection", (socket) => {
  console.log("a user connected");

  //hooks
  socket.on("login", (data) => login(data, socket));
  socket.on("register", (data) => register(data, socket));
  socket.on("getMonth", (data) => calendar(data, socket));

  socket.on("addStudent", (data) => addStudent(data, socket));
  socket.on("addGroup", (data) => addGroup(data, socket));
  socket.on("addClient", (data) => addClient(data, socket));

  socket.on("getStudentList", (token) => getStudentList(token, socket));
  socket.on("getStudentsByDate", (token) => getStudentsByDate(token, socket));
  socket.on("getUserData", (token) => getUserData(token, socket));
  socket.on("getGroupByStudentId", (data) => getGroupByStudentId(data, socket));
  socket.on("getAllIdStudents", (data) => getAllIdStudents(data, socket));
  socket.on("getGroupList", (data) => getGroupList(data, socket));
  socket.on("getTableData", (data) => getTableData(data, socket));
  socket.on("deleteStudent", (data) => deleteStudent(data, socket));
  socket.on("studentToArhive", (data) => studentToArhive(data, socket));

  socket.on("clientToArhive", (data) => clientToArhive(data, socket));
  socket.on("deleteClient", (data) => deleteClient(data, socket));
  socket.on("getClientList", (data) => getClientList(data, socket));
  socket.on("groupToArchive", (data) => groupToArchive(data, socket));
  socket.on("deleteGroup", (data) => deleteGroup(data, socket));
  socket.on("getClientsByDate", (data) => getClientsByDate(data, socket));
  socket.on("getGroupById", (data) => getGroupById(data, socket));
  socket.on("updateClient", (data) => updateClient(data, socket));
  socket.on("getClientById", (data) => getClientById(data, socket));
  socket.on("getGroupsByDate", (data) => getGroupsByDate(data, socket));
  socket.on("getClientTableData", (token) => getClientTableData(token, socket));

  socket.on("getStudentFinanceData", (data) =>
    getStudentFinanceData(data, socket)
  );
  socket.on("getStudentCountData", (data) => getStudentCountData(data, socket));
  socket.on("getStudentLessonsData", (data) =>
    getStudentLessonsData(data, socket)
  );
  socket.on("getClientFinanceData", (data) =>
    getClientFinanceData(data, socket)
  );
  socket.on("getClientCountData", (data) => getClientCountData(data, socket));
  socket.on("getClientWorksData", (data) => getClientWorksData(data, socket));
  socket.on("getStudentClientComparisonData", (data) =>
    getStudentClientComparisonData(data, socket)
  );
  socket.on("fetchGroupsByDate", (data) => fetchGroupsByDate(data, socket));
  //modifyGroupSchedule
  socket.on("modifyGroupSchedule", (data) => modifyGroupSchedule(data, socket));

  socket.on("createStudentSchedule", (data) =>
    createStudentSchedule(data, socket)
  );

  socket.on("getAllItemsIdsAndNames", (token) =>
    getAllItemsIdsAndNames(token, socket)
  );

  socket.on("updateStudentSchedule", (data) =>
    updateStudentSchedule(data, socket)
  );

  socket.on("createLink", (data) => createLink(data, socket));
  socket.on("getLinksByTag", (data) => getLinksByTag(data, socket));
  socket.on("getLinkById", (data) => getLinkById(data, socket));
  socket.on("getLinksByUser", (token) => getLinksByUser(token, socket));
  socket.on("getLinksByLinkedId", (data) => getLinksByLinkedId(data, socket));

  socket.on("cancelLesson", (data) => cancelLesson(data, socket));

  // socket.on("getAllStatisticsData", (data) =>
  //   getAllStatisticsData(data, socket)
  // );

  // socket.on("updateStudents", (data) => updateStudents(data, socket));
  socket.on("updateStudentAndItems", (data) =>
    updateStudentAndItems(data, socket)
  );
  socket.on("updateGroup", (data) => updateGroup(data, socket));
  socket.on("uploadUsersFiles", (data) => uploadUsersFiles(data, socket));
  socket.on("deleteAudio", (data) => deleteAudio(data, socket)); // files & audio

  socket.on("setUserData", (data) => setUserData(data, socket));

  socket.on("getByGroupId", (data) => getByGroupId(data, socket));
  socket.on("getByClientScheduleId", (data) =>
    getByClientScheduleId(data, socket)
  );
  socket.on("getByGroupScheduleId", (data) =>
    getByGroupScheduleId(data, socket)
  );

  socket.on("deleteLink", (data) => deleteLink(data, socket));
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
