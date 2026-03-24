import { supabase } from "@/lib/supabase";

export const StudentService = {
  async getStudentAttendanceInfo(studentId: string) {
    const { data: rawEnrollments } = await supabase
      .from('enrollments')
      .select('subject_id')
      .eq('student_id', studentId);
      
    const subjectIds = rawEnrollments?.map(e => e.subject_id) || [];
    
    let subjectMap = new Map();
    if (subjectIds.length > 0) {
      const { data: subjects, error } = await supabase
        .from('subjects')
        .select('id, name')
        .in('id', subjectIds);
        
      if (!error && subjects) {
        subjects.forEach(s => subjectMap.set(s.id, s.name));
      }
    }
    
    const { data: attendanceNodes } = await supabase
      .from('attendance')
      .select('subject_id, date, present')
      .eq('student_id', studentId);
      
    // Categorize blocks of class activity by subject constraint sequentially
    const groupedAttendance = new Map();
    attendanceNodes?.forEach(record => {
      if (!groupedAttendance.has(record.subject_id)) {
        groupedAttendance.set(record.subject_id, []);
      }
      groupedAttendance.get(record.subject_id).push(record);
    });

    return subjectIds.map(subId => {
      const records = groupedAttendance.get(subId) || [];
      const totalClasses = records.length;
      const attendedClasses = records.filter((r: any) => r.present).length;
      const percentage = totalClasses === 0 ? 0 : Math.round((attendedClasses / totalClasses) * 100);
      
      // Enforce temporal cascade layout (most recent classes shown first naturally)
      records.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        subject_id: subId,
        subject_name: subjectMap.get(subId) || `Subject ID ${subId}`,
        total_classes: totalClasses,
        attended_classes: attendedClasses,
        percentage,
        records
      };
    });
  },

  async getStudentExamScores(studentId: string) {
    // Read raw marks
    const { data: marks } = await supabase
      .from('marks')
      .select('subject_exam_id, marks_obtained')
      .eq('student_id', studentId);
      
    if (!marks || marks.length === 0) return [];
    
    // Extract unique ID structures cleanly bypassing native Supabase explicit FK constraints
    const subjectExamIds = Array.from(new Set(marks.map(m => m.subject_exam_id)));
    
    const { data: subjectExams } = await supabase
      .from('subject_exams')
      .select('*')
      .in('id', subjectExamIds);
      
    if (!subjectExams || subjectExams.length === 0) return [];
    
    const subjectIds = Array.from(new Set(subjectExams.map(se => se.subject_id)));
    const examIds = Array.from(new Set(subjectExams.map(se => se.exam_id)));
    
    // Resolve metadata associations concurrently
    const [{ data: subjects }, { data: exams }] = await Promise.all([
      supabase.from('subjects').select('id, name').in('id', subjectIds),
      supabase.from('exams').select('id, name').in('id', examIds)
    ]);
    
    const subjectMap = new Map(subjects?.map(s => [s.id, s.name]));
    const examMap = new Map(exams?.map(e => [e.id, e.name]));
    const subjectExamMap = new Map(subjectExams.map(se => [se.id, se]));
    
    // Compose fully structured UI layer payload
    const results: any[] = [];
    marks.forEach((m: any) => {
      const se = subjectExamMap.get(m.subject_exam_id);
      if (!se) return;
      
      const subjectName = subjectMap.get(se.subject_id) || `Sub ${se.subject_id}`;
      const examName = examMap.get(se.exam_id) || `Exam ${se.exam_id}`;
      const percentage = se.total_marks > 0 ? Math.round((m.marks_obtained / se.total_marks) * 100) : 0;
      
      results.push({
        id: `${subjectName}-${examName}`,
        subject_name: subjectName,
        exam_name: examName,
        marks_obtained: m.marks_obtained,
        total_marks: se.total_marks,
        percentage
      });
    });

    // Organize neatly sorted alphabetically first by Subject, then Exam Series
    return results.sort((a, b) => a.subject_name.localeCompare(b.subject_name) || a.exam_name.localeCompare(b.exam_name));
  }
};
