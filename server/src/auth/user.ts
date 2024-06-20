import { IToken, IUserCredentials } from "types";
import api from "../api";
import db from "../db";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { upload } from "files/files";

api.get("/getUserData", async (req: Request, res: Response) => {
  const _token = req.query.token as IToken["token"];
  try {
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

    const files = await db.file.findMany({
      where: {
        id: {
          in: user.filesIds,
        },
        extraType: "user",
      },
    });

    console.log(user);
    res.json({
      userName: user.name,
      email: user.email,
      files: files,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

api.post("/setUserData", async (req: Request, res: Response) => {
  const data = req.body;
  console.log("Change user data", data);
  try {
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

    let newData: IUserCredentials;
    if (name) newData.name = name;
    if (email) newData.email = email;
    if (password) newData.password = hash;

    await db.user.update({
      where: {
        id: user.id,
      },
      data: newData,
    });

    res.json({ userName: user.name, email: user.email });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

api.post("/uploadUsersFiles", async (req: Request, res: Response) => {
  const { token, files } = req.body;
  try {
    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    const userId = token_.userId;
    let filesIds = [];
    if (files.length > 0) {
      filesIds = await upload(files, userId, "user", (ids) => {
        filesIds = ids;
      });
    }

    await db.user.update({
      where: {
        id: userId,
      },
      data: {
        filesIds: filesIds,
      },
    });

    res.status(200).send("Files uploaded successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
