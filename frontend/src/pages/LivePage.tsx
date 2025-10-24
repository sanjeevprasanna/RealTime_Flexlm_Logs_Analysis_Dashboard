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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const LivePage = () => {
  const [selectedVendor, setSelectedVendor] = useState("all");
  const [hourlyData, setHourlyData] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLiveData();
    // Optionally, set up polling to refresh data every 30 seconds
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:3000/services/getLivePageData",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch live data");
      }
      const data = await response.json();

      // Transform hourly data to match chart format
      const transformedHourly = data.hourlyData.map((hour) => ({
        time: hour.time,
        cadence: Number(hour.vendorCounts.cadence) || 0,
        altair: Number(hour.vendorCounts.altair) || 0,
        synopsys: Number(hour.vendorCounts.synopsys) || 0,
        total: Object.values(hour.vendorCounts).reduce(
          (sum: Number, count) => sum + Number(count),
          0,
        ),
      }));

      setHourlyData(transformedHourly);
      setFeatures(data.features);
      setError(null);
    } catch (err) {
      console.error("Error fetching live data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredData =
    selectedVendor === "all"
      ? features
      : features.filter((item) => item.vendor === selectedVendor);

  // Extract unique vendors from features data
  const vendors = ["all", ...new Set(features.map((f) => f.vendor))];

  if (loading && hourlyData.length === 0) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950 text-gray-100">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 text-lg">Loading live data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950 text-gray-100">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-400 text-lg">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950 text-gray-100">
      <div className="flex-1 p-6 overflow-auto space-y-6">
        <Card className="bg-gray-900 border-gray-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-xl">
              24-Hour Usage Overview
            </CardTitle>
            <CardDescription className="text-gray-400">
              Hourly active features count for today across all vendors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis
                  dataKey="time"
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
                <Legend wrapperStyle={{ color: "#9CA3AF" }} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#60A5FA"
                  strokeWidth={2}
                  dot={false}
                  name="Total Features"
                />
                <Line
                  type="monotone"
                  dataKey="cadence"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  name="Cadence"
                />
                <Line
                  type="monotone"
                  dataKey="altair"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                  name="Altair"
                />
                <Line
                  type="monotone"
                  dataKey="synopsys"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={false}
                  name="Synopsys"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-xl">
                  Current Feature Usage
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Feature allocation and active users per vendor
                </CardDescription>
              </div>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Filter by vendor" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {vendors.map((vendor) => (
                    <SelectItem
                      key={vendor}
                      value={vendor}
                      className="text-white hover:bg-gray-700"
                    >
                      {vendor === "all" ? "All Vendors" : vendor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No active features found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800">
                    <TableHead className="text-gray-300">Feature</TableHead>
                    <TableHead className="text-gray-300">Vendor</TableHead>
                    <TableHead className="text-gray-300">Active</TableHead>
                    <TableHead className="text-gray-300">Total</TableHead>
                    <TableHead className="text-gray-300">Available</TableHead>
                    <TableHead className="text-gray-300">Users</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className="border-gray-800 hover:bg-gray-800 transition-colors"
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
                        {row.active}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {row.total}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {row.available}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.users.slice(0, 3).map((user) => (
                            <Badge
                              key={user}
                              variant="secondary"
                              className="bg-gray-700 text-gray-300 text-xs"
                            >
                              {user}
                            </Badge>
                          ))}
                          {row.users.length > 3 && (
                            <Badge
                              variant="secondary"
                              className="bg-gray-700 text-gray-300 text-xs"
                            >
                              +{row.users.length - 3}
                            </Badge>
                          )}
                        </div>
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

export default LivePage;
