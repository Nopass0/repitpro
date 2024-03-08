import io from "../socket";
import db from "../db";
import { webcrypto } from "crypto";

export const register = async (data) => {
  //   console.log("login", data);

  //crypt password
  // const hash = await webcrypto.subtle.digest(
  //   "SHA-256",
  //   new TextEncoder().encode(data.password)
  // );

  const hash = await new TextEncoder().encode(data.password).toString();
  const user = await db.user.findUnique({
    where: {
      name: data.login,
      password: hash,
    },
  });

  if (user) {
    return io.emit("register", {
      error: "Пользователь с таким именем уже существует",
    });
  }

  const userCreated = await db.user.create({
    data: {
      name: data.login,
      password: hash,
    },
  });

  //create new token
  const token = await db.token.create({
    data: {
      userId: userCreated.id,
      token:
        Math.random().toString(36).substring(2) +
        Math.random().toString(36).substring(2),
    },
  });

  return io.emit("register", {
    token: token.token,
    message: "Пользователь создан",
  });
};
