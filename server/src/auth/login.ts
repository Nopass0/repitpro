import io from "../socket";
import db from "../db";
import bcrypt from "bcrypt";

export const login = async (data, socket) => {
  const user = await db.user.findUnique({
    where: {
      name: data.login,
    },
  });

  if (!user) {
    return socket.emit("login", {
      error: "Пользователь не найден",
    });
  }

  const hash = bcrypt.hashSync(user.password, 3);

  if (await bcrypt.compare(data.password, hash)) {
    return socket.emit("login", {
      error: "Неверное имя пользователя или пароль",
    });
  }

  //delete all user's tokens
  await db.token.deleteMany({
    where: {
      userId: user.id,
    },
  });

  //create new token
  const token = await db.token.create({
    data: {
      userId: user.id,
      token:
        Math.random().toString(36).substring(2) +
        Math.random().toString(36).substring(2),
    },
  });

  return socket.emit("login", { token: token.token, message: "Вход выполнен" });
};
