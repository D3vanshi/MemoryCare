import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Pill } from "lucide-react";
import type { Medication } from "@shared/schema";

interface MedicationNotificationProps {
  medication: Medication;
  onTake: (id: number) => void;
  onSnooze: (id: number) => void;
}

export function MedicationNotification({ medication, onTake, onSnooze }: MedicationNotificationProps) {
  const [isTaken, setIsTaken] = useState(false);

  const handleTake = () => {
    setIsTaken(true);
    onTake(medication.id);
  };

  return (
    <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-gray-100/50 shadow-lg hover:shadow-xl transition-all duration-200">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">{medication.name}</h3>
              <div className="flex items-center text-gray-500 space-x-2">
                <Clock className="h-4 w-4" />
                <span>{medication.time}</span>
              </div>
              {medication.notes && (
                <p className="text-sm text-gray-500 mt-2">{medication.notes}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSnooze(medication.id)}
              className="border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            >
              Snooze
            </Button>
            <Button
              size="sm"
              onClick={handleTake}
              disabled={isTaken}
              className={`bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-200 ${
                isTaken ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isTaken ? 'Taken' : 'Take Now'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
} 