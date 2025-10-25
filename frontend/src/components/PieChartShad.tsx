"use client";
import { LabelList, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { PieChartHomePageProps } from "@/lib/types";

export function PieChartShad({ data }: PieChartHomePageProps) {
  // Filter out items with active_count <= 0
  const filteredData = data.filter((d) => d.active_count > 0);

  const chartConfig: ChartConfig = Object.fromEntries(
    filteredData.map((d, i) => [
      d.daemon,
      {
        label: d.daemon,
        color: `var(--chart-${(i % 5) + 1})`,
      },
    ]),
  );

  const chartData = filteredData.map((d, i) => ({
    daemon: d.daemon,
    active_count: d.active_count,
    fill: `var(--chart-${(i % 5) + 1})`,
  }));

  return (
    <Card className="flex flex-col h-full bg-gray-800 border-gray-700">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-white">Active Vendors</CardTitle>
        <CardDescription className="text-gray-400">
          Current active license daemons
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex justify-center items-center">
        <ChartContainer config={chartConfig} className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="active_count"
                    hideLabel
                    className="bg-gray-800 border-gray-700"
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="active_count"
                nameKey="daemon"
                outerRadius="90%"
                innerRadius="50%"
                stroke="none"
              >
                <LabelList
                  dataKey="daemon"
                  className="fill-white"
                  stroke="none"
                  fontSize={12}
                  formatter={(value: keyof typeof chartConfig) =>
                    chartConfig[value]?.label
                  }
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm border-t border-gray-700 pt-4">
        <div className="text-gray-400 leading-none text-center">
          Current Active Vendors
        </div>
      </CardFooter>
    </Card>
  );
}
