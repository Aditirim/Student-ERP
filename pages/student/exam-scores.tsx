import { GetServerSideProps } from "next"
import { StudentService } from "@/services/student"
import { getStudentLayout } from "@/components/layout/wrappers"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrophyIcon, FileText, AlertCircle, LayoutGrid } from "lucide-react"

interface ScoreRecord {
  id: string;
  subject_name: string;
  exam_name: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
}

interface ExamScoresProps {
  scores: ScoreRecord[];
  error?: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const userId = context.req.cookies.userId;
  if (!userId) return { redirect: { destination: "/login", permanent: false } };
  
  try {
    const scores = await StudentService.getStudentExamScores(userId);
    return { props: { scores } };
  } catch (error) {
    return { props: { error: "An unexpected error occurred while parsing grade metrics.", scores: [] } };
  }
};

export default function ExamScoresPage({ scores, error }: ExamScoresProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Academic Transcripts</h1>
        <p className="text-muted-foreground">Review published examination scores natively bound to your section enrollments.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-4 text-sm text-destructive mb-6">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {scores.length === 0 && !error ? (
         <Card className="border-dashed shadow-none bg-muted/5">
           <CardContent className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
              <LayoutGrid className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium text-foreground">No Published Marks Found</p>
              <p className="text-sm max-w-sm mt-2">
                None of your registered course instructors have finalized gradebook records for any formal examinations yet. Check back following evaluation periods.
              </p>
           </CardContent>
         </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {scores.map(s => {
            // Evaluative Threshold Logic Design Pattern
            const isHighDistinction = s.percentage >= 90;
            const isPass = s.percentage >= 40;
            const thresholdColor = isHighDistinction ? 'bg-green-500' : isPass ? 'bg-blue-500' : 'bg-red-500';
            const thresholdText = isHighDistinction ? 'text-green-600' : isPass ? 'text-blue-600' : 'text-red-600';
            const passFailMsg = isHighDistinction ? 'DISTINCTION' : isPass ? 'PASS' : 'FAIL';
            
            return (
              <Card key={s.id} className="relative overflow-hidden border-muted shadow-sm hover:shadow-md transition-all group duration-300 transform hover:-translate-y-1">
                {/* Visual Anchor Indicator Strip */}
                <div className={`absolute top-0 left-0 w-1 h-full ${thresholdColor}`} />
                
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div className="space-y-1 pr-2">
                    <CardDescription className="uppercase tracking-widest font-bold text-[11px] text-primary">
                      {s.subject_name}
                    </CardDescription>
                    <CardTitle className="text-xl flex items-center gap-2 tracking-tight">
                      {s.exam_name}
                    </CardTitle>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center shrink-0 border border-muted-foreground/10">
                    <TrophyIcon className={`h-4 w-4 ${isHighDistinction ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4">
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-extrabold tracking-tighter">
                      {s.marks_obtained}
                    </span>
                    <span className="text-muted-foreground font-semibold text-lg">
                      / {s.total_marks}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-end text-xs font-semibold">
                      <span className="text-muted-foreground">Score Vector: {s.percentage}%</span>
                      <span className={`tracking-wider ${thresholdText}`}>
                        {passFailMsg}
                      </span>
                    </div>
                    {/* Linear Graphical Progress Meter */}
                    <div className="w-full bg-muted overflow-hidden h-2 rounded-full transform translate-z-0">
                      <div 
                        style={{ width: `${Math.min(100, s.percentage)}%` }} 
                        className={`h-full transition-all duration-1000 ${thresholdColor}`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

ExamScoresPage.getLayout = getStudentLayout;
