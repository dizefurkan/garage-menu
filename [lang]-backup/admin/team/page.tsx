import { getSessionWithTenant } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function getTeamMembers(tenantId: number) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data } = await supabase
    .from("tenant_users")
    .select("id, role, invited_at, accepted_at, auth_users:user_id(email)")
    .eq("tenant_id", tenantId);

  return data || [];
}

async function getPendingInvites(tenantId: number) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data } = await supabase
    .from("invitations")
    .select("id, email, created_at, expires_at, accepted_at")
    .eq("tenant_id", tenantId)
    .is("accepted_at", null);

  return data || [];
}

export default async function TeamPage() {
  const { user, tenant, role } = await getSessionWithTenant();

  if (!user || !tenant || role !== "owner") {
    redirect("/admin/dashboard");
  }

  const members = await getTeamMembers(tenant.id);
  const pendingInvites = await getPendingInvites(tenant.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team & Invites</h1>
        <p className="mt-2 text-gray-600">Manage team members</p>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            Team Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invites">
            Pending Invites ({pendingInvites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {members.length === 0 ? (
                <p className="text-gray-600">No team members yet</p>
              ) : (
                <div className="space-y-3">
                  {members.map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded border p-3"
                    >
                      <div>
                        <p className="font-medium">
                          {(member as any).auth_users?.email}
                        </p>
                        <p className="text-sm capitalize text-gray-500">
                          {member.role}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send New Invite</CardTitle>
            </CardHeader>
            <CardContent>
              <Button>+ Send Invite</Button>
            </CardContent>
          </Card>

          {pendingInvites.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {pendingInvites.map((invite: any) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between rounded border p-3"
                    >
                      <div>
                        <p className="font-medium">{invite.email}</p>
                        <p className="text-sm text-gray-500">
                          Expires{" "}
                          {new Date(invite.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
