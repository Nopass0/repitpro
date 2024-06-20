import db from "../db";
import api from "../api";
import bcrypt from "bcrypt";

import { Request, Response } from "express";

api.post("/login", async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;

    const user = await db.user.findUnique({
      where: {
        name: login,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "Пользователь не найден",
      });
    }

    const hash = bcrypt.hashSync(user.password, 3);

    if (await bcrypt.compare(password, hash)) {
      return res.status(401).json({
        error: "Неверное имя пользователя или пароль",
      });
    }

    await db.token.deleteMany({
      where: {
        userId: user.id,
      },
    });

    const token = await db.token.create({
      data: {
        userId: user.id,
        token:
          Math.random().toString(36).substring(2) +
          Math.random().toString(36).substring(2),
      },
    });

    return res
      .status(200)
      .json({ token: token.token, message: "Вход выполнен" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});
