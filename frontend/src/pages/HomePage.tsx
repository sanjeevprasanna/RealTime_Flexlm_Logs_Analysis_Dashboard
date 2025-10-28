import { LabelList, Pie, PieChart, ResponsiveContainer } from "recharts";

import { Activity, Users, Calendar, Database } from "lucide-react";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUp, BarChart3 } from "lucide-react";

// Enhanced Tooltip Component
const EnhancedTooltipContent = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-md border border-emerald-500/40 rounded-lg p-3 shadow-2xl">
        <p className="text-gray-300 text-xs font-medium mb-1.5">
          {new Date(label).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/50"></div>
          <span className="text-white text-base font-bold">
            {payload[0].value.toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Bar Shape with Gradient and Glow
const GradientBarShape = (props) => {
  const { fill, x, y, width, height, index, payload } = props;
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: "pointer" }}
    >
      <defs>
        <linearGradient id={`barGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.75} />
        </linearGradient>
        <filter
          id={`glow-${index}`}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur
            stdDeviation={isHovered ? "5" : "0"}
            result="coloredBlur"
          />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`url(#barGradient-${index})`}
        filter={`url(#glow-${index})`}
        rx="6"
        opacity={isHovered ? 1 : 0.88}
        style={{
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isHovered ? "translateY(-3px)" : "translateY(0)",
        }}
      />
      {isHovered && (
        <rect
          x={x}
          y={y - 3}
          width={width}
          height={height}
          fill="url(#barGradient-${index})"
          rx="6"
          opacity="0.3"
          style={{
            transition: "all 0.3s ease",
          }}
        />
      )}
    </g>
  );
};

// Main Component
const BarChartShad = ({ data }) => {
  const [activeChart, setActiveChart] = React.useState("active_count");
  const [viewMode, setViewMode] = React.useState("bars"); // "bars" or "trend"

  const chartConfig = {
    active_count: {
      label: "Total Usage",
      color: "hsl(890, 91%, 60%)",
    },
  };

  const total = React.useMemo(() => {
    return {
      active_count: data.reduce((acc, curr) => acc + curr.active_count, 0),
    };
  }, [data]);

  const stats = React.useMemo(() => {
    const average = Math.round(total.active_count / data.length);
    const firstWeek =
      data.slice(0, 7).reduce((acc, curr) => acc + curr.active_count, 0) / 7;
    const lastWeek =
      data.slice(-7).reduce((acc, curr) => acc + curr.active_count, 0) / 7;
    const trendPercentage = (
      ((lastWeek - firstWeek) / firstWeek) *
      100
    ).toFixed(1);
    const isPositive = trendPercentage > 0;

    return { average, trendPercentage, isPositive };
  }, [data, total]);

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 h-full shadow-2xl">
      <CardHeader className="flex flex-col items-stretch border-b border-gray-700/50 !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-5 pb-4 sm:!py-6">
          <CardTitle className="text-white text-xl font-semibold tracking-tight">
            License Usage- Last 30 Days
          </CardTitle>
          <CardDescription className="text-gray-400 text-sm flex items-center gap-2"></CardDescription>
        </div>
        <div className="flex">
          <button
            data-active={activeChart === "active_count"}
            className="data-[active=true]:bg-gray-800/60 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-gray-700/50 px-6 py-4 text-left sm:border-t-0 sm:border-l sm:px-8 sm:py-6 hover:bg-gray-800/40 transition-colors"
            onClick={() => setActiveChart("active_count")}
          >
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
              {chartConfig.active_count.label}
            </span>
            <span className="text-2xl leading-none font-bold text-white sm:text-4xl">
              {total.active_count.toLocaleString()}
            </span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:p-6 pt-6">
        {/* <div className="flex justify-end mb-3 gap-2"> */}
        {/*   <button */}
        {/*     onClick={() => setViewMode("bars")} */}
        {/*     className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "bars" */}
        {/*         ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" */}
        {/*         : "bg-gray-800/40 text-gray-400 border border-gray-700/50 hover:bg-gray-800/60" */}
        {/*       }`} */}
        {/*   > */}
        {/*     <BarChart3 className="w-3.5 h-3.5 inline mr-1" /> */}
        {/*     Bars */}
        {/*   </button> */}
        {/*   <button */}
        {/*     onClick={() => setViewMode("trend")} */}
        {/*     className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "trend" */}
        {/*         ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" */}
        {/*         : "bg-gray-800/40 text-gray-400 border border-gray-700/50 hover:bg-gray-800/60" */}
        {/*       }`} */}
        {/*   > */}
        {/*     <TrendingUp className="w-3.5 h-3.5 inline mr-1" /> */}
        {/*     Trend */}
        {/*   </button> */}
        {/* </div> */}
        {/**/}
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[320px] w-full"
        >
          {/* {viewMode === "bars" ? ( */}
          {/*   <BarChart */}
          {/*     accessibilityLayer */}
          {/*     data={data} */}
          {/*     margin={{ left: 12, right: 12, top: 20 }} */}
          {/*   > */}
          {/*     <CartesianGrid */}
          {/*       vertical={false} */}
          {/*       stroke="#374151" */}
          {/*       strokeDasharray="3 3" */}
          {/*       opacity={0.3} */}
          {/*     /> */}
          {/*     <XAxis */}
          {/*       dataKey="date" */}
          {/*       tickLine={false} */}
          {/*       axisLine={false} */}
          {/*       tickMargin={8} */}
          {/*       minTickGap={32} */}
          {/*       stroke="#9CA3AF" */}
          {/*       tick={{ fill: "#9CA3AF", fontSize: 12 }} */}
          {/*       tickFormatter={(value) => { */}
          {/*         const date = new Date(value); */}
          {/*         return date.toLocaleDateString("en-US", { */}
          {/*           month: "short", */}
          {/*           day: "numeric", */}
          {/*         }); */}
          {/*       }} */}
          {/*     /> */}
          {/*     <ChartTooltip content={<EnhancedTooltipContent />} /> */}
          {/*     <Bar */}
          {/*       dataKey={activeChart} */}
          {/*       shape={<GradientBarShape />} */}
          {/*       animationDuration={800} */}
          {/*       animationBegin={0} */}
          {/*     /> */}
          {/*   </BarChart> */}
          {/* ) : ( */}
          <ComposedChart data={data} margin={{ left: 12, right: 12, top: 20 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#374151"
              strokeDasharray="3 3"
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip content={<EnhancedTooltipContent />} />
            <Bar
              dataKey={activeChart}
              fill="url(#areaGradient)"
              opacity={0.4}
              radius={[4, 4, 0, 0]}
              animationDuration={600}
            />
            <Line
              type="monotone"
              dataKey={activeChart}
              stroke="url(#lineGradient)"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 6,
                fill: "#10b981",
                stroke: "#fff",
                strokeWidth: 2,
              }}
              animationDuration={1000}
            />
          </ComposedChart>
          {/* )} */}
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

// PieChart Component
const PieChartShad = ({ data }) => {
  const filteredData = data.filter((d) => d.active_count > 0);

  const chartConfig = Object.fromEntries(
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

  const totalCount = filteredData.reduce((sum, d) => sum + d.active_count, 0);

  return (
    <Card className="flex flex-col h-full bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl">
      <CardHeader className="items-center pb-4 border-b border-gray-700/50">
        <CardTitle className="text-white text-xl font-semibold tracking-tight">
          Vendor Distribution
        </CardTitle>
        <CardDescription className="text-gray-400 text-sm"></CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center items-center pt-6">
        <ChartContainer config={chartConfig} className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                className="text-gray-50 bg-gray-800 border-gray-700 shadow-xl"
                content={
                  <ChartTooltipContent
                    nameKey="active_count"
                    hideLabel
                    className="text-gray-50 bg-gray-800 border-gray-700 shadow-xl"
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="active_count"
                nameKey="daemon"
                outerRadius="85%"
                innerRadius="55%"
                stroke="none"
                paddingAngle={2}
              >
                <LabelList
                  dataKey="daemon"
                  className="fill-white font-medium"
                  stroke="none"
                  fontSize={13}
                  formatter={(value) => chartConfig[value]?.label}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="text-center mt-4">
          {/* <p className="text-3xl font-bold text-white">{totalCount}</p> */}
          <p className="text-sm text-gray-400 mt-1">Vendor Distribution</p>
        </div>
      </CardContent>
    </Card>
  );
};

// SummaryCard Component
const SummaryCard = ({
  title,
  value,
  trend,
  subtitle,
  color = "blue",
  isUp = true,
  icon: Icon,
}) => {
  const colorMap = {
    green: "text-green-400",
    red: "text-red-400",
    blue: "text-blue-400",
    yellow: "text-yellow-400",
  };

  const bgColorMap = {
    green: "bg-green-500/10",
    red: "bg-red-500/10",
    blue: "bg-blue-500/10",
    yellow: "bg-yellow-500/10",
  };

  return (
    <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-gray-600 overflow-hidden group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            {title}
          </CardTitle>
          {Icon && (
            <div
              className={`p-2 rounded-lg ${bgColorMap[color]} transition-transform group-hover:scale-110`}
            >
              <Icon className={`w-4 h-4 ${colorMap[color]}`} />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-4xl font-bold text-white tracking-tight">
              {value}
            </span>
            {/* {trend && ( */}
            {/*   <div className={`flex items-center gap-1 ${colorMap[color]} bg-gray-800/50 px-2 py-1 rounded-full`}> */}
            {/*     {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />} */}
            {/*     <span className="text-xs font-semibold">{trend}</span> */}
            {/*   </div> */}
            {/* )} */}
          </div>
          {subtitle && (
            <span className="text-xs text-gray-500 mt-1">{subtitle}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Main HomePage Component
const HomePage = () => {
  const [dashboardData, setDashboardData] = React.useState([]);
  const [pieData, setPieData] = React.useState([]);
  const [summaryData, setSummaryData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = () => {
      Promise.all([
        fetch("http://localhost:3000/services/getDailyActiveCountsLast30Days")
          .then((res) => res.json())
          .then((data) => {
            const temp = data.map((d) => ({
              ...d,
              active_count: Math.abs(Number(d.active_count)),
            }));
            setDashboardData(temp);
          }),

        fetch("http://localhost:3000/services/getActiveVendors")
          .then((res) => res.json())
          .then((data) => {
            const temp = data.map((d) => ({
              ...d,
              active_count: Math.abs(Number(d.active_count)),
            }));
            setPieData(temp);
          }),

        fetch("http://localhost:3000/services/getSummaryHomePage")
          .then((res) => res.json())
          .then((data) => {
            setSummaryData(data);
          }),
      ])
        .catch((err) => console.error("Error fetching data:", err))
        .finally(() => setLoading(false));
    };
    fetchData(); // immediate fetch on mount
    const interval = setInterval(fetchData, 30000); // fetch every 60 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-screen bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400 text-lg">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950">
      <div className="flex-1 p-6 overflow-auto">
        {/* Main Chart */}
        <div className="h-[560px] rounded-xl mb-6 transform hover:scale-[1.01] transition-transform duration-300">
          <BarChartShad data={dashboardData} />
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="rounded-xl transform hover:scale-[1.01] transition-transform duration-300">
            <PieChartShad data={pieData} />
          </div>

          {/* Summary Cards */}
          <div className="rounded-xl">
            {summaryData ? (
              <div className="grid grid-cols-2 gap-4 h-full">
                <SummaryCard
                  title="Active Licenses"
                  value={summaryData.activeLicenses.today}
                  trend={summaryData.activeLicenses.trend}
                  color={
                    summaryData.activeLicenses.trend.startsWith("+")
                      ? "green"
                      : "red"
                  }
                  isUp={summaryData.activeLicenses.trend.startsWith("+")}
                  icon={Activity}
                />
                <SummaryCard
                  title="Active Vendors"
                  value={summaryData.activeVendors.today}
                  trend={summaryData.activeVendors.trend}
                  color={
                    summaryData.activeVendors.trend.startsWith("+")
                      ? "green"
                      : "red"
                  }
                  isUp={summaryData.activeVendors.trend.startsWith("+")}
                  icon={Users}
                />
                <SummaryCard
                  title="Events Today"
                  value={summaryData.eventsToday.today}
                  trend={summaryData.eventsToday.trend}
                  color={
                    summaryData.eventsToday.trend.startsWith("+")
                      ? "green"
                      : "red"
                  }
                  isUp={summaryData.eventsToday.trend.startsWith("+")}
                  icon={Calendar}
                />
                <SummaryCard
                  title="Available Licenses"
                  value={summaryData.licenses.available}
                  subtitle={`${summaryData.licenses.used} / ${summaryData.licenses.total} used`}
                  color="blue"
                  icon={Database}
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-8 h-full flex items-center justify-center shadow-2xl">
                <p className="text-gray-400 text-center">Loading summary...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
