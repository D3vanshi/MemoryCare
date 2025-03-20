import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import CalendarPage from "@/pages/calendar-page";
import MedicationPage from "@/pages/medication-page";
import GalleryPage from "@/pages/gallery-page";
import QuizPage from "@/pages/quiz-page";
import NotesPage from "@/pages/notes-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/medication" component={MedicationPage} />
      <ProtectedRoute path="/gallery" component={GalleryPage} />
      <ProtectedRoute path="/quiz" component={QuizPage} />
      <ProtectedRoute path="/notes" component={NotesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
