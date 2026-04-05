"use client";

import React, { useEffect, useRef, useState } from "react";
import "gridstack/dist/gridstack.min.css";
import { supabase } from "@/lib/supabase";
import { GridStack, GridStackWidget } from "gridstack";
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

interface EditModalState extends Omit<
  DashboardWidget,
  "id" | "x" | "y" | "w" | "h"
> {
  visible: boolean;
  widgetId: string | null;
}

// --- SUMBER DATA JSON (MOCK DATA) ---
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
  { id: "LOG-004", time: "03:00 PM", status: "Normal", operator: "Erlangga" },
  { id: "LOG-005", time: "04:45 PM", status: "Normal", operator: "Joko" },
  { id: "LOG-006", time: "06:10 PM", status: "Warning", operator: "Siti" },
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

export default function InteractiveDashboard() {
  // PENTING: Tambahkan tipe untuk useRef
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInstance = useRef<GridStack | null>(null);

  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    widgetId: null as string | null,
  });

  const [editModal, setEditModal] = useState<EditModalState>({
    visible: false,
    widgetId: null,
    type: "",
    title: "",
    value: "",
    variant: "default",
    dataKey: "utama",
    chartColor: "blue",
    chartLayout: "horizontal",
    pieTheme: "default",
    textAlign: "left",
  });

  const [shareModal, setShareModal] = useState({
    visible: false,
    link: "",
  });

  useEffect(() => {
    // PENTING: Pengecekan agar gridRef.current tidak bernilai null
    if (!gridInstance.current && gridRef.current) {
      gridInstance.current = GridStack.init(
        {
          cellHeight: 80,
          margin: 16,
          minRow: 6,
          float: true,
          acceptWidgets: true,
          resizable: { handles: "se, sw, ne, nw" },
        },
        gridRef.current,
      );

      gridInstance.current.on(
        "dropped",
        (event: Event, previousWidget: any, newWidget: any) => {
          if (!newWidget.el) return;

          const widgetType = newWidget.el.getAttribute("data-type");
          gridInstance.current?.removeWidget(newWidget.el);

          const defaultKey = Object.keys(DASHBOARD_DATA_JSON)[0];
          let defaultTitle = "";
          let defaultValue: string | number = "";
          let defaultVariant = "default";
          let defaultDataKey = "utama";
          let defaultChartColor = "blue";
          let defaultPieTheme = "default";
          let defaultChartLayout: "horizontal" | "vertical" = "horizontal";
          let defaultTextAlign: "left" | "center" | "right" = "left";

          if (widgetType === "stats") {
            defaultTitle = defaultKey;
            defaultValue = DASHBOARD_DATA_JSON[defaultKey];
          } else if (widgetType === "chart") {
            defaultTitle = "Production Trend (Line)";
          } else if (widgetType === "bar") {
            defaultTitle = "Production per Rig (Bar)";
            defaultChartColor = "emerald";
          } else if (widgetType === "pie") {
            defaultTitle = "Area Distribution";
          } else if (widgetType === "table") {
            defaultTitle = "Operational Log";
          } else if (widgetType === "text") {
            defaultTitle = "Note Title";
            defaultValue = "Type note content here...";
            defaultVariant = "note";
          }

          setWidgets((prev) => [
            ...prev,
            {
              id: `widget-${Date.now()}`,
              x: newWidget.x,
              y: newWidget.y,
              w: newWidget.w || 3,
              h: newWidget.h || 2,
              type: widgetType,
              title: defaultTitle,
              value: defaultValue,
              variant: defaultVariant,
              dataKey: defaultDataKey,
              chartColor: defaultChartColor,
              chartLayout: defaultChartLayout,
              pieTheme: defaultPieTheme,
              textAlign: defaultTextAlign,
            },
          ]);
        },
      );
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      GridStack.setupDragIn(".drag-sidebar-item", {
        appendTo: "body",
        helper: "clone",
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!gridInstance.current || !gridRef.current) return;
    const uninitializedItems = gridRef.current.querySelectorAll(
      ".grid-stack-item:not(.gs-init)",
    );
    uninitializedItems.forEach((item) => {
      // PENTING: as HTMLElement agar TypeScript tidak protes
      gridInstance.current?.makeWidget(item as HTMLElement);
      item.classList.add("gs-init");
    });
  }, [widgets]);

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.pageX + 4,
      y: e.pageY + 4,
      widgetId: id,
    });
  };

  useEffect(() => {
    const closeContextMenu = () =>
      setContextMenu((prev) => ({ ...prev, visible: false }));
    document.addEventListener("click", closeContextMenu);
    return () => document.removeEventListener("click", closeContextMenu);
  }, []);

  const handleDelete = () => {
    setWidgets((prev) => prev.filter((w) => w.id !== contextMenu.widgetId));
    setContextMenu({ visible: false, x: 0, y: 0, widgetId: null });
  };

  const openEditModal = () => {
    const targetWidget = widgets.find((w) => w.id === contextMenu.widgetId);
    if (targetWidget) {
      setEditModal({
        visible: true,
        widgetId: targetWidget.id,
        type: targetWidget.type || "",
        title: targetWidget.title,
        value: String(targetWidget.value),
        variant: targetWidget.variant,
        dataKey: targetWidget.dataKey,
        chartColor: targetWidget.chartColor,
        chartLayout: targetWidget.chartLayout,
        pieTheme: targetWidget.pieTheme,
        textAlign: targetWidget.textAlign,
      });
    }
    setContextMenu({ visible: false, x: 0, y: 0, widgetId: null });
  };

  const saveEdit = () => {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === editModal.widgetId
          ? {
              ...w,
              title: editModal.title,
              value: editModal.value,
              variant: editModal.variant,
              dataKey: editModal.dataKey,
              chartColor: editModal.chartColor,
              chartLayout: editModal.chartLayout,
              pieTheme: editModal.pieTheme,
              textAlign: editModal.textAlign,
            }
          : w,
      ),
    );
    setEditModal({
      visible: false,
      widgetId: null,
      type: "",
      title: "",
      value: "",
      variant: "default",
      dataKey: "utama",
      chartColor: "blue",
      chartLayout: "horizontal",
      pieTheme: "default",
      textAlign: "left",
    });
  };

  const handleShare = async () => {
    let currentWidgets = [...widgets];
    if (gridInstance.current) {
      const gridNodes = gridInstance.current.save() as GridStackWidget[];
      currentWidgets = currentWidgets.map((w) => {
        const nodeInfo = gridNodes.find((n) => String(n.id) === String(w.id));
        if (nodeInfo) {
          return {
            ...w,
            x: nodeInfo.x,
            y: nodeInfo.y,
            w: nodeInfo.w,
            h: nodeInfo.h,
          };
        }
        return w;
      });
      setWidgets(currentWidgets);
    }

    const uniqueId = "v_" + Math.random().toString(36).substring(2, 11);

    const { error } = await supabase
      .from("dashboards")
      .insert([{ id: uniqueId, config: currentWidgets }]);

    if (error) {
      console.error("Error dari Supabase:", error.message, error.details);
      alert(`Gagal: ${error.message}`);
      return;
    }

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    setShareModal({ visible: true, link: `${baseUrl}/${uniqueId}` });
  };

  const renderWidgetContent = (widget: DashboardWidget) => {
    if (widget.type === "stats") {
      return (
        <div className="flex h-full w-full items-center justify-center p-6 cursor-move drag-handle">
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
            className={`flex h-full w-full justify-center p-6 cursor-move drag-handle ${alignContainerClass}`}
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
            className={`flex flex-col h-full w-full p-6 justify-start cursor-move drag-handle ${alignContainerClass}`}
          >
            <h3
              className={`text-lg font-bold text-slate-200 mb-2 pb-2 border-b border-slate-700 w-full ${alignTextClass}`}
            >
              {widget.title}
            </h3>
            <div
              className={`text-slate-400 text-sm whitespace-pre-wrap flex-1 overflow-y-auto w-full ${alignTextClass}`}
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
          <div className="w-full flex justify-center mb-3 pointer-events-auto cursor-move drag-handle opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-1.5 bg-slate-600 hover:bg-slate-500 rounded-full transition-colors"></div>
          </div>
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
          <div className="w-full flex justify-center mb-3 pointer-events-auto cursor-move drag-handle opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-1.5 bg-slate-600 hover:bg-slate-500 rounded-full transition-colors"></div>
          </div>
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
          <div className="w-full flex justify-center mb-3 pointer-events-auto cursor-move drag-handle opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-1.5 bg-slate-600 hover:bg-slate-500 rounded-full transition-colors"></div>
          </div>
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

  return (
    <div className="min-h-screen p-8 bg-slate-900 flex flex-col gap-8 font-sans">
      {/* HEADER TOOLBAR (DARK) */}
      <div className="w-full bg-slate-800 border border-slate-700 p-5 rounded-3xl shadow-lg flex items-center justify-between z-20">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="font-extrabold text-white text-xl tracking-tight">
              ViNext Dashboard Builder
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Drag components to the canvas, right click to customize
            </p>
          </div>
        </div>

        <div className="flex items-center border-l border-slate-700 pl-6 overflow-x-auto scrollbar-hide py-2">
          {/* TOMBOL SHARE DI SEBELAH KIRI (HANYA IKON) */}
          <button
            onClick={handleShare}
            title="Share Dashboard"
            className="shrink-0 flex items-center justify-center w-10 h-10 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 rounded-xl transition-all mr-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </button>

          <div className="flex gap-4">
            <div
              className="drag-sidebar-item grid-stack-item cursor-grab active:cursor-grabbing shrink-0"
              gs-w="3"
              gs-h="2"
              data-type="stats"
            >
              <div className="grid-stack-item-content flex items-center gap-3 bg-slate-800 border border-slate-600 px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-all shadow-sm select-none">
                <span className="text-sm font-semibold text-slate-200 pointer-events-none">
                  Stats
                </span>
              </div>
            </div>

            <div
              className="drag-sidebar-item grid-stack-item cursor-grab active:cursor-grabbing shrink-0"
              gs-w="3"
              gs-h="3"
              data-type="text"
            >
              <div className="grid-stack-item-content flex items-center gap-3 bg-slate-800 border border-slate-600 px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-all shadow-sm select-none">
                <span className="text-sm font-semibold text-slate-200 pointer-events-none">
                  Text Note
                </span>
              </div>
            </div>

            <div
              className="drag-sidebar-item grid-stack-item cursor-grab active:cursor-grabbing shrink-0"
              gs-w="6"
              gs-h="5"
              data-type="table"
            >
              <div className="grid-stack-item-content flex items-center gap-3 bg-slate-800 border border-slate-600 px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-all shadow-sm select-none">
                <span className="text-sm font-semibold text-slate-200 pointer-events-none">
                  Table Data
                </span>
              </div>
            </div>

            <div
              className="drag-sidebar-item grid-stack-item cursor-grab active:cursor-grabbing shrink-0"
              gs-w="5"
              gs-h="4"
              data-type="chart"
            >
              <div className="grid-stack-item-content flex items-center gap-3 bg-slate-800 border border-slate-600 px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-all shadow-sm select-none">
                <span className="text-sm font-semibold text-slate-200 pointer-events-none">
                  Line Chart
                </span>
              </div>
            </div>

            <div
              className="drag-sidebar-item grid-stack-item cursor-grab active:cursor-grabbing shrink-0"
              gs-w="5"
              gs-h="4"
              data-type="bar"
            >
              <div className="grid-stack-item-content flex items-center gap-3 bg-slate-800 border border-slate-600 px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-all shadow-sm select-none">
                <span className="text-sm font-semibold text-slate-200 pointer-events-none">
                  Bar Chart
                </span>
              </div>
            </div>

            <div
              className="drag-sidebar-item grid-stack-item cursor-grab active:cursor-grabbing shrink-0"
              gs-w="4"
              gs-h="5"
              data-type="pie"
            >
              <div className="grid-stack-item-content flex items-center gap-3 bg-slate-800 border border-slate-600 px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-all shadow-sm select-none">
                <span className="text-sm font-semibold text-slate-200 pointer-events-none">
                  Pie Chart
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CANVAS */}
      <div className="bg-dotted-grid rounded-3xl min-h-[750px] p-5 relative overflow-hidden shadow-inner">
        <div className="grid-stack" ref={gridRef}>
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className="grid-stack-item group"
              gs-id={widget.id}
              gs-x={widget.x}
              gs-y={widget.y}
              gs-w={widget.w}
              gs-h={widget.h}
            >
              <div
                className="grid-stack-item-content relative cursor-context-menu overflow-hidden"
                onContextMenu={(e) => handleContextMenu(e, widget.id)}
              >
                <div className="w-full h-full pointer-events-none">
                  {renderWidgetContent(widget)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONTEXT MENU */}
      {contextMenu.visible && (
        <div
          className="fixed bg-slate-800/95 backdrop-blur-xl border border-slate-700 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] rounded-2xl p-1.5 z-[9999] flex flex-col"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={openEditModal}
            className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl font-medium transition-colors"
          >
            Edit Settings
          </button>
          <div className="h-px bg-slate-700/60 my-1 mx-2"></div>
          <button
            onClick={handleDelete}
            className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl font-medium transition-colors"
          >
            Delete Widget
          </button>
        </div>
      )}

      {/* MODAL EDIT & KUSTOMISASI CHART */}
      {editModal.visible && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-[24px] shadow-2xl border border-slate-700 w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Widget Configuration
                </h2>
              </div>
              <button
                onClick={() => setEditModal({ ...editModal, visible: false })}
                className="text-slate-500 hover:text-slate-300 hover:bg-slate-800 p-2 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 bg-slate-900 flex flex-col gap-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {editModal.type !== "stats" && editModal.type !== "table" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Panel Title
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-800 border border-slate-700 text-white font-medium rounded-xl block p-3.5 focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all shadow-inner"
                    value={editModal.title}
                    onChange={(e) =>
                      setEditModal({ ...editModal, title: e.target.value })
                    }
                  />
                </div>
              )}

              {(editModal.type === "chart" || editModal.type === "bar") && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Orientation
                      </label>
                      <select
                        className="w-full bg-slate-800 border border-slate-700 text-white text-sm font-medium rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 block p-3.5 outline-none"
                        value={editModal.chartLayout}
                        onChange={(e) =>
                          setEditModal({
                            ...editModal,
                            chartLayout: e.target.value as
                              | "horizontal"
                              | "vertical",
                          })
                        }
                      >
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Vertical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Chart Color
                      </label>
                      <select
                        className="w-full bg-slate-800 border border-slate-700 text-white text-sm font-medium rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 block p-3.5 outline-none"
                        value={editModal.chartColor}
                        onChange={(e) =>
                          setEditModal({
                            ...editModal,
                            chartColor: e.target.value,
                          })
                        }
                      >
                        <option value="blue">Blue</option>
                        <option value="emerald">Emerald</option>
                        <option value="orange">Orange</option>
                        <option value="rose">Rose</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Select Data Source (Y-Axis)
                    </label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm font-medium rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 block p-3.5 outline-none"
                      value={editModal.dataKey}
                      onChange={(e) =>
                        setEditModal({ ...editModal, dataKey: e.target.value })
                      }
                    >
                      {editModal.type === "chart" ? (
                        <>
                          <option value="utama">Primary Metric Data</option>
                          <option value="sekunder">
                            Secondary Metric Data
                          </option>
                          <option value="target">Target Line</option>
                        </>
                      ) : (
                        <>
                          <option value="utama">
                            Output Data (Production)
                          </option>
                          <option value="target">Target Data</option>
                        </>
                      )}
                    </select>
                  </div>
                </>
              )}

              {editModal.type === "pie" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Color Theme
                  </label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm font-medium rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 block p-3.5 outline-none"
                    value={editModal.pieTheme}
                    onChange={(e) =>
                      setEditModal({ ...editModal, pieTheme: e.target.value })
                    }
                  >
                    <option value="default">Vibrant (Default)</option>
                    <option value="cool">Cool (Purple & Pink)</option>
                    <option value="monochrome">Monochrome (Slate)</option>
                  </select>
                </div>
              )}

              {editModal.type === "text" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Display Style
                      </label>
                      <select
                        className="w-full bg-slate-800 border border-slate-700 text-white text-sm font-medium rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 block p-3.5 outline-none"
                        value={editModal.variant}
                        onChange={(e) =>
                          setEditModal({
                            ...editModal,
                            variant: e.target.value,
                          })
                        }
                      >
                        <option value="note">Header & Text Body</option>
                        <option value="header">Header Only</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Text Alignment
                      </label>
                      <select
                        className="w-full bg-slate-800 border border-slate-700 text-white text-sm font-medium rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 block p-3.5 outline-none"
                        value={editModal.textAlign}
                        onChange={(e) =>
                          setEditModal({
                            ...editModal,
                            textAlign: e.target.value as
                              | "left"
                              | "center"
                              | "right",
                          })
                        }
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                  {editModal.variant === "note" && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Text Content / Description
                      </label>
                      <textarea
                        rows={4}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-300 font-medium rounded-xl block p-3.5 focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 outline-none resize-none shadow-inner"
                        value={editModal.value}
                        onChange={(e) =>
                          setEditModal({ ...editModal, value: e.target.value })
                        }
                      />
                    </div>
                  )}
                </>
              )}

              {editModal.type === "stats" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Select JSON Variable
                    </label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm font-medium rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 block p-3.5 outline-none"
                      value={editModal.title}
                      onChange={(e) =>
                        setEditModal({
                          ...editModal,
                          title: e.target.value,
                          value: DASHBOARD_DATA_JSON[e.target.value] || "",
                        })
                      }
                    >
                      {Object.keys(DASHBOARD_DATA_JSON).map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Output Value (Read-Only)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-400 font-mono text-lg font-bold rounded-xl block p-3.5 cursor-not-allowed shadow-inner"
                      value={editModal.value}
                      readOnly
                    />
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setEditModal({ ...editModal, visible: false })}
                className="px-5 py-2.5 text-sm font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL SHARE (DARK) --- */}
      {shareModal.visible && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-[24px] shadow-2xl border border-slate-700 w-full max-w-md overflow-hidden transform transition-all p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Share Link Created!
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Anyone with this link can view your dashboard.
            </p>

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2 rounded-xl mb-6 relative">
              <input
                type="text"
                value={shareModal.link}
                readOnly
                className="bg-transparent text-slate-300 w-full outline-none text-sm px-2 font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareModal.link);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                  isCopied
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 hover:bg-slate-700 text-white"
                }`}
              >
                {isCopied ? "Copied!" : "Copy"}
                {/* TOOLTIP COPIED */}
                <div
                  className={`absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white text-slate-900 text-xs font-bold rounded-lg transition-all duration-300 pointer-events-none whitespace-nowrap ${
                    isCopied
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2"
                  }`}
                >
                  Link copied!
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45"></div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShareModal({ visible: false, link: "" })}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
