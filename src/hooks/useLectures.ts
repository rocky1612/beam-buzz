import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Lecture {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  professor_name: string;
  location: string;
  lecture_time: string;
  day_of_week: number;
  additional_notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useLectures = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLectures = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLectures([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("lectures")
        .select("*")
        .eq("user_id", user.id)
        .order("day_of_week", { ascending: true })
        .order("lecture_time", { ascending: true });

      if (error) throw error;

      setLectures(data || []);
    } catch (error) {
      console.error("Error fetching lectures:", error);
      toast({
        title: "Error",
        description: "Failed to load lectures",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addLecture = async (lectureData: Omit<Lecture, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("lectures")
        .insert([{ ...lectureData, user_id: user.id }]);

      if (error) throw error;

      await fetchLectures();
      toast({
        title: "Success",
        description: "Lecture added successfully",
      });
    } catch (error) {
      console.error("Error adding lecture:", error);
      toast({
        title: "Error",
        description: "Failed to add lecture",
        variant: "destructive",
      });
    }
  };

  const updateLecture = async (id: string, updates: Partial<Lecture>) => {
    try {
      const { error } = await supabase
        .from("lectures")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      await fetchLectures();
      toast({
        title: "Success",
        description: "Lecture updated successfully",
      });
    } catch (error) {
      console.error("Error updating lecture:", error);
      toast({
        title: "Error",
        description: "Failed to update lecture",
        variant: "destructive",
      });
    }
  };

  const deleteLecture = async (id: string) => {
    try {
      const { error } = await supabase
        .from("lectures")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetchLectures();
      toast({
        title: "Success",
        description: "Lecture deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting lecture:", error);
      toast({
        title: "Error",
        description: "Failed to delete lecture",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLectures();
  }, []);

  return {
    lectures,
    isLoading,
    addLecture,
    updateLecture,
    deleteLecture,
    refreshLectures: fetchLectures,
  };
};
