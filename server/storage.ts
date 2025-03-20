import { users, type User, type InsertUser, events, type Event, type InsertEvent, medications, type Medication, type InsertMedication, photos, type Photo, type InsertPhoto, quizzes, type Quiz, type InsertQuiz, quizResults, type QuizResult, type InsertQuizResult, notes, type Note, type InsertNote, activities, type Activity, type InsertActivity } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Event operations
  getEventsByUserId(userId: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  
  // Medication operations
  getMedicationsByUserId(userId: number): Promise<Medication[]>;
  getUpcomingMedications(userId: number): Promise<Medication[]>;
  getMedicationById(id: number): Promise<Medication | undefined>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(id: number, data: Partial<Medication>): Promise<Medication>;
  deleteMedication(id: number): Promise<void>;
  
  // Photo operations
  getPhotosByUserId(userId: number): Promise<Photo[]>;
  getPhotoCategories(userId: number): Promise<string[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  
  // Quiz operations
  getQuizzesByCreator(userId: number): Promise<Quiz[]>;
  getQuizzesForPatient(userId: number): Promise<Quiz[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuizLastTaken(quizId: number): Promise<void>;
  
  // Quiz results operations
  getQuizResultsByUserId(userId: number): Promise<QuizResult[]>;
  createQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  
  // Note operations
  getNotesByUserId(userId: number): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  
  // Activity operations
  getRecentActivities(userId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private medications: Map<number, Medication>;
  private photos: Map<number, Photo>;
  private quizzes: Map<number, Quiz>;
  private quizResults: Map<number, QuizResult>;
  private notes: Map<number, Note>;
  private activities: Map<number, Activity>;
  
  sessionStore: session.SessionStore;
  
  private userIdCounter: number = 1;
  private eventIdCounter: number = 1;
  private medicationIdCounter: number = 1;
  private photoIdCounter: number = 1;
  private quizIdCounter: number = 1;
  private quizResultIdCounter: number = 1;
  private noteIdCounter: number = 1;
  private activityIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.medications = new Map();
    this.photos = new Map();
    this.quizzes = new Map();
    this.quizResults = new Map();
    this.notes = new Map();
    this.activities = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Add a demo user
    this.createUser({
      username: "demo@example.com",
      password: "password",
      name: "Demo User",
      role: "patient"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Event methods
  async getEventsByUserId(userId: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.userId === userId
    );
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const event: Event = { ...insertEvent, id };
    this.events.set(id, event);
    return event;
  }

  // Medication methods
  async getMedicationsByUserId(userId: number): Promise<Medication[]> {
    return Array.from(this.medications.values()).filter(
      (medication) => medication.userId === userId
    );
  }

  async getUpcomingMedications(userId: number): Promise<Medication[]> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
    
    const userMedications = await this.getMedicationsByUserId(userId);
    
    // Filter medications that are coming up in the next 2 hours
    return userMedications.filter(medication => {
      const [medHourStr, medMinuteStr] = medication.time.split(':');
      const medHour = parseInt(medHourStr);
      const medMinute = parseInt(medMinuteStr);
      
      // Convert both times to minutes for easier comparison
      const currentTotalMinutes = currentHour * 60 + currentMinutes;
      const medTotalMinutes = medHour * 60 + medMinute;
      
      // Check if medication is due in the next 2 hours (120 minutes)
      const diff = medTotalMinutes - currentTotalMinutes;
      return diff >= 0 && diff <= 120;
    }).sort((a, b) => {
      const [aHour, aMinute] = a.time.split(':').map(Number);
      const [bHour, bMinute] = b.time.split(':').map(Number);
      return (aHour * 60 + aMinute) - (bHour * 60 + bMinute);
    });
  }

  async getMedicationById(id: number): Promise<Medication | undefined> {
    return this.medications.get(id);
  }

  async createMedication(insertMedication: InsertMedication): Promise<Medication> {
    const id = this.medicationIdCounter++;
    const medication: Medication = { ...insertMedication, id };
    this.medications.set(id, medication);
    return medication;
  }

  async updateMedication(id: number, data: Partial<Medication>): Promise<Medication> {
    const medication = await this.getMedicationById(id);
    if (!medication) {
      throw new Error("Medication not found");
    }
    
    const updatedMedication = { ...medication, ...data };
    this.medications.set(id, updatedMedication);
    return updatedMedication;
  }

  async deleteMedication(id: number): Promise<void> {
    this.medications.delete(id);
  }

  // Photo methods
  async getPhotosByUserId(userId: number): Promise<Photo[]> {
    return Array.from(this.photos.values()).filter(
      (photo) => photo.userId === userId
    );
  }

  async getPhotoCategories(userId: number): Promise<string[]> {
    const userPhotos = await this.getPhotosByUserId(userId);
    const categories = new Set<string>();
    
    userPhotos.forEach(photo => {
      if (photo.category) {
        categories.add(photo.category);
      }
    });
    
    return Array.from(categories);
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const id = this.photoIdCounter++;
    const photo: Photo = { ...insertPhoto, id };
    this.photos.set(id, photo);
    return photo;
  }

  // Quiz methods
  async getQuizzesByCreator(userId: number): Promise<Quiz[]> {
    return Array.from(this.quizzes.values()).filter(
      (quiz) => quiz.userId === userId
    );
  }

  async getQuizzesForPatient(userId: number): Promise<Quiz[]> {
    return Array.from(this.quizzes.values()).filter(
      (quiz) => !quiz.patientId || quiz.patientId === userId
    );
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = this.quizIdCounter++;
    const quiz: Quiz = { ...insertQuiz, id, lastTaken: null, nextReview: null };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async updateQuizLastTaken(quizId: number): Promise<void> {
    const quiz = this.quizzes.get(quizId);
    if (quiz) {
      quiz.lastTaken = new Date();
      
      // Calculate next review date based on spaced repetition algorithm
      // Simple implementation: review again in 3 days
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + 3);
      quiz.nextReview = nextReview;
      
      this.quizzes.set(quizId, quiz);
    }
  }

  // Quiz result methods
  async getQuizResultsByUserId(userId: number): Promise<QuizResult[]> {
    return Array.from(this.quizResults.values()).filter(
      (result) => result.userId === userId
    );
  }

  async createQuizResult(insertResult: InsertQuizResult): Promise<QuizResult> {
    const id = this.quizResultIdCounter++;
    const result: QuizResult = { ...insertResult, id, date: new Date() };
    this.quizResults.set(id, result);
    return result;
  }

  // Note methods
  async getNotesByUserId(userId: number): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      (note) => note.userId === userId
    ).sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.noteIdCounter++;
    const note: Note = { ...insertNote, id, date: new Date() };
    this.notes.set(id, note);
    return note;
  }

  // Activity methods
  async getRecentActivities(userId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Get only 10 most recent activities
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const activity: Activity = { ...insertActivity, id, date: new Date() };
    this.activities.set(id, activity);
    return activity;
  }
}

export const storage = new MemStorage();
