import { Link } from "wouter";
import {
  Calendar,
  Pill,
  Image,
  Brain,
  FileText,
  HeartPulse,
  LucideIcon,
} from "lucide-react";

interface FeatureCardProps {
  name: string;
  icon: string;
  color: string;
  path: string;
}

const iconMap: { [key: string]: LucideIcon } = {
  calendar: Calendar,
  pill: Pill,
  image: Image,
  brain: Brain,
  "file-text": FileText,
  "heart-pulse": HeartPulse,
};

const colorMap: { [key: string]: string } = {
  blue: "from-blue-500 to-blue-600",
  orange: "from-orange-500 to-orange-600",
  green: "from-green-500 to-green-600",
  purple: "from-purple-500 to-purple-600",
  yellow: "from-yellow-500 to-yellow-600",
  pink: "from-pink-500 to-pink-600",
};

export function FeatureCard({ name, icon, color, path }: FeatureCardProps) {
  const Icon = iconMap[icon];
  const gradientColor = colorMap[color];

  return (
    <Link href={path}>
      <a className="block group">
        <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg border border-gray-100/50 transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-200" style={{ backgroundImage: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.1), transparent 40%)' }} />
          
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientColor} shadow-lg`}>
              {Icon && <Icon className="h-6 w-6 text-white" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {getFeatureDescription(name)}
              </p>
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
}

function getFeatureDescription(name: string): string {
  switch (name) {
    case "Calendar":
      return "Schedule and track events";
    case "Medication":
      return "Manage your medications";
    case "Photo Gallery":
      return "Store and view memories";
    case "Quiz":
      return "Test your memory";
    case "Notes":
      return "Write down thoughts";
    case "Create Quiz":
      return "Design memory exercises";
    default:
      return "";
  }
}
