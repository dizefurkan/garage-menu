"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail } from "@/app/auth/login-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithEmail(email, password);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.success) {
        router.push("/admin/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Garage Menu</h1>
          <p className="text-muted-foreground">
            Sign in to manage your restaurant menu
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
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

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Don't have access?{" "}
            <span className="font-medium text-foreground">
              Ask your admin for an invitation link
            </span>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          © 2026 Garage Menu. All rights reserved.
        </div>
      </div>
    </div>
  );
}
