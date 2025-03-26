import { useState, useEffect } from "react";
import { getAgentData } from "../lib/get-agent-data";

export type AgentData = {
  balance: bigint;
};

export function useAgentData() {
  const [data, setData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getAgentData();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch agent data"));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up interval to refetch data every 5 seconds
    const intervalId = setInterval(() => {
      fetchData();
    }, 10000);

    // Clean up interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    loading,
    error,
    refetch
  };
}
