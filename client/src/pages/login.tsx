import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, LockKeyhole } from "lucide-react";
import type { AuthSessionResponse, LoginRequestBody } from "@shared/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";

function normalizeErrorMessage(error: unknown) {
    if (!(error instanceof Error)) {
        return "We could not sign you in right now.";
    }

    if (error.message.startsWith("401:")) {
        return "That password was not accepted.";
    }

    if (error.message.startsWith("400:")) {
        return "Enter the CMS password to continue.";
    }

    return error.message;
}

export default function LoginPage() {
    const [password, setPassword] = useState("");
    const { toast } = useToast();

    const loginMutation = useMutation({
        mutationFn: async (payload: LoginRequestBody) => {
            const response = await apiRequest("POST", "/api/auth/login", payload);
            return (await response.json()) as AuthSessionResponse;
        },
        onSuccess: (session) => {
            queryClient.setQueryData(["/api/auth/session"], session);
            toast({
                title: "Signed in",
                description: "CMS access is active for this browser session.",
            });
        },
        onError: (error) => {
            toast({
                title: "Sign-in failed",
                description: normalizeErrorMessage(error),
                variant: "destructive",
            });
        },
    });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        loginMutation.mutate({ password });
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.18),_transparent_36%),linear-gradient(135deg,_hsl(var(--background)),_hsl(var(--muted)/0.7))] px-6 py-12">
            <div className="absolute right-6 top-6">
                <ThemeToggle />
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,hsl(var(--border)/0.14)_45%,transparent_100%)] opacity-60" />

            <Card className="relative z-10 w-full max-w-md border-border/70 bg-background/95 backdrop-blur">
                <CardHeader className="space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-primary/10 text-primary">
                        <LockKeyhole className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle>Admin Sign In</CardTitle>
                        <CardDescription>
                            Enter the CMS admin password configured on the server
                            to unlock the dashboard.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="cms-password">Password</Label>
                            <Input
                                id="cms-password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="Enter admin password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                disabled={loginMutation.isPending}
                                data-testid="input-login-password"
                            />
                        </div>

                        <Button
                            className="w-full"
                            type="submit"
                            disabled={loginMutation.isPending}
                            data-testid="button-login-submit"
                        >
                            {loginMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Signing in
                                </>
                            ) : (
                                "Unlock CMS"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
