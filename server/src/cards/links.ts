import { Prisma, PrismaClient } from "@prisma/client";
import {
  IStudentCardResponse,
  ITimeLine,
  IItemCard,
  IUploadFiles,
} from "../types";
import db from "../db";
import io from "../socket";
import { addDays, differenceInDays, isWithinInterval } from "date-fns";
import { randomBytes } from "crypto";
import { join } from "path";
import { mkdir, mkdirSync, writeFileSync } from "fs";
import { promises as fsPromises } from "fs";
import mime from "mime-types";
import { getBufferByFilePath, upload, uploadFiles } from "../files/files";
import { cache, strongCache } from "utils/Cache";
import { deleteFileById } from "utils/filesystem";

export const createLink = async (data: any) => {
  try {
    const { tag, linkedId, link, token } = data;

    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });

    const userId = token_.userId;

    const createdLink = db.link.create({
      data: {
        tag,
        linkedId,
        link,
        userId,
      },
    });

    io.emit("createLink", { message: "ok" });
  } catch (err) {
    console.error(err);
    io.emit("createLink", { message: `Error: ${err}` });
  }
};

export const getLinksByTag = async (data: { tag: string; token: string }) => {
  try {
    const { tag, token } = data;
    const token_ = await db.token.findFirst({
      where: { token },
    });

    const userId = token_.userId;

    const links = await db.link.findMany({
      where: { tag, userId },
    });

    io.emit("getLinksByTag", { links });
  } catch (err) {
    console.error(err);
    io.emit("getLinksByTag", { message: `Error: ${err}` });
  }
};

export const getLinkById = async (data: { id: string; token: string }) => {
  try {
    const { id, token } = data;
    const token_ = await db.token.findFirst({
      where: { token },
    });

    const userId = token_.userId;

    const link = await db.link.findFirst({
      where: { id, userId },
    });

    io.emit("getLinkById", { link });
  } catch (err) {
    console.error(err);
    io.emit("getLinkById", { message: `Error: ${err}` });
  }
};

export const getLinksByUser = async (token: string) => {
  try {
    const token_ = await db.token.findFirst({
      where: { token },
    });

    const userId = token_.userId;

    const links = await db.link.findMany({
      where: { userId },
    });

    io.emit("getLinksByUser", { links });
  } catch (err) {
    console.error(err);
    io.emit("getLinksByUser", { message: `Error: ${err}` });
  }
};

export const getLinksByLinkedId = async (data: {
  linkedId: string;
  token: string;
}) => {
  try {
    const { linkedId, token } = data;
    const token_ = await db.token.findFirst({
      where: { token },
    });

    const userId = token_.userId;

    const links = await db.link.findMany({
      where: { linkedId, userId },
    });

    io.emit("getLinksByLinkedId", { links });
  } catch (err) {
    console.error(err);
    io.emit("getLinksByLinkedId", { message: `Error: ${err}` });
  }
};

export const getLinksByLinkedIdAndTag = async (data: {
  linkedId: string;
  tag: string;
  token: string;
}) => {
  try {
    const { linkedId, tag, token } = data;
    const token_ = await db.token.findFirst({
      where: { token },
    });

    const userId = token_.userId;

    const links = await db.link.findMany({
      where: { linkedId, tag, userId },
    });

    io.emit("getLinksByLinkedIdAndTag", { links });
  } catch (err) {
    console.error(err);
    io.emit("getLinksByLinkedIdAndTag", { message: `Error: ${err}` });
  }
};
