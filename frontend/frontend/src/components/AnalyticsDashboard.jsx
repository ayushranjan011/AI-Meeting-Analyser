import React from "react";
import {
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const EMOTION_COLORS = {
  happy: "#16a34a",
  neutral: "#64748b",
  sad: "#2563eb",
  angry: "#dc2626",
  surprise: "#d97706",
  fear: "#7c3aed",
  disgust: "#059669",
};

function formatTimeLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function AnalyticsDashboard({ analytics }) {
  const distribution = analytics?.distribution || [];
  const timeline = analytics?.timeline || [];
  const hasDistribution = distribution.some((item) => item.count > 0);

  const pieData = hasDistribution
    ? distribution.filter((item) => item.count > 0)
    : [{ emotion: "neutral", count: 1, percentage: 100 }];

  return (
    <section className="panel analytics-panel">
      <div className="panel-header">
        <h2>Emotion Analytics Dashboard</h2>
      </div>
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Emotion Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="count" nameKey="emotion" outerRadius={88} label={(entry) => `${entry.emotion}: ${entry.percentage}%`}>
                {pieData.map((entry) => (
                  <Cell
                    key={entry.emotion}
                    fill={EMOTION_COLORS[entry.emotion] || "#94a3b8"}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Emotion Timeline (%)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ts" tickFormatter={formatTimeLabel} />
              <YAxis domain={[0, 100]} />
              <Tooltip labelFormatter={formatTimeLabel} />
              <Legend />
              <Line type="monotone" dataKey="happy" stroke={EMOTION_COLORS.happy} dot={false} />
              <Line type="monotone" dataKey="neutral" stroke={EMOTION_COLORS.neutral} dot={false} />
              <Line type="monotone" dataKey="sad" stroke={EMOTION_COLORS.sad} dot={false} />
              <Line type="monotone" dataKey="angry" stroke={EMOTION_COLORS.angry} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

export default AnalyticsDashboard;
