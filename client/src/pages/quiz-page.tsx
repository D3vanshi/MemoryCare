import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronLeft, ChevronRight, Clock, Check, Brain, User, ArrowRight, PlusCircle, Plus, AlertCircle } from "lucide-react";
import { Quiz, QuizQuestion, QuizResult } from "@shared/schema";
import { z } from "zod";

export default function QuizPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCaretakerView, setIsCaretakerView] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isAddQuizOpen, setIsAddQuizOpen] = useState(false);
  const [isReviewAnswersOpen, setIsReviewAnswersOpen] = useState(false);
  const [quizState, setQuizState] = useState<'intro' | 'questions' | 'results'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [timerActive, setTimerActive] = useState(false);
  
  // Check URL for caretaker parameter and handle role restrictions
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('role') === 'caretaker') {
      if (user?.role === 'patient') {
        // Redirect patients back to login if they try to access caretaker view
        setLocation('/login');
        return;
      }
      setIsCaretakerView(true);
    }
  }, [window.location.search, user?.role, setLocation]);

  const { data: quizzes, isLoading } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"]
  });

  const { data: quizResults } = useQuery<QuizResult[]>({
    queryKey: ["/api/quiz-results"],
    enabled: quizState === 'results'
  });

  const addQuizSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    questions: z.array(z.object({
      question: z.string().min(1, { message: "Question is required" }),
      options: z.array(z.string()).min(2, { message: "At least 2 options are required" }),
      correctOption: z.number().min(0, { message: "Please select the correct answer" }),
      imageUrl: z.string().optional()
    })).min(1, { message: "At least one question is required" })
  });

  const addQuizForm = useForm({
    defaultValues: {
      title: "",
      questions: [
        {
          question: "",
          options: ["", "", "", ""],
          correctOption: 0,
          imageUrl: ""
        }
      ],
      patientId: undefined
    },
    resolver: zodResolver(addQuizSchema)
  });

  const addQuizMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/quizzes", {
        ...data,
        userId: user?.id
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      setIsAddQuizOpen(false);
      addQuizForm.reset();
      toast({
        title: "Quiz created",
        description: "Your quiz has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create quiz",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const submitQuizResultMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/quiz-results", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recent"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit quiz result",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (quizId: number) => {
      await apiRequest("DELETE", `/api/quizzes/${quizId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Quiz deleted",
        description: "The quiz has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete quiz",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [quizToEdit, setQuizToEdit] = useState<Quiz | null>(null);

  const handleEdit = (quiz: Quiz) => {
    // Parse questions if they're stored as a string
    const questions = typeof quiz.questions === 'string' 
      ? JSON.parse(quiz.questions) 
      : quiz.questions;

    addQuizForm.reset({
      title: quiz.title,
      questions: questions.map((q: QuizQuestion) => ({
        question: q.question,
        options: q.options,
        correctOption: q.correctOption,
        imageUrl: q.imageUrl || ''
      }))
    });
    setIsAddQuizOpen(true);
  };

  const handleDelete = (quiz: Quiz) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to manage quizzes.",
        variant: "destructive"
      });
      return;
    }
    setQuizToDelete(quiz);
  };

  const onSubmitQuiz = async (data: z.infer<typeof addQuizSchema>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to manage quizzes.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Format questions for storage
      const formattedQuestions = data.questions.map((q, index) => ({
        id: index + 1,
        question: q.question,
        options: q.options.filter(opt => opt.trim() !== ''),
        correctOption: q.correctOption,
        imageUrl: q.imageUrl || null
      }));

      await addQuizMutation.mutateAsync({
        title: data.title,
        questions: formattedQuestions,
        userId: user.id,
        patientId: null
      });

      addQuizForm.reset();
      setIsAddQuizOpen(false);
      toast({
        title: "Success",
        description: "Quiz has been saved successfully.",
      });
    } catch (error) {
      console.error('Failed to create quiz:', error);
      toast({
        title: "Error",
        description: "Failed to create quiz. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateQuizMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...quizData } = data;
      const res = await apiRequest("PATCH", `/api/quizzes/${id}`, quizData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      setIsAddQuizOpen(false);
      setQuizToEdit(null);
      addQuizForm.reset();
      toast({
        title: "Quiz updated",
        description: "Your quiz has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update quiz",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const startQuiz = (quiz: Quiz) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to take or preview quizzes.",
        variant: "destructive"
      });
      return;
    }

    const questions = typeof quiz.questions === 'string' 
      ? JSON.parse(quiz.questions) 
      : quiz.questions;

    setActiveQuiz({
      ...quiz,
      questions: questions
    });
    setQuizState('questions');
    setCurrentQuestion(0);
    setAnswers({});
    setTimerActive(true);
    setTimeLeft(45);
  };

  const selectAnswer = (questionId: number, answer: string) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const nextQuestion = () => {
    if (!activeQuiz) return;
    const questions = activeQuiz.questions as QuizQuestion[];
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTimeLeft(45);
    } else {
      // Calculate score
      let newScore = 0;
      
      questions.forEach(question => {
        const selectedAnswer = answers[question.id];
        const correctAnswer = question.options[question.correctOption];
        if (selectedAnswer === correctAnswer) {
          newScore++;
        }
      });
      
      setScore(newScore);
      setQuizState('results');
      setTimerActive(false);
      
      // Submit result
      submitQuizResultMutation.mutate({
        quizId: activeQuiz.id,
        userId: user?.id,
        score: newScore,
        totalQuestions: questions.length
      });
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setTimeLeft(45);
    }
  };

  const finishQuiz = () => {
    setQuizState('intro');
    setActiveQuiz(null);
  };

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timerActive && timeLeft === 0) {
      // Auto-progress when timer runs out
      nextQuestion();
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timeLeft, timerActive]);

  // Get current question
  const getCurrentQuestion = () => {
    if (!activeQuiz) return null;
    const questions = activeQuiz.questions as QuizQuestion[];
    return questions[currentQuestion];
  };

  // Add question to form
  const addQuestion = () => {
    const questions = addQuizForm.getValues().questions;
    addQuizForm.setValue('questions', [
      ...questions,
      {
        question: "",
        options: ["", "", "", ""],
        correctOption: 0,
        imageUrl: ""
      }
    ]);
  };

  // Remove question from form
  const removeQuestion = (index: number) => {
    const questions = addQuizForm.getValues().questions;
    if (questions.length > 1) {
      addQuizForm.setValue('questions', questions.filter((_, i) => i !== index));
    }
  };

  // Add this function to handle reviewing answers
  const handleReviewAnswers = () => {
    setIsReviewAnswersOpen(true);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-4 text-gray-500 hover:text-gray-700"
              onClick={() => setLocation("/")}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">Memory Quiz</h1>
            {user && (user.role === "caretaker") && (
              <Button 
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => setIsCaretakerView(!isCaretakerView)}
              >
                {isCaretakerView ? (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    Patient View
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Caretaker View
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isCaretakerView && user?.role !== 'patient' ? (
          /* Caretaker View */
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Quizzes Management</h2>
              <Button 
                onClick={() => setIsAddQuizOpen(true)}
                className="flex items-center"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create New Quiz
              </Button>
            </div>

            {isLoading ? (
              <div className="py-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : quizzes && quizzes.length > 0 ? (
              <div className="grid gap-4">
                {quizzes.map((quiz) => {
                  const questions = typeof quiz.questions === 'string' 
                    ? JSON.parse(quiz.questions) 
                    : quiz.questions;
                  
                  return (
                    <Card key={quiz.id}>
                      <CardHeader>
                        <CardTitle>{quiz.title}</CardTitle>
                        <CardDescription>
                          {questions.length} questions
                          {quiz.lastTaken && ` - Last taken: ${new Date(quiz.lastTaken).toLocaleDateString()}`}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="flex justify-between">
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => handleEdit(quiz)}>
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(quiz)}
                          >
                            Delete
                          </Button>
                        </div>
                        <Button onClick={() => startQuiz(quiz)}>Preview Quiz</Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="py-16 text-center">
                <div className="flex flex-col items-center justify-center">
                  <Brain className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No quizzes created yet</h3>
                  <p className="text-gray-500 mb-4">Create your first memory quiz for patients</p>
                  <Button onClick={() => setIsAddQuizOpen(true)}>
                    Create a quiz
                  </Button>
                </div>
              </Card>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!quizToDelete} onOpenChange={(open) => !open && setQuizToDelete(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Quiz</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this quiz? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setQuizToDelete(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (quizToDelete) {
                        deleteQuizMutation.mutate(quizToDelete.id);
                        setQuizToDelete(null);
                      }
                    }}
                  >
                    Delete Quiz
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Create/Edit Quiz Dialog */}
            <Dialog 
              open={isAddQuizOpen} 
              onOpenChange={(open) => {
                setIsAddQuizOpen(open);
                if (!open) {
                  setQuizToEdit(null);
                  addQuizForm.reset({
                    title: "",
                    questions: [{
                      question: "",
                      options: ["", "", "", ""],
                      correctOption: 0,
                      imageUrl: ""
                    }],
                    patientId: undefined
                  });
                }
              }}
            >
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Quiz</DialogTitle>
                  <DialogDescription>
                    Design memory exercises for patients based on spaced repetition.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...addQuizForm}>
                  <form onSubmit={addQuizForm.handleSubmit(onSubmitQuiz)} className="space-y-6">
                    <FormField
                      control={addQuizForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quiz Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter quiz title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Questions</h3>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={addQuestion}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Question
                        </Button>
                      </div>
                      
                      {addQuizForm.watch('questions').map((_, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base">Question {index + 1}</CardTitle>
                              {addQuizForm.watch('questions').length > 1 && (
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeQuestion(index)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <FormField
                              control={addQuizForm.control}
                              name={`questions.${index}.question`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Question</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter the question" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={addQuizForm.control}
                              name={`questions.${index}.imageUrl`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Image URL (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter an image URL if needed" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="space-y-2">
                              <FormLabel>Options</FormLabel>
                              {[0, 1, 2, 3].map((optionIndex) => (
                                <FormField
                                  key={optionIndex}
                                  control={addQuizForm.control}
                                  name={`questions.${index}.options.${optionIndex}`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <div className="flex gap-2">
                                          <Input 
                                            placeholder={`Option ${optionIndex + 1}`} 
                                            {...field} 
                                          />
                                          <FormField
                                            control={addQuizForm.control}
                                            name={`questions.${index}.correctOption`}
                                            render={({ field: radioField }) => (
                                              <FormItem>
                                                <FormControl>
                                                  <RadioGroup
                                                    onValueChange={(val) => radioField.onChange(Number(val))}
                                                    value={String(radioField.value)}
                                                    className="flex"
                                                  >
                                                    <div className="flex items-center">
                                                      <RadioGroupItem
                                                        value={String(optionIndex)}
                                                        id={`option-${index}-${optionIndex}`}
                                                        className="mr-2"
                                                      />
                                                      <Label
                                                        htmlFor={`option-${index}-${optionIndex}`}
                                                        className="text-xs text-gray-500"
                                                      >
                                                        Correct
                                                      </Label>
                                                    </div>
                                                  </RadioGroup>
                                                </FormControl>
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddQuizOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={addQuizMutation.isPending}
                      >
                        {addQuizMutation.isPending ? "Creating..." : "Create Quiz"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          /* Patient View */
          <div>
            {quizState === 'intro' && (
              <Card className="bg-white rounded-xl shadow-md p-6">
                <CardHeader>
                  <CardTitle className="text-xl">Today's Memory Exercise</CardTitle>
                  <CardDescription>
                    This quiz contains questions prepared by your caretaker to help strengthen your memory. 
                    Take your time and do your best!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="text-gray-500 h-5 w-5" />
                      <span className="text-gray-700 font-medium">Estimated time: 5-10 minutes</span>
                    </div>
                    {isLoading ? (
                      <div className="py-4 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : quizzes && quizzes.length > 0 ? (
                      <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                        </svg>
                        <span className="text-gray-700 font-medium">{quizzes.length} quizzes available</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                        </svg>
                        <span className="text-gray-700 font-medium">No quizzes available yet</span>
                      </div>
                    )}
                  </div>
                  
                  {isLoading ? (
                    <div className="py-4 flex justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : quizzes && quizzes.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-800">Available Quizzes</h3>
                      {quizzes.map((quiz) => {
                        const questions = typeof quiz.questions === 'string' 
                          ? JSON.parse(quiz.questions) 
                          : quiz.questions;
                        
                        return (
                          <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">{quiz.title}</CardTitle>
                              <CardDescription>
                                {questions.length} questions
                              </CardDescription>
                            </CardHeader>
                            <CardFooter>
                              <Button 
                                className="w-full"
                                onClick={() => startQuiz(quiz)}
                              >
                                Start Quiz
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No quizzes have been created yet. Please ask your caretaker to create some memory exercises for you.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {quizState === 'questions' && activeQuiz && (
              <Card className="bg-white rounded-xl shadow-md p-6">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      Question {currentQuestion + 1} of {(activeQuiz.questions as QuizQuestion[]).length}
                    </CardTitle>
                    <div className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                      Time: {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                    </div>
                  </div>
                  <Progress 
                    value={(timeLeft / 45) * 100} 
                    className="h-2 mt-2" 
                  />
                </CardHeader>
                <CardContent className="py-6">
                  {getCurrentQuestion() && (
                    <div>
                      <p className="text-gray-700 text-lg mb-4">{getCurrentQuestion()?.question}</p>
                      
                      {getCurrentQuestion()?.imageUrl && (
                        <div className="mb-4 flex justify-center">
                          <img 
                            src={getCurrentQuestion()?.imageUrl || ''} 
                            alt="Question visual" 
                            className="rounded-lg shadow-md max-h-60" 
                          />
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        {getCurrentQuestion()?.options.map((option, idx) => (
                          <div 
                            key={idx}
                            className={`p-3 border ${answers[getCurrentQuestion()?.id || 0] === option ? 'border-primary-500 bg-primary-50' : 'border-gray-300'} rounded-lg hover:bg-gray-50 cursor-pointer`}
                            onClick={() => selectAnswer(getCurrentQuestion()?.id || 0, option)}
                          >
                            <div className="flex items-center">
                              <div className={`w-5 h-5 rounded-full ${answers[getCurrentQuestion()?.id || 0] === option ? 'bg-primary-500' : 'border-2 border-gray-300'} mr-3 flex-shrink-0 flex items-center justify-center`}>
                                {answers[getCurrentQuestion()?.id || 0] === option && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <span>{option}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between pt-4 border-t">
                  <Button 
                    variant="outline"
                    onClick={prevQuestion}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </Button>
                  <Button 
                    onClick={nextQuestion}
                    disabled={!answers[getCurrentQuestion()?.id || 0]}
                  >
                    {currentQuestion < (activeQuiz.questions as QuizQuestion[]).length - 1 ? 'Next' : 'Finish'}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {quizState === 'results' && activeQuiz && (
              <Card className="bg-white rounded-xl shadow-md p-6">
                <CardContent className="py-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Great job!</h2>
                    <p className="text-gray-600">You've completed today's memory exercise.</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-700 font-medium">Your score:</span>
                      <span className="text-xl font-bold text-primary-600">
                        {score}/{(activeQuiz.questions as QuizQuestion[]).length}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                      <div 
                        className="bg-primary-500 h-4 rounded-full" 
                        style={{ width: `${(score / (activeQuiz.questions as QuizQuestion[]).length) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      {score / (activeQuiz.questions as QuizQuestion[]).length >= 0.8 ? (
                        <p>Excellent job! You're showing strong memory skills.</p>
                      ) : score / (activeQuiz.questions as QuizQuestion[]).length >= 0.6 ? (
                        <p>Good work! You're making progress with your memory.</p>
                      ) : (
                        <p>Keep practicing! Regular exercises will help improve your memory.</p>
                      )}
                      <p>Remember to take these quizzes regularly for best results.</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-3">
                    <Button 
                      variant="outline"
                      className="py-3 bg-primary-100 text-primary-700 rounded-lg font-medium hover:bg-primary-200"
                      onClick={handleReviewAnswers}
                    >
                      Review Answers
                    </Button>
                    <Button 
                      className="py-3 bg-primary-500 text-white rounded-lg shadow-sm hover:bg-primary-600 font-medium"
                      onClick={finishQuiz}
                    >
                      Back to Quizzes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Add the Review Answers Dialog */}
      <Dialog open={isReviewAnswersOpen} onOpenChange={setIsReviewAnswersOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Your Answers</DialogTitle>
            <DialogDescription>
              Let's go through your answers and see how you did
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {(activeQuiz?.questions as QuizQuestion[])?.map((question, index) => {
              const selectedAnswer = answers[question.id];
              const isCorrect = selectedAnswer === question.options[question.correctOption];
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {isCorrect ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Question {index + 1}</p>
                      <p className="text-gray-700">{question.question}</p>
                      {question.imageUrl && (
                        <img 
                          src={question.imageUrl} 
                          alt="Question visual" 
                          className="mt-2 rounded-lg max-h-40"
                        />
                      )}
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-500">Your answer:</p>
                        <p className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedAnswer}
                        </p>
                        {!isCorrect && (
                          <>
                            <p className="text-sm font-medium text-gray-500 mt-2">Correct answer:</p>
                            <p className="text-sm text-green-600">
                              {question.options[question.correctOption]}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsReviewAnswersOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
