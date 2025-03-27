import { sql, eq } from "drizzle-orm";
import { users, medications, photos, quizzes, quizResults, notes, activities, events } from "../shared/schema";
import type { User, InsertUser, Medication, InsertMedication, Photo, InsertPhoto, Quiz, InsertQuiz, QuizResult, InsertQuizResult, Note, InsertNote, Activity, InsertActivity, Event, InsertEvent } from "../shared/schema";
import { db } from "./db";
import session from "express-session";
import { QuizQuestion } from "../shared/schema";
import { MySqlDatabase } from "drizzle-orm/mysql2";
import { createRequire } from "module";

// Create session store
const require = createRequire(import.meta.url);
const MySQLStore = require("express-mysql-session")(session);

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;
  
  // Medication operations
  getMedicationsByUserId(userId: number): Promise<Medication[]>;
  getUpcomingMedications(userId: number): Promise<Medication[]>;
  getMedicationById(id: number): Promise<Medication | undefined>;
  createMedication(data: InsertMedication): Promise<Medication>;
  updateMedication(id: number, data: Partial<Medication>): Promise<Medication>;
  deleteMedication(id: number): Promise<void>;
  
  // Photo operations
  getPhotosByUserId(userId: number): Promise<Photo[]>;
  getPhotoCategories(userId: number): Promise<string[]>;
  createPhoto(data: InsertPhoto): Promise<Photo>;
  
  // Quiz operations
  getQuizzesByCreator(userId: number): Promise<Quiz[]>;
  getQuizzesByPatient(patientId: number): Promise<Quiz[]>;
  getQuizById(id: number): Promise<Quiz | undefined>;
  createQuiz(data: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: number, data: Partial<Quiz>): Promise<Quiz>;
  deleteQuiz(id: number): Promise<void>;
  
  // Quiz results operations
  getQuizResultsByUserId(userId: number): Promise<QuizResult[]>;
  createQuizResult(data: InsertQuizResult): Promise<QuizResult>;
  
  // Note operations
  getNotesByUserId(userId: number): Promise<Note[]>;
  getNoteById(id: number): Promise<Note | undefined>;
  createNote(data: InsertNote): Promise<Note>;
  updateNote(id: number, data: Partial<Note>): Promise<Note>;
  deleteNote(id: number): Promise<void>;
  
  // Event operations
  getEventsByUserId(userId: number): Promise<Event[]>;
  getEventById(id: number): Promise<Event | undefined>;
  createEvent(data: InsertEvent): Promise<Event>;
  updateEvent(id: number, data: Partial<Event>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;
  
  // Activity operations
  getRecentActivities(userId: number): Promise<Activity[]>;
  createActivity(data: InsertActivity): Promise<Activity>;
  
  // Session store
  sessionStore: session.Store;
}

export class DbStorage implements IStorage {
  private db = db;
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new MySQLStore({
      host: "localhost",
      port: 3306,
      user: "root",
      password: "root",
      database: "memorycare",
      createDatabaseTable: true,
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data'
        }
      }
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(data: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(data);
    const id = Number(result[0].insertId);
    return { 
      id, 
      ...data,
      role: data.role || 'patient' // Provide default role
    };
  }

  // Medication operations
  async getMedicationsByUserId(userId: number): Promise<Medication[]> {
    return await this.db.select().from(medications).where(eq(medications.userId, userId));
  }

  async getUpcomingMedications(userId: number): Promise<Medication[]> {
    try {
      console.log('Fetching upcoming medications:');
      console.log('- User ID:', userId);

      // Get all untaken medications
      const result = await this.db.select()
        .from(medications)
        .where(eq(medications.userId, userId))
        .where(sql`${medications.taken} IS NULL`)
        .orderBy(sql`${medications.time} ASC`);

      console.log('- Found medications:', result);
      return result;
    } catch (error) {
      console.error('Error fetching upcoming medications:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async getMedicationById(id: number): Promise<Medication | undefined> {
    const result = await this.db.select().from(medications).where(eq(medications.id, id));
    return result[0];
  }

  async createMedication(data: InsertMedication): Promise<Medication> {
    const result = await this.db.insert(medications).values(data);
    const id = Number(result[0].insertId);
    return { 
      id, 
      ...data,
      notes: data.notes || null // Handle optional notes
    };
  }

  async updateMedication(id: number, data: Partial<Medication>): Promise<Medication> {
    await this.db.update(medications).set(data).where(eq(medications.id, id));
    const updated = await this.getMedicationById(id);
    if (!updated) throw new Error("Failed to update medication");
    return updated;
  }

  async markMedicationAsTaken(id: number): Promise<Medication> {
    await this.db.update(medications)
      .set({ taken: new Date() })
      .where(eq(medications.id, id));
    const updated = await this.getMedicationById(id);
    if (!updated) throw new Error("Failed to mark medication as taken");
    return updated;
  }

  async snoozeMedication(id: number, snoozeTime: Date): Promise<Medication> {
    try {
      console.log('Snoozing medication:', id);
      console.log('Original snooze time:', snoozeTime);
      
      // Format time as HH:mm:ss
      const formattedTime = snoozeTime.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      console.log('Formatted snooze time:', formattedTime);
      
      await this.db.update(medications)
        .set({ time: formattedTime })
        .where(eq(medications.id, id));
      
      const updated = await this.getMedicationById(id);
      if (!updated) throw new Error("Failed to snooze medication");
      
      console.log('Updated medication:', updated);
      return updated;
    } catch (error) {
      console.error('Error snoozing medication:', error);
      throw error;
    }
  }

  async deleteMedication(id: number): Promise<void> {
    await this.db.delete(medications).where(eq(medications.id, id));
  }

  // Photo operations
  async getPhotosByUserId(userId: number): Promise<Photo[]> {
    return await this.db.select().from(photos).where(eq(photos.userId, userId));
  }

  async getPhotoCategories(userId: number): Promise<string[]> {
    const result = await this.db.select({ category: photos.category })
      .from(photos)
      .where(eq(photos.userId, userId));
    const categories = new Set(result.map(r => r.category));
    return Array.from(categories).filter((c): c is string => c !== null);
  }

  async createPhoto(data: InsertPhoto): Promise<Photo> {
    const result = await this.db.insert(photos).values(data);
    const id = Number(result[0].insertId);
    return { 
      id, 
      ...data,
      description: data.description || null,
      category: data.category || null
    };
  }

  // Quiz operations
  async getQuizzesByCreator(userId: number): Promise<Quiz[]> {
    return await this.db.select().from(quizzes).where(eq(quizzes.userId, userId));
  }

  async getQuizzesByPatient(patientId: number): Promise<Quiz[]> {
    return await this.db.select().from(quizzes).where(eq(quizzes.patientId, patientId));
  }

  async getQuizById(id: number): Promise<Quiz | undefined> {
    const [quiz] = await this.db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async createQuiz(data: InsertQuiz): Promise<Quiz> {
    const result = await this.db.insert(quizzes).values({
      ...data,
      questions: data.questions as QuizQuestion[],
      lastTaken: data.lastTaken || null,
      nextReview: data.nextReview || null,
      patientId: data.patientId || null
    });
    const id = Number(result[0].insertId);
    return {
      id,
      ...data,
      questions: data.questions as QuizQuestion[],
      lastTaken: data.lastTaken || null,
      nextReview: data.nextReview || null,
      patientId: data.patientId || null
    };
  }

  async updateQuiz(id: number, data: Partial<Quiz>): Promise<Quiz> {
    await this.db.update(quizzes)
      .set({
        ...data,
        questions: data.questions as QuizQuestion[] | undefined,
        lastTaken: data.lastTaken || null,
        nextReview: data.nextReview || null,
        patientId: data.patientId || null
      })
      .where(eq(quizzes.id, id));
    
    const [updatedQuiz] = await this.db.select()
      .from(quizzes)
      .where(eq(quizzes.id, id));
    
    if (!updatedQuiz) {
      throw new Error("Failed to update quiz");
    }
    
    return updatedQuiz;
  }

  async deleteQuiz(id: number): Promise<void> {
    await this.db.delete(quizzes).where(eq(quizzes.id, id));
  }

  async updateQuizLastTaken(id: number, date: Date): Promise<void> {
    await this.db.update(quizzes)
      .set({ lastTaken: date })
      .where(eq(quizzes.id, id));
  }

  // Quiz results operations
  async getQuizResultsByUserId(userId: number): Promise<QuizResult[]> {
    return await this.db.select().from(quizResults).where(eq(quizResults.userId, userId));
  }

  async createQuizResult(data: InsertQuizResult): Promise<QuizResult> {
    const result = await this.db.insert(quizResults).values({
      ...data,
      date: data.date || new Date()
    });
    const id = Number(result[0].insertId);
    return { 
      id,
      ...data,
      date: data.date || new Date()
    };
  }

  // Note operations
  async getNotesByUserId(userId: number): Promise<Note[]> {
    return await this.db.select().from(notes).where(eq(notes.userId, userId));
  }

  async getNoteById(id: number): Promise<Note | undefined> {
    const [note] = await this.db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async createNote(data: InsertNote): Promise<Note> {
    const result = await this.db.insert(notes).values({
      ...data,
      date: data.date || new Date(),
      tags: data.tags || null
    });
    const id = Number(result[0].insertId);
    return { 
      id,
      ...data,
      date: data.date || new Date(),
      tags: data.tags || null
    };
  }

  async updateNote(id: number, data: Partial<Note>): Promise<Note> {
    await this.db.update(notes)
      .set({
        ...data,
        date: data.date || new Date()
      })
      .where(eq(notes.id, id));
    
    const [updatedNote] = await this.db.select()
      .from(notes)
      .where(eq(notes.id, id));
    
    if (!updatedNote) {
      throw new Error("Failed to update note");
    }
    
    return updatedNote;
  }

  async deleteNote(id: number): Promise<void> {
    await this.db.delete(notes).where(eq(notes.id, id));
  }

  // Event operations
  async getEventsByUserId(userId: number): Promise<Event[]> {
    return await this.db.select().from(events).where(eq(events.userId, userId));
  }

  async getEventById(id: number): Promise<Event | undefined> {
    const [event] = await this.db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(data: InsertEvent): Promise<Event> {
    const result = await this.db.insert(events).values({
      ...data,
      date: data.date || new Date().toISOString().split('T')[0],
      type: data.type || 'event',
      color: data.color || 'blue'
    });
    const id = Number(result[0].insertId);
    return { 
      id,
      ...data,
      date: data.date || new Date().toISOString().split('T')[0],
      type: data.type || 'event',
      color: data.color || 'blue'
    };
  }

  async updateEvent(id: number, data: Partial<Event>): Promise<Event> {
    await this.db.update(events)
      .set({
        ...data,
        date: data.date || new Date().toISOString().split('T')[0]
      })
      .where(eq(events.id, id));
    
    const [updatedEvent] = await this.db.select()
      .from(events)
      .where(eq(events.id, id));
    
    if (!updatedEvent) {
      throw new Error("Failed to update event");
    }
    
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<void> {
    await this.db.delete(events).where(eq(events.id, id));
  }

  // Activity operations
  async getRecentActivities(userId: number): Promise<Activity[]> {
    try {
      console.log('Fetching recent activities for user:', userId);
      const result = await this.db.select()
        .from(activities)
        .where(eq(activities.userId, userId))
        .orderBy(sql`${activities.date} DESC`)
        .limit(10);
      console.log('Found activities:', result);
      return result;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async createActivity(data: InsertActivity): Promise<Activity> {
    try {
      console.log('Creating activity:', data);
      const result = await this.db.insert(activities).values({
        ...data,
        date: data.date || new Date()
      });
      const id = Number(result[0].insertId);
      const activity = { 
        id,
        ...data,
        date: data.date || new Date()
      };
      console.log('Created activity:', activity);
      return activity;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }
}

export const storage = new DbStorage();
