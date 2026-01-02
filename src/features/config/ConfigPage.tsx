import { Routes, Route, Navigate, NavLink, useLocation } from "react-router-dom";
import { Bot, Wrench, BookOpen, Key, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { AgentsTab } from "./AgentsTab";
import { ToolsTab } from "./ToolsTab";
import { PlaybooksTab } from "./PlaybooksTab";
import { InviteCodesTab } from "./InviteCodesTab";
import { AdminsTab } from "./AdminsTab";

const tabs = [
  { path: "/config/agents", label: "Agents", icon: Bot },
  { path: "/config/tools", label: "Tools", icon: Wrench },
  { path: "/config/playbooks", label: "Playbooks", icon: BookOpen },
  { path: "/config/invite-codes", label: "Invite Codes", icon: Key },
  { path: "/config/admins", label: "Admins", icon: Shield },
];

export function ConfigPage() {
  const { t } = useI18n();
  const location = useLocation();

  return (
    <div>
      <PageHeader
        title={t("config.title")}
        description={t("config.description")}
      />

      <Card>
        <CardContent className="p-0">
          {/* Tabs */}
          <div className="border-b border-border">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = location.pathname === tab.path;
                return (
                  <NavLink
                    key={tab.path}
                    to={tab.path}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            <Routes>
              <Route path="/" element={<Navigate to="/config/agents" replace />} />
              <Route path="agents" element={<AgentsTab />} />
              <Route path="tools" element={<ToolsTab />} />
              <Route path="playbooks" element={<PlaybooksTab />} />
              <Route path="invite-codes" element={<InviteCodesTab />} />
              <Route path="admins" element={<AdminsTab />} />
            </Routes>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
