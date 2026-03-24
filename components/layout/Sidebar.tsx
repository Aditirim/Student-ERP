"use client"

import Link from "next/link"
import { useRouter } from "next/router"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  portalName: string;
  portalIcon: React.ElementType;
  navItems: { name: string; href: string; icon: React.ElementType }[];
}

export function Sidebar({ portalName, portalIcon: PortalIcon, navItems }: SidebarProps) {
  const router = useRouter()
  const pathname = router.pathname

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Failed to logout:", error)
    }
  }

  return (
    <aside className="fixed hidden w-64 flex-col border-r bg-background sm:flex min-h-screen">
      <div className="flex h-16 items-center border-b px-6">
        <PortalIcon className="mr-2 h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">{portalName}</span>
      </div>
      <div className="flex flex-1 flex-col justify-between py-6 px-4">
        <nav className="grid gap-2 text-sm font-medium">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
