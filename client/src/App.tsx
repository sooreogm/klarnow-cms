import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import Dashboard from "@/pages/dashboard";
import ArticleEditor from "@/pages/article-editor";
import Categories from "@/pages/categories";
import Challenges from "@/pages/challenges";
import Comments from "@/pages/comments";
import Settings from "@/pages/settings";
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
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
        </Switch>
    );
}

export default function App() {
    const style = {
        "--sidebar-width": "16rem",
        "--sidebar-width-icon": "3rem",
    };

    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <SidebarProvider style={style as React.CSSProperties}>
                    <div className="flex h-screen w-full">
                        <AppSidebar />
                        <div className="flex flex-col flex-1">
                            <header className="flex items-center justify-between p-4 border-b">
                                <SidebarTrigger data-testid="button-sidebar-toggle" />
                                <ThemeToggle />
                            </header>
                            <main className="flex-1 overflow-y-auto">
                                <Router />
                            </main>
                        </div>
                    </div>
                </SidebarProvider>
                <Toaster />
            </TooltipProvider>
        </QueryClientProvider>
    );
}
