import { requireUser } from "@/lib/dal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-slate-400">Name</p>
            <p className="text-white">{user.organizations.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Plan</p>
            <p className="text-white capitalize">{user.organizations.plan}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Credits</p>
            <p className="text-white">{user.organizations.credits_balance}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-slate-400">Email</p>
            <p className="text-white">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Role</p>
            <p className="text-white capitalize">{user.role}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
