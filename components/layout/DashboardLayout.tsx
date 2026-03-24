import { ReactNode } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"

interface DashboardLayoutProps {
  children: ReactNode;
  portalName: string;
  portalIcon: React.ElementType;
  navItems: { name: string; href: string; icon: React.ElementType }[];
  profileLink: string;
}

export function DashboardLayout({
  children,
  portalName,
  portalIcon,
  navItems,
  profileLink,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar portalName={portalName} portalIcon={portalIcon} navItems={navItems} />
      <div className="flex flex-1 flex-col sm:pl-64">
        <Header profileLink={profileLink} />
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
