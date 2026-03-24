import { supabase } from "@/lib/supabase";
import { AuthResponse } from "@/types";

export const AuthService = {
  async login(id: string, password: string): Promise<AuthResponse> {
    // Try to fetch from students table
    let { data: user, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .single();

    let role: "student" | "teacher" = "student";

    if (error || !user) {
      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", id)
        .single();
        
      if (teacherError || !teacher) {
        return { success: false, message: "Invalid credentials" };
      }
      user = teacher;
      role = "teacher";
    }

    if (user.password !== password) {
      return { success: false, message: "Invalid credentials" };
    }

    const { password: _password, ...userWithoutPassword } = user;

    return {
      success: true,
      role: role,
      user: userWithoutPassword as any
    };
  }
};
