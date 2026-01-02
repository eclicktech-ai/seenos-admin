import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { AuthProvider } from "@/features/auth";
import { router } from "./router";
import "./index.css";

const storedTheme = localStorage.getItem("seenos-theme");
if (storedTheme === "dark") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider defaultLanguage="en">
        <TooltipProvider>
          <AuthProvider>
            <RouterProvider router={router} />
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  </StrictMode>
);
