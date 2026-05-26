import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` never opens a DB connection, but Prisma still loads this file.
// `env("DATABASE_URL")` throws (PrismaConfigEnvError) when unset — which breaks
// `npm install` postinstall on Vercel/CI if DATABASE_URL is not available yet.
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://prisma_generate_placeholder:prisma_generate_placeholder@127.0.0.1:5432/prisma_generate_placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
