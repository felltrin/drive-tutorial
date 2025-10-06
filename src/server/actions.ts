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

  const childrenFolders = await db
    .select()
    .from(folders_table)
    .where(
      and(
        eq(folders_table.ownerId, session.userId),
        eq(folders_table.parent, folder.id),
      ),
    );

  const childrenFiles = await db
    .select()
    .from(files_table)
    .where(
      and(
        eq(files_table.ownerId, session.userId),
        eq(files_table.parent, folder.id),
      ),
    );

  // folder deletion with nothing inside
  if (
    (childrenFolders === undefined || childrenFolders.length === 0) &&
    (childrenFiles === undefined || childrenFiles.length === 0)
  ) {
    const dbDeleteResult = await db
      .delete(folders_table)
      .where(eq(folders_table.id, folderId));
    console.log(dbDeleteResult);

    const c = await cookies();
    c.set("force-refresh", JSON.stringify(Math.random()));

    return { success: true };
  }

  // deleting folder if it only has files inside
  if (childrenFolders === undefined || childrenFolders.length === 0) {
    const fileIdsToDelete = [];
    for (const file of childrenFiles) {
      fileIdsToDelete.push(file.id);
    }

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

    const c = await cookies();

    c.set("force-refresh", JSON.stringify(Math.random()));

    return { success: true };
  }

  //   console.log(childrenFiles);
  //   console.log(childrenFolders);

  // retreive folders that have the received folder as a parent, and their children
  // recursion
  //   const dbDeleteResult = await db
  //     .delete(folders_table)
  //     .where(eq(folders_table.id, folderId));

  //   const c = await cookies();
  //   c.set("force-refresh", JSON.stringify(Math.random()));

  //   return { success: true };
}
