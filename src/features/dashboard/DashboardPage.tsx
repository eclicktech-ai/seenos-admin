import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, FolderKanban, MessageSquare, Coins, UserPlus, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { DateRangeSelector, type CustomDateRange } from "@/components/shared/DateRangeSelector";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usageApi } from "@/api/usage";
import { formatNumber } from "@/lib/utils";
import { TopUsersTable } from "./TopUsersTable";
import { useI18n } from "@/lib/i18n";

const AreaChart = lazy(() =>
  import("@/components/charts/AreaChart").then((mod) => ({ default: mod.AreaChart }))
);

// Helper to calculate days from custom range or use preset
function useDateRange(presetDays: number, customRange: CustomDateRange | null) {
  return useMemo(() => {
    if (customRange) {
      const start = new Date(customRange.startDate);
      const end = new Date(customRange.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return { days, startDate: customRange.startDate, endDate: customRange.endDate };
    }
    return { days: presetDays, startDate: null, endDate: null };
  }, [presetDays, customRange]);
}

export function DashboardPage() {
  const { t } = useI18n();
  
  // Preset days state
  const [overviewDays, setOverviewDays] = useState(30);
  const [userRegDays, setUserRegDays] = useState(30);
  const [projectDays, setProjectDays] = useState(30);
  const [convDays, setConvDays] = useState(30);
  const [tokenDays, setTokenDays] = useState(30);

  // Custom date range state
  const [overviewCustom, setOverviewCustom] = useState<CustomDateRange | null>(null);
  const [userRegCustom, setUserRegCustom] = useState<CustomDateRange | null>(null);
  const [projectCustom, setProjectCustom] = useState<CustomDateRange | null>(null);
  const [convCustom, setConvCustom] = useState<CustomDateRange | null>(null);
  const [tokenCustom, setTokenCustom] = useState<CustomDateRange | null>(null);

  // Calculate effective date ranges
  const overviewRange = useDateRange(overviewDays, overviewCustom);
  const userRegRange = useDateRange(userRegDays, userRegCustom);
  const projectRange = useDateRange(projectDays, projectCustom);
  const convRange = useDateRange(convDays, convCustom);
  const tokenRange = useDateRange(tokenDays, tokenCustom);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["usage", "summary"],
    queryFn: () => usageApi.getSummary(),
  });

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ["usage", "daily", tokenRange.days, tokenRange.startDate, tokenRange.endDate],
    queryFn: () => usageApi.getDailyUsage({ days: tokenRange.days }),
  });

  const { data: overviewStats, isLoading: overviewLoading } = useQuery({
    queryKey: ["usage", "dashboard-stats", overviewRange.days, overviewRange.startDate],
    queryFn: () => usageApi.getDashboardStats(overviewRange.days),
  });

  const { data: userRegStats } = useQuery({
    queryKey: ["usage", "dashboard-stats", "user-reg", userRegRange.days, userRegRange.startDate],
    queryFn: () => usageApi.getDashboardStats(userRegRange.days),
  });

  const { data: projectStats } = useQuery({
    queryKey: ["usage", "dashboard-stats", "project", projectRange.days, projectRange.startDate],
    queryFn: () => usageApi.getDashboardStats(projectRange.days),
  });

  const { data: convStats } = useQuery({
    queryKey: ["usage", "dashboard-stats", "conv", convRange.days, convRange.startDate],
    queryFn: () => usageApi.getDashboardStats(convRange.days),
  });

  const { data: topUsers, isLoading: topUsersLoading } = useQuery({
    queryKey: ["usage", "top-users"],
    queryFn: () => usageApi.getTopUsers({ limit: 10 }),
  });

  // Handler to clear custom range when preset is selected
  const handlePresetChange = (
    setDays: (d: number) => void,
    setCustom: (c: CustomDateRange | null) => void
  ) => (days: number) => {
    setDays(days);
    setCustom(null);
  };

  const formatChartDate = useCallback(
    (dateStr: string) =>
      new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    []
  );

  const tokenChartData = useMemo(
    () =>
      dailyData?.dailyUsage?.map((d) => ({
        date: formatChartDate(d.date),
        tokens: d.totalTokens,
        cost: d.cost,
        calls: d.callCount,
      })) || [],
    [dailyData, formatChartDate]
  );

  const userRegChartData = useMemo(
    () =>
      userRegStats?.userRegistrations?.map((d) => ({
        date: formatChartDate(d.date),
        count: d.count,
      })) || [],
    [userRegStats, formatChartDate]
  );

  const projectChartData = useMemo(
    () =>
      projectStats?.projectCreations?.map((d) => ({
        date: formatChartDate(d.date),
        count: d.count,
      })) || [],
    [projectStats, formatChartDate]
  );

  const convChartData = useMemo(
    () =>
      convStats?.conversationCreations?.map((d) => ({
        date: formatChartDate(d.date),
        count: d.count,
      })) || [],
    [convStats, formatChartDate]
  );

  if (summaryLoading || overviewLoading) {
    return <LoadingPage />;
  }

  // Calculate recent registrations for overview period
  const recentRegistrations = overviewStats?.userRegistrations?.reduce(
    (sum, d) => sum + d.count,
    0
  ) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
      />

      {/* Overview Stats Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{t("dashboard.overview")}</h3>
          <DateRangeSelector 
            value={overviewDays} 
            onChange={handlePresetChange(setOverviewDays, setOverviewCustom)}
            customRange={overviewCustom}
            onCustomRangeChange={setOverviewCustom}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t("dashboard.totalUsers")}
            value={formatNumber(overviewStats?.totalUsers || 0)}
            description={t("dashboard.recentRegistrations", { count: recentRegistrations, days: overviewDays })}
            icon={Users}
            color="info"
          />
          <StatCard
            title={t("projects.title")}
            value={formatNumber(overviewStats?.totalProjects || 0)}
            icon={FolderKanban}
            color="success"
          />
          <StatCard
            title={t("nav.conversations")}
            value={formatNumber(overviewStats?.totalConversations || 0)}
            icon={MessageSquare}
            color="warning"
          />
          <StatCard
            title={t("dashboard.totalCost")}
            value={`$${(summary?.totalCost || 0).toFixed(2)}`}
            description={`${formatNumber(summary?.totalTokens || 0)} tokens`}
            icon={Coins}
            color="default"
          />
        </div>
      </div>

      {/* User Registration Trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-5 w-5 text-sky-500" />
            {t("dashboard.userRegistrationTrend")}
          </CardTitle>
          <DateRangeSelector 
            value={userRegDays} 
            onChange={handlePresetChange(setUserRegDays, setUserRegCustom)}
            customRange={userRegCustom}
            onCustomRangeChange={setUserRegCustom}
          />
        </CardHeader>
        <CardContent>
          {userRegChartData.length > 0 ? (
            <Suspense
              fallback={
                <div className="h-[250px] flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              }
            >
              <AreaChart
                data={userRegChartData}
                xKey="date"
                yKey="count"
                height={250}
                color="hsl(var(--chart-series-1))"
                gradientId="userRegGradient"
              />
            </Suspense>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No registration data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project Creation Trend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="h-5 w-5 text-green-500" />
              {t("dashboard.projectCreationTrend")}
            </CardTitle>
            <DateRangeSelector 
              value={projectDays} 
              onChange={handlePresetChange(setProjectDays, setProjectCustom)}
              customRange={projectCustom}
              onCustomRangeChange={setProjectCustom}
            />
          </CardHeader>
          <CardContent>
            {projectChartData.length > 0 ? (
              <Suspense
                fallback={
                  <div className="h-[200px] flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                }
              >
                <AreaChart
                  data={projectChartData}
                  xKey="date"
                  yKey="count"
                  height={200}
                color="hsl(var(--chart-series-2))"
                gradientId="projectGradient"
                />
              </Suspense>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No project data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation Trend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-amber-500" />
              {t("dashboard.conversationTrend")}
            </CardTitle>
            <DateRangeSelector 
              value={convDays} 
              onChange={handlePresetChange(setConvDays, setConvCustom)}
              customRange={convCustom}
              onCustomRangeChange={setConvCustom}
            />
          </CardHeader>
          <CardContent>
            {convChartData.length > 0 ? (
              <Suspense
                fallback={
                  <div className="h-[200px] flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                }
              >
                <AreaChart
                  data={convChartData}
                  xKey="date"
                  yKey="count"
                  height={200}
                color="hsl(var(--chart-series-3))"
                gradientId="convGradient"
                />
              </Suspense>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No conversation data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Token Usage and Top Users */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-cyan-500" />
              {t("dashboard.tokenUsageTrend")}
            </CardTitle>
            <DateRangeSelector 
              value={tokenDays} 
              onChange={handlePresetChange(setTokenDays, setTokenCustom)}
              customRange={tokenCustom}
              onCustomRangeChange={setTokenCustom}
            />
          </CardHeader>
          <CardContent>
            {dailyLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                }
              >
                <AreaChart
                  data={tokenChartData}
                  xKey="date"
                  yKey="tokens"
                  height={300}
                color="hsl(var(--chart-series-4))"
                gradientId="tokenGradient"
                />
              </Suspense>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.topActiveUsers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <TopUsersTable
              users={topUsers?.users || []}
              loading={topUsersLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Model Usage */}
      {summary?.byModel && Object.keys(summary.byModel).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.modelUsageDistribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(summary.byModel).map(([model, usage]) => (
                <div
                  key={model}
                  className="rounded-lg border border-border p-4"
                >
                  <h4 className="font-medium text-sm truncate" title={model}>
                    {model}
                  </h4>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Calls</span>
                      <span>{formatNumber(usage.callCount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tokens</span>
                      <span>{formatNumber(usage.totalTokens)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost</span>
                      <span>${usage.cost.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
