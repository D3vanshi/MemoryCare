import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UploadButton } from "@/components/ui/upload-button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronLeft, Plus, Search, Filter } from "lucide-react";
import { Photo } from "@shared/schema";
import { z } from "zod";

export default function GalleryPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: photos, isLoading, refetch } = useQuery<Photo[]>({
    queryKey: ["/api/photos"]
  });

  const { data: categories } = useQuery<string[]>({
    queryKey: ["/api/photos/categories"]
  });

  // Photo form validation schema
  const formSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().optional(),
    imageUrl: z.string().min(1, { message: "Please upload an image" }),
    category: z.string().min(1, { message: "Please select a category" }),
    date: z.string().min(1, { message: "Date is required" })
  });

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      category: "memories",
      date: new Date().toISOString().split("T")[0]
    },
    resolver: zodResolver(formSchema)
  });

  const addPhotoMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/photos", {
        ...data,
        userId: user?.id
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/photos/categories"] });
      // Reset form values explicitly first
      form.reset({
        title: "",
        description: "",
        imageUrl: "",
        category: "memories",
        date: new Date().toISOString().split("T")[0]
      });
      // Then close the dialog
      setIsAddPhotoOpen(false);
      // Finally show success toast
      toast({
        title: "Photo added",
        description: "Your photo has been added to the gallery.",
      });
      // Force a refetch to update the UI
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Failed to add photo",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: any) => {
    addPhotoMutation.mutate(data);
  };

  const filteredPhotos = photos?.filter(photo => {
    const matchesCategory = selectedCategory === "all" || photo.category === selectedCategory;
    const matchesSearch = searchTerm === "" || 
      photo.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (photo.description && photo.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleUpload = (url: string) => {
    form.setValue("imageUrl", url);
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
            <h1 className="text-2xl font-bold text-gray-800">Photo Gallery</h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Gallery Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="font-semibold text-gray-800">Your Memories</h2>
            <div className="relative">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm">
                  <SelectValue placeholder="All Memories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Memories</SelectItem>
                  {categories?.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex space-x-2">
            <div className="relative">
              <Input
                placeholder="Search photos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            <Button 
              onClick={() => setIsAddPhotoOpen(true)}
              variant="default"
              className="flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Photo
            </Button>
          </div>
        </div>

        {/* Photo Grid */}
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredPhotos && filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-12">
            {filteredPhotos.map((photo) => (
              <div 
                key={photo.id} 
                className="relative group overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow aspect-square"
              >
                <img 
                  src={photo.imageUrl} 
                  alt={photo.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity flex items-end justify-start p-4">
                  <div className="transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                    <p className="text-white text-sm font-medium">{photo.title}</p>
                    <p className="text-white text-xs opacity-80">
                      {new Date(photo.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    {photo.description && (
                      <p className="text-white text-xs mt-1 opacity-90 line-clamp-2">
                        {photo.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="py-16 text-center">
            <div className="flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              {selectedCategory !== "all" || searchTerm !== "" ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No matching photos found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your filters or search term</p>
                  <Button variant="outline" onClick={() => {
                    setSelectedCategory("all");
                    setSearchTerm("");
                  }}>
                    Clear filters
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No photos yet</h3>
                  <p className="text-gray-500 mb-4">Start building your memory collection</p>
                  <Button onClick={() => setIsAddPhotoOpen(true)}>
                    Add your first photo
                  </Button>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Add Photo Dialog */}
        <Dialog open={isAddPhotoOpen} onOpenChange={setIsAddPhotoOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Photo</DialogTitle>
              <DialogDescription>
                Upload a photo to your memory gallery.
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
                        <Input placeholder="Enter a title for this memory" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe this memory" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="family">Family</SelectItem>
                          <SelectItem value="friends">Friends</SelectItem>
                          <SelectItem value="vacations">Vacations</SelectItem>
                          <SelectItem value="celebrations">Celebrations</SelectItem>
                          <SelectItem value="memories">Memories</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo</FormLabel>
                      <FormControl>
                        <div>
                          <UploadButton onUpload={handleUpload} />
                          {field.value && (
                            <div className="mt-2">
                              <img 
                                src={field.value} 
                                alt="Preview" 
                                className="max-h-32 rounded-md" 
                              />
                            </div>
                          )}
                          <Input 
                            type="hidden" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddPhotoOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={addPhotoMutation.isPending || !form.getValues().imageUrl}
                  >
                    {addPhotoMutation.isPending ? "Adding..." : "Add Photo"}
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
