import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q || q.trim().length === 0) {
    const thoughts = await prisma.thought.findMany({
      include: { tags: true },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(thoughts);
  }

  const thoughts = await prisma.thought.findMany({
    where: {
      OR: [
        { title: { contains: q.trim() } },
        { content: { contains: q.trim() } },
      ],
    },
    include: { tags: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(thoughts);
}
