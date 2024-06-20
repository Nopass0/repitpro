import api from "../api";
import db from "../db";
import { Request, Response } from "express";
import bcrypt from "bcrypt";

api.post("/register", async (req: Request, res: Response) => {
  const { login, password } = req.body;
  const hash = bcrypt.hashSync(password, 3);

  const user = await db.user.findUnique({
    where: {
      name: login,
    },
  });

  if (user) {
    return res.status(409).json({
      error: "Пользователь с таким именем уже существует",
    });
  }

  let reg_login = /^[a-zA-Z0-9]+$/;
  if (!reg_login.test(login) || login.length < 5) {
    return res.status(400).json({
      error:
        "Логин должен состоять только из букв латинского алфавита и цифр. Длина должна быть не менее 5 символов",
    });
  }

  let reg =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  let example = "1q2w3e4r5t6y7u8i9o0p";
  if (password.length < 8) {
    return res.status(400).json({
      error:
        "Пароль должен состоять из 8-ми или более символов, включая строчные и заглавные буквы, цифры и специальные символы. Например: 1q2w3e4r5t6y7u8i9o0p",
    });
  }

  if (password === example) {
    return res.status(400).json({
      error: "Пример пароля не может быть использован для регистрации",
    });
  }

  const userCreated = await db.user.create({
    data: {
      name: login,
      password: hash,
    },
  });

  const token = await db.token.create({
    data: {
      userId: userCreated.id,
      token:
        Math.random().toString(36).substring(2) +
        Math.random().toString(36).substring(2),
    },
  });

  return res.status(201).json({
    token: token.token,
    message: "Пользователь создан",
  });
});
