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
  Legend,
  ResponsiveContainer,
} from "recharts";

const DenialPage = () => {
  const [selectedVendor, setSelectedVendor] = useState("all");
  const [hourlyData, setHourlyData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDenialData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDenialData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDenialData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:3000/services/getDenialPageData",
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      console.log("Received data:", data); // Debug log

      // Defensive programming - check if data exists
      if (!data) {
        throw new Error("No data received from server");
      }

      // Set hourly data with fallback
      setHourlyData(data.hourlyData || []);

      // Transform tableData to lowercase vendor names with fallback
      const transformedTableData = (data.tableData || []).map((item) => ({
        feature: item.feature,
        vendor: item.vendor?.toLowerCase() || "unknown",
        denied: item.denied || 0,
      }));

      setTableData(transformedTableData);
      setError(null);
    } catch (err) {
      console.error("Error fetching denial data:", err);
      setError(err.message);
      // Set empty arrays to prevent undefined errors
      setHourlyData([]);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData =
    selectedVendor === "all"
      ? tableData
      : tableData.filter((item) => item.vendor === selectedVendor);

  // Extract unique vendors from tableData with fallback
  const vendors = [
    "all",
    ...new Set(tableData.map((item) => item.vendor).filter(Boolean)),
  ];

  const date = new Date();

  if (loading && hourlyData.length === 0) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 text-lg">Loading denial data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950">
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <div className="text-red-400 text-lg">Error: {error}</div>
          <button
            onClick={fetchDenialData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950">
      <div className="flex-1 p-6 overflow-auto space-y-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">
              License Denials - {date.getDate()}/{date.getMonth() + 1}/
              {date.getFullYear()}
            </CardTitle>
            <CardDescription className="text-gray-400">
              Hourly denied license requests grouped by vendor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hourlyData.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No denial data available for today
              </div>
            ) : (
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
                  <Legend wrapperStyle={{ color: "#9CA3AF" }} />
                  <Line
                    type="monotone"
                    dataKey="cadence"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Cadence"
                  />
                  <Line
                    type="monotone"
                    dataKey="altair"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    name="Altair"
                  />
                  <Line
                    type="monotone"
                    dataKey="synopsys"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    name="Synopsys"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">
                  Denied License Requests
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Features and vendors with license denial counts
                </CardDescription>
              </div>
              {tableData.length > 0 && (
                <Select
                  value={selectedVendor}
                  onValueChange={setSelectedVendor}
                >
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
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No denials found for today
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-gray-800">
                    <TableHead className="text-gray-300">Feature</TableHead>
                    <TableHead className="text-gray-300">Vendor</TableHead>
                    <TableHead className="text-gray-300">Denials</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, i) => (
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
                                ? "text-yellow-500"
                                : "text-purple-500"
                            }`}
                        >
                          {row.vendor}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <Badge
                          variant="secondary"
                          className="bg-red-900/30 text-red-400 border-red-700"
                        >
                          {row.denied}
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

export default DenialPage;
