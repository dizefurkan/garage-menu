/**
 * Accept Invite Page
 * @path app/(auth)/accept-invite/page.tsx
 *
 * Flow:
 * 1. User receives email with link: /accept-invite?token=ABC123
 * 2. Page shows invite details
 * 3. User clicks "Accept" → signs up/logs in
 * 4. Server action processes token and adds user to tenant
 * 5. Redirects to admin dashboard
 */

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// shadcn/ui imports
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

import { supabase } from "@/lib/auth/supabase";
import { acceptInvite } from "@/lib/db/queries";

const SignUpSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpInput = z.infer<typeof SignUpSchema>;

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"invite" | "signup" | "success">("invite");

  const form = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // ============================================================================
  // HANDLE ACCEPT INVITE
  // ============================================================================
  async function handleAcceptInvite() {
    if (!token) {
      setError("No invitation token provided");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if invitation is valid
      const { data: invitation } = await supabase
        .from("invitations")
        .select("*")
        .eq("token", token)
        .single();

      if (!invitation) {
        setError("Invalid or expired invitation");
        return;
      }

      if (new Date(invitation.expires_at) < new Date()) {
        setError("This invitation has expired");
        return;
      }

      // Move to signup
      setStep("signup");
      form.setValue("email", invitation.email);
    } catch (err) {
      console.error("Error checking invitation:", err);
      setError("Failed to verify invitation");
    } finally {
      setIsLoading(false);
    }
  }

  // ============================================================================
  // HANDLE SIGNUP AND ACCEPT
  // ============================================================================
  async function onSignUp(data: SignUpInput) {
    if (!token) {
      setError("No invitation token provided");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError || !authData.user) {
        setError(authError?.message || "Failed to create account");
        return;
      }

      // 2. Accept invitation (add user to tenant)
      await acceptInvite(token);

      // 3. Sign in user
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      setStep("success");

      // 4. Redirect after 2 seconds
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Error during signup:", err);
      setError(
        err instanceof Error ? err.message : "Failed to accept invitation"
      );
      setStep("signup"); // Stay on signup form
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="font-semibold">Invalid Invitation Link</p>
              <p className="mt-2 text-sm">No invitation token provided.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        {/* Invite Overview */}
        {step === "invite" && (
          <>
            <CardHeader>
              <CardTitle>You're Invited!</CardTitle>
              <CardDescription>
                You've been invited to join a menu management team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <p className="text-sm text-gray-600">
                Click below to accept the invitation and create your account.
              </p>

              <Button
                onClick={handleAcceptInvite}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Accept Invitation"
                )}
              </Button>
            </CardContent>
          </>
        )}

        {/* Sign Up Form */}
        {step === "signup" && (
          <>
            <CardHeader>
              <CardTitle>Create Your Account</CardTitle>
              <CardDescription>
                Complete your signup to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSignUp)}
                  className="space-y-4"
                >
                  {error && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  {/* Email (read-only) */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} disabled type="email" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                          />
                        </FormControl>
                        <FormDescription>At least 8 characters</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Confirm Password */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account & Accept Invite"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </>
        )}

        {/* Success */}
        {step === "success" && (
          <>
            <CardHeader>
              <CardTitle>Welcome!</CardTitle>
              <CardDescription>Your account has been created</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl mb-2">✓</div>
              <p className="text-green-600 font-semibold">
                Invitation accepted successfully!
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Redirecting you to the dashboard...
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
