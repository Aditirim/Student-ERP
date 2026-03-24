import { useState } from "react"
import { GetServerSideProps } from "next"
import { StudentService } from "@/services/student"
import { getStudentLayout } from "@/components/layout/wrappers"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronDown, ChevronUp, BookOpen, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface SubjectRecord {
  date: string;
  present: boolean;
}

interface SubjectAttendance {
  subject_id: number;
  subject_name: string;
  total_classes: number;
  attended_classes: number;
  percentage: number;
  records: SubjectRecord[];
}

interface AttendancePageProps {
  attendanceData: SubjectAttendance[];
  error?: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const userId = context.req.cookies.userId;
  if (!userId) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  
  try {
    const attendanceData = await StudentService.getStudentAttendanceInfo(userId);
    return { props: { attendanceData } };
  } catch (error) {
    return { props: { error: "Failed to load attendance analytics.", attendanceData: [] } };
  }
};

const CircularRatio = ({ attended, total }: { attended: number, total: number }) => {
  const value = total === 0 ? 0 : Math.round((attended / total) * 100);
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center p-2">
      <svg className="h-[4.5rem] w-[4.5rem] -rotate-90 transform drop-shadow-sm">
        {/* Base circle conceptually representing absents (red) */}
        <circle
          cx="36"
          cy="36"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className={total === 0 ? "text-muted border" : "text-red-500"}
        />
        {/* Overlay circle dynamically projecting presents (green) */}
        {total > 0 && (
          <circle
            cx="36"
            cy="36"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-green-500 transition-all duration-1000 ease-out"
          />
        )}
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-sm font-bold tracking-tight">{value}%</span>
      </div>
    </div>
  );
};

const SubjectRow = ({ subject }: { subject: SubjectAttendance }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border border-muted rounded-xl mb-4 bg-card shadow-sm overflow-hidden transition-all">
      {/* Top Level Summary Row */}
      <div 
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-6 cursor-pointer hover:bg-muted/10 transition-colors" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold shadow-inner">
             {subject.subject_id}
          </div>
          <div>
            <h3 className="text-lg font-bold">{subject.subject_name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
               <BookOpen className="h-4 w-4" /> Enrolled Subject
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 md:gap-8">
           <div className="text-right flex flex-col items-end">
             <span className="text-sm text-muted-foreground font-medium">Attended</span>
             <span className="font-bold text-lg">{subject.attended_classes} / {subject.total_classes}</span>
           </div>
           
           <CircularRatio attended={subject.attended_classes} total={subject.total_classes} />
           
           <Button variant="ghost" size="sm" className="hidden sm:flex">
             {isOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
             View
           </Button>
        </div>
      </div>
      
      {/* Expanded Class Dates Dropdown */}
      {isOpen && (
        <div className="border-t bg-muted/10 p-4 md:p-6 pb-6 animate-in slide-in-from-top-2 duration-300">
           <h4 className="font-semibold mb-4 text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
             <Calendar className="h-4 w-4" /> Academic Register Logs
           </h4>
           <div className="space-y-3">
             {subject.records.length === 0 && (
               <div className="text-sm text-muted-foreground text-center p-6 border border-dashed rounded-lg bg-background">
                 No classes have securely been recorded by faculty yet.
               </div>
             )}
             
             {subject.records.map((r, i) => (
               <div key={`${r.date}-${i}`} className="flex justify-between items-center p-3.5 border rounded-lg bg-background shadow-sm hover:border-primary/50 transition-colors">
                 <span className="font-medium text-[15px] flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-primary/50" />
                   {new Date(r.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                 </span>
                 
                 {r.present ? (
                   <span className="flex items-center text-green-700 bg-green-50 px-4 py-1.5 rounded-full text-xs font-bold border border-green-200 shadow-sm">
                     <CheckCircle2 className="h-4 w-4 mr-2"/> PRESENT
                   </span>
                 ) : (
                   <span className="flex items-center text-red-700 bg-red-50 px-4 py-1.5 rounded-full text-xs font-bold border border-red-200 shadow-sm">
                     <XCircle className="h-4 w-4 mr-2"/> ABSENT
                   </span>
                 )}
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  )
}

export default function StudentAttendancePage({ attendanceData, error }: AttendancePageProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Attendance Analytics</h1>
        <p className="text-muted-foreground">Monitor your real-time academic progression metrics per subject.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-4 text-sm text-destructive mb-6">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {attendanceData.length === 0 && !error ? (
        <Card className="border-dashed shadow-none bg-muted/5">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
             <Calendar className="h-12 w-12 mb-4 opacity-20" />
             <p className="text-lg font-medium">No Subjects Found</p>
             <p className="text-sm">You are currently not securely enrolled into any subjects in the database.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {attendanceData.map((subject) => (
            <SubjectRow key={subject.subject_id} subject={subject} />
          ))}
        </div>
      )}
    </div>
  )
}

StudentAttendancePage.getLayout = getStudentLayout;
