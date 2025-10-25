import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";

interface Feature {
  feature: string;
  daemon: string;
  total: number;
  inUse: number;
  users: string[];
}

interface HourlyData {
  hour: string;
  count: number;
}

interface UserActivity {
  user: string;
  feature: string;
  accessTime: string;
  duration: string;
}

const SubscriptionsPage = () => {
  const [timeRange, setTimeRange] = useState("24h");
  const [featuresData, setFeaturesData] = useState<Feature[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [userActivityData, setUserActivityData] = useState<UserActivity[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          "http://localhost:3000/services/getSubsPageData",
        );
        const data = await res.json();

        setFeaturesData(data.features || []);
        setHourlyData(data.hourlyData || []);
        setUserActivityData(data.userActivity || []);
      } catch (error) {
        console.error("Failed to fetch subscriptions data:", error);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100">
      <main className="flex-1 p-6 space-y-6 overflow-auto">
        {/* 24h Usage Chart */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-white text-lg">
                Feature Usage - Today
              </CardTitle>
              <CardDescription className="text-gray-400">
                Hourly usage pattern for {dayjs().format("MMMM D, YYYY")}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {["24h"].map((range) => (
                <Button
                  key={range}
                  size="sm"
                  variant={timeRange === range ? "default" : "outline"}
                  onClick={() => setTimeRange(range)}
                  className={
                    timeRange === range
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                  }
                >
                  {range === "24h" ? "Today" : "Last 7 Days"}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="hour"
                    stroke="#9CA3AF"
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    type="category"
                    interval={0} // show all labels
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    domain={[0, "auto"]} // start from 0, auto-scale max
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                      color: "#fff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#3B82F6" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Feature Subscriptions */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Feature Subscriptions
            </CardTitle>
            <CardDescription className="text-gray-400">
              Current usage and availability overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-300">Feature</TableHead>
                  <TableHead className="text-gray-300">Total</TableHead>
                  <TableHead className="text-gray-300">In Use</TableHead>
                  <TableHead className="text-gray-300">Available</TableHead>
                  <TableHead className="text-gray-300">Users</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featuresData.map((row) => (
                  <TableRow
                    key={row.feature + row.daemon}
                    className="border-gray-800 hover:bg-gray-800/70"
                  >
                    <TableCell className="font-medium text-gray-200">
                      {row.feature}
                    </TableCell>
                    <TableCell className="text-white">{row.total}</TableCell>
                    <TableCell className="text-yellow-400">
                      {row.inUse}
                    </TableCell>
                    <TableCell className="text-green-400">
                      {row.total - row.inUse}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.users.slice(0, 3).map((user) => (
                          <Badge
                            key={user}
                            className="bg-gray-700 text-gray-200 hover:bg-gray-600"
                          >
                            {user}
                          </Badge>
                        ))}
                        {row.users.length > 3 && (
                          <Badge className="bg-gray-700 text-gray-300">
                            +{row.users.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">User Activity</CardTitle>
            <CardDescription className="text-gray-400">
              Detailed user feature access history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-300">User</TableHead>
                  <TableHead className="text-gray-300">Feature</TableHead>
                  <TableHead className="text-gray-300">Access Time</TableHead>
                  <TableHead className="text-gray-300">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userActivityData.map((row, idx) => (
                  <TableRow
                    key={idx}
                    className="border-gray-800 hover:bg-gray-800/70"
                  >
                    <TableCell className="font-medium text-white">
                      {row.user}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-gray-700 text-gray-200"
                      >
                        {row.feature}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-200">
                      {row.accessTime}
                    </TableCell>
                    <TableCell className="text-gray-200">
                      {row.duration}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SubscriptionsPage;
