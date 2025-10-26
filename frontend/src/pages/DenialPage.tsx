import { useState, useEffect } from "react";
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
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  XCircle,
  AlertTriangle,
  TrendingDown,
  Filter,
  RefreshCw,
} from "lucide-react";

const DenialPage = () => {
  const [selectedVendor, setSelectedVendor] = useState("all");
  const [hourlyData, setHourlyData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDenialData();
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

      if (!data) {
        throw new Error("No data received from server");
      }

      setHourlyData(data.hourlyData || []);

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

  const vendors = [
    "all",
    ...new Set(tableData.map((item) => item.vendor).filter(Boolean)),
  ];

  // Calculate summary stats
  const totalDenials = tableData.reduce(
    (sum, item) => sum + Number(item.denied),
    0,
  );
  const cadenceDenials = tableData
    .filter((item) => item.vendor === "cadence")
    .reduce((sum, item) => sum + Number(item.denied), 0);
  const altairDenials = tableData
    .filter((item) => item.vendor === "altair")
    .reduce((sum, item) => sum + Number(item.denied), 0);
  const synopsysDenials = tableData
    .filter((item) => item.vendor === "synopsys")
    .reduce((sum, item) => sum + Number(item.denied), 0);

  const date = new Date();

  if (loading && hourlyData.length === 0) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-400 text-lg">Loading denial data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <div className="text-red-400 text-lg mb-4">Error: {error}</div>
            <button
              onClick={fetchDenialData}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950">
      <div className="flex-1 p-6 overflow-auto space-y-6">
        {/* Summary Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4"> */}
        {/*   <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300"> */}
        {/*     <CardHeader className="pb-3"> */}
        {/*       <div className="flex items-center justify-between"> */}
        {/*         <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wide"> */}
        {/*           Total Denials */}
        {/*         </CardTitle> */}
        {/*         <div className="p-2 rounded-lg bg-red-500/10 transition-transform hover:scale-110"> */}
        {/*           <XCircle className="w-4 h-4 text-red-400" /> */}
        {/*         </div> */}
        {/*       </div> */}
        {/*     </CardHeader> */}
        {/*     <CardContent> */}
        {/*       <div className="text-3xl font-bold text-white"> */}
        {/*         {totalDenials} */}
        {/*       </div> */}
        {/*       <p className="text-xs text-gray-500 mt-1">All vendors today</p> */}
        {/*     </CardContent> */}
        {/*   </Card> */}
        {/**/}
        {/*   <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300"> */}
        {/*     <CardHeader className="pb-3"> */}
        {/*       <div className="flex items-center justify-between"> */}
        {/*         <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wide"> */}
        {/*           Cadence */}
        {/*         </CardTitle> */}
        {/*         <div className="p-2 rounded-lg bg-green-500/10 transition-transform hover:scale-110"> */}
        {/*           <TrendingDown className="w-4 h-4 text-green-400" /> */}
        {/*         </div> */}
        {/*       </div> */}
        {/*     </CardHeader> */}
        {/*     <CardContent> */}
        {/*       <div className="text-3xl font-bold text-white"> */}
        {/*         {cadenceDenials} */}
        {/*       </div> */}
        {/*       <p className="text-xs text-gray-500 mt-1">Denied requests</p> */}
        {/*     </CardContent> */}
        {/*   </Card> */}
        {/**/}
        {/*   <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300"> */}
        {/*     <CardHeader className="pb-3"> */}
        {/*       <div className="flex items-center justify-between"> */}
        {/*         <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wide"> */}
        {/*           Altair */}
        {/*         </CardTitle> */}
        {/*         <div className="p-2 rounded-lg bg-yellow-500/10 transition-transform hover:scale-110"> */}
        {/*           <TrendingDown className="w-4 h-4 text-yellow-400" /> */}
        {/*         </div> */}
        {/*       </div> */}
        {/*     </CardHeader> */}
        {/*     <CardContent> */}
        {/*       <div className="text-3xl font-bold text-white"> */}
        {/*         {altairDenials} */}
        {/*       </div> */}
        {/*       <p className="text-xs text-gray-500 mt-1">Denied requests</p> */}
        {/*     </CardContent> */}
        {/*   </Card> */}
        {/**/}
        {/*   <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300"> */}
        {/*     <CardHeader className="pb-3"> */}
        {/*       <div className="flex items-center justify-between"> */}
        {/*         <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wide"> */}
        {/*           Synopsys */}
        {/*         </CardTitle> */}
        {/*         <div className="p-2 rounded-lg bg-purple-500/10 transition-transform hover:scale-110"> */}
        {/*           <TrendingDown className="w-4 h-4 text-purple-400" /> */}
        {/*         </div> */}
        {/*       </div> */}
        {/*     </CardHeader> */}
        {/*     <CardContent> */}
        {/*       <div className="text-3xl font-bold text-white"> */}
        {/*         {synopsysDenials} */}
        {/*       </div> */}
        {/*       <p className="text-xs text-gray-500 mt-1">Denied requests</p> */}
        {/*     </CardContent> */}
        {/*   </Card> */}
        {/* </div> */}
        {/**/}
        {/* Chart */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl">
          <CardHeader className="border-b border-gray-700/50">
            <CardTitle className="text-white text-xl font-semibold tracking-tight">
              License Denials - {date.getDate()}/{date.getMonth() + 1}/
              {date.getFullYear()}
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              Hourly denied license requests
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {hourlyData.length === 0 ? (
              <div className="text-center py-12">
                <XCircle className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
                <div className="text-gray-400 text-lg font-medium">
                  No denial data available for today
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  Great! All license requests were successful
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={380}>
                <LineChart
                  data={hourlyData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="cadenceGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="altairGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="synopsysGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    opacity={0.3}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="hour"
                    stroke="#9CA3AF"
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#374151" }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#374151" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#fff",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    labelStyle={{ fontWeight: "600", color: "#F59E0B" }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: "#9CA3AF",
                      paddingTop: "20px",
                    }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey="cadence"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ fill: "#10B981", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Cadence"
                  />
                  <Line
                    type="monotone"
                    dataKey="altair"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    dot={{ fill: "#F59E0B", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Altair"
                  />
                  <Line
                    type="monotone"
                    dataKey="synopsys"
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    dot={{ fill: "#8B5CF6", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Synopsys"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl">
          <CardHeader className="border-b border-gray-700/50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-white text-xl font-semibold tracking-tight">
                  Denied License Requests
                </CardTitle>
                <CardDescription className="text-gray-400 text-sm mt-1">
                  Features and vendors with license denial counts
                </CardDescription>
              </div>
              {tableData.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <Select
                    value={selectedVendor}
                    onValueChange={setSelectedVendor}
                  >
                    <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white hover:bg-gray-700 transition-colors">
                      <SelectValue placeholder="Filter by vendor" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {vendors.map((vendor) => (
                        <SelectItem
                          key={vendor}
                          value={vendor}
                          className="text-white hover:bg-gray-700 focus:bg-gray-700"
                        >
                          {vendor === "all"
                            ? "All Vendors"
                            : vendor.charAt(0).toUpperCase() + vendor.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {filteredData.length === 0 ? (
              <div className="text-center py-12">
                <XCircle className="w-16 h-16 text-green-400 mx-auto mb-4 opacity-50" />
                <div className="text-gray-400 text-lg font-medium">
                  No denials found for today
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  All license requests were successful!
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-800 overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-800/95 backdrop-blur-sm z-10">
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                          Feature
                        </th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                          Vendor
                        </th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                          Denials
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-white">
                            {row.feature}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={`font-medium ${row.vendor === "cadence"
                                  ? "text-green-400 border-green-400/30 bg-green-400/5"
                                  : row.vendor === "altair"
                                    ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/5"
                                    : "text-purple-400 border-purple-400/30 bg-purple-400/5"
                                }`}
                            >
                              {row.vendor}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="secondary"
                              className="bg-red-500/10 text-red-400 border border-red-500/30 font-semibold inline-flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" />
                              {row.denied}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DenialPage;
