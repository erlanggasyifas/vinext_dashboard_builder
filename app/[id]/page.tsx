"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase"; // Pastikan path ini benar sesuai proyekmu
import "gridstack/dist/gridstack.min.css";
import { GridStack } from "gridstack";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Link from "next/link";
import { useParams } from "next/navigation"; // TAMBAHAN PENTING DI SINI

// --- TYPE DEFINITIONS ---
interface DashboardWidget {
  id: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  type: string | null;
  title: string;
  value: string | number;
  variant: string;
  dataKey: string;
  chartColor: string;
  chartLayout: "horizontal" | "vertical";
  pieTheme: string;
  textAlign: "left" | "center" | "right";
}

// --- DATA MOCK ---
const DASHBOARD_DATA_JSON: Record<string, string | number> = {
  ROP: 4.5,
  WOB: 15.2,
  RPM: 120,
  Torque: 2100,
  "Flow Rate": 450,
  "Standpipe Pressure": 2800,
};

const dataChart = [
  { name: "Rig Alpha", utama: 4500, sekunder: 3000, target: 4000 },
  { name: "Rig Beta", utama: 3200, sekunder: 2800, target: 3500 },
  { name: "Rig Delta", utama: 2800, sekunder: 2100, target: 2500 },
  { name: "Rig Echo", utama: 3900, sekunder: 3500, target: 3800 },
  { name: "Rig Zeta", utama: 2100, sekunder: 1800, target: 2500 },
];

const dataPie = [
  { name: "Rig Alpha", value: 400 },
  { name: "Rig Beta", value: 300 },
  { name: "Rig Delta", value: 300 },
  { name: "Rig Echo", value: 200 },
];

const dataTable = [
  { id: "LOG-001", time: "10:00 AM", status: "Normal", operator: "Erlangga" },
  { id: "LOG-002", time: "11:30 AM", status: "Warning", operator: "Budi" },
  { id: "LOG-003", time: "01:15 PM", status: "Critical", operator: "Siti" },
];

const CHART_COLORS: Record<string, string> = {
  blue: "#3b82f6",
  emerald: "#10b981",
  orange: "#f97316",
  rose: "#e11d48",
};

const PIE_THEMES: Record<string, string[]> = {
  default: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
  cool: ["#6366f1", "#8b5cf6", "#d946ef", "#ec4899"],
  monochrome: ["#94a3b8", "#64748b", "#475569", "#334155"],
};

export default function SharedDashboardView() {
  // PENGGUNAAN USEPARAMS DI SINI
  const params = useParams();
  const dashboardId = params?.id as string;

  const gridRef = useRef<HTMLDivElement>(null);
  const gridInstance = useRef<GridStack | null>(null);

  // --- STATE ---
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  // --- 1. FETCH DATA DARI SUPABASE ---
  useEffect(() => {
    // Jika dashboardId belum terbaca, jangan lakukan fetch dulu
    if (!dashboardId) return;

    const fetchDashboard = async () => {
      // Mulai proses loading
      setIsLoading(true);

      const { data, error } = await supabase
        .from("dashboards")
        .select("config")
        .eq("id", dashboardId)
        .single();

      if (error || !data) {
        setIsNotFound(true);
      } else {
        setWidgets(data.config); // Mengisi state dengan data dari database
      }

      // Selesai proses loading
      setIsLoading(false);
    };

    fetchDashboard();
  }, [dashboardId]);

  // --- 2. INISIALISASI GRIDSTACK (HANYA JIKA LOADING SELESAI & DATA ADA) ---
  useEffect(() => {
    if (!isLoading && !isNotFound && !gridInstance.current && gridRef.current) {
      gridInstance.current = GridStack.init(
        {
          cellHeight: 80,
          margin: 16,
          minRow: 6,
          staticGrid: true, // KUNCI: Mematikan fungsi drag dan resize
        },
        gridRef.current,
      );
    }
  }, [isLoading, isNotFound]);

  // --- 3. MEMASUKKAN WIDGET KE GRIDSTACK ---
  useEffect(() => {
    if (!gridInstance.current || !gridRef.current) return;
    const uninitializedItems = gridRef.current.querySelectorAll(
      ".grid-stack-item:not(.gs-init)",
    );
    uninitializedItems.forEach((item) => {
      // TAMBAHKAN 'as HTMLElement' DI BARIS BAWAH INI:
      gridInstance.current?.makeWidget(item as HTMLElement);
      item.classList.add("gs-init");
    });
  }, [widgets]);

  // --- RENDERING KONTEN WIDGET ---
  const renderWidgetContent = (widget: DashboardWidget) => {
    if (widget.type === "stats") {
      return (
        <div className="flex h-full w-full items-center justify-center p-6">
          <div>
            <p className="text-slate-400 text-center text-lg font-bold uppercase tracking-widest mb-1">
              {widget.title}
            </p>
            <div className="flex items-baseline justify-center gap-1">
              <h2 className="text-5xl font-extrabold text-white tracking-tight">
                {widget.value}
              </h2>
            </div>
          </div>
        </div>
      );
    }

    if (widget.type === "text") {
      const alignContainerClass =
        widget.textAlign === "center"
          ? "items-center text-center"
          : widget.textAlign === "right"
            ? "items-end text-right"
            : "items-start text-left";
      const alignTextClass =
        widget.textAlign === "center"
          ? "text-center"
          : widget.textAlign === "right"
            ? "text-right"
            : "text-left";

      if (widget.variant === "header") {
        return (
          <div
            className={`flex h-full w-full justify-center p-6 ${alignContainerClass}`}
          >
            <h3
              className={`text-2xl font-bold text-slate-200 tracking-tight w-full ${alignTextClass}`}
            >
              {widget.title}
            </h3>
          </div>
        );
      } else {
        return (
          <div
            className={`flex flex-col h-full w-full p-6 justify-start ${alignContainerClass}`}
          >
            <h3
              className={`text-lg font-bold text-slate-200 mb-2 pb-2 border-b border-slate-700 w-full ${alignTextClass}`}
            >
              {widget.title}
            </h3>
            <div
              className={`text-slate-400 text-sm whitespace-pre-wrap flex-1 overflow-y-auto w-full custom-scrollbar ${alignTextClass}`}
            >
              {widget.value}
            </div>
          </div>
        );
      }
    }

    if (widget.type === "table") {
      return (
        <div className="flex flex-col h-full w-full p-5 pointer-events-none">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">
            {widget.title}
          </h3>
          <div className="flex-1 w-full overflow-y-auto pr-2 custom-scrollbar pointer-events-auto">
            <table className="w-full text-left text-sm text-slate-400 border-collapse">
              <thead className="sticky top-0 bg-slate-800 text-slate-300 z-10">
                <tr>
                  <th className="py-2 border-b border-slate-700 font-semibold">
                    ID
                  </th>
                  <th className="py-2 border-b border-slate-700 font-semibold">
                    Time
                  </th>
                  <th className="py-2 border-b border-slate-700 font-semibold">
                    Status
                  </th>
                  <th className="py-2 border-b border-slate-700 font-semibold">
                    Operator
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataTable.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-2 border-b border-slate-700/50">
                      {row.id}
                    </td>
                    <td className="py-2 border-b border-slate-700/50">
                      {row.time}
                    </td>
                    <td className="py-2 border-b border-slate-700/50">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${row.status === "Normal" ? "bg-emerald-500/10 text-emerald-400" : row.status === "Warning" ? "bg-orange-500/10 text-orange-400" : "bg-red-500/10 text-red-400"}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 border-b border-slate-700/50">
                      {row.operator}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (widget.type === "chart" || widget.type === "bar") {
      const activeColor = CHART_COLORS[widget.chartColor] || CHART_COLORS.blue;
      const isVertical = widget.chartLayout === "vertical";
      const xType = isVertical ? "number" : "category";
      const yType = isVertical ? "category" : "number";
      const xDataKey = isVertical ? undefined : "name";
      const yDataKey = isVertical ? "name" : undefined;
      const chartMargin = isVertical
        ? { top: 5, right: 20, left: 10, bottom: 5 }
        : { top: 5, right: 10, left: -20, bottom: 5 };

      return (
        <div className="flex flex-col h-full w-full p-5 pointer-events-none">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">
            {widget.title}
          </h3>
          <div className="flex-1 w-full min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              {widget.type === "chart" ? (
                <LineChart
                  layout={widget.chartLayout}
                  data={dataChart}
                  margin={chartMargin}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={isVertical}
                    vertical={!isVertical}
                    stroke="#334155"
                  />
                  <XAxis
                    type={xType}
                    dataKey={xDataKey}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    type={yType}
                    dataKey={yDataKey}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    stroke="#94a3b8"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "0.75rem",
                      padding: "10px",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.5)",
                    }}
                    itemStyle={{
                      color: "#e2e8f0",
                      textTransform: "capitalize",
                    }}
                    labelStyle={{ fontWeight: "bold", color: "#f8fafc" }}
                  />
                  <Line
                    type="monotone"
                    dataKey={widget.dataKey}
                    name={
                      widget.dataKey === "utama"
                        ? "Primary"
                        : widget.dataKey === "sekunder"
                          ? "Secondary"
                          : "Target"
                    }
                    stroke={activeColor}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: "#0f172a" }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: activeColor }}
                  />
                </LineChart>
              ) : (
                <BarChart
                  layout={widget.chartLayout}
                  data={dataChart}
                  margin={chartMargin}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={isVertical}
                    vertical={!isVertical}
                    stroke="#334155"
                  />
                  <XAxis
                    type={xType}
                    dataKey={xDataKey}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    type={yType}
                    dataKey={yDataKey}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    stroke="#94a3b8"
                  />
                  <Tooltip
                    cursor={{ fill: "#334155", opacity: 0.4 }}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "0.75rem",
                      padding: "10px",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.5)",
                    }}
                    itemStyle={{
                      color: "#e2e8f0",
                      textTransform: "capitalize",
                    }}
                    labelStyle={{ fontWeight: "bold", color: "#f8fafc" }}
                  />
                  <Bar
                    dataKey={widget.dataKey}
                    name={
                      widget.dataKey === "utama"
                        ? "Primary"
                        : widget.dataKey === "sekunder"
                          ? "Secondary"
                          : "Target"
                    }
                    fill={activeColor}
                    radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (widget.type === "pie") {
      const activeTheme = PIE_THEMES[widget.pieTheme] || PIE_THEMES.default;
      return (
        <div className="flex flex-col h-full w-full p-5 pointer-events-none">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">
            {widget.title}
          </h3>
          <div className="flex-1 w-full min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {dataPie.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={activeTheme[index % activeTheme.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "0.75rem",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.5)",
                  }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    return null;
  };

  // --- TAMPILAN JIKA SEDANG LOADING ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium tracking-wide animate-pulse">
          Loading Dashboard Data...
        </p>
      </div>
    );
  }

  // --- TAMPILAN JIKA DATA TIDAK ADA DI DATABASE ---
  if (isNotFound) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-200 p-6">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
          Dashboard Not Found
        </h1>
        <p className="text-slate-400 mb-8 text-center max-w-md leading-relaxed">
          We couldn't find a dashboard with ID:{" "}
          <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded ml-1">
            {dashboardId}
          </code>
          . The link might be broken or the dashboard has been deleted.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
        >
          Create New Dashboard
        </Link>
      </div>
    );
  }

  // --- TAMPILAN JIKA BERHASIL (SAMA PERSIS DENGAN BUILDER) ---
  return (
    <div className="min-h-screen p-8 bg-slate-900 flex flex-col gap-8 font-sans">
      {/* HEADER VIEW MODE */}
      <div className="w-full bg-slate-800 border border-slate-700 p-5 rounded-3xl shadow-lg flex items-center justify-between z-20">
        <div>
          <h1 className="font-extrabold text-white text-xl tracking-tight">
            Shared Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            View Only Mode • ID: {dashboardId}
          </p>
        </div>
        <Link
          href="/"
          className="px-5 py-2.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 rounded-xl font-semibold text-sm transition-all"
        >
          Build Your Own
        </Link>
      </div>

      {/* CANVAS GRIDSTACK (BACKGROUND DOTTED SAMA DENGAN BUILDER) */}
      <div className="bg-dotted-grid rounded-3xl min-h-[750px] p-5 relative overflow-hidden shadow-inner">
        <div className="grid-stack" ref={gridRef}>
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className="grid-stack-item"
              gs-id={widget.id}
              gs-x={widget.x}
              gs-y={widget.y}
              gs-w={widget.w}
              gs-h={widget.h}
            >
              <div className="grid-stack-item-content bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
                <div className="w-full h-full">
                  {renderWidgetContent(widget)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
