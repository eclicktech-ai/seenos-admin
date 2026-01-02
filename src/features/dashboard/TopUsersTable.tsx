import { useNavigate } from "react-router-dom";
import type { TopUser } from "@/types";
import { formatNumber } from "@/lib/utils";

interface TopUsersTableProps {
  users: TopUser[];
  loading?: boolean;
  onUserClick?: (user: TopUser) => void;
}

export function TopUsersTable({ users, loading, onUserClick }: TopUsersTableProps) {
  const navigate = useNavigate();

  const handleUserClick = (user: TopUser) => {
    if (onUserClick) {
      onUserClick(user);
    } else {
      // Default: navigate to conversations filtered by user
      navigate(`/conversations?userId=${user.userId}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse mt-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-4">
        No data available
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user, index) => (
        <div
          key={user.userId}
          onClick={() => handleUserClick(user)}
          className="flex items-center gap-3 p-2 -mx-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index < 3
                ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate hover:underline">{user.email}</p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(user.totalTokens ?? 0)} tokens
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">${(user.totalCost ?? 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(user.callCount ?? 0)} calls
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
