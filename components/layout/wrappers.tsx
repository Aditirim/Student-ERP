import { ReactElement } from "react"
import { DashboardLayout } from "./DashboardLayout"
import { GraduationCap, LayoutDashboard, BookOpen, Calendar, FileText, ClipboardCheck, BookUp } from "lucide-react"

const studentNavItems = [
  { name: "Dashboard", href: "/student", icon: LayoutDashboard },
  { name: "Registration", href: "/student/registration", icon: BookOpen },
  { name: "Attendance", href: "/student/attendance", icon: Calendar },
  { name: "Exam Scores", href: "/student/exam-scores", icon: FileText },
]

export function getStudentLayout(page: ReactElement) {
  return (
    <DashboardLayout portalName="Student Portal" portalIcon={GraduationCap} profileLink="/student/profile" navItems={studentNavItems}>
      {page}
    </DashboardLayout>
  )
}

const teacherNavItems = [
  { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
  { name: "Mark Attendance", href: "/teacher/attendance", icon: ClipboardCheck },
  { name: "Upload Marks", href: "/teacher/marks", icon: BookUp },
]

export function getTeacherLayout(page: ReactElement) {
  return (
    <DashboardLayout portalName="Teacher Portal" portalIcon={BookUp} profileLink="/teacher/profile" navItems={teacherNavItems}>
      {page}
    </DashboardLayout>
  )
}
