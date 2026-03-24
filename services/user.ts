import { supabase } from "@/lib/supabase";
import { Student, Teacher } from "@/types";

export const UserService = {
  async getStudentProfile(id: string): Promise<Student | null> {
    const { data: user, error } = await supabase
      .from("students")
      .select("id, name, branch, year, semester, section")
      .eq("id", id)
      .single();

    if (error || !user) {
      return null;
    }
    return user as Student;
  },

  async getTeacherProfile(id: string): Promise<Teacher | null> {
    const { data: user, error } = await supabase
      .from("teachers")
      .select("id, name")
      .eq("id", id)
      .single();

    if (error || !user) {
      return null;
    }
    return user as Teacher;
  }
};
