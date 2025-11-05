import React from "react";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";
import { useDayState } from "../pages/HomePage";
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

const UserUsageTable = ({ title, users, icon: Icon, trend = "up" }) => {
  const gradientColors =
    trend === "up"
      ? "from-emerald-500/10 to-cyan-500/10"
      : "from-orange-500/10 to-red-500/10";

  const iconColor = trend === "up" ? "text-emerald-400" : "text-orange-400";

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl h-full flex flex-col">
      <CardHeader className="border-b border-gray-700/50 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-xl font-semibold tracking-tight flex items-center gap-2">
              {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
              {title}
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm mt-1">
              Total checkouts
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          <Table>
            <TableHeader className=" bg-gray-800/90 backdrop-blur-sm z-10">
              <TableRow className="border-gray-700 hover:bg-transparent">
                <TableHead className="text-gray-400 font-semibold w-12 text-center">
                  #
                </TableHead>
                <TableHead className="text-gray-400  font-semibold">
                  User
                </TableHead>
                <TableHead className="text-gray-400 font-semibold text-right">
                  Checkouts
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-8 text-gray-500"
                  >
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, index) => (
                  <TableRow
                    key={user.user}
                    className="border-gray-700/50 hover:bg-gray-800/40 transition-colors group"
                  >
                    <TableCell className="text-center text-gray-500 font-mono text-sm">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                      {user.user}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-gray-300 font-semibold text-lg">
                        {Number(user.cnt).toLocaleString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

const UserUsageTables = () => {
  const { topUsers, bottomUsers } = useDayState();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <UserUsageTable
        title="Most Active Users"
        users={topUsers}
        icon={TrendingUp}
        trend="up"
      />
      <UserUsageTable
        title="Least Active Users"
        users={bottomUsers}
        icon={TrendingDown}
        trend="down"
      />
    </div>
  );
};

export default UserUsageTables;
