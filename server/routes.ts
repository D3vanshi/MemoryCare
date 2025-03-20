import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // API routes with /api prefix
  // Events routes
  app.get("/api/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const events = await storage.getEventsByUserId(userId);
    res.json(events);
  });

  app.post("/api/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const event = await storage.createEvent({
        ...req.body,
        userId: req.user!.id
      });
      
      // Log the activity
      await storage.createActivity({
        userId: req.user!.id,
        type: "calendar",
        description: "Added a new event"
      });
      
      res.status(201).json(event);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Medications routes
  app.get("/api/medications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const medications = await storage.getMedicationsByUserId(userId);
    res.json(medications);
  });

  app.get("/api/medications/upcoming", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const medications = await storage.getUpcomingMedications(userId);
    res.json(medications);
  });

  app.post("/api/medications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const medication = await storage.createMedication({
        ...req.body,
        userId: req.user!.id
      });
      
      // Log the activity
      await storage.createActivity({
        userId: req.user!.id,
        type: "medication",
        description: "Added a new medication reminder"
      });
      
      res.status(201).json(medication);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/medications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    
    try {
      const medication = await storage.getMedicationById(id);
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      
      if (medication.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this medication" });
      }
      
      const updatedMedication = await storage.updateMedication(id, req.body);
      
      // Log the activity
      await storage.createActivity({
        userId: req.user!.id,
        type: "medication",
        description: "Updated a medication reminder"
      });
      
      res.json(updatedMedication);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/medications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    
    try {
      const medication = await storage.getMedicationById(id);
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      
      if (medication.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this medication" });
      }
      
      await storage.deleteMedication(id);
      
      // Log the activity
      await storage.createActivity({
        userId: req.user!.id,
        type: "medication",
        description: "Deleted a medication reminder"
      });
      
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Photos routes
  app.get("/api/photos", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const photos = await storage.getPhotosByUserId(userId);
    res.json(photos);
  });

  app.get("/api/photos/categories", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const categories = await storage.getPhotoCategories(userId);
    res.json(categories);
  });

  app.post("/api/photos", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const photo = await storage.createPhoto({
        ...req.body,
        userId: req.user!.id
      });
      
      // Log the activity
      await storage.createActivity({
        userId: req.user!.id,
        type: "photo",
        description: "Added a new photo to gallery"
      });
      
      res.status(201).json(photo);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Quizzes routes
  app.get("/api/quizzes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const userRole = req.user!.role;
    
    let quizzes;
    if (userRole === 'caretaker') {
      quizzes = await storage.getQuizzesByCreator(userId);
    } else {
      quizzes = await storage.getQuizzesForPatient(userId);
    }
    
    res.json(quizzes);
  });

  app.post("/api/quizzes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const quiz = await storage.createQuiz({
        ...req.body,
        userId: req.user!.id
      });
      
      // Log the activity
      await storage.createActivity({
        userId: req.user!.id,
        type: "quiz",
        description: "Created a new quiz"
      });
      
      res.status(201).json(quiz);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Quiz results routes
  app.get("/api/quiz-results", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const results = await storage.getQuizResultsByUserId(userId);
    res.json(results);
  });

  app.post("/api/quiz-results", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const result = await storage.createQuizResult({
        ...req.body,
        userId: req.user!.id
      });
      
      // Update the quiz's lastTaken date
      await storage.updateQuizLastTaken(req.body.quizId);
      
      // Log the activity
      await storage.createActivity({
        userId: req.user!.id,
        type: "quiz",
        description: `Completed a quiz with score ${req.body.score}/${req.body.totalQuestions}`,
        details: `Score: ${req.body.score}/${req.body.totalQuestions}`
      });
      
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Notes routes
  app.get("/api/notes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const notes = await storage.getNotesByUserId(userId);
    res.json(notes);
  });

  app.post("/api/notes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const note = await storage.createNote({
        ...req.body,
        userId: req.user!.id
      });
      
      // Log the activity
      await storage.createActivity({
        userId: req.user!.id,
        type: "note",
        description: "Added a new note"
      });
      
      res.status(201).json(note);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Activities routes
  app.get("/api/activities/recent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const activities = await storage.getRecentActivities(userId);
    res.json(activities);
  });

  const httpServer = createServer(app);
  return httpServer;
}
