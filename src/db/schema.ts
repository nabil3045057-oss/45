import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const launcherPresets = pgTable("launcher_presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  port: integer("port").notNull().default(20128),
  nodeVersion: text("node_version").notNull().default("24.22.1"),
  omnirouteVersion: text("omniroute_version").notNull().default("3.8.52"),
  bindHost: text("bind_host").notNull().default("127.0.0.1"),
  requireApiKey: boolean("require_api_key").notNull().default(true),
  openBrowser: boolean("open_browser").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type LauncherPreset = typeof launcherPresets.$inferSelect;
export type NewLauncherPreset = typeof launcherPresets.$inferInsert;