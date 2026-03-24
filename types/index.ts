export type UserRole = "student" | "teacher";

export interface Student {
  id: string;
  name: string;
  email?: string;
  branch?: string;
  year?: number;
  semester?: number;
  section?: string;
  // password is intentionally omitted or made optional in types used for frontend/responses
}

export interface Teacher {
  id: string;
  name: string;
}

export type AuthResponse = 
  | { success: true; role: UserRole; user: Student | Teacher }
  | { success: false; message: string };
