"use client";

import React, { useEffect, useRef, useState } from "react";
import "gridstack/dist/gridstack.min.css";
import { GridStack } from "gridstack";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// --- SUMBER DATA JSON (MOCK DATA) ---
const DASHBOARD_DATA_JSON = {
  ROP: 4.5,
  WOB: 15.2,
  RPM: 120,
  Torque: 2100,
  "Flow Rate": 450,
  "Standpipe Pressure": 2800,
};

const dataPengunjung = [
  { name: "00:00", uv: 4 },
  { name: "04:00", uv: 3.5 },
  { name: "08:00", uv: 5 },
  { name: "12:00", uv: 4.5 },
  { name: "16:00", uv: 6 },
  { name: "20:00", uv: 4.2 },
  { name: "24:00", uv: 5.5 },
];

// --- ICONS (SVG) ---
const IconSettings = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);
const IconTrash = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);
const IconLink = () => (
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
    className="text-blue-400 bg-blue-500/20 p-1 rounded-md"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

export default function InteractiveDashboard() {
  const gridRef = useRef(null);
  const gridInstance = useRef(null);
  const [widgets, setWidgets] = useState([]);

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    widgetId: null,
  });

  const [editModal, setEditModal] = useState({
    visible: false,
    widgetId: null,
    type: "",
    title: "",
    value: "",
  });

  useEffect(() => {
    if (!gridInstance.current) {
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

      gridInstance.current.on("dropped", (event, previousWidget, newWidget) => {
        const widgetType = newWidget.el.getAttribute("data-type");
        gridInstance.current.removeWidget(newWidget.el);

        const defaultKey = Object.keys(DASHBOARD_DATA_JSON)[0];
        let defaultTitle = "";
        let defaultValue = "";

        // --- PENYESUAIAN DEFAULT SAAT DROP ---
        if (widgetType === "stats") {
          defaultTitle = defaultKey;
          defaultValue = DASHBOARD_DATA_JSON[defaultKey];
        } else if (widgetType === "chart") {
          defaultTitle = "Tren " + defaultKey;
        } else if (widgetType === "text") {
          defaultTitle = "Judul Catatan";
          defaultValue = "Ketik isi catatan di sini...";
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
          },
        ]);
      });
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
    if (!gridInstance.current) return;
    const uninitializedItems = gridRef.current.querySelectorAll(
      ".grid-stack-item:not(.gs-init)",
    );
    uninitializedItems.forEach((item) => {
      gridInstance.current.makeWidget(item);
      item.classList.add("gs-init");
    });
  }, [widgets]);

  const handleContextMenu = (e, id) => {
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
        type: targetWidget.type,
        title: targetWidget.title || "",
        value: targetWidget.value || "",
      });
    }
    setContextMenu({ visible: false, x: 0, y: 0, widgetId: null });
  };

  const saveEdit = () => {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === editModal.widgetId
          ? { ...w, title: editModal.title, value: editModal.value }
          : w,
      ),
    );
    setEditModal({
      visible: false,
      widgetId: null,
      type: "",
      title: "",
      value: "",
    });
  };

  // --- TAMBAHAN WARNA UNTUK WIDGET TEKS ---
  const getWidgetClass = (type) => {
    if (type === "stats") return "widget-orange";
    if (type === "chart") return "widget-blue";
    if (type === "text") return ""; // Teks kita buat tanpa aksen garis atas agar polos
    return "";
  };

  const renderWidgetContent = (widget) => {
    if (widget.type === "stats") {
      return (
        <div className="flex h-full w-full items-center justify-center items-start p-6">
          <div>
            <p className="text-slate-400 text-center text-lg font-bold uppercase tracking-widest mb-1">
              {widget.title}
            </p>
            <div className="flex items-baseline gap-1">
              <h2 className="text-5xl font-extrabold text-white tracking-tight">
                {widget.value}
              </h2>
            </div>
          </div>
        </div>
      );
    }

    // --- KOMPONEN BARU: TEXT / CATATAN ---
    if (widget.type === "text") {
      return (
        <div className="flex flex-col h-full w-full p-6 items-start justify-start cursor-move drag-handle">
          <h3 className="text-lg font-bold text-slate-200 mb-2 pb-2 border-b border-slate-700 w-full">
            {widget.title}
          </h3>
          <div className="text-slate-400 text-sm whitespace-pre-wrap flex-1 overflow-y-auto w-full">
            {widget.value}
          </div>
        </div>
      );
    }

    if (widget.type === "chart") {
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
              <LineChart
                layout="vertical"
                data={dataPengunjung}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  vertical={true}
                  stroke="#334155"
                />
                <XAxis
                  type="number"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  stroke="#94a3b8"
                />
                <YAxis
                  dataKey="name"
                  type="category"
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
                  itemStyle={{ color: "#e2e8f0" }}
                  labelStyle={{ fontWeight: "bold", color: "#f8fafc" }}
                />
                <Line
                  type="monotone"
                  dataKey="uv"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#0f172a" }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#60a5fa" }}
                />
              </LineChart>
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
        <div>
          <h1 className="font-extrabold text-white text-xl tracking-tight">
            Dashboard Builder
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tarik komponen ke canvas, klik kanan untuk edit/bind data
          </p>
        </div>
        <div className="flex gap-4 border-l border-slate-700 pl-6">
          <div
            className="drag-sidebar-item grid-stack-item cursor-grab active:cursor-grabbing"
            gs-w="3"
            gs-h="2"
            data-type="stats"
          >
            <div className="grid-stack-item-content flex items-center gap-3 bg-slate-800 border border-slate-600 px-5 py-2.5 rounded-xl hover:bg-slate-700 hover:border-slate-500 transition-all shadow-sm select-none">
              <span className="text-sm font-semibold text-slate-200 pointer-events-none">
                Simple Stats
              </span>
            </div>
          </div>

          <div
            className="drag-sidebar-item grid-stack-item cursor-grab active:cursor-grabbing"
            gs-w="2"
            gs-h="10"
            data-type="chart"
          >
            <div className="grid-stack-item-content flex items-center gap-3 bg-slate-800 border border-slate-600 px-5 py-2.5 rounded-xl hover:bg-slate-700 hover:border-slate-500 transition-all shadow-sm select-none">
              <span className="text-sm font-semibold text-slate-200 pointer-events-none">
                Line Chart
              </span>
            </div>
          </div>

          {/* --- TOMBOL BARU DI TOOLBAR UNTUK TEXT WIDGET --- */}
          <div
            className="drag-sidebar-item grid-stack-item cursor-grab active:cursor-grabbing"
            gs-w="3"
            gs-h="3"
            data-type="text"
          >
            <div className="grid-stack-item-content flex items-center gap-3 bg-slate-800 border border-slate-600 px-5 py-2.5 rounded-xl hover:bg-slate-700 hover:border-slate-500 transition-all shadow-sm select-none">
              <span className="text-sm font-semibold text-slate-200 pointer-events-none">
                Catatan Teks
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CANVAS (DARK) */}
      <div className="bg-dotted-grid rounded-3xl min-h-[750px] p-5 relative overflow-hidden shadow-inner">
        <div className="grid-stack" ref={gridRef}>
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className={`grid-stack-item group ${getWidgetClass(widget.type)}`}
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

      {/* CONTEXT MENU (DARK) */}
      {contextMenu.visible && (
        <div
          className="fixed bg-slate-800/95 backdrop-blur-xl border border-slate-700 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] rounded-2xl p-1.5 z-[9999] min-w-[200px] flex flex-col"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={openEditModal}
            className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl font-medium transition-colors flex items-center gap-3"
          >
            Edit Komponen
          </button>
          <div className="h-px bg-slate-700/60 my-1 mx-2"></div>
          <button
            onClick={handleDelete}
            className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl font-medium transition-colors flex items-center gap-3"
          >
            Hapus Widget
          </button>
        </div>
      )}

      {/* MODAL EDIT (DARK) */}
      {editModal.visible && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-[24px] shadow-2xl border border-slate-700 w-full max-w-md overflow-hidden transform transition-all">
            {/* Header Modal */}
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {editModal.type === "text" ? "Edit Catatan" : "Data Binding"}
                </h2>
              </div>
              <button
                onClick={() => setEditModal({ visible: false })}
                className="text-slate-500 hover:text-slate-300 hover:bg-slate-800 p-2 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 bg-slate-900">
              {/* --- KONDISI 1: JIKA WIDGET BUKAN TEXT (STATS/CHART) --- */}
              {editModal.type !== "text" && (
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Pilih Variabel dari JSON
                  </label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 text-white text-sm font-medium rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 block p-3.5 transition-all outline-none appearance-none cursor-pointer shadow-sm"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundPosition: `right 1rem center`,
                      backgroundRepeat: `no-repeat`,
                      backgroundSize: `1.2em 1.2em`,
                    }}
                    value={editModal.title}
                    onChange={(e) => {
                      const selectedKey = e.target.value;
                      setEditModal({
                        ...editModal,
                        title: selectedKey,
                        value: DASHBOARD_DATA_JSON[selectedKey] || "",
                      });
                    }}
                  >
                    <option value="" disabled className="text-slate-500">
                      -- Pilih Variabel --
                    </option>
                    {Object.keys(DASHBOARD_DATA_JSON).map((key) => (
                      <option key={key} value={key} className="bg-slate-800">
                        {key}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editModal.type === "stats" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Nilai Output (Read-Only)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-400 font-mono text-lg font-bold rounded-xl block p-3.5 cursor-not-allowed shadow-inner"
                    value={editModal.value}
                    readOnly
                  />
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    Nilai ini terisi otomatis dari sumber data.
                  </p>
                </div>
              )}

              {/* --- KONDISI 2: JIKA WIDGET ADALAH TEXT --- */}
              {editModal.type === "text" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Judul Catatan
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-800 border border-slate-700 text-white font-medium rounded-xl block p-3.5 focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all shadow-inner"
                      value={editModal.title}
                      placeholder="Masukkan judul..."
                      onChange={(e) =>
                        setEditModal({ ...editModal, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Isi Teks / Keterangan
                    </label>
                    <textarea
                      rows="4"
                      className="w-full bg-slate-800 border border-slate-700 text-slate-300 font-medium rounded-xl block p-3.5 focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all shadow-inner resize-none"
                      value={editModal.value}
                      placeholder="Ketik catatan di sini..."
                      onChange={(e) =>
                        setEditModal({ ...editModal, value: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() =>
                  setEditModal({
                    visible: false,
                    widgetId: null,
                    type: "",
                    title: "",
                    value: "",
                  })
                }
                className="px-5 py-2.5 text-sm font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all shadow-sm"
              >
                Batal
              </button>
              <button
                onClick={saveEdit}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
