import io from "../socket";
import db from "../db";
import { webcrypto } from "crypto";

export const login = async (data) => {
  //   console.log("login", data);

  //crypt password
  const hash = String(
    await webcrypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(data.password)
    )
  );

  const user = await db.user.findUnique({
    where: {
      name: data.login,
      password: hash,
    },
  });

  if (!user) {
    return io.emit("login", {
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

  return io.emit("login", { token: token.token, message: "Вход выполнен" });
};
