import { getStudentLayout } from "@/components/layout/wrappers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your student portal.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">No new notifications</div>
            <p className="text-xs text-muted-foreground">Check back later</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

StudentDashboard.getLayout = getStudentLayout;
