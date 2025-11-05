"use server";

import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { files_table, folders_table } from "./db/schema";
import { auth } from "@clerk/nextjs/server";
import { UTApi } from "uploadthing/server";
import { cookies } from "next/headers";

const utApi = new UTApi();

export async function deleteFile(fileId: number) {
  const session = await auth();
  if (!session.userId) {
    return { error: "Unauthorized" };
  }

  const [file] = await db
    .select()
    .from(files_table)
    .where(
      and(eq(files_table.id, fileId), eq(files_table.ownerId, session.userId)),
    );

  if (!file) {
    return { error: "File not found" };
  }

  const utapiResult = await utApi.deleteFiles([
    file.url.replace("https://utfs.io/f/", ""),
  ]);
  console.log(utapiResult);

  const dbDeleteResult = await db
    .delete(files_table)
    .where(eq(files_table.id, fileId));
  console.log(dbDeleteResult);

  const c = await cookies();

  c.set("force-refresh", JSON.stringify(Math.random()));

  return { success: true };
}

export async function deleteFolder(folderId: number) {
  const session = await auth();
  if (!session.userId) {
    return { error: "Unauthorized" };
  }

  const [folder] = await db
    .select()
    .from(folders_table)
    .where(
      and(
        eq(folders_table.id, folderId),
        eq(folders_table.ownerId, session.userId),
      ),
    );

  if (!folder) {
    return { error: "Selected folder not found" };
  }

  const folderIdsToDelete: number[] = [];
  const fileIdsToDelete: number[] = [];

  async function gatherFileIds(newFolder: {
    id: number;
    ownerId: string;
    name: string;
    parent: number | null;
    createdAt: Date;
  }) {
    let folders, files;
    if (session.userId) {
      folders = await db
        .select()
        .from(folders_table)
        .where(
          and(
            eq(folders_table.ownerId, session.userId),
            eq(folders_table.parent, newFolder.id),
          ),
        );

      files = await db
        .select()
        .from(files_table)
        .where(
          and(
            eq(files_table.ownerId, session.userId),
            eq(files_table.parent, newFolder.id),
          ),
        );

      if (
        (folders === undefined || folders.length === 0) &&
        (files === undefined || files.length === 0)
      ) {
        return;
      } else if (folders === undefined || folders.length === 0) {
        for (let i = 0; i < files.length; i++) {
          fileIdsToDelete.push(files[i]!.id);
        }
        return;
      } else {
        for (let i = 0; i < files.length; i++) {
          fileIdsToDelete.push(files[i]!.id);
        }
        for (let i = 0; i < folders.length; i++) {
          folderIdsToDelete.push(folders[i]!.id);
          await gatherFileIds(folders[i]!);
        }
      }
    }
  }

  await gatherFileIds(folder);

  if (
    (fileIdsToDelete === undefined || fileIdsToDelete.length === 0) &&
    (folderIdsToDelete === undefined || folderIdsToDelete.length === 0)
  ) {
    const dbDeleteResult = await db
      .delete(folders_table)
      .where(eq(folders_table.id, folderId));
    console.log(dbDeleteResult);
  } else if (
    folderIdsToDelete === undefined ||
    folderIdsToDelete.length === 0
  ) {
    console.log("deleting files along with the selected folder");
    for (const fileId of fileIdsToDelete) {
      const [file] = await db
        .select()
        .from(files_table)
        .where(
          and(
            eq(files_table.id, fileId),
            eq(files_table.ownerId, session.userId),
          ),
        );

      if (!file) {
        return { error: "File not found" };
      }

      const utapiResult = await utApi.deleteFiles([
        file.url.replace("https://utfs.io/f/", ""),
      ]);
      console.log(utapiResult);

      const dbDeleteResult = await db
        .delete(files_table)
        .where(eq(files_table.id, fileId));
      console.log(dbDeleteResult);
    }
    const dbDeleteResult = await db
      .delete(folders_table)
      .where(eq(folders_table.id, folderId));
    console.log(dbDeleteResult);
  } else {
    for (const fileId of fileIdsToDelete) {
      const [file] = await db
        .select()
        .from(files_table)
        .where(
          and(
            eq(files_table.id, fileId),
            eq(files_table.ownerId, session.userId),
          ),
        );

      if (!file) {
        return { error: "File not found" };
      }

      const utapiResult = await utApi.deleteFiles([
        file.url.replace("https://utfs.io/f/", ""),
      ]);
      console.log(utapiResult);

      const dbDeleteResult = await db
        .delete(files_table)
        .where(eq(files_table.id, fileId));
      console.log(dbDeleteResult);
    }
    for (const folderIdOther of folderIdsToDelete) {
      const [theFolder] = await db
        .delete(folders_table)
        .where(eq(folders_table.id, folderIdOther));

      if (!theFolder) {
        return { error: "Folder not found" };
      }
    }
    const dbDeleteResult = await db
      .delete(folders_table)
      .where(eq(folders_table.id, folderId));
    console.log(dbDeleteResult);
  }
  const c = await cookies();
  c.set("force-refresh", JSON.stringify(Math.random()));

  return { success: true };
}
