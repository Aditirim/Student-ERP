import type { NextApiRequest, NextApiResponse } from "next";
import { AuthService } from "@/services/auth";
import { serialize } from "cookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, password } = req.body;
  if (!id || !password) {
    return res.status(400).json({ success: false, message: "ID and password are required" });
  }

  const response = await AuthService.login(id, password);

  if (!response.success) {
    return res.status(401).json(response);
  }

  // Set auth cookies
  res.setHeader('Set-Cookie', [
    serialize('userId', response.user.id, { path: '/', httpOnly: true, maxAge: 604800 }),
    serialize('userRole', response.role, { path: '/', httpOnly: true, maxAge: 604800 })
  ]);

  return res.status(200).json(response);
}
