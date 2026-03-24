import { useState } from "react";
import { GetServerSideProps } from "next";
import { UserService } from "@/services/user";
import { EnrollmentService } from "@/services/enrollment";
import { Student } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getStudentLayout } from "@/components/layout/wrappers"
import { User as UserIcon, BookOpen, CheckCircle, PlusCircle } from "lucide-react"

interface Subject {
  id: number;
  name: string;
}

interface RegistrationProps {
  user?: Student;
  subjects: Subject[];
  initialEnrollments: number[];
  error?: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const userId = context.req.cookies.userId;
  if (!userId) return { redirect: { destination: "/login", permanent: false } };
  
  const user = await UserService.getStudentProfile(userId);
  if (!user) return { props: { error: "Failed to load profile", subjects: [], initialEnrollments: [] } };

  const subjects = await EnrollmentService.getAllSubjects();
  let initialEnrollments = await EnrollmentService.getStudentEnrollments(userId);
  
  // Clean nulls/undefined from raw DB constraints
  initialEnrollments = initialEnrollments.filter(Boolean); 

  return { props: { user, subjects, initialEnrollments } };
};

export default function RegistrationPage({ user, subjects, initialEnrollments, error }: RegistrationProps) {
  const [enrollments, setEnrollments] = useState<number[]>(initialEnrollments);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleRegister = async (subjectId: number) => {
    if (enrollments.includes(subjectId)) {
      alert("You are already registered for this subject!");
      return;
    }

    setLoadingId(subjectId);
    try {
      const res = await fetch("/api/student/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setEnrollments([...enrollments, subjectId]);
      } else {
        alert(data.message || "Failed to register.");
      }
    } catch (err) {
      alert("An error occurred during registration. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  if (error || !user) {
    return <div className="p-8 text-center text-destructive">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Student Details Module */}
      <Card className="border-muted shadow-sm bg-primary/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-full">
              <UserIcon className="h-6 w-6 text-primary" />
            </div>
            Student Details
          </CardTitle>
          <CardDescription className="text-base">Verify your details before registering for subjects.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-muted-foreground font-medium mb-1">Name</p>
              <p className="font-semibold text-lg leading-tight">{user.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium mb-1">Student ID</p>
              <p className="font-semibold text-lg leading-tight">{user.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium mb-1">Branch</p>
              <p className="font-semibold text-lg leading-tight uppercase">{user.branch}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium mb-1">Email</p>
              <p className="font-semibold text-lg leading-tight">{user.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium mb-1">Year</p>
              <p className="font-semibold text-lg leading-tight">{user.year}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium mb-1">Semester</p>
              <p className="font-semibold text-lg leading-tight">{user.semester}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium mb-1">Section</p>
              <p className="font-semibold text-lg leading-tight uppercase">{user.section}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Registration Table Module */}
      <Card className="border-muted shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Available Subjects
          </CardTitle>
          <CardDescription>Click 'Register' alongside the subjects you wish to enroll in.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_auto] items-center text-sm font-semibold border-b bg-muted/50 p-4 tracking-tight">
              <div>Subject Name</div>
              <div className="text-right w-36">Action</div>
            </div>
            {/* Table Body */}
            <div className="divide-y">
              {subjects.map((subject) => {
                const isRegistered = enrollments.includes(subject.id);
                const isLoading = loadingId === subject.id;
                
                return (
                  <div key={subject.id} className="grid grid-cols-[1fr_auto] items-center p-4 transition-colors hover:bg-muted/10">
                    <div className="font-medium flex items-center gap-4">
                      {/* Subject ID Icon */}
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                        {subject.id}
                      </span>
                      <span className="text-base">{subject.name}</span>
                    </div>
                    
                    <div className="text-right w-36">
                      {isRegistered ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-green-700 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-800 cursor-pointer shadow-sm transition-all" 
                          onClick={() => alert("You have already completed registration for this subject.")}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Registered
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          className="w-full shadow-sm" 
                          disabled={isLoading} 
                          onClick={() => handleRegister(subject.id)}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          {isLoading ? "Wait..." : "Register"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {subjects.length === 0 && (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                  <BookOpen className="h-10 w-10 mb-4 opacity-20" />
                  No subjects currently available in the database.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

RegistrationPage.getLayout = getStudentLayout;
