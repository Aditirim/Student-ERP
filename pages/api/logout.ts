import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Set-Cookie', [
    serialize('userId', '', { path: '/', httpOnly: true, maxAge: -1 }),
    serialize('userRole', '', { path: '/', httpOnly: true, maxAge: -1 })
  ]);
  return res.status(200).json({ success: true, message: "Logged out successfully" });
}
