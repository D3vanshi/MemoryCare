import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { FeatureCard } from "@/components/feature-card";
import { AlertCircle, Bell, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Medication } from "@shared/schema";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const { data: upcomingMedications, isLoading: isMedicationsLoading } = useQuery<Medication[]>({
    queryKey: ["/api/medications/upcoming"],
  });

  const { data: recentActivities, isLoading: isActivitiesLoading } = useQuery({
    queryKey: ["/api/activities/recent"],
  });

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
      name: "Caretaker",
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
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">MemoryCare</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 relative">
                <Bell className="h-5 w-5" />
                {upcomingMedications && upcomingMedications.length > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-gray-200" onClick={handleLogout}>
                <User className="h-5 w-5 text-gray-700" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-primary-500 to-primary-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-semibold">Hello, {user?.name || 'there'}!</h2>
          <p className="mt-2 text-primary-100">It's a beautiful {formattedDate}.</p>

          {/* Medication Alert */}
          {upcomingMedications && upcomingMedications.length > 0 ? (
            <div className="mt-6 p-4 bg-white rounded-lg shadow-md text-gray-800 flex items-start space-x-4">
              <div className="flex-shrink-0 p-2 bg-orange-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 2 12 4-12 4 12 4-12 4 12 4-6-2"></path>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Upcoming medication</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {upcomingMedications[0].name} at {upcomingMedications[0].time}
                </p>
                <div className="mt-2 flex space-x-2">
                  <Button size="sm" className="px-3 py-1 h-auto bg-orange-500 hover:bg-orange-600">
                    Take now
                  </Button>
                  <Button variant="secondary" size="sm" className="px-3 py-1 h-auto">
                    Snooze
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            !isMedicationsLoading && (
              <div className="mt-6 p-4 bg-white rounded-lg shadow-md text-gray-800">
                <p className="text-center text-gray-500">No upcoming medications</p>
              </div>
            )
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Features</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
      </section>

      {/* Recent Activities */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Recent Activities</h2>

        <Card>
          <CardContent className="p-4">
            {isActivitiesLoading ? (
              <div className="py-8 flex justify-center">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : recentActivities && recentActivities.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentActivities.map((activity: any) => (
                  <li key={activity.id} className="py-3 flex items-start space-x-3">
                    <div className={`flex-shrink-0 p-2 bg-${getActivityColor(activity.type)}-100 rounded-full`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-${getActivityColor(activity.type)}-600`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {getActivityIcon(activity.type)}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{activity.description}</p>
                      <p className="text-sm text-gray-500">
                        {activity.details && `${activity.details} - `}
                        {new Date(activity.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p>No recent activities found.</p>
                <p className="text-sm mt-2">Try using more features to track your progress!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 z-10">
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
