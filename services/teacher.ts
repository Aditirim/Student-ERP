import { supabase } from "@/lib/supabase";

export const TeacherService = {
  // Fetch assignments formatted with subject names
  async getAssignments(teacherId: string) {
    const { data: assignments, error } = await supabase
      .from('teacher_assignments')
      .select('*')
      .eq('teacher_id', teacherId);
      
    if (error || !assignments) return [];

    const { data: subjects } = await supabase
      .from('subjects')
      .select('*');
      
    const subjectMap = new Map();
    if (subjects) {
      subjects.forEach(s => subjectMap.set(s.id, s.name));
    }

    return assignments.map((a: any) => ({
      ...a,
      subject_name: subjectMap.get(a.subject_id) || `Subject ${a.subject_id}`
    }));
  },

  async getStudentsForAssignment(assignmentId: number) {
    const { data: assignment } = await supabase
      .from('teacher_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();
      
    if (!assignment) return [];

    const { data: students } = await supabase
      .from('students')
      .select('id, name')
      .match({
        branch: assignment.branch,
        year: assignment.year,
        semester: assignment.semester,
        section: assignment.section
      });

    if (!students || students.length === 0) return [];

    const studentIds = students.map(s => s.id);
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('subject_id', assignment.subject_id)
      .in('student_id', studentIds);

    const enrolledIds = new Set(enrollments?.map(e => e.student_id) || []);
    // Sort logic to order students alphabetically by their student ID sequentially
    return students.filter(s => enrolledIds.has(s.id)).sort((a,b) => a.id.localeCompare(b.id));
  },

  async getAttendance(subjectId: number, studentIds: string[], dateStr: string) {
    const { data } = await supabase
      .from('attendance')
      .select('student_id, present')
      .eq('subject_id', subjectId)
      .eq('date', dateStr)
      .in('student_id', studentIds);
    return data || [];
  },

  async saveAttendance(subjectId: number, dateStr: string, records: { student_id: string, present: boolean }[]) {
    if (records.length === 0) return { success: true };
    const studentIds = records.map(r => r.student_id);
    
    // Wipe existing records strictly for this date and these students
    await supabase
      .from('attendance')
      .delete()
      .eq('subject_id', subjectId)
      .eq('date', dateStr)
      .in('student_id', studentIds);

    // Insert atomic updates
    const toInsert = records.map(r => ({
      student_id: r.student_id,
      subject_id: subjectId,
      date: dateStr,
      present: r.present
    }));
    
    const { error } = await supabase.from('attendance').insert(toInsert);
    return { success: !error, error: error?.message };
  },

  async getExams() {
    const { data } = await supabase.from('exams').select('*').order('id');
    return data || [];
  },

  async getSubjectExamDetails(subjectId: number, examId: number) {
    const { data } = await supabase
      .from('subject_exams')
      .select('*')
      .match({ subject_id: subjectId, exam_id: examId })
      .single();
    return data;
  },

  async getMarks(subjectExamId: number, studentIds: string[]) {
    if (studentIds.length === 0) return [];
    const { data } = await supabase
      .from('marks')
      .select('student_id, marks_obtained')
      .eq('subject_exam_id', subjectExamId)
      .in('student_id', studentIds);
    return data || [];
  },

  async saveMarks(subjectExamId: number, records: { student_id: string, marks_obtained: number }[]) {
    if (records.length === 0) return { success: true };
    const studentIds = records.map(r => r.student_id);

    // Secure duplicate-prevention wipe directly tied to this exact exam criteria block
    await supabase
      .from('marks')
      .delete()
      .eq('subject_exam_id', subjectExamId)
      .in('student_id', studentIds);

    const toInsert = records.map(r => ({
      student_id: r.student_id,
      subject_exam_id: subjectExamId,
      marks_obtained: r.marks_obtained
    }));

    const { error } = await supabase.from('marks').insert(toInsert);
    return { success: !error, error: error?.message };
  }
};
