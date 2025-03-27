import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { FeatureCard } from "@/components/feature-card";
import { AlertCircle, Bell, User, Search, LogOut, Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Medication } from "@shared/schema";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MedicationNotification } from "@/components/medication-notification";
import { ActivityItem } from "@/components/activity-item";

interface Activity {
  id: number;
  userId: number;
  type: string;
  description: string;
  date: string;
  details?: string;
}

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: user?.name || "",
    email: user?.username || "",
    notifications: true,
    theme: "light"
  });

  const { data: upcomingMedications, isLoading: isMedicationsLoading, error: medicationsError } = useQuery<Medication[]>({
    queryKey: ["/api/medications/upcoming"],
    refetchInterval: 30000,
    onSuccess: (data) => {
      console.log('Successfully fetched medications:', data);
    },
    onError: (error) => {
      console.error('Error fetching medications:', error);
      toast({
        title: "Failed to load medications",
        description: "There was an error loading your upcoming medications.",
        variant: "destructive",
      });
    }
  });

  const { data: recentActivities, isLoading: isActivitiesLoading, error: activitiesError } = useQuery<Activity[]>({
    queryKey: ["/api/activities/recent"],
    onError: (error) => {
      console.error('Error fetching activities:', error);
      toast({
        title: "Failed to load activities",
        description: "There was an error loading your recent activities.",
        variant: "destructive",
      });
    }
  });

  const takeMedicationMutation = useMutation({
    mutationFn: async (medicationId: number) => {
      const res = await apiRequest("POST", `/api/medications/${medicationId}/take`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recent"] });
      toast({
        title: "Medication taken",
        description: "Your medication has been marked as taken.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to mark medication as taken",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const snoozeMedicationMutation = useMutation({
    mutationFn: async (medicationId: number) => {
      console.log('Snoozing medication:', medicationId);
      const res = await apiRequest("POST", `/api/medications/${medicationId}/snooze`);
      const data = await res.json();
      console.log('Snooze response:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recent"] });
      toast({
        title: "Medication snoozed",
        description: "Your medication reminder has been snoozed for 15 minutes.",
      });
    },
    onError: (error) => {
      console.error('Error snoozing medication:', error);
      toast({
        title: "Failed to snooze medication",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleTakeMedication = (medicationId: number) => {
    takeMedicationMutation.mutate(medicationId);
  };

  const handleSnoozeMedication = (medicationId: number) => {
    snoozeMedicationMutation.mutate(medicationId);
  };

  const features = [
    {
      name: "Calendar",
      icon: "calendar",
      color: "blue",
      path: "/calendar",
    },
    {
      name: "Medication",
      icon: "pill",
      color: "orange",
      path: "/medication",
    },
    {
      name: "Photo Gallery",
      icon: "image",
      color: "green",
      path: "/gallery",
    },
    {
      name: "Quiz",
      icon: "brain",
      color: "purple",
      path: "/quiz",
    },
    {
      name: "Notes",
      icon: "file-text",
      color: "yellow",
      path: "/notes",
    },
    {
      name: "Create Quiz",
      icon: "heart-pulse",
      color: "pink",
      path: "/quiz?role=caretaker",
    },
  ];

  const formattedDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsProfileOpen(false);
  };

  const handleSettingsSave = () => {
    // Here you would typically make an API call to save the settings
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
    setIsSettingsOpen(false);
  };

  useEffect(() => {
    if (upcomingMedications) {
      console.log('Upcoming medications:', upcomingMedications);
    }
  }, [upcomingMedications]);

  useEffect(() => {
    if (recentActivities) {
      console.log('Recent activities:', recentActivities);
    }
  }, [recentActivities]);

  // Check for upcoming medications every minute
  useEffect(() => {
    const checkMedications = () => {
      if (upcomingMedications && upcomingMedications.length > 0) {
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
        
        upcomingMedications.forEach(medication => {
          if (medication.time === currentTime && !medication.taken) {
            // Show browser notification
            if (Notification.permission === "granted") {
              new Notification("Time to take medication!", {
                body: `It's time to take ${medication.name}`,
                icon: "/pill.png"
              });
            }
            
            // Show in-app notification
            setHasNewNotifications(true);
            toast({
              title: "Medication Reminder",
              description: `It's time to take ${medication.name}`,
              action: (
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleTakeMedication(medication.id)}
                  >
                    Take Now
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleSnoozeMedication(medication.id)}
                  >
                    Snooze
                  </Button>
                </div>
              )
            });
          }
        });
      }
    };

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Check immediately and then every minute
    checkMedications();
    const interval = setInterval(checkMedications, 60000);

    return () => clearInterval(interval);
  }, [upcomingMedications]);

  // Reset notification indicator when drawer is opened
  useEffect(() => {
    if (isNotificationsOpen) {
      setHasNewNotifications(false);
    }
  }, [isNotificationsOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a5 5 0 0 1 5 5c0 2.76-2.5 5-5 9-2.5-4-5-6.24-5-9a5 5 0 0 1 5-5z"></path>
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-800">MemoryCare</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setIsNotificationsOpen(true)}
              >
                <Bell className="h-5 w-5" />
                {hasNewNotifications && (
                  <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 ring-2 ring-white" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsProfileOpen(true)}
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome back{user?.name ? `, ${user.name}` : ''}!</h2>
          <p className="text-gray-500">{formattedDate}</p>
        </div>

        {/* Upcoming Medications */}
        {isMedicationsLoading ? (
          <Card className="mb-12 bg-white/80 backdrop-blur-sm border border-gray-100/50">
            <CardContent className="p-6 text-center text-gray-500">
              <p>Loading medications...</p>
            </CardContent>
          </Card>
        ) : upcomingMedications && upcomingMedications.length > 0 ? (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Medications</h2>
            <div className="grid gap-4">
              {upcomingMedications.map(medication => (
                <MedicationNotification
                  key={medication.id}
                  medication={medication}
                  onTake={handleTakeMedication}
                  onSnooze={handleSnoozeMedication}
                />
              ))}
            </div>
          </div>
        ) : (
          <Card className="mb-12 bg-white/80 backdrop-blur-sm border border-gray-100/50">
            <CardContent className="p-6 text-center text-gray-500">
              <p>No upcoming medications</p>
            </CardContent>
          </Card>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature) => (
            <FeatureCard
              key={feature.name}
              name={feature.name}
              icon={feature.icon}
              color={feature.color}
              path={feature.path}
            />
          ))}
        </div>

        {/* Recent Activities */}
        <div className="mb-20">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activities</h2>
          <Card className="bg-white/80 backdrop-blur-sm border border-gray-100/50">
            <CardContent className="p-0">
              {isActivitiesLoading ? (
                <div className="p-6 text-center text-gray-500">Loading activities...</div>
              ) : !recentActivities || recentActivities.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No recent activities</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {recentActivities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Drawers and Dialogs */}
      <Drawer open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Profile</DrawerTitle>
            <DrawerDescription>Manage your account settings</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-8 w-8 text-gray-700" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{user?.name}</h3>
                <p className="text-sm text-gray-500">{user?.username}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsSettingsOpen(true);
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsHelpOpen(true);
                }}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </Button>
            </div>
          </div>
          <DrawerFooter>
            <Button variant="destructive" onClick={handleLogout} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your account preferences and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={settingsForm.name}
                onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settingsForm.email}
                onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex space-x-4">
                <Button
                  variant={settingsForm.theme === "light" ? "default" : "outline"}
                  onClick={() => setSettingsForm({ ...settingsForm, theme: "light" })}
                >
                  Light
                </Button>
                <Button
                  variant={settingsForm.theme === "dark" ? "default" : "outline"}
                  onClick={() => setSettingsForm({ ...settingsForm, theme: "dark" })}
                >
                  Dark
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notifications"
                checked={settingsForm.notifications}
                onChange={(e) => setSettingsForm({ ...settingsForm, notifications: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="notifications">Enable notifications</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSettingsSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help & Support Dialog */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
            <DialogDescription>
              Get assistance with using MemoryCare
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Frequently Asked Questions</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Q: How do I take a memory quiz?</strong><br />
                  A: Click on the "Memory Quiz" card on the home page and select a quiz to start.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Q: How do I add a medication reminder?</strong><br />
                  A: Go to the "Medications" section and click the "Add Medication" button.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Q: How do I create a memory note?</strong><br />
                  A: Navigate to the "Notes" section and click the "Add Note" button.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Contact Support</h3>
              <p className="text-sm text-gray-600">
                Need more help? Contact our support team at:<br />
                <a href="mailto:support@memorycare.com" className="text-primary-600 hover:underline">
                  support@memorycare.com
                </a>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHelpOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notifications Drawer */}
      <Drawer open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Medication Reminders</DrawerTitle>
            <DrawerDescription>Your upcoming medications</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            {isMedicationsLoading ? (
              <div className="text-center text-gray-500">Loading medications...</div>
            ) : upcomingMedications && upcomingMedications.length > 0 ? (
              upcomingMedications.map(medication => (
                <MedicationNotification
                  key={medication.id}
                  medication={medication}
                  onTake={handleTakeMedication}
                  onSnooze={handleSnoozeMedication}
                />
              ))
            ) : (
              <div className="text-center text-gray-500">No upcoming medications</div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 py-2 px-4 z-10">
        <div className="flex justify-around items-center max-w-5xl mx-auto">
          <Link href="/" className="flex flex-col items-center p-2 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/calendar" className="flex flex-col items-center p-2 text-gray-500 hover:text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span className="text-xs mt-1">Calendar</span>
          </Link>
          <Link href="/gallery" className="flex flex-col items-center p-2 text-gray-500 hover:text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span className="text-xs mt-1">Photos</span>
          </Link>
          <Link href="/quiz" className="flex flex-col items-center p-2 text-gray-500 hover:text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span className="text-xs mt-1">Quiz</span>
          </Link>
          <Link href="/notes" className="flex flex-col items-center p-2 text-gray-500 hover:text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span className="text-xs mt-1">Notes</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function getActivityColor(type: string): string {
  switch (type) {
    case 'quiz':
      return 'blue';
    case 'photo':
      return 'green';
    case 'medication':
      return 'orange';
    case 'note':
      return 'yellow';
    default:
      return 'gray';
  }
}

function getActivityIcon(type: string): JSX.Element {
  switch (type) {
    case 'quiz':
      return <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>;
    case 'photo':
      return <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>;
    case 'medication':
      return <path d="m6 2 12 4-12 4 12 4-12 4 12 4-6-2"></path>;
    case 'note':
      return <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>;
    default:
      return <circle cx="12" cy="12" r="10"></circle>;
  }
}
