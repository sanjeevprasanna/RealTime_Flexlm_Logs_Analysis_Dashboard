export type BarChartHomePage = {
  date: string;
  active_count: number;
};

export type BarChartHomePageProps = {
  data: BarChartHomePage[];
};

export type PieChartHomePage = {
  daemon: string;
  active_count: number;
};

export type PieChartHomePageProps = {
  data: PieChartHomePage[];
};
