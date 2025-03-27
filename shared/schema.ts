import { mysqlTable, text, int, timestamp, json, datetime, mysqlEnum, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("patient"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

export const events = mysqlTable("events", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  type: text("type").notNull().default("event"),
  color: text("color"),
});

export const insertEventSchema = createInsertSchema(events).pick({
  userId: true,
  title: true,
  date: true,
  type: true,
  color: true,
});

export const medications = mysqlTable("medications", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  name: text("name").notNull(),
  time: text("time").notNull(),
  frequency: text("frequency").notNull(),
  notes: text("notes"),
  taken: timestamp("taken"),
});

export const insertMedicationSchema = createInsertSchema(medications).pick({
  userId: true,
  name: true,
  time: true,
  frequency: true,
  notes: true,
});

export const photos = mysqlTable("photos", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  category: text("category"),
  date: text("date").notNull(),
});

export const insertPhotoSchema = createInsertSchema(photos).pick({
  userId: true,
  title: true,
  description: true,
  imageUrl: true,
  category: true,
  date: true,
});

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctOption: number;
  imageUrl: string | null;
}

export const quizzes = mysqlTable("quizzes", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  patientId: int("patient_id"),
  title: varchar("title", { length: 255 }).notNull(),
  questions: json("questions").$type<QuizQuestion[]>().notNull(),
  lastTaken: datetime("last_taken"),
  nextReview: datetime("next_review"),
});

export const insertQuizSchema = createInsertSchema(quizzes).pick({
  userId: true,
  patientId: true,
  title: true,
  questions: true,
  lastTaken: true,
  nextReview: true,
});

export const quizResults = mysqlTable("quiz_results", {
  id: int("id").primaryKey().autoincrement(),
  quizId: int("quiz_id").notNull(),
  userId: int("user_id").notNull(),
  score: int("score").notNull(),
  totalQuestions: int("total_questions").notNull(),
  date: timestamp("date").notNull().defaultNow(),
});

export const insertQuizResultSchema = createInsertSchema(quizResults).pick({
  quizId: true,
  userId: true,
  score: true,
  totalQuestions: true,
  date: true,
});

export const notes = mysqlTable("notes", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: json("tags").default([]),
  date: timestamp("date").notNull().defaultNow(),
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  userId: true,
  title: true,
  content: true,
  tags: true,
  date: true,
});

export const activities = mysqlTable("activities", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  type: true,
  description: true,
  date: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;

export type QuizResult = typeof quizResults.$inferSelect;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
