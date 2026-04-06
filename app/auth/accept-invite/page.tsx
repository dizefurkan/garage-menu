"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientSupabase } from "@/lib/auth/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [step, setStep] = useState<"verify" | "signup" | "success">("verify");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);

  // Step 1: Verify invitation token
  async function verifyInvite() {
    if (!token) {
      setError("Invalid invitation link");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClientSupabase();

      // Check if invitation exists and is valid
      const { data: invitation, error: inviteError } = await (supabase as any)
        .from("invitations")
        .select("email, tenant_id, expires_at, tenants(name)")
        .eq("token", token)
        .is("accepted_at", null)
        .single();

      if (inviteError || !invitation) {
        setError("Invitation not found or already expired");
        return;
      }

      // Check expiration
      if (new Date(invitation.expires_at) < new Date()) {
        setError("Invitation has expired");
        return;
      }

      setEmail(invitation.email);
      setTenantName((invitation.tenants as any)?.name || null);
      setStep("signup");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to verify invitation"
      );
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Create user and accept invitation
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!token) {
        throw new Error("Invalid token");
      }

      const supabase = createClientSupabase();

      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!authData.user) {
        throw new Error("User creation failed");
      }

      // Get invitation to get tenant_id
      const { data: invitation, error: inviteError } = await (supabase as any)
        .from("invitations")
        .select("tenant_id")
        .eq("token", token)
        .single();

      if (inviteError || !invitation) {
        throw new Error("Invitation not found");
      }

      // Add user to tenant_users
      const { error: addUserError } = await (supabase as any)
        .from("tenant_users")
        .insert({
          tenant_id: invitation.tenant_id,
          user_id: authData.user.id,
          role: "editor",
          accepted_at: new Date().toISOString(),
        });

      if (addUserError) {
        throw new Error(addUserError.message);
      }

      // Mark invitation as accepted
      const { error: updateError } = await (supabase as any)
        .from("invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("token", token);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setStep("success");
      setTimeout(() => router.push("/admin/dashboard"), 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to accept invitation"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        {step === "verify" && (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Join Team</CardTitle>
              <CardDescription>
                Verify your invitation to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              {token ? (
                <Button
                  onClick={verifyInvite}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Verifying..." : "Verify Invitation"}
                </Button>
              ) : (
                <Alert>
                  <AlertDescription>
                    No invitation token found. Please check your email link.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </>
        )}

        {step === "signup" && (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                Create Account
              </CardTitle>
              <CardDescription>
                {tenantName && `You're invited to join ${tenantName}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Accept Invitation"}
                </Button>
              </form>
            </CardContent>
          </>
        )}

        {step === "success" && (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
              <CardDescription>Your account has been created</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Redirecting to dashboard...
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
