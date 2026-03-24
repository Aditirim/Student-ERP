import { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { UserService } from "@/services/user";
import { TeacherService } from "@/services/teacher";
import { Teacher } from "@/types";
import { getTeacherLayout } from "@/components/layout/wrappers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardCheck, CalendarIcon, Users, Check, X, Save, AlertCircle, Filter } from "lucide-react"

interface Assignment {
  id: number;
  subject_id: number;
  branch: string;
  year: number;
  semester: number;
  section: string;
  subject_name: string;
}

interface Student {
  id: string;
  name: string;
}

interface MarkAttendanceProps {
  user?: Teacher;
  assignments: Assignment[];
  error?: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const userId = context.req.cookies.userId;
  if (!userId) return { redirect: { destination: "/login", permanent: false } };
  
  const user = await UserService.getTeacherProfile(userId);
  if (!user) return { props: { error: "Failed to load profile", assignments: [] } };

  const assignments = await TeacherService.getAssignments(userId);
  
  return { props: { user, assignments } };
};

export default function MarkAttendancePage({ user, assignments, error }: MarkAttendanceProps) {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | "">("");
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [subjectId, setSubjectId] = useState<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // System local date format YYYY-MM-DD ensures "every day" reset logic constraint
  const todayString = new Date().toLocaleDateString("en-CA");

  const loadStudents = async () => {
    if (!selectedAssignmentId) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/teacher/attendance?assignmentId=${selectedAssignmentId}&date=${todayString}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setSubjectId(data.subject_id);
      setStudents(data.students);
      
      // Map existing records to local state
      const initialMap: Record<string, boolean> = {};
      data.attendance.forEach((record: any) => {
        initialMap[record.student_id] = record.present;
      });
      setAttendance(initialMap);
      
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch student roster");
    } finally {
      setIsLoading(false);
    }
  };

  const markStatus = (studentId: string, present: boolean) => {
    setAttendance(prev => ({ ...prev, [studentId]: present }));
  };

  const markAll = (present: boolean) => {
    const freshMap: Record<string, boolean> = {};
    students.forEach(s => {
      freshMap[s.id] = present;
    });
    setAttendance(freshMap);
  };

  const uploadAttendance = async () => {
    if (!subjectId) return;
    setIsSaving(true);
    setErrorMsg("");

    const records = Object.entries(attendance).map(([student_id, present]) => ({
      student_id,
      present
    }));

    try {
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, date: todayString, records })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to upload");
      
      alert("Attendance records successfully uploaded/updated for today!");
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while uploading attendance");
    } finally {
      setIsSaving(false);
    }
  };

  if (error || !user) {
    return <div className="p-8 text-center text-destructive">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header Context Box */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mark Attendance</h1>
          <p className="text-muted-foreground">Select an assigned class to securely upload daily register logs.</p>
        </div>
        <div className="flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-lg border border-border/50 text-sm font-medium">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <span>Date: {todayString}</span>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Class Filtering */}
      <Card className="shadow-sm border-muted bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filter Required Assigned Class:
              </label>
              <select 
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedAssignmentId}
                onChange={(e) => {
                  setSelectedAssignmentId(Number(e.target.value));
                  setStudents([]); // Reset students when class changes
                }}
              >
                <option value="" disabled>-- Select Assigned Class --</option>
                {assignments.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.subject_name} • {a.branch} • Year {a.year} • Sem {a.semester} • Sec {a.section}
                  </option>
                ))}
              </select>
            </div>
            <Button className="h-11 shadow-sm px-8 w-full md:w-auto" disabled={!selectedAssignmentId || isLoading} onClick={loadStudents}>
              {isLoading ? "Fetching..." : "Apply Filters"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students Data Form Module */}
      {students.length > 0 && (
        <Card className="border-muted shadow-sm">
          <CardHeader className="border-b bg-muted/10 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Student Roll Listing
                </CardTitle>
                <CardDescription>
                  Click "Present" or "Absent". Records can be edited until midnight (12:00 AM).
                </CardDescription>
              </div>
              <div className="hidden md:flex gap-2">
                <Button variant="outline" size="sm" onClick={() => markAll(true)}>Mark All Present</Button>
                <Button variant="outline" size="sm" onClick={() => markAll(false)}>Mark All Absent</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {students.map((student) => {
                const isPresent = attendance[student.id];
                
                return (
                  <div key={student.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-6 transition-colors hover:bg-muted/10 gap-4">
                    <div className="font-medium flex items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                        {student.id.replace('S','')}
                      </span>
                      <div>
                        <p className="text-base font-semibold">{student.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {student.id}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 md:w-auto h-10">
                      <Button 
                        variant={isPresent === true ? "default" : "outline"}
                        className={`w-full md:w-28 flex-1 ${isPresent === true ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                        onClick={() => markStatus(student.id, true)}
                      >
                        <Check className="mr-2 h-4 w-4" /> Present
                      </Button>
                      <Button 
                        variant={isPresent === false ? "destructive" : "outline"}
                        className={`w-full md:w-28 flex-1 ${isPresent === false ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                        onClick={() => markStatus(student.id, false)}
                      >
                        <X className="mr-2 h-4 w-4" /> Absent
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="bg-muted/5 border-t p-6 flex justify-end">
            <Button size="lg" className="shadow-md h-12 px-8" onClick={uploadAttendance} disabled={isSaving}>
              <Save className="mr-2 h-5 w-5" />
              {isSaving ? "Uploading..." : "Upload Final Attendance"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {selectedAssignmentId && students.length === 0 && !isLoading && (
         <div className="p-12 text-center text-muted-foreground border-dashed border-2 rounded-xl flex flex-col items-center">
            <Users className="h-10 w-10 mb-4 opacity-20" />
            No enrolled students found for this class assignment.
         </div>
      )}
    </div>
  )
}

MarkAttendancePage.getLayout = getTeacherLayout;
