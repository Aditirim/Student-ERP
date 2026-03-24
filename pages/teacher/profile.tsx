import { GetServerSideProps } from "next";
import { UserService } from "@/services/user";
import { Teacher } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User as UserIcon, Briefcase } from "lucide-react"
import { getTeacherLayout } from "@/components/layout/wrappers"

export const getServerSideProps: GetServerSideProps = async (context) => {
  const userId = context.req.cookies.userId;
  if (!userId) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  
  const user = await UserService.getTeacherProfile(userId);
  if (!user) {
    return { props: { error: "Failed to load profile data." } };
  }

  return { props: { user } };
};

export default function TeacherProfile({ user, error }: { user?: Teacher, error?: string }) {
  if (error || !user) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <p className="text-destructive font-medium border border-destructive/50 bg-destructive/10 p-4 rounded-md">
          {error || "Failed to load profile data."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teacher Profile</h1>
        <p className="text-muted-foreground">Manage your professoral information.</p>
      </div>

      <Card className="shadow-sm border-muted">
        <CardHeader className="flex flex-col md:flex-row items-center gap-6 space-y-0 pb-6 pt-8 bg-muted/30">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
            <UserIcon className="h-12 w-12" />
          </div>
          <div className="space-y-1 text-center md:text-left">
            <CardTitle className="text-3xl tracking-tight">{user.name}</CardTitle>
            <CardDescription className="text-base text-muted-foreground capitalize">
              Teacher ID: <span className="text-foreground font-semibold">{user.id}</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-8 p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/70 shadow-sm border border-border/50">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none text-muted-foreground mb-1">Role</p>
                <p className="text-lg font-semibold tracking-tight">Faculty Member</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

TeacherProfile.getLayout = getTeacherLayout;
