import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Coins, MessageSquare, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useI18n } from "@/lib/i18n";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { DateRangeSelector } from "@/components/shared/DateRangeSelector";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usageApi } from "@/api/usage";
import { formatNumber } from "@/lib/utils";

// Helper to calculate date range
function getDateRange(days: number) {
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  return { startDate, endDate };
}

export function AnalyticsPage() {
  const { t } = useI18n();
  // Independent date ranges for each section
  const [summaryDays, setSummaryDays] = useState(30);
  const [tokenRankDays, setTokenRankDays] = useState(30);
  const [messageRankDays, setMessageRankDays] = useState(30);

  // Calculate date ranges
  const summaryRange = useMemo(() => getDateRange(summaryDays), [summaryDays]);
  const tokenRange = useMemo(() => getDateRange(tokenRankDays), [tokenRankDays]);
  const messageRange = useMemo(() => getDateRange(messageRankDays), [messageRankDays]);

  const { data: topByTokens, isLoading: tokensLoading } = useQuery({
    queryKey: ["analytics", "top-tokens", tokenRankDays],
    queryFn: () => usageApi.getTopUsers({ ...tokenRange, limit: 20 }),
  });

  const { data: topByMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ["analytics", "top-messages", messageRankDays],
    queryFn: () => usageApi.getTopUsersByMessages({ ...messageRange, limit: 20 }),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["analytics", "summary", summaryDays],
    queryFn: () => usageApi.getSummary(summaryRange),
  });

  if (summaryLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("analytics.title")}
        description={t("analytics.description")}
      />

      {/* Summary Stats */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{t("analytics.usageSummary")}</h3>
          <DateRangeSelector value={summaryDays} onChange={setSummaryDays} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t("analytics.apiCalls")}
            value={formatNumber(summary?.callCount || 0)}
            icon={MessageSquare}
            color="info"
          />
          <StatCard
            title={t("dashboard.totalTokens")}
            value={formatNumber(summary?.totalTokens || 0)}
            icon={Coins}
            color="success"
          />
          <StatCard
            title={t("analytics.promptTokens")}
            value={formatNumber(summary?.promptTokens || 0)}
            icon={TrendingUp}
            color="warning"
          />
          <StatCard
            title={t("dashboard.totalCost")}
            value={`$${(summary?.totalCost || 0).toFixed(2)}`}
            icon={Coins}
            color="default"
          />
        </div>
      </div>

      {/* Rankings */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top by Tokens */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-5 w-5 text-amber-500" />
              {t("analytics.topTokenConsumers")}
            </CardTitle>
            <DateRangeSelector value={tokenRankDays} onChange={setTokenRankDays} />
          </CardHeader>
          <CardContent>
            {tokensLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : !topByTokens?.users?.length ? (
              <EmptyState
                icon={Coins}
                title="No Data"
                description="No token usage data for this period"
              />
            ) : (
              <div className="space-y-3">
                {topByTokens.users.map((user, index) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          index === 0 ? "default" : index === 1 ? "secondary" : "outline"
                        }
                      >
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{user.name || user.email}</p>
                        {user.name && (
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium">
                        {formatNumber(user.totalTokens || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${(user.totalCost || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top by Messages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-sky-500" />
              {t("analytics.topMessageSenders")}
            </CardTitle>
            <DateRangeSelector value={messageRankDays} onChange={setMessageRankDays} />
          </CardHeader>
          <CardContent>
            {messagesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : !topByMessages?.users?.length ? (
              <EmptyState
                icon={MessageSquare}
                title="No Data"
                description="No message data for this period"
              />
            ) : (
              <div className="space-y-3">
                {topByMessages.users.map((user, index) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          index === 0 ? "default" : index === 1 ? "secondary" : "outline"
                        }
                      >
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{user.name || user.email}</p>
                        {user.name && (
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium">
                        {formatNumber(user.messages || 0)} msgs
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.conversations || 0} conversations
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
