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
    const { tag, linkedId, links, token } = data;

    const token_ = await db.token.findFirst({
      where: {
        token,
      },
    });
    console.log(
      tag,
      linkedId,
      links,
      token,
      "------------------- LINKS DATA ------------------"
    );
    const userId = token_.userId;
    const isTagExist = await db.link.findMany({
      where: {
        tag,
        linkedId,
        userId,
      },
    });
    console.log(
      isTagExist,
      "------------------- IS TAG EXIST ------------------"
    );
    if (isTagExist.length > 0) {
      const updateLink = await db.link.update({
        where: {
          id: isTagExist[0].id,
        },
        data: {
          links,
        },
      });
      console.log(
        updateLink,
        "------------------- UPDATE LINKS DATA ------------------"
      );
      return;
    } else {
      const createdLink = await db.link.create({
        data: {
          tag,
          linkedId,
          links,
          userId,
        },
      });
      console.log(
        createdLink,
        "------------------- CREATED LINKS DATA ------------------"
      );
    }
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

    const links = await db.link.findFirst({
      where: { linkedId, userId },
    });

    io.emit("getLinksByLinkedId", {
      links: JSON.parse(JSON.stringify(links)).links,
    });
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


export const deleteLinksByLinkedId = async (data: {
  linkedId: string;
  token: string;
}) => {
  try {
    const { linkedId, token } = data;
    const token_ = await db.token.findFirst({
      where: { token },
    });

    const userId = token_.userId;

    const links = await db.link.deleteMany({
      where: { linkedId, userId },
    });

    io.emit("deleteLinksByLinkedId", { links });
  } catch (err) {
    console.error(err);
    io.emit("deleteLinksByLinkedId", { message: `Error: ${err}` });
  }
}

export const deleteLink = async (data: { link: string; token: string; linkedId: string }) => {
  try {
    const { link, token, linkedId } = data;
    const token_ = await db.token.findFirst({
      where: { token },
    });

    const userId = token_.userId;

    const links = await db.link.findFirst({
      where: {linkedId, userId },
    });
    const newLinks = JSON.parse(JSON.stringify(links)).links.filter((item: string) => item !== link);

    await db.link.update({
      where: { id: links?.id },
      data: {
        links: newLinks,
      },
    });

    io.emit("deleteLink", { links });
  } catch (err) {
    console.error(err);
    io.emit("deleteLink", { message: `Error: ${err}` });
  }
}
