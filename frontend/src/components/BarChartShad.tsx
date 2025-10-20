"use client";
import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { BarChartHomePageProps } from "@/lib/types";

const chartConfig = {
  active_count: {
    label: "Total Usage",
    color: "hsl(220, 90%, 60%)",
  },
};

export function BarChartShad({ data }: BarChartHomePageProps) {
  const [activeChart, setActiveChart] = React.useState("active_count");
  const total = React.useMemo(() => {
    return {
      active_count: data.reduce((acc, curr) => acc + curr.active_count, 0),
    };
  }, [data]);

  return (
    <Card className="bg-gray-800 border-gray-700 h-full">
      <CardHeader className="flex flex-col items-stretch border-b border-gray-700 !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-6">
          <CardTitle className="text-white">Active Users - Last 30 Days</CardTitle>
        </div>
        <div className="flex">
          <button
            data-active={activeChart === "active_count"}
            className="data-[active=true]:bg-gray-700 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-gray-700 px-6 py-4 text-left sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
            onClick={() => setActiveChart("active_count")}
          >
            <span className="text-gray-400 text-xs">
              {chartConfig.active_count.label}
            </span>
            <span className="text-lg leading-none font-bold text-white sm:text-3xl">
              {total.active_count.toLocaleString()}
            </span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} stroke="#374151" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              stroke="#9CA3AF"
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px] bg-gray-800 border-gray-700"
                  nameKey="active_count"
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                />
              }
            />
            <Bar dataKey={activeChart} fill={chartConfig.active_count.color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
