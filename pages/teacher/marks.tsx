import { useState } from "react";
import { GetServerSideProps } from "next";
import { UserService } from "@/services/user";
import { TeacherService } from "@/services/teacher";
import { Teacher } from "@/types";
import { getTeacherLayout } from "@/components/layout/wrappers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Filter, Save, AlertCircle, BookUp, Users, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Assignment {
  id: number;
  subject_id: number;
  branch: string;
  year: number;
  semester: number;
  section: string;
  subject_name: string;
}

interface Exam {
  id: number;
  name: string;
}

interface Student {
  id: string;
  name: string;
}

interface MarkUploadProps {
  user?: Teacher;
  assignments: Assignment[];
  exams: Exam[];
  error?: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const userId = context.req.cookies.userId;
  if (!userId) return { redirect: { destination: "/login", permanent: false } };
  
  const user = await UserService.getTeacherProfile(userId);
  if (!user) return { props: { error: "Failed to load profile", assignments: [], exams: [] } };

  const assignments = await TeacherService.getAssignments(userId);
  const exams = await TeacherService.getExams();
  
  return { props: { user, assignments, exams } };
};

export default function UploadMarksPage({ user, assignments, exams, error }: MarkUploadProps) {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | "">("");
  const [selectedExamId, setSelectedExamId] = useState<number | "">("");
  
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, number | "">>({});
  
  const [subjectExamId, setSubjectExamId] = useState<number | null>(null);
  const [totalMarks, setTotalMarks] = useState<number>(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);

  const loadData = async () => {
    if (!selectedAssignmentId || !selectedExamId) return;
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg(false);
    try {
      const res = await fetch(`/api/teacher/marks?assignmentId=${selectedAssignmentId}&examId=${selectedExamId}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setSubjectExamId(data.subject_exam_id);
      setTotalMarks(data.total_marks);
      setStudents(data.students);
      
      // Init local state tracking
      const initialMap: Record<string, number | ""> = {};
      data.marks.forEach((record: any) => {
        initialMap[record.student_id] = record.marks_obtained;
      });
      setMarks(initialMap);
      
    } catch (err: any) {
       setErrorMsg(err.message || "Failed to fetch gradebook configurations.");
       setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkChange = (studentId: string, val: string) => {
     let numVal = parseInt(val, 10);
     if (val === "" || isNaN(numVal)) {
        setMarks(prev => ({ ...prev, [studentId]: "" }));
        return;
     }

     // Strict validation bounding box logic
     if (numVal < 0) numVal = 0;
     if (numVal > totalMarks) numVal = totalMarks;

     setMarks(prev => ({ ...prev, [studentId]: numVal }));
  };

  const uploadMarks = async () => {
    if (!subjectExamId) return;
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg(false);

    // Filter out logically empty inputs, do not enforce defaults of 0
    const records = Object.entries(marks)
      .filter(([_, val]) => val !== "")
      .map(([student_id, val]) => ({
         student_id,
         marks_obtained: val as number
      }));

    try {
      const res = await fetch("/api/teacher/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectExamId, records })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to finalize marks");
      
      setSuccessMsg(true);
    } catch (err: any) {
      setErrorMsg(err.message || "An isolated error occurred while parsing the upload grid.");
    } finally {
      setIsSaving(false);
    }
  };

  if (error || !user) {
    return <div className="p-8 text-center text-destructive">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gradebook Uploader</h1>
          <p className="text-muted-foreground">Continuously upload, edit, and safely finalize grading matrices per exam.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-4 text-sm text-destructive font-medium border border-destructive/30">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 p-4 text-sm text-green-700 font-medium border border-green-200">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <p>The entire assessment matrix was perfectly published and securely written to the database!</p>
        </div>
      )}

      {/* Advanced Dual Context Matrix Filtering */}
      <Card className="shadow-sm border-muted bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <BookUp className="h-4 w-4" /> Selected Assigned Subject:
              </label>
              <select 
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedAssignmentId}
                onChange={(e) => {
                  setSelectedAssignmentId(Number(e.target.value));
                  setStudents([]);
                }}
              >
                <option value="" disabled>-- Choose Authorized Section --</option>
                {assignments.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.subject_name} • {a.branch} • Year {a.year} • Sec {a.section}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Filter className="h-4 w-4" /> Selected Evaluation Level:
              </label>
              <select 
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedExamId}
                onChange={(e) => {
                  setSelectedExamId(Number(e.target.value));
                  setStudents([]);
                }}
              >
                <option value="" disabled>-- Select Examination Matrix --</option>
                {exams.map(e => (
                  <option key={e.id} value={e.id}>{e.name} Evaluation</option>
                ))}
              </select>
            </div>
            
            <Button className="h-11 shadow-sm px-8 w-full md:w-auto mt-4 md:mt-0" disabled={!selectedAssignmentId || !selectedExamId || isLoading} onClick={loadData}>
              {isLoading ? "Querying Engine..." : "Apply Dual Filters"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Roster Input Rendering */}
      {students.length > 0 && (
        <Card className="border-muted shadow-sm overflow-hidden border-t-4 border-t-primary/80">
          <CardHeader className="border-b bg-muted/10 pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Grading Assessment Scale
            </CardTitle>
            <CardDescription className="text-sm">
               Maximum permissible value currently configured: <strong>{totalMarks} Points</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {students.map((student) => {
                const markVal = marks[student.id] !== undefined ? marks[student.id] : "";
                
                return (
                  <div key={student.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-6 hover:bg-muted/5 gap-4">
                    
                    <div className="font-medium flex items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                        {student.id.replace('S','')}
                      </span>
                      <div>
                        <p className="text-base font-semibold">{student.name}</p>
                        <p className="text-xs text-muted-foreground tracking-widest">{student.id.toUpperCase()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Input 
                        type="number"
                        min="0"
                        max={totalMarks}
                        placeholder="..."
                        className="w-24 text-center font-bold text-lg h-11 border-primary/20 bg-background shadow-inner"
                        value={markVal}
                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                      />
                      <span className="text-muted-foreground font-semibold text-lg flex shrink-0">
                        / <span className="text-foreground ml-2">{totalMarks}</span>
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t p-6 flex justify-end">
            <Button size="lg" className="shadow-md h-12 px-10 text-[15px]" onClick={uploadMarks} disabled={isSaving}>
              <Save className="mr-3 h-5 w-5" />
              {isSaving ? "Injecting Data..." : "Finalize Assessed Matrix"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {selectedAssignmentId && selectedExamId && students.length === 0 && !isLoading && !errorMsg && (
         <div className="p-12 text-center text-muted-foreground border-dashed border-2 rounded-xl flex flex-col items-center">
            <Users className="h-10 w-10 mb-4 opacity-20" />
            No enrolled students identified meeting criteria bounds.
         </div>
      )}
    </div>
  )
}

UploadMarksPage.getLayout = getTeacherLayout;
