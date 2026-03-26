import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LogOut, ShieldCheck } from "lucide-react";
import { Switch, Route } from "wouter";
import type { AuthSessionResponse } from "@shared/auth";
import {
    AUTH_REQUIRED_EVENT,
    apiRequest,
    getQueryFn,
    queryClient,
} from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Dashboard from "@/pages/dashboard";
import ArticleEditor from "@/pages/article-editor";
import Categories from "@/pages/categories";
import Challenges from "@/pages/challenges";
import Comments from "@/pages/comments";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
    return (
        <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/articles/new" component={ArticleEditor} />
            <Route path="/articles/:id" component={ArticleEditor} />
            <Route path="/categories" component={Categories} />
            <Route path="/challenges" component={Challenges} />
            <Route path="/comments" component={Comments} />
            <Route component={NotFound} />
        </Switch>
    );
}

function clearProtectedQueryCache() {
    queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== "/api/auth/session",
    });
}

function AppLoadingScreen() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.16),_transparent_32%),hsl(var(--background))] px-6">
            <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background/90 px-5 py-3 text-sm text-muted-foreground shadow-sm">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Checking your CMS session
            </div>
        </div>
    );
}

function AppErrorScreen() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="space-y-2">
                <p className="text-lg font-semibold">Authentication check failed</p>
                <p className="text-sm text-muted-foreground">
                    The CMS could not verify your current session.
                </p>
            </div>
            <Button
                variant="outline"
                onClick={() =>
                    queryClient.invalidateQueries({
                        queryKey: ["/api/auth/session"],
                    })
                }
            >
                Retry
            </Button>
        </div>
    );
}

function AuthenticatedApp({ session }: { session: AuthSessionResponse }) {
    const style = {
        "--sidebar-width": "16rem",
        "--sidebar-width-icon": "3rem",
    };

    const logoutMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest("POST", "/api/auth/logout");
            return (await response.json()) as AuthSessionResponse;
        },
        onSuccess: (nextSession) => {
            clearProtectedQueryCache();
            queryClient.setQueryData(["/api/auth/session"], nextSession);
        },
    });

    return (
        <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1">
                    <header className="flex items-center justify-between gap-4 border-b p-4">
                        <div className="flex items-center gap-3">
                            <SidebarTrigger data-testid="button-sidebar-toggle" />
                            <div className="hidden md:block">
                                <p className="text-sm font-medium">
                                    Welcome back
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Signed in as {session.username ?? "admin"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <Button
                                variant="outline"
                                onClick={() => logoutMutation.mutate()}
                                disabled={logoutMutation.isPending}
                                data-testid="button-logout"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign out
                            </Button>
                        </div>
                    </header>
                    <main className="flex-1 overflow-y-auto">
                        <Router />
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}

function AuthGate() {
    const sessionQuery = useQuery<AuthSessionResponse>({
        queryKey: ["/api/auth/session"],
        queryFn: getQueryFn<AuthSessionResponse>({ on401: "throw" }),
    });

    useEffect(() => {
        function handleAuthRequired() {
            clearProtectedQueryCache();
            queryClient.setQueryData(["/api/auth/session"], {
                authenticated: false,
                username: null,
            } satisfies AuthSessionResponse);
            queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
        }

        window.addEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);
        return () => {
            window.removeEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);
        };
    }, []);

    if (sessionQuery.isLoading) {
        return <AppLoadingScreen />;
    }

    if (sessionQuery.isError) {
        return <AppErrorScreen />;
    }

    if (!sessionQuery.data?.authenticated) {
        return <LoginPage />;
    }

    return <AuthenticatedApp session={sessionQuery.data} />;
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <AuthGate />
                <Toaster />
            </TooltipProvider>
        </QueryClientProvider>
    );
}
