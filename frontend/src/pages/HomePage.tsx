import Navbar from "@/components/Navbar";
import { BarChartShad } from "@/components/BarChartShad";
import { useEffect, useState } from "react";
import type { BarChartHomePageProps, PieChartHomePageProps } from "@/lib/types";
import { PieChartShad } from "@/components/PieChartShad";
import { SummaryCard } from "@/components/SummaryCard";
import SubsciptionsPage from "./SubscriptionsPage";
const HomePage = () => {
  const [dashboardData, setDashboardData] = useState<BarChartHomePageProps[]>(
    [],
  );
  const [pieData, setPieData] = useState<PieChartHomePageProps[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:3000/services/getDailyActiveCountsLast30Days")
      .then((res) => res.json())
      .then((data) => {
        const temp = data.map((d: any) => ({
          ...d,
          active_count: Math.abs(Number(d.active_count)),
        }));
        setDashboardData(temp);
      })
      .catch((err) => console.error("Error fetching data(Barchart):", err));

    fetch("http://localhost:3000/services/getActiveVendors")
      .then((res) => res.json())
      .then((data) => {
        const temp = data.map((d: any) => {
          return {
            ...d,
            active_count: Math.abs(Number(d.active_count)),
          };
        });
        setPieData(temp);
      })
      .catch((err) => console.error("Error fetching data(Piechart):", err));

    fetch("http://localhost:3000/services/getSummaryHomePage")
      .then((res) => res.json())
      .then((data) => {
        setSummaryData(data);
      })
      .catch((err) => console.error("Error fetching summary data:", err));
  }, []);

  return (
    <>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950">
        <div className="flex-1 p-6 overflow-auto">
          <div className="h-[450px] bg-gray-900 rounded-lg shadow-lg border border-gray-800 mb-6">
            <BarChartShad data={dashboardData} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-800 p-6">
              <PieChartShad data={pieData} />
            </div>
            <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-800 p-6">
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
                  />
                  <SummaryCard
                    title="Available Licenses"
                    value={summaryData.licenses.available}
                    subtitle={`${summaryData.licenses.used} / ${summaryData.licenses.total} used`}
                    color="blue"
                  />
                </div>
              ) : (
                <p className="text-gray-400 text-center">Loading summary...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
