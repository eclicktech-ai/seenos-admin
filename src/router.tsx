import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";

const LoginPage = lazy(() =>
  import("@/features/auth/LoginPage").then((mod) => ({ default: mod.LoginPage }))
);
const DashboardPage = lazy(() =>
  import("@/features/dashboard/DashboardPage").then((mod) => ({
    default: mod.DashboardPage,
  }))
);
const UsersPage = lazy(() =>
  import("@/features/users/UsersPage").then((mod) => ({ default: mod.UsersPage }))
);
const ProjectsPage = lazy(() =>
  import("@/features/projects/ProjectsPage").then((mod) => ({
    default: mod.ProjectsPage,
  }))
);
const ConversationsPage = lazy(() =>
  import("@/features/conversations/ConversationsPage").then((mod) => ({
    default: mod.ConversationsPage,
  }))
);
const ContextPage = lazy(() =>
  import("@/features/context/ContextPage").then((mod) => ({ default: mod.ContextPage }))
);
const ConfigPage = lazy(() =>
  import("@/features/config/ConfigPage").then((mod) => ({ default: mod.ConfigPage }))
);
const AuditPage = lazy(() =>
  import("@/features/audit/AuditPage").then((mod) => ({ default: mod.AuditPage }))
);
const AnalyticsPage = lazy(() =>
  import("@/features/analytics/AnalyticsPage").then((mod) => ({
    default: mod.AnalyticsPage,
  }))
);
const SessionsPage = lazy(() =>
  import("@/features/sessions/SessionsPage").then((mod) => ({
    default: mod.SessionsPage,
  }))
);

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: withSuspense(<LoginPage />),
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: withSuspense(<DashboardPage />),
      },
      {
        path: "users",
        element: withSuspense(<UsersPage />),
      },
      {
        path: "projects",
        element: withSuspense(<ProjectsPage />),
      },
      {
        path: "conversations",
        element: withSuspense(<ConversationsPage />),
      },
      {
        path: "context",
        element: withSuspense(<ContextPage />),
      },
      {
        path: "analytics",
        element: withSuspense(<AnalyticsPage />),
      },
      {
        path: "sessions",
        element: withSuspense(<SessionsPage />),
      },
      {
        path: "config/*",
        element: withSuspense(<ConfigPage />),
      },
      {
        path: "audit",
        element: withSuspense(<AuditPage />),
      },
    ],
  },
]);
