/**
 * Mock data for dashboard demonstration
 */

export interface KPIData {
  revenue: {
    current: number;
    previous: number;
    change: number;
    trend: "up" | "down";
  };
  activeUsers: {
    current: number;
    previous: number;
    change: number;
    trend: "up" | "down";
  };
  conversionRate: {
    current: number;
    previous: number;
    change: number;
    trend: "up" | "down";
  };
  averageOrderValue: {
    current: number;
    previous: number;
    change: number;
    trend: "up" | "down";
  };
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  value?: number;
}

export interface DashboardData {
  kpis: KPIData;
  timeSeries: {
    revenue: TimeSeriesData[];
    users: TimeSeriesData[];
    conversions: TimeSeriesData[];
  };
  categories: CategoryData[];
  recentActivity: ActivityItem[];
}

/**
 * Generates mock dashboard data
 */
export function mockDashboardData(): DashboardData {
  // Generate time series data (last 30 days)
  const days = 30;
  const revenue: TimeSeriesData[] = [];
  const users: TimeSeriesData[] = [];
  const conversions: TimeSeriesData[] = [];

  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    revenue.push({
      date: dateStr,
      value: 50000 + Math.random() * 20000 + Math.sin(i / 5) * 10000,
    });

    users.push({
      date: dateStr,
      value: 1000 + Math.random() * 500 + Math.cos(i / 7) * 200,
    });

    conversions.push({
      date: dateStr,
      value: 50 + Math.random() * 30 + Math.sin(i / 3) * 15,
    });
  }

  // Calculate KPIs from time series
  const currentRevenue = revenue[revenue.length - 1].value;
  const previousRevenue = revenue[0].value;
  const revenueChange = ((currentRevenue - previousRevenue) / previousRevenue) * 100;

  const currentUsers = users[users.length - 1].value;
  const previousUsers = users[0].value;
  const usersChange = ((currentUsers - previousUsers) / previousUsers) * 100;

  return {
    kpis: {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        change: revenueChange,
        trend: revenueChange >= 0 ? "up" : "down",
      },
      activeUsers: {
        current: Math.round(currentUsers),
        previous: Math.round(previousUsers),
        change: usersChange,
        trend: usersChange >= 0 ? "up" : "down",
      },
      conversionRate: {
        current: 3.2,
        previous: 3.5,
        change: -8.6,
        trend: "down",
      },
      averageOrderValue: {
        current: 125.50,
        previous: 118.75,
        change: 5.7,
        trend: "up",
      },
    },
    timeSeries: {
      revenue,
      users,
      conversions,
    },
    categories: [
      { name: "Electronics", value: 45000, color: "#3b82f6" },
      { name: "Clothing", value: 32000, color: "#10b981" },
      { name: "Food", value: 28000, color: "#f59e0b" },
      { name: "Books", value: 15000, color: "#ef4444" },
      { name: "Other", value: 10000, color: "#8b5cf6" },
    ],
    recentActivity: [
      {
        id: "1",
        type: "order",
        description: "New order #12345",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        value: 125.50,
      },
      {
        id: "2",
        type: "user",
        description: "New user registered",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: "3",
        type: "order",
        description: "Order #12344 completed",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        value: 89.99,
      },
      {
        id: "4",
        type: "payment",
        description: "Payment processed",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        value: 250.00,
      },
    ],
  };
}

