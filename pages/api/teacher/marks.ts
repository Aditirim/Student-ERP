import type { NextApiRequest, NextApiResponse } from "next";
import { TeacherService } from "@/services/teacher";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.cookies.userId;
  const userRole = req.cookies.userRole;
  
  if (!userId || userRole !== 'teacher') {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  if (req.method === 'GET') {
    const { assignmentId, examId } = req.query;
    if (!assignmentId || !examId) return res.status(400).json({ error: "Missing class or exam parameters" });

    // Ensure teacher actually owns this assignment before proxying
    const assignments = await TeacherService.getAssignments(userId);
    const assignment = assignments.find(a => a.id === Number(assignmentId));
    if (!assignment) return res.status(403).json({ error: "You are not authorized to access this section mapping." });

    // Validate if the chosen assignment explicitly contains an mapping for the specific Exam Type
    const subjectExam = await TeacherService.getSubjectExamDetails(assignment.subject_id, Number(examId));
    if (!subjectExam) return res.status(404).json({ error: "The selected Exam metric has not been configured in the syllabus for this exact subject yet." });

    const students = await TeacherService.getStudentsForAssignment(Number(assignmentId));
    if(students.length === 0) {
       return res.status(200).json({ subject_exam_id: subjectExam.id, total_marks: subjectExam.total_marks, students: [], marks: [] });
    }

    const marks = await TeacherService.getMarks(subjectExam.id, students.map(s => s.id));
    
    return res.status(200).json({ 
      subject_exam_id: subjectExam.id,
      total_marks: subjectExam.total_marks,
      students, 
      marks
    });
  }

  if (req.method === 'POST') {
    const { subjectExamId, records } = req.body;
    if (!subjectExamId || !records) return res.status(400).json({ error: "Missing payload details" });
    
    const result = await TeacherService.saveMarks(subjectExamId, records);
    if (!result.success) return res.status(500).json(result);
    
    return res.status(200).json({ success: true, message: "Marks securely uploaded to grading block." });
  }

  return res.status(405).end();
}
