import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { Event } from "@shared/schema";

export default function CalendarPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    type: "event",
    color: "blue"
  });
  
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"]
  });

  const addEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const res = await apiRequest("POST", "/api/events", {
        ...eventData,
        userId: user?.id
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setIsAddEventOpen(false);
      setNewEvent({
        title: "",
        date: new Date().toISOString().split("T")[0],
        type: "event",
        color: "blue"
      });
      toast({
        title: "Event added",
        description: "Your event has been added to the calendar.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add event",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handlePrevMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() - 1);
    setDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + 1);
    setDate(newDate);
  };

  const handleToday = () => {
    setDate(new Date());
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    addEventMutation.mutate(newEvent);
  };

  // Format events for rendering on calendar
  const dateHasEvent = (date: Date) => {
    if (!events) return false;
    const dateString = date.toISOString().split("T")[0];
    return events.some(event => event.date === dateString);
  };

  const getEventForDate = (date: Date) => {
    if (!events) return null;
    const dateString = date.toISOString().split("T")[0];
    return events.find(event => event.date === dateString);
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const renderCalendarDay = (day: Date) => {
    const event = getEventForDate(day);
    const isToday = new Date().toDateString() === day.toDateString();
    const isCurrentMonth = day.getMonth() === date.getMonth();
    
    return (
      <div className={`relative h-full min-h-[100px] p-2 ${isCurrentMonth ? '' : 'opacity-40'} ${isToday ? 'bg-primary-50' : ''} hover:bg-gray-50 transition-colors`}>
        <div className="flex justify-between items-center mb-1">
          <time className={`font-medium ${isToday ? 'text-primary-600 bg-primary-100 rounded-full w-7 h-7 flex items-center justify-center' : ''} ${isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}`}>
            {day.getDate()}
          </time>
          {isCurrentMonth && !event && (
            <button 
              onClick={() => {
                setNewEvent({
                  ...newEvent,
                  date: day.toISOString().split("T")[0]
                });
                setIsAddEventOpen(true);
              }}
              className="text-gray-400 hover:text-primary-500 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          )}
        </div>
        
        {event && (
          <div 
            className={`mt-1 p-2 rounded-md bg-${event.color || 'blue'}-100 text-${event.color || 'blue'}-800 text-xs border-l-2 border-${event.color || 'blue'}-500 shadow-sm cursor-pointer hover:bg-${event.color || 'blue'}-200`}
            onClick={() => {
              toast({
                title: event.title,
                description: `Date: ${new Date(event.date).toLocaleDateString()}${event.type ? ` • Type: ${event.type}` : ''}`,
              });
            }}
          >
            <div className="font-medium truncate">{event.title}</div>
            {event.type && (
              <div className="mt-1 text-xs opacity-80">{event.type}</div>
            )}
          </div>
        )}
      </div>
    );
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
            <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Calendar Controls */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">{formatMonth(date)}</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              className="ml-2 px-3 py-2 bg-primary-100 text-primary-700"
              onClick={handleToday}
            >
              Today
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-3 text-sm font-medium text-gray-500 text-center">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          {isLoading ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Calendar
              mode="multiple"
              selected={[]}
              month={date}
              onMonthChange={setDate}
              className="rounded-md border-0"
              classNames={{
                month: "space-y-4",
                caption: "hidden",
                table: "w-full border-collapse",
                head_row: "grid grid-cols-7",
                head_cell: "hidden",
                row: "grid grid-cols-7 border-b border-gray-200 last:border-0",
                cell: "relative p-0 border-r border-gray-200 last:border-r-0 min-h-[100px]",
                day: "h-full",
                day_selected: "bg-primary-50",
                day_today: "bg-primary-50 ring-2 ring-primary-500",
              }}
              components={{
                Day: ({ date, ...props }) => {
                  return <div {...props}>{renderCalendarDay(date)}</div>;
                }
              }}
            />
          )}
        </Card>

        {/* Add Event Button */}
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={() => setIsAddEventOpen(true)}
            className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg shadow-sm hover:bg-primary-600"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Event
          </Button>
        </div>

        {/* Add Event Dialog */}
        <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Event</DialogTitle>
              <DialogDescription>
                Create a new event or reminder on your calendar.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddEvent}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input 
                    id="title" 
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="Enter event title" 
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="type">Event Type</Label>
                  <Select 
                    value={newEvent.type}
                    onValueChange={(value) => setNewEvent({...newEvent, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">Regular Event</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="color">Color</Label>
                  <Select 
                    value={newEvent.color}
                    onValueChange={(value) => setNewEvent({...newEvent, color: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="yellow">Yellow</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="pink">Pink</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddEventOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={addEventMutation.isPending}
                >
                  {addEventMutation.isPending ? "Adding..." : "Add Event"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
