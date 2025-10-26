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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Clock, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";

const WaitPage = () => {
  const [hourlyData, setHourlyData] = useState([]);
  const [waitQueue, setWaitQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWaitData();
    const interval = setInterval(fetchWaitData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchWaitData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:3000/services/getWaitPageData",
      );
      if (!response.ok) throw new Error("Failed to fetch wait data");

      const data = await response.json();
      setHourlyData(data.hourlyData || []);
      setWaitQueue(data.waitQueue || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching wait data:", err);
      setError(err.message);
      setHourlyData([]);
      setWaitQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const date = new Date();
  const totalWaiting = waitQueue.filter((q) => q.status === "Waiting").length;
  const totalGranted = waitQueue.filter(
    (q) => q.status === "GIVEN FEATURE",
  ).length;
  const peakDenials = Math.max(...hourlyData.map((h) => h.waitCount || 0), 0);

  if (loading && hourlyData.length === 0) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-400 text-lg">Loading wait data...</div>
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
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <div className="text-red-400 text-lg">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  const maxValue = peakDenials;
  const roundedMax = Math.ceil(maxValue / 10) * 10; // round up to nearest 10

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950">
      <div className="flex-1 p-6 overflow-auto">
        {/* Summary Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"> */}
        {/*   <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300"> */}
        {/*     <CardHeader className="pb-3"> */}
        {/*       <div className="flex items-center justify-between"> */}
        {/*         <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wide"> */}
        {/*           Currently Waiting */}
        {/*         </CardTitle> */}
        {/*         <div className="p-2 rounded-lg bg-amber-500/10 transition-transform hover:scale-110"> */}
        {/*           <Clock className="w-4 h-4 text-amber-400" /> */}
        {/*         </div> */}
        {/*       </div> */}
        {/*     </CardHeader> */}
        {/*     <CardContent> */}
        {/*       <div className="text-3xl font-bold text-white"> */}
        {/*         {totalWaiting} */}
        {/*       </div> */}
        {/*       <p className="text-xs text-gray-500 mt-1"> */}
        {/*         Active queue requests */}
        {/*       </p> */}
        {/*     </CardContent> */}
        {/*   </Card> */}
        {/**/}
        {/*   <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300"> */}
        {/*     <CardHeader className="pb-3"> */}
        {/*       <div className="flex items-center justify-between"> */}
        {/*         <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wide"> */}
        {/*           Granted Today */}
        {/*         </CardTitle> */}
        {/*         <div className="p-2 rounded-lg bg-green-500/10 transition-transform hover:scale-110"> */}
        {/*           <CheckCircle className="w-4 h-4 text-green-400" /> */}
        {/*         </div> */}
        {/*       </div> */}
        {/*     </CardHeader> */}
        {/*     <CardContent> */}
        {/*       <div className="text-3xl font-bold text-white"> */}
        {/*         {totalGranted} */}
        {/*       </div> */}
        {/*       <p className="text-xs text-gray-500 mt-1"> */}
        {/*         Successfully allocated */}
        {/*       </p> */}
        {/*     </CardContent> */}
        {/*   </Card> */}
        {/**/}
        {/*   <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300"> */}
        {/*     <CardHeader className="pb-3"> */}
        {/*       <div className="flex items-center justify-between"> */}
        {/*         <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wide"> */}
        {/*           Peak Denials */}
        {/*         </CardTitle> */}
        {/*         <div className="p-2 rounded-lg bg-red-500/10 transition-transform hover:scale-110"> */}
        {/*           <TrendingUp className="w-4 h-4 text-red-400" /> */}
        {/*         </div> */}
        {/*       </div> */}
        {/*     </CardHeader> */}
        {/*     <CardContent> */}
        {/*       <div className="text-3xl font-bold text-white">{peakDenials}</div> */}
        {/*       <p className="text-xs text-gray-500 mt-1"> */}
        {/*         Maximum hourly denials */}
        {/*       </p> */}
        {/*     </CardContent> */}
        {/*   </Card> */}
        {/* </div> */}
        {/**/}
        {/* Chart */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl mb-6">
          <CardHeader className="border-b border-gray-700/50">
            <CardTitle className="text-white text-xl font-semibold tracking-tight">
              Wait Queue - {date.getDate()}/{date.getMonth() + 1}/
              {date.getFullYear()}
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              Hourly number of license Queued
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={380}>
              <AreaChart
                data={hourlyData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorWait" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
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
                  domain={[0, roundedMax]}
                  allowDataOverflow={true}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  labelStyle={{ color: "#F59E0B", fontWeight: "600" }}
                  cursor={{
                    stroke: "#F59E0B",
                    strokeWidth: 1,
                    strokeDasharray: "5 5",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="waitCount"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  fill="url(#colorWait)"
                  name="Denial Count"
                  dot={{ fill: "#F59E0B", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl">
          <CardHeader className="border-b border-gray-700/50">
            <CardTitle className="text-white text-xl font-semibold tracking-tight">
              Current Wait Queue
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              Users who have been queued or granted licenses today
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {waitQueue.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 opacity-50" />
                <div className="text-gray-400 text-lg font-medium">
                  No users currently waiting for licenses
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  All requests have been fulfilled
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-800/50">
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                        Feature
                      </th>
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                        Vendor
                      </th>
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                        User
                      </th>
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                        Duration
                      </th>
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                        Requests
                      </th>
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitQueue.map((row, i) => (
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
                            className={`border-gray-700 font-medium ${row.vendor === "cadence"
                                ? "text-green-400 border-green-400/30 bg-green-400/5"
                                : row.vendor === "altair"
                                  ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/5"
                                  : "text-purple-400 border-purple-400/30 bg-purple-400/5"
                              }`}
                          >
                            {row.vendor}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-300 font-medium">
                          {row.user}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {row.duration}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="secondary"
                            className="bg-gray-700/50 text-gray-300 border border-gray-600 font-semibold"
                          >
                            {row.denialCount}x
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={`font-semibold inline-flex items-center gap-1 ${row.status === "GIVEN FEATURE"
                                ? "border-green-400/40 text-green-400 bg-green-400/10"
                                : "border-amber-400/40 text-amber-400 bg-amber-400/10"
                              }`}
                          >
                            {row.status === "GIVEN FEATURE" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {row.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WaitPage;
