import { prisma } from "@/lib/prisma";
import { ThoughtBoard } from "./components/ThoughtBoard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const thoughts = await prisma.thought.findMany({
    include: { tags: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <ThoughtBoard
      initialThoughts={JSON.parse(JSON.stringify(thoughts))}
      allTags={tags.map((t) => t.name)}
    />
  );
}
