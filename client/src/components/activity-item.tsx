import { Calendar, Clock } from "lucide-react";

interface Activity {
  id: number;
  userId: number;
  type: string;
  description: string;
  date: string;
  details?: string;
}

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const date = new Date(activity.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'medication_created':
      case 'medication_taken':
      case 'medication_snoozed':
        return '💊';
      case 'photo':
        return '📸';
      case 'quiz':
      case 'quiz_created':
      case 'quiz_updated':
      case 'quiz_deleted':
        return '🧩';
      case 'note':
        return '📝';
      case 'event':
        return '📅';
      default:
        return '✨';
    }
  };

  return (
    <div className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="text-2xl">{getActivityIcon(activity.type)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
        <div className="flex items-center mt-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{formattedDate}</span>
          <Clock className="h-3 w-3 ml-2 mr-1" />
          <span>{formattedTime}</span>
        </div>
      </div>
    </div>
  );
} 