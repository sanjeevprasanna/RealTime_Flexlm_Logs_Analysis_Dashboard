import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const WaitPage = () => {
  const [hourlyData, setHourlyData] = useState([]);
  const [waitQueue, setWaitQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWaitData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchWaitData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchWaitData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:3000/services/getWaitPageData",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch wait data");
      }
      const data = await response.json();
      setHourlyData(data.hourlyData);
      setWaitQueue(data.waitQueue);
      setError(null);
    } catch (err) {
      console.error("Error fetching wait data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const date = new Date();

  if (loading && hourlyData.length === 0) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 text-lg">Loading wait data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-400 text-lg">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950">
      <div className="flex-1 p-6 overflow-auto">
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">
              Wait Queue - {date.getDate()}/{date.getMonth() + 1}/
              {date.getFullYear()}
            </CardTitle>
            <CardDescription className="text-gray-400">
              Hourly number of license denials (users waiting for allocation)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="hour"
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF" }}
                />
                <YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
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
                  dataKey="waitCount"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Denial Count"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">
              Current Wait Queue (Last Hour)
            </CardTitle>
            <CardDescription className="text-gray-400">
              Users who have been denied licenses in the last hour
            </CardDescription>
          </CardHeader>
          <CardContent>
            {waitQueue.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No users currently waiting for licenses
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-gray-800">
                    <TableHead className="text-gray-300">Feature</TableHead>
                    <TableHead className="text-gray-300">Vendor</TableHead>
                    <TableHead className="text-gray-300">User</TableHead>
                    <TableHead className="text-gray-300">Duration</TableHead>
                    <TableHead className="text-gray-300">Denials</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waitQueue.map((row, i) => (
                    <TableRow
                      key={i}
                      className="border-gray-800 hover:bg-gray-800"
                    >
                      <TableCell className="font-medium text-white">
                        {row.feature}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`border-gray-700 ${row.vendor === "cadence"
                              ? "text-green-500"
                              : row.vendor === "altair"
                                ? "text-yellow-400"
                                : "text-purple-400"
                            }`}
                        >
                          {row.vendor}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {row.user}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {row.duration}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <Badge
                          variant="secondary"
                          className="bg-gray-700 text-gray-300"
                        >
                          {row.denialCount}x
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-yellow-700 text-yellow-500"
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WaitPage;
