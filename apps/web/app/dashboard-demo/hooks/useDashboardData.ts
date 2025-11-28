"use client";

import { useState, useEffect } from "react";
import { mockDashboardData, type DashboardData } from "../data/mockData";

/**
 * Hook for fetching dashboard data
 * In production, this would fetch from an API
 */
export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // In production, replace with actual API call
      const fetchedData = mockDashboardData();
      setData(fetchedData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch data"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    fetchData();
  };

  return { data, isLoading, error, refresh };
}

