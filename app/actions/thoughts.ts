"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createThought(formData: {
  content: string;
  title?: string;
  color?: string;
  tagNames?: string[];
}) {
  const { content, title, color, tagNames } = formData;

  await prisma.thought.create({
    data: {
      content,
      title: title || null,
      color: color || "gray",
      tags: tagNames?.length
        ? {
            connectOrCreate: tagNames.map((name) => ({
              where: { name },
              create: { name },
            })),
          }
        : undefined,
    },
  });

  revalidatePath("/");
}

export async function updateThought(
  id: string,
  formData: {
    content: string;
    title?: string;
    color?: string;
    tagNames?: string[];
  }
) {
  const { content, title, color, tagNames } = formData;

  await prisma.thought.update({
    where: { id },
    data: {
      content,
      title: title || null,
      color: color || "gray",
      tags: {
        set: [],
        connectOrCreate: (tagNames || []).map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
  });

  revalidatePath("/");
}

export async function deleteThought(id: string) {
  await prisma.thought.delete({ where: { id } });
  revalidatePath("/");
}

export async function togglePin(id: string) {
  const thought = await prisma.thought.findUnique({ where: { id } });
  if (!thought) return;

  await prisma.thought.update({
    where: { id },
    data: { pinned: !thought.pinned },
  });

  revalidatePath("/");
}
