import { config } from "dotenv";
import { join } from "path";
import { defineConfig, env } from "prisma/config";

// Load root .env from one directory above
config({ path: join(__dirname, "..", ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

