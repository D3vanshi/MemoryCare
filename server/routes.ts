import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { User } from "../shared/schema";

declare module "express-session" {
  interface SessionData {
    user: User;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // API routes with /api prefix
  // Medications routes
  app.get("/api/medications", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const medications = await storage.getMedicationsByUserId(user.id);
    res.json(medications);
  });

  app.get("/api/medications/upcoming", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const medications = await storage.getUpcomingMedications(user.id);
      console.log('Sending medications to client:', medications);
      res.json(medications);
    } catch (error) {
      console.error('Error in /api/medications/upcoming:', error);
      res.status(500).json({ error: "Failed to fetch medications" });
    }
  });

  app.post("/api/medications", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      console.log('Creating medication with data:', req.body);
      const medication = await storage.createMedication({
        userId: user.id,
        name: req.body.name,
        time: req.body.time,
        frequency: req.body.frequency,
        notes: req.body.notes
      });
      console.log('Created medication:', medication);

      // Create activity for the new medication
      await storage.createActivity({
        userId: user.id,
        type: 'medication_created',
        description: `Added new medication: ${medication.name}`,
        date: new Date()
      });
      console.log('Created activity for medication');

      res.json(medication);
    } catch (error) {
      console.error('Error creating medication:', error);
      res.status(500).json({ message: "Failed to create medication" });
    }
  });

  app.patch("/api/medications/:id", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const medication = await storage.getMedicationById(Number(req.params.id));
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      if (medication.userId !== user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedMedication = await storage.updateMedication(Number(req.params.id), req.body);
      res.json(updatedMedication);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/medications/:id", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const medication = await storage.getMedicationById(Number(req.params.id));
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      if (medication.userId !== user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Create activity before deleting the medication
      await storage.createActivity({
        userId: user.id,
        type: "medication_deleted",
        description: `Deleted medication: ${medication.name}`,
        date: new Date()
      });
      
      await storage.deleteMedication(Number(req.params.id));
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/medications/:id/take", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const medication = await storage.getMedicationById(Number(req.params.id));
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      if (medication.userId !== user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Mark medication as taken
      await storage.markMedicationAsTaken(Number(req.params.id));
      
      // Log the activity
      await storage.createActivity({
        userId: user.id,
        type: "medication_taken",
        description: `Took medication: ${medication.name}`,
        details: new Date().toISOString()
      });
      
      res.json({ message: "Medication marked as taken" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/medications/:id/snooze", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const medication = await storage.getMedicationById(Number(req.params.id));
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      if (medication.userId !== user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Snooze medication for 15 minutes
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + 15);
      await storage.snoozeMedication(Number(req.params.id), snoozeTime);
      
      // Log the activity
      await storage.createActivity({
        userId: user.id,
        type: "medication_snoozed",
        description: `Snoozed medication: ${medication.name}`,
        details: snoozeTime.toISOString()
      });
      
      res.json({ message: "Medication snoozed" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Photos routes
  app.get("/api/photos", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const photos = await storage.getPhotosByUserId(user.id);
    res.json(photos);
  });

  app.get("/api/photos/categories", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const categories = await storage.getPhotoCategories(user.id);
    res.json(categories);
  });

  app.post("/api/photos", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const photo = await storage.createPhoto({
        ...req.body,
        userId: user.id
      });
      
      // Log the activity
      await storage.createActivity({
        userId: user.id,
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
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    let quizzes;
    if (user.role === 'caretaker') {
      quizzes = await storage.getQuizzesByCreator(user.id);
    } else {
      quizzes = await storage.getQuizzesByPatient(user.id);
    }
    
    res.json(quizzes);
  });

  app.post("/api/quizzes", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const quiz = await storage.createQuiz({
        ...req.body,
        userId: user.id
      });
      
      // Log the activity
      await storage.createActivity({
        userId: user.id,
        type: "quiz",
        description: "Created a new quiz"
      });
      
      res.status(201).json(quiz);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/quizzes/:id", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const quizId = parseInt(req.params.id);
    const quiz = await storage.getQuizById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    if (quiz.userId !== user.id) {
      return res.status(403).json({ error: "Not authorized to delete this quiz" });
    }

    await storage.deleteQuiz(quizId);

    // Log the activity
    await storage.createActivity({
      userId: user.id,
      type: "quiz_deleted",
      description: `Deleted quiz: ${quiz.title}`
    });

    res.status(204).send();
  });

  app.patch("/api/quizzes/:id", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const quizId = parseInt(req.params.id);
    const quiz = await storage.getQuizById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    if (quiz.userId !== user.id) {
      return res.status(403).json({ error: "Not authorized to update this quiz" });
    }

    const { title, questions, patientId } = req.body;
    await storage.updateQuiz(quizId, { title, questions, patientId });

    // Log the activity
    await storage.createActivity({
      userId: user.id,
      type: "quiz_updated",
      description: `Updated quiz: ${title}`
    });

    res.status(200).json({ message: "Quiz updated successfully" });
  });

  // Quiz results routes
  app.get("/api/quiz-results", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const results = await storage.getQuizResultsByUserId(user.id);
    res.json(results);
  });

  app.post("/api/quiz-results", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const result = await storage.createQuizResult({
        ...req.body,
        userId: user.id
      });
      
      // Update the quiz's lastTaken date
      await storage.updateQuizLastTaken(req.body.quizId, new Date());
      
      // Log the activity
      await storage.createActivity({
        userId: user.id,
        type: "quiz",
        description: `Completed a quiz with score ${req.body.score}/${req.body.totalQuestions}`
      });
      
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Notes routes
  app.get("/api/notes", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const notes = await storage.getNotesByUserId(user.id);
    res.json(notes);
  });

  app.post("/api/notes", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const note = await storage.createNote({
        ...req.body,
        userId: user.id
      });
      
      // Log the activity
      await storage.createActivity({
        userId: user.id,
        type: "note",
        description: "Added a new note"
      });
      
      res.status(201).json(note);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const noteId = Number(req.params.id);
      const note = await storage.getNoteById(noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      if (note.userId !== user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updatedNote = await storage.updateNote(noteId, req.body);
      
      // Log the activity
      await storage.createActivity({
        userId: user.id,
        type: "note",
        description: "Updated a note"
      });
      
      res.json(updatedNote);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const noteId = Number(req.params.id);
      const note = await storage.getNoteById(noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      if (note.userId !== user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deleteNote(noteId);
      
      // Log the activity
      await storage.createActivity({
        userId: user.id,
        type: "note",
        description: "Deleted a note"
      });
      
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Activities routes
  app.get("/api/activities/recent", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      console.log('Fetching recent activities for user:', user.id);
      const activities = await storage.getRecentActivities(user.id);
      console.log('Found activities:', activities);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Event routes
  app.get("/api/events", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const events = await storage.getEventsByUserId(user.id);
    res.json(events);
  });

  app.post("/api/events", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const event = await storage.createEvent({
        ...req.body,
        userId: user.id
      });
      
      // Log the activity
      await storage.createActivity({
        userId: user.id,
        type: "event",
        description: "Added a new calendar event"
      });
      
      res.status(201).json(event);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/events/:id", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const eventId = Number(req.params.id);
      const event = await storage.getEventById(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (event.userId !== user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updatedEvent = await storage.updateEvent(eventId, req.body);
      
      // Log the activity
      await storage.createActivity({
        userId: user.id,
        type: "event",
        description: "Updated a calendar event"
      });
      
      res.json(updatedEvent);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const eventId = Number(req.params.id);
      const event = await storage.getEventById(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (event.userId !== user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deleteEvent(eventId);
      
      // Log the activity
      await storage.createActivity({
        userId: user.id,
        type: "event",
        description: "Deleted a calendar event"
      });
      
      res.sendStatus(204);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
