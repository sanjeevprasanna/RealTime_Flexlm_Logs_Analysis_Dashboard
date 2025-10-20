import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: number | string;
  trend?: string;
  subtitle?: string;
  color?: "green" | "red" | "blue" | "yellow";
  isUp?: boolean;
}

export const SummaryCard = ({
  title,
  value,
  trend,
  subtitle,
  color = "blue",
  isUp = true,
}: SummaryCardProps) => {
  const colorMap: Record<string, string> = {
    green: "text-green-500",
    red: "text-red-500",
    blue: "text-blue-500",
    yellow: "text-yellow-500",
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-200 bg-gray-800 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-gray-400">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-white">{value}</span>
            {trend && (
              <div className={`flex items-center gap-1 ${colorMap[color]}`}>
                {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="text-xs font-semibold">{trend}</span>
              </div>
            )}
          </div>
          {subtitle && (
            <span className="text-xs text-gray-500">{subtitle}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
