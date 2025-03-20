import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertMedicationSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronLeft, Plus, Clock, Calendar, Edit, Trash2 } from "lucide-react";
import { Medication } from "@shared/schema";

export default function MedicationPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false);
  const [medicationToEdit, setMedicationToEdit] = useState<Medication | null>(null);
  const [medicationToDelete, setMedicationToDelete] = useState<Medication | null>(null);
  
  const { data: medications, isLoading } = useQuery<Medication[]>({
    queryKey: ["/api/medications"]
  });

  const addMedicationForm = useForm({
    resolver: zodResolver(insertMedicationSchema.omit({ userId: true })),
    defaultValues: {
      name: "",
      time: "",
      frequency: "daily",
      notes: ""
    }
  });

  const addMedicationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/medications", {
        ...data,
        userId: user?.id
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      setIsAddMedicationOpen(false);
      addMedicationForm.reset();
      toast({
        title: "Medication added",
        description: "Your medication reminder has been added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add medication",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateMedicationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/medications/${data.id}`, {
        ...data,
        userId: user?.id
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      setMedicationToEdit(null);
      addMedicationForm.reset();
      toast({
        title: "Medication updated",
        description: "Your medication reminder has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update medication",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteMedicationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/medications/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      setMedicationToDelete(null);
      toast({
        title: "Medication deleted",
        description: "Your medication reminder has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete medication",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: any) => {
    if (medicationToEdit) {
      updateMedicationMutation.mutate({ ...data, id: medicationToEdit.id });
    } else {
      addMedicationMutation.mutate(data);
    }
  };

  const handleEdit = (medication: Medication) => {
    setMedicationToEdit(medication);
    addMedicationForm.reset({
      name: medication.name,
      time: medication.time,
      frequency: medication.frequency,
      notes: medication.notes || ""
    });
    setIsAddMedicationOpen(true);
  };

  const handleDelete = (medication: Medication) => {
    setMedicationToDelete(medication);
  };

  const confirmDelete = () => {
    if (medicationToDelete) {
      deleteMedicationMutation.mutate(medicationToDelete.id);
    }
  };

  const getIconColor = (index: number) => {
    const colors = ["blue", "green", "purple", "orange", "pink"];
    return colors[index % colors.length];
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
            <h1 className="text-2xl font-bold text-gray-800">Medication Reminders</h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Medication List */}
        <Card className="bg-white rounded-xl shadow-md mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Medications</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : medications && medications.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {medications.map((medication, index) => (
                  <li key={medication.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 w-full">
                        <div className={`flex-shrink-0 p-3 bg-${getIconColor(index)}-100 rounded-full`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-${getIconColor(index)}-600`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 2 12 4-12 4 12 4-12 4 12 4-6-2"></path>
                          </svg>
                        </div>
                        <div className="w-full">
                          <div className="flex justify-between items-start w-full">
                            <h3 className="font-medium text-gray-800 text-lg">{medication.name}</h3>
                            <div className={`px-3 py-1 rounded-full bg-${getIconColor(index)}-100 text-${getIconColor(index)}-700 text-xs font-medium`}>
                              {formatFrequency(medication.frequency)}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 bg-gray-50 p-2 rounded-md">
                            <Clock className="h-5 w-5 mr-2 text-primary-500" />
                            <span className="font-medium text-base">{medication.time}</span>
                            <div className="ml-auto flex items-center">
                              <span className="text-xs bg-gray-200 rounded-full px-2 py-1">Reminder set</span>
                            </div>
                          </div>
                          {medication.notes && (
                            <div className="mt-2 text-sm text-gray-600 p-2 border-l-2 border-gray-200 pl-3">
                              {medication.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(medication)}
                        >
                          <Edit className="h-4 w-4 text-gray-500 hover:text-primary-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(medication)}
                        >
                          <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p>No medications found.</p>
                <p className="text-sm mt-2">Add your first medication reminder below.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Medication Button */}
        <div className="flex justify-end">
          <Button 
            onClick={() => {
              setMedicationToEdit(null);
              addMedicationForm.reset({
                name: "",
                time: "",
                frequency: "daily",
                notes: ""
              });
              setIsAddMedicationOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg shadow-sm hover:bg-primary-600"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Medication
          </Button>
        </div>

        {/* Add/Edit Medication Dialog */}
        <Dialog 
          open={isAddMedicationOpen} 
          onOpenChange={(open) => {
            setIsAddMedicationOpen(open);
            if (!open) {
              setMedicationToEdit(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {medicationToEdit ? "Edit Medication" : "Add New Medication"}
              </DialogTitle>
              <DialogDescription>
                {medicationToEdit 
                  ? "Update your medication reminder details below."
                  : "Set up a reminder for your medication."
                }
              </DialogDescription>
            </DialogHeader>
            
            <Form {...addMedicationForm}>
              <form onSubmit={addMedicationForm.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={addMedicationForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medication Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter medication name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addMedicationForm.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addMedicationForm.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="twice-daily">Twice Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="as-needed">As Needed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addMedicationForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any special instructions or notes" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddMedicationOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={addMedicationMutation.isPending || updateMedicationMutation.isPending}
                  >
                    {addMedicationMutation.isPending || updateMedicationMutation.isPending 
                      ? "Saving..." 
                      : medicationToEdit ? "Update" : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!medicationToDelete} onOpenChange={(open) => !open && setMedicationToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Medication</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this medication reminder?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {medicationToDelete && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">{medicationToDelete.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{medicationToDelete.time} - {formatFrequency(medicationToDelete.frequency)}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setMedicationToDelete(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMedicationMutation.isPending}
              >
                {deleteMedicationMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function formatFrequency(frequency: string): string {
  switch (frequency) {
    case 'daily':
      return 'Daily';
    case 'twice-daily':
      return 'Twice Daily';
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'as-needed':
      return 'As Needed';
    default:
      return frequency;
  }
}
