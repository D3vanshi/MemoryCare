import { Link } from "wouter";

interface FeatureCardProps {
  name: string;
  icon: string;
  color: string;
  path: string;
}

export function FeatureCard({ name, icon, color, path }: FeatureCardProps) {
  const getIconPath = (iconName: string) => {
    switch (iconName) {
      case "calendar":
        return (
          <path d="M19 4H5c-1.1 0-2 .9-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 6v2h14V6H5zm4 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
        );
      case "pill":
        return (
          <path d="m6 2 12 4-12 4 12 4-12 4 12 4-6-2" />
        );
      case "image":
        return (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </>
        );
      case "brain":
        return (
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54zm5 0A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54z" />
        );
      case "file-text":
        return (
          <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </>
        );
      case "heart-pulse":
        return (
          <>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            <path d="M3.22 12H9.5l.5-1 2 4 .5-2h6.08" />
          </>
        );
      default:
        return (
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        );
    }
  };

  const getColorClass = (colorName: string) => {
    switch (colorName) {
      case "blue":
        return "bg-blue-100 text-blue-600";
      case "orange":
        return "bg-orange-100 text-orange-600";
      case "green":
        return "bg-green-100 text-green-600";
      case "purple":
        return "bg-purple-100 text-purple-600";
      case "yellow":
        return "bg-yellow-100 text-yellow-600";
      case "pink":
        return "bg-pink-100 text-pink-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <Link href={path}>
      <a className="feature-card bg-white rounded-xl shadow-md p-4 flex flex-col items-center hover:shadow-lg transition-shadow cursor-pointer">
        <div className={`w-14 h-14 rounded-full ${getColorClass(color)} flex items-center justify-center mb-3`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {getIconPath(icon)}
          </svg>
        </div>
        <h3 className="font-medium text-center">{name}</h3>
      </a>
    </Link>
  );
}
