import { useQuery } from "@tanstack/react-query";
import { User, Loader2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usageApi } from "@/api/usage";

interface UserSelectProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
}

/**
 * User selector component that fetches and displays a list of users
 */
export function UserSelect({
  value,
  onValueChange,
  placeholder = "All Users",
  className = "",
  showClearButton = true,
}: UserSelectProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["users", "list", { limit: 100 }],
    queryFn: () => usageApi.getUsers({ limit: 100 }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const users = data?.users || [];

  // Find user display name
  const getDisplayName = (userId: string) => {
    const user = users.find((u) => u.userId === userId);
    if (user) {
      if (user.name) return user.name;
      if (user.email) return user.email;
    }
    // Truncate long IDs
    return userId.length > 16 ? `${userId.slice(0, 8)}...${userId.slice(-4)}` : userId;
  };

  if (isLoading) {
    return (
      <div className={`flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Select
        value={value || "all"}
        onValueChange={(v) => onValueChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-full">
          <User className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue>
            {value ? getDisplayName(value) : placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-60">
          <SelectItem value="all">
            <span className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{placeholder}</span>
            </span>
          </SelectItem>
          {users.map((user) => (
            <SelectItem key={user.userId} value={user.userId}>
              <div className="flex flex-col">
                <span className="font-medium">
                  {user.name || user.email || user.userId.slice(0, 12) + "..."}
                </span>
                {user.email && user.name && (
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showClearButton && value && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onValueChange(null);
          }}
          className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
          title="Clear filter"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

