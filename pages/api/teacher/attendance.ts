import type { NextApiRequest, NextApiResponse } from "next";
import { TeacherService } from "@/services/teacher";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.cookies.userId;
  const userRole = req.cookies.userRole;
  
  if (!userId || userRole !== 'teacher') {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  if (req.method === 'GET') {
    const { assignmentId, date } = req.query;
    if (!assignmentId || !date) return res.status(400).json({ error: "Missing parameters" });

    // Ensure teacher actually owns this assignment before proxying
    const assignments = await TeacherService.getAssignments(userId);
    const assignment = assignments.find(a => a.id === Number(assignmentId));
    if (!assignment) return res.status(403).json({ error: "Forbidden cross-assignment access" });

    const students = await TeacherService.getStudentsForAssignment(Number(assignmentId));
    const attendance = await TeacherService.getAttendance(assignment.subject_id, students.map(s => s.id), String(date));
    
    return res.status(200).json({ 
      subject_id: assignment.subject_id,
      students, 
      attendance
    });
  }

  if (req.method === 'POST') {
    const { subjectId, date, records } = req.body;
    if (!subjectId || !date || !records) return res.status(400).json({ error: "Missing payload details" });
    
    const result = await TeacherService.saveAttendance(subjectId, date, records);
    if (!result.success) return res.status(500).json(result);
    
    return res.status(200).json({ success: true, message: "Attendance uploaded successfully" });
  }

  return res.status(405).end();
}
