import type { NextApiRequest, NextApiResponse } from "next";
import { EnrollmentService } from "@/services/enrollment";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const userId = req.cookies.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const { subjectId } = req.body;
  if (!subjectId) return res.status(400).json({ success: false, message: "Subject ID required" });

  // Optional: Pre-check to explicitly catch existing
  const existing = await EnrollmentService.getStudentEnrollments(userId);
  if (existing.includes(subjectId)) {
    return res.status(400).json({ success: false, message: "Already registered" });
  }

  const response = await EnrollmentService.register(userId, subjectId);
  if (!response.success) {
    return res.status(500).json(response);
  }
  
  return res.status(200).json({ success: true, message: "Successfully registered" });
}
