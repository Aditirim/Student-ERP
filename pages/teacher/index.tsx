import { getTeacherLayout } from "@/components/layout/wrappers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your teacher portal.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mt-2">
              Use the sidebar to manage attendance and marks.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

TeacherDashboard.getLayout = getTeacherLayout;
