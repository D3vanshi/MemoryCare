import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import LoginForm from "@/components/login-form";
import SignupForm from "@/components/signup-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  // Redirect to home if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  return (
    <div className="min-h-screen flex">
      {/* Left side with forms */}
      <div className="w-full lg:w-1/2 p-4 flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg transform hover:scale-105 transition-transform duration-200">
              <svg className="h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a5 5 0 0 1 5 5c0 2.76-2.5 5-5 9-2.5-4-5-6.24-5-9a5 5 0 0 1 5-5z"></path>
                <path d="M9 13s.5 1 3 1 3-1 3-1"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">MemoryCare</h1>
            <p className="text-gray-500 text-center">Memory exercises & care assistant</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="data-[state=active]:bg-gray-100">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side with hero background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Animated circles in background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 rounded-full bg-white/10 -top-20 -right-20 animate-pulse"></div>
          <div className="absolute w-96 h-96 rounded-full bg-white/10 -bottom-20 -left-20 animate-pulse delay-300"></div>
          <div className="absolute w-64 h-64 rounded-full bg-white/10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse delay-700"></div>
        </div>
        
        {/* Content with glassmorphism */}
        <div className="relative max-w-md text-center backdrop-blur-lg bg-white/10 p-8 rounded-2xl shadow-lg border border-white/20">
          <h2 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
            Welcome to MemoryCare
          </h2>
          <p className="text-xl opacity-90 mb-8">
            A supportive assistant for memory exercises, medication reminders, and more.
          </p>
          <div className="grid grid-cols-2 gap-6 text-left">
            <div className="flex items-start space-x-3 transform transition-all hover:scale-105">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 4H5c-1.1 0-2 .9-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6c0-1.1-.9-2-2-2z"></path>
                  <path d="M16 2v4"></path>
                  <path d="M8 2v4"></path>
                  <path d="M3 10h18"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Calendar Events</h3>
                <p className="opacity-80 text-sm">Keep track of important dates</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 transform transition-all hover:scale-105">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 21h8"></path>
                  <path d="M12 21v-4"></path>
                  <path d="M12 3L4 11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2l-8-8z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Medication Reminders</h3>
                <p className="opacity-80 text-sm">Never miss medications</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 transform transition-all hover:scale-105">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Quick Notes</h3>
                <p className="opacity-80 text-sm">Jot down reminders</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 transform transition-all hover:scale-105">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 3v18"></path>
                  <path d="M9 8h7a3 3 0 0 0 0-6H9v10h7a3 3 0 0 0 0-6H9"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Memory Exercises</h3>
                <p className="opacity-80 text-sm">Practice with quizzes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
