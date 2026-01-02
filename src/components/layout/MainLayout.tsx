import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/features/auth";
import { cn } from "@/lib/utils";

export function MainLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [sidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin
  if (!user?.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You don't have permission to access the admin dashboard. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setMobileSidebarOpen(true)} />
      
      {/* Desktop Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <Sidebar mobile onClose={() => setMobileSidebarOpen(false)} />
        </>
      )}

      {/* Main Content */}
      <main
        className={cn(
          "min-h-[calc(100vh-4rem)] p-4 lg:p-6 transition-all",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-60"
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
