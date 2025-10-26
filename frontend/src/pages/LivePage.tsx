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
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { Activity, Users, Database, TrendingUp, Filter } from "lucide-react";
import dayjs from "dayjs";
const LivePage = () => {
  const [selectedVendor, setSelectedVendor] = useState("all");
  const [hourlyData, setHourlyData] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLiveData();
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

      const transformedHourly = data.hourlyData.map((hour) => ({
        time: hour.time,
        cadence: Number(hour.vendorCounts.cadence) || 0,
        altair: Number(hour.vendorCounts.altair) || 0,
        synopsys: Number(hour.vendorCounts.synopsys) || 0,
        total: Object.values(hour.vendorCounts).reduce(
          (sum, count) => sum + Number(count),
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

  const vendors = ["all", ...new Set(features.map((f) => f.vendor))];

  // Calculate summary stats
  const totalActive = features.reduce((sum, f) => sum + Number(f.active), 0);
  const totalAvailable = features.reduce(
    (sum, f) => sum + Number(f.available),
    0,
  );
  const totalLicenses = features.reduce((sum, f) => sum + Number(f.total), 0);
  const uniqueUsers = new Set(features.flatMap((f) => f.users)).size;

  if (loading && hourlyData.length === 0) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-400 text-lg">Loading live data...</div>
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
            <Activity className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <div className="text-red-400 text-lg">Error: {error}</div>
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
        {/*           Active Licenses */}
        {/*         </CardTitle> */}
        {/*         <div className="p-2 rounded-lg bg-blue-500/10 transition-transform hover:scale-110"> */}
        {/*           <Activity className="w-4 h-4 text-blue-400" /> */}
        {/*         </div> */}
        {/*       </div> */}
        {/*     </CardHeader> */}
        {/*     <CardContent> */}
        {/*       <div className="text-3xl font-bold text-white">{totalActive}</div> */}
        {/*       <p className="text-xs text-gray-500 mt-1">Currently in use</p> */}
        {/*     </CardContent> */}
        {/*   </Card> */}
        {/**/}
        {/*   <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300"> */}
        {/*     <CardHeader className="pb-3"> */}
        {/*       <div className="flex items-center justify-between"> */}
        {/*         <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wide"> */}
        {/*           Available */}
        {/*         </CardTitle> */}
        {/*         <div className="p-2 rounded-lg bg-green-500/10 transition-transform hover:scale-110"> */}
        {/*           <Database className="w-4 h-4 text-green-400" /> */}
        {/*         </div> */}
        {/*       </div> */}
        {/*     </CardHeader> */}
        {/*     <CardContent> */}
        {/*       <div className="text-3xl font-bold text-white"> */}
        {/*         {totalAvailable} */}
        {/*       </div> */}
        {/*       <p className="text-xs text-gray-500 mt-1">Ready to allocate</p> */}
        {/*     </CardContent> */}
        {/*   </Card> */}
        {/**/}
        {/*   <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300"> */}
        {/*     <CardHeader className="pb-3"> */}
        {/*       <div className="flex items-center justify-between"> */}
        {/*         <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wide"> */}
        {/*           Total Licenses */}
        {/*         </CardTitle> */}
        {/*         <div className="p-2 rounded-lg bg-purple-500/10 transition-transform hover:scale-110"> */}
        {/*           <TrendingUp className="w-4 h-4 text-purple-400" /> */}
        {/*         </div> */}
        {/*       </div> */}
        {/*     </CardHeader> */}
        {/*     <CardContent> */}
        {/*       <div className="text-3xl font-bold text-white"> */}
        {/*         {totalLicenses} */}
        {/*       </div> */}
        {/*       <p className="text-xs text-gray-500 mt-1">Total capacity</p> */}
        {/*     </CardContent> */}
        {/*   </Card> */}
        {/**/}
        {/*   <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300"> */}
        {/*     <CardHeader className="pb-3"> */}
        {/*       <div className="flex items-center justify-between"> */}
        {/*         <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wide"> */}
        {/*           Active Users */}
        {/*         </CardTitle> */}
        {/*         <div className="p-2 rounded-lg bg-amber-500/10 transition-transform hover:scale-110"> */}
        {/*           <Users className="w-4 h-4 text-amber-400" /> */}
        {/*         </div> */}
        {/*       </div> */}
        {/*     </CardHeader> */}
        {/*     <CardContent> */}
        {/*       <div className="text-3xl font-bold text-white">{uniqueUsers}</div> */}
        {/*       <p className="text-xs text-gray-500 mt-1">Unique users</p> */}
        {/*     </CardContent> */}
        {/*   </Card> */}
        {/* </div> */}
        {/**/}
        {/* Chart */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl">
          <CardHeader className="border-b border-gray-700/50">
            <CardTitle className="text-white text-xl font-semibold tracking-tight">
              Feature Usage
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              Hourly active features count for {dayjs().format("MMMM D, YYYY")}{" "}
              across all vendors
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={380}>
              <LineChart
                data={hourlyData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="totalGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.3}
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
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
                  labelStyle={{ fontWeight: "600", color: "#60A5FA" }}
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
                  dataKey="total"
                  stroke="#60A5FA"
                  strokeWidth={3}
                  dot={{ fill: "#60A5FA", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="Total Features"
                />
                <Line
                  type="monotone"
                  dataKey="cadence"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={false}
                  name="Cadence"
                />
                <Line
                  type="monotone"
                  dataKey="altair"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={false}
                  name="Altair"
                />
                <Line
                  type="monotone"
                  dataKey="synopsys"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={false}
                  name="Synopsys"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl">
          <CardHeader className="border-b border-gray-700/50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-white text-xl font-semibold tracking-tight">
                  Current Feature Usage
                </CardTitle>
                <CardDescription className="text-gray-400 text-sm mt-1">
                  Feature allocation and active users per vendor
                </CardDescription>
              </div>
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
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {filteredData.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
                <div className="text-gray-400 text-lg font-medium">
                  No active features found
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  Try selecting a different vendor
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-800 overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
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
                          Active
                        </th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                          Total
                        </th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                          Available
                        </th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                          Users
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((row, idx) => (
                        <tr
                          key={idx}
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
                            <span className="text-blue-400 font-semibold">
                              {row.active}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-300 font-medium">
                            {row.total}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-semibold ${row.available > 0
                                  ? "text-green-400"
                                  : "text-red-400"
                                }`}
                            >
                              {row.available}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {row.users.slice(0, 3).map((user) => (
                                <Badge
                                  key={user}
                                  variant="secondary"
                                  className="bg-gray-700/50 text-gray-300 text-xs border border-gray-600"
                                >
                                  {user}
                                </Badge>
                              ))}
                              {row.users.length > 3 && (
                                <Badge
                                  variant="secondary"
                                  className="bg-gray-700/50 text-gray-300 text-xs border border-gray-600 font-semibold"
                                >
                                  +{row.users.length - 3}
                                </Badge>
                              )}
                            </div>
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

export default LivePage;
