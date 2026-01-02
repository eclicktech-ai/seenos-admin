import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Folder,
  MessageSquare,
  Database,
  Settings,
  FileText,
  ChevronDown,
  X,
  BarChart3,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

interface SidebarProps {
  collapsed?: boolean;
  onClose?: () => void;
  mobile?: boolean;
}

interface MenuItem {
  icon: React.ElementType;
  labelKey: string; // i18n key
  path: string;
  children?: { labelKey: string; path: string }[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", path: "/dashboard" },
  { icon: Users, labelKey: "nav.users", path: "/users" },
  { icon: Folder, labelKey: "nav.projects", path: "/projects" },
  { icon: MessageSquare, labelKey: "nav.conversations", path: "/conversations" },
  { icon: Timer, labelKey: "nav.sessions", path: "/sessions" },
  { icon: Database, labelKey: "nav.context", path: "/context" },
  { icon: BarChart3, labelKey: "nav.analytics", path: "/analytics" },
  {
    icon: Settings,
    labelKey: "nav.settings",
    path: "/config",
    children: [
      { labelKey: "nav.agents", path: "/config/agents" },
      { labelKey: "nav.tools", path: "/config/tools" },
      { labelKey: "nav.playbooks", path: "/config/playbooks" },
      { labelKey: "nav.inviteCodes", path: "/config/invite-codes" },
      { labelKey: "nav.admins", path: "/config/admins" },
    ],
  },
  { icon: FileText, labelKey: "nav.auditLogs", path: "/audit" },
];

export function Sidebar({ collapsed, onClose, mobile }: SidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(["/config"]);
  const { t } = useI18n();

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path)
        ? prev.filter((p) => p !== path)
        : [...prev, path]
    );
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-background border-r border-border",
        mobile
          ? "fixed inset-y-0 left-0 z-50 w-64"
          : cn(
              "hidden lg:flex fixed inset-y-0 left-0 pt-16",
              collapsed ? "w-16" : "w-60"
            )
      )}
    >
      {mobile && (
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">SN</span>
            </div>
            <span className="font-semibold">SeenOS Admin</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.path);
            const active = isActive(item.path);

            return (
              <li key={item.path}>
                {hasChildren ? (
                  <div>
                    <button
                      onClick={() => toggleExpand(item.path)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-foreground"
                          : "text-foreground/70 hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0",
                          active ? "text-primary" : "text-foreground/70"
                        )}
                        strokeWidth={2.25}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{t(item.labelKey)}</span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </>
                      )}
                    </button>
                    {!collapsed && isExpanded && item.children && (
                      <ul className="mt-1 ml-4 space-y-1 border-l border-border/70 pl-4">
                        {item.children.map((child) => (
                          <li key={child.path}>
                            <NavLink
                              to={child.path}
                              onClick={onClose}
                              className={({ isActive }) =>
                                cn(
                                  "block rounded-md px-3 py-2 text-sm transition-colors",
                                  isActive
                                    ? "bg-primary/10 text-foreground font-medium"
                                    : "text-foreground/60 hover:bg-accent hover:text-foreground"
                                )
                              }
                            >
                              {t(child.labelKey)}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-foreground"
                          : "text-foreground/70 hover:bg-accent hover:text-foreground"
                      )
                    }
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        active ? "text-primary" : "text-foreground/70"
                      )}
                      strokeWidth={2.25}
                    />
                    {!collapsed && <span>{t(item.labelKey)}</span>}
                  </NavLink>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-3 space-y-3">
        {!collapsed && (
          <LanguageSwitcher className="w-full" showIcon={true} />
        )}
        <div className="text-xs text-muted-foreground text-center">
          {!collapsed && <span>SeenOS Admin v1.0.0</span>}
        </div>
      </div>
    </aside>
  );
}
