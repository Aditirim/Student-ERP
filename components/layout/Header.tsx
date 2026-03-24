import Link from "next/link"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header({ profileLink }: { profileLink: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end border-b bg-background/80 px-6 backdrop-blur w-full">
      <div className="flex items-center gap-4">
        <Link href={profileLink}>
          <Button variant="outline" size="sm" className="gap-2 rounded-full px-4">
            <User className="h-4 w-4" />
            <span className="hidden text-sm font-medium md:inline-block">Profile</span>
          </Button>
        </Link>
      </div>
    </header>
  )
}
