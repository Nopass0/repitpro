import io from "../socket";
import db from "../db";
import bcrypt from "bcrypt";

export const getUserData = async (_token) => {
  console.log(_token);
  const token = await db.token.findFirst({
    where: {
      token: _token,
    },
  });

  const user = await db.user.findUnique({
    where: {
      id: token.userId,
    },
  });

  console.log(user);
  return io.emit("getUserData", { userName: user.name, email: user.email });
};

export const setUserData = async (data) => {
  console.log("Change user data", data);
  const token = await db.token.findFirst({
    where: {
      token: data.token,
    },
  });

  const user = await db.user.findUnique({
    where: {
      id: token.userId,
    },
  });

  const { name, email, password } = data;

  const hash = bcrypt.hashSync(password, 3);

  let newData: any = {};

  if (name) {
    newData.name = name;
  }
  if (email) {
    newData.email = email;
  }
  if (password) {
    newData.password = hash;
  }

  await db.user.update({
    where: {
      id: user.id,
    },
    data: newData,
  });

  return io.emit("getUserData", { userName: user.name, email: user.email });
};
