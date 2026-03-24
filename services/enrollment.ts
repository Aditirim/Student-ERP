import { supabase } from "@/lib/supabase";

export const EnrollmentService = {
  async getAllSubjects() {
    const { data, error } = await supabase.from('subjects').select('*');
    return error ? [] : data;
  },

  async getStudentEnrollments(studentId: string) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('subject_id')
      .eq('student_id', studentId);
    return error ? [] : data.map(e => e.subject_id);
  },

  async register(studentId: string, subjectId: number) {
    const { error } = await supabase
      .from('enrollments')
      .insert([{ student_id: studentId, subject_id: subjectId }]);
    
    if (error) {
      if (error.code === '23505') { // Unique violation
        return { success: false, message: "Already registered for this subject." };
      }
      return { success: false, message: error.message };
    }
    return { success: true };
  }
};
