'use client';

import dynamic from 'next/dynamic';
import { Suspense, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';

type FunnelMetric = { name: string; value: number };
type AgentMetric = { name: string; total: number; funnels: Record<string, number> };
type TrafficMetric = { date: string; count: number; weekday: number };

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return <div className="w-full animate-pulse rounded-lg bg-muted" style={{ height }} />;
}

export function FunnelLineChart({ data }: { data: FunnelMetric[] }) {
  const chartData = useMemo(
    () => (data?.length ? data : [{ name: 'No stages', value: 0 }]),
    [data]
  );

  return (
    <Card className="col-span-full lg:col-span-3">
      <CardHeader>
        <CardTitle>Pipeline funnel</CardTitle>
        <CardDescription>Contacts per funnel stage</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function FunnelRadarChart({ data }: { data: FunnelMetric[] }) {
  const chartData = useMemo(
    () => (data?.length ? data : [{ name: 'Empty', value: 0 }]),
    [data]
  );

  return (
    <Card className="col-span-full lg:col-span-3">
      <CardHeader>
        <CardTitle>Stage distribution</CardTitle>
        <CardDescription>Radar view of pipeline balance</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid className="stroke-border" />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis tick={{ fontSize: 10 }} />
            <Radar
              name="Contacts"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.35}
            />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function AgentList({ data }: { data: AgentMetric[] }) {
  const agents = data?.length ? data : [];

  return (
    <Card className="col-span-full lg:col-span-6">
      <CardHeader>
        <CardTitle>Agent leaderboard</CardTitle>
        <CardDescription>Assigned contacts by agent and stage</CardDescription>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No assignment data yet.</p>
        ) : (
          <div className="space-y-3">
            {agents.slice(0, 8).map((agent, idx) => (
              <div
                key={agent.name}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Object.keys(agent.funnels || {}).length} stages active
                    </p>
                  </div>
                </div>
                <span className="text-lg font-semibold tabular-nums">{agent.total}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TrafficHeatmap({ data }: { data: TrafficMetric[] }) {
  const { weeks, max } = useMemo(() => {
    if (!data?.length) return { weeks: [] as TrafficMetric[][], max: 1 };
    const byWeek: TrafficMetric[][] = [];
    let chunk: TrafficMetric[] = [];
    data.forEach((d, i) => {
      chunk.push(d);
      if (chunk.length === 7 || i === data.length - 1) {
        byWeek.push(chunk);
        chunk = [];
      }
    });
    const maxVal = Math.max(1, ...data.map((d) => d.count));
    return { weeks: byWeek, max: maxVal };
  }, [data]);

  return (
    <Card className="col-span-full lg:col-span-6">
      <CardHeader>
        <CardTitle>Message traffic</CardTitle>
        <CardDescription>Last 90 days — message volume heatmap</CardDescription>
      </CardHeader>
      <CardContent>
        {weeks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No message traffic recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="mb-2 flex gap-1 text-[10px] text-muted-foreground">
              {WEEKDAYS.map((d) => (
                <span key={d} className="w-6 text-center">
                  {d}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex gap-1">
                  {week.map((day) => {
                    const intensity = day.count / max;
                    return (
                      <div
                        key={day.date}
                        title={`${day.date}: ${day.count} messages`}
                        className="h-6 w-6 rounded-sm border border-border/40"
                        style={{
                          backgroundColor: `hsl(var(--primary) / ${Math.max(0.08, intensity)})`,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Lazy-loaded analytics bundle for pages that want smaller initial JS */
export const AnalyticsChartsLazy = dynamic(
  () =>
    Promise.resolve({
      default: function AnalyticsChartsBundle({
        funnelMetrics,
        agentMetrics,
        trafficMetrics,
      }: {
        funnelMetrics: FunnelMetric[];
        agentMetrics: AgentMetric[];
        trafficMetrics: TrafficMetric[];
      }) {
        return (
          <Suspense fallback={<ChartSkeleton />}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
              <FunnelLineChart data={funnelMetrics} />
              <FunnelRadarChart data={funnelMetrics} />
              <AgentList data={agentMetrics} />
              <TrafficHeatmap data={trafficMetrics} />
            </div>
          </Suspense>
        );
      },
    }),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
