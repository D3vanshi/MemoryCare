import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronLeft, Plus, Search, Calendar, Tag, X } from "lucide-react";
import { insertNoteSchema, Note } from "@shared/schema";
import { z } from "zod";

export default function NotesPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const { data: notes, isLoading, refetch } = useQuery<Note[]>({
    queryKey: ["/api/notes"]
  });

  const noteColors: Record<string, string> = {
    "health": "yellow",
    "social": "green",
    "family": "blue",
    "important": "red",
    "hobby": "purple",
    "shopping": "gray",
    "fun": "purple",
    "personal": "pink",
  };

  const formSchema = insertNoteSchema.omit({ userId: true }).extend({
    tags: z.array(z.string()),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: [] as string[],
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/notes", {
        ...data,
        userId: user?.id
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      // Reset form values explicitly first
      form.reset({
        title: "",
        content: "",
        tags: [] as string[],
      });
      // Then close the dialog
      setIsAddNoteOpen(false);
      // Finally show success toast
      toast({
        title: "Note added",
        description: "Your note has been saved.",
      });
      // Force a refetch to update the UI
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Failed to add note",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: any) => {
    addNoteMutation.mutate(data);
  };

  const filteredNotes = notes?.filter(note => {
    const matchesSearch = searchTerm === "" || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = selectedTag === null || 
      (note.tags as string[]).includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  const availableTags = [
    "health", "social", "family", "important", "hobby", "shopping", "fun", "personal"
  ];

  const addTag = (tag: string) => {
    const currentTags = form.getValues().tags;
    if (!currentTags.includes(tag)) {
      form.setValue("tags", [...currentTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    const currentTags = form.getValues().tags;
    form.setValue("tags", currentTags.filter(t => t !== tag));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
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
            <h1 className="text-2xl font-bold text-gray-800">Notes</h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter */}
        <div className="flex mb-6">
          <div className="relative flex-1 mr-4">
            <Input 
              type="text" 
              placeholder="Search notes..." 
              className="w-full pl-10 pr-4 py-3" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <Button 
            id="add-note-btn" 
            className="flex-shrink-0 flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg shadow-sm hover:bg-primary-600"
            onClick={() => setIsAddNoteOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            New Note
          </Button>
        </div>

        {/* Tag Filter */}
        {selectedTag && (
          <div className="mb-4 flex items-center">
            <span className="mr-2 text-sm text-gray-500">Filtered by:</span>
            <span 
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${noteColors[selectedTag] || 'gray'}-100 text-${noteColors[selectedTag] || 'gray'}-800`}
            >
              {selectedTag}
              <button 
                onClick={() => setSelectedTag(null)} 
                className="ml-1 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}

        {/* Notes Grid */}
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredNotes && filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => {
              const tags = note.tags as string[];
              const borderColor = tags.length > 0 ? noteColors[tags[0]] || 'gray' : 'gray';
              
              return (
                <div 
                  key={note.id} 
                  className={`bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-${borderColor}-400`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-800">{note.title}</h3>
                    <span className="text-xs text-gray-500">{formatDate(note.date)}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{note.content}</p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span 
                          key={tag}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${noteColors[tag] || 'gray'}-100 text-${noteColors[tag] || 'gray'}-800 cursor-pointer`}
                          onClick={() => setSelectedTag(tag)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="py-16 text-center">
            <div className="flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              {searchTerm || selectedTag ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No matching notes found</h3>
                  <p className="text-gray-500 mb-4">Try a different search term or filter</p>
                  <Button variant="outline" onClick={() => {
                    setSearchTerm("");
                    setSelectedTag(null);
                  }}>
                    Clear filters
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No notes yet</h3>
                  <p className="text-gray-500 mb-4">Create your first note to get started</p>
                  <Button onClick={() => setIsAddNoteOpen(true)}>
                    Create a note
                  </Button>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Add Note Dialog */}
        <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Note</DialogTitle>
              <DialogDescription>
                Create a new note to remember important information.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter note title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Write your note here..." 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Tag className="h-4 w-4 mr-2" />
                        Tags
                      </FormLabel>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {field.value.map(tag => (
                          <span 
                            key={tag} 
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${noteColors[tag] || 'gray'}-100 text-${noteColors[tag] || 'gray'}-800`}
                          >
                            {tag}
                            <button 
                              type="button" 
                              onClick={() => removeTag(tag)} 
                              className="ml-1 text-gray-500 hover:text-gray-700"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {availableTags
                          .filter(tag => !field.value.includes(tag))
                          .map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => addTag(tag)}
                              className={`px-2 py-1 border border-${noteColors[tag] || 'gray'}-200 rounded-full text-xs text-${noteColors[tag] || 'gray'}-600 hover:bg-${noteColors[tag] || 'gray'}-50`}
                            >
                              + {tag}
                            </button>
                          ))
                        }
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddNoteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={addNoteMutation.isPending}
                  >
                    {addNoteMutation.isPending ? "Saving..." : "Save Note"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
