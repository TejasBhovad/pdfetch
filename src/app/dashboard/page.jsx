"use client";

import { useEffect, useState } from "react";
import { useApiClient } from "@/utils/api";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get our API client hook
  const apiClientPromise = useApiClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const apiClient = await apiClientPromise;
        const response = await apiClient.getStats();

        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [apiClientPromise]);

  if (loading) {
    return <div className="flex justify-center p-8">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Documents"
          value={stats?.documentCount || 0}
          description="Total documents uploaded"
          icon="📄"
        />
        <StatCard
          title="Questions"
          value={stats?.questionCount || 0}
          description="Questions asked"
          icon="❓"
        />
        <StatCard
          title="Storage"
          value={`${stats?.totalStorageUsed || 0} ${
            stats?.storageUnit || "MB"
          }`}
          description="Storage used"
          icon="💾"
        />
      </div>

      <div className="flex gap-4">
        <Link
          href="/documents"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          View Documents
        </Link>
        <Link
          href="/upload"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Upload New Document
        </Link>
      </div>
    </div>
  );
}

function StatCard({ title, value, description, icon }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}
