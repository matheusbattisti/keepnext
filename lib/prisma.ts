import path from "path";
import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabasePath() {
  const envUrl = process.env.DATABASE_URL || "file:./dev.db";
  const dbFile = envUrl.replace(/^file:\.\//, "").replace(/^file:/, "");
  if (!path.isAbsolute(dbFile)) {
    return path.join(process.cwd(), "prisma", dbFile);
  }
  return dbFile;
}

function ensureDatabase(dbPath: string) {
  const db = new Database(dbPath);
  const tableExists = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='Thought'"
    )
    .get();

  if (!tableExists) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS "Thought" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT,
        "content" TEXT NOT NULL,
        "color" TEXT NOT NULL DEFAULT 'gray',
        "pinned" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      );
      CREATE TABLE IF NOT EXISTS "Tag" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS "_TagToThought" (
        "A" TEXT NOT NULL,
        "B" TEXT NOT NULL,
        CONSTRAINT "_TagToThought_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "_TagToThought_B_fkey" FOREIGN KEY ("B") REFERENCES "Thought" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_key" ON "Tag"("name");
      CREATE UNIQUE INDEX IF NOT EXISTS "_TagToThought_AB_unique" ON "_TagToThought"("A", "B");
      CREATE INDEX IF NOT EXISTS "_TagToThought_B_index" ON "_TagToThought"("B");
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "checksum" TEXT NOT NULL,
        "finished_at" DATETIME,
        "migration_name" TEXT NOT NULL,
        "logs" TEXT,
        "rolled_back_at" DATETIME,
        "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      );
      INSERT OR IGNORE INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count")
      VALUES ('init', 'manual', '20260309182616_init', datetime('now'), 1);
    `);
  }
  db.close();
}

function createPrismaClient() {
  const dbPath = getDatabasePath();
  ensureDatabase(dbPath);
  const adapter = new PrismaBetterSqlite3({
    url: `file:${dbPath}`,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
