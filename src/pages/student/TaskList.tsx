import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight } from "lucide-react";
import { taskService } from "../../services/taskServices";
import type { Tasks, TaskStatus } from "../../types/database.types";

type TabKey =
  | "all"
  | "not_started"
  | "in_progress"
  | "completed"
  | "overdue";

// Intern can only update status if NOT completed/overdue — unless rejected (then they can re-update)
const canUpdateStatus = (status: TaskStatus) =>
  status !== "completed" && status !== "overdue";

const UPDATABLE_STATUSES: TaskStatus[] = [
  "not_started",
  "pending",
  "in_progress",
  "completed",
];

// Order for "All Tasks" tab: completed first, then in_progress, pending, not_started, rejected, overdue last
const ALL_TASKS_STATUS_ORDER: Record<TaskStatus, number> = {
  completed: 0,
  in_progress: 1,
  pending: 2,
  not_started: 3,
  rejected: 4,
  overdue: 5,
  pending_approval: 6,
  needs_revision: 7,
};



const STATUS_LABEL: Record<TaskStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  pending: "Pending",
  completed: "Completed",
  rejected: "Rejected",
  overdue: "Overdue",
  pending_approval: "Pending Approval",
  needs_revision: "For Revision",
};

function getPriorityColor(priority: string): string {
  if (priority === "high") return "text-red-500";
  if (priority === "medium") return "text-amber-500";
  if (priority === "low") return "text-blue-400";
  return "text-gray-400";
}

function getPriorityBar(priority: string): string {
  if (priority === "high") return "bg-red-500";
  if (priority === "medium") return "bg-amber-500";
  if (priority === "low") return "bg-blue-400";
  return "bg-gray-300";
}

function getPillClass(status: TaskStatus): string {
  if (status === "in_progress") return "bg-yellow-100 text-yellow-800";
  if (status === "completed") return "bg-blue-100 text-blue-800";
  if (status === "overdue") return "bg-red-100 text-red-700";
  if (status === "pending") return "bg-orange-100 text-orange-700";
  if (status === "rejected") return "bg-red-100 text-red-800";
  if (status === "pending_approval") return "bg-yellow-100 text-yellow-800";
  if (status === "needs_revision") return "bg-rose-100 text-rose-800";
  return "bg-gray-100 text-gray-600";
}

function fmt(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function fmtDateTime(date: string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function TaskList() {
  const [tab, setTab] = useState<TabKey>("all");
  const [tasks, setTasks] = useState<Tasks[]>([]);
  const [loading, setLoading] = useState(true);

  // Status update modal
  const [statusModalTask, setStatusModalTask] = useState<Tasks | null>(null);
  const [selectedStatus, setSelectedStatus] =
    useState<TaskStatus>("not_started");
  const [updating, setUpdating] = useState(false);

  const [detailTask, setDetailTask] = useState<Tasks | null>(null);
  const [detailUpdating, setDetailUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchTasks = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const data = await taskService.getMyTasks(signal);
      if (signal?.aborted) return;
      setTasks(data);
    } catch (err) {
      const e = err as { name?: string; code?: string };
      if (
        e?.name === "CanceledError" ||
        e?.name === "AbortError" ||
        e?.code === "ERR_CANCELED"
      )
        return;
      console.error("Failed to fetch tasks:", err);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTasks(controller.signal);
    return () => controller.abort();
  }, [fetchTasks]);

  const openStatusModal = (task: Tasks) => {
    setStatusModalTask(task);
    setSelectedStatus(task.status === "rejected" ? "not_started" : task.status);
  };

  const closeStatusModal = () => {
    setStatusModalTask(null);
    setUpdating(false);
  };

  const handleStatusSave = async () => {
    if (!statusModalTask || selectedStatus === statusModalTask.status) {
      closeStatusModal();
      return;
    }
    if (updating) return;
    setUpdating(true);
    try {
      await taskService.updateStatus(statusModalTask.id, selectedStatus);
      closeStatusModal();
      await fetchTasks();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleStartTask = async () => {
    if (!detailTask || detailUpdating) return;
    if (detailTask.status !== "not_started" && detailTask.status !== "pending")
      return;
    setDetailUpdating(true);
    try {
      await taskService.updateStatus(detailTask.id, "in_progress");
      closeDetailModal();
      await fetchTasks();
    } catch (err) {
      console.error("Failed to start task:", err);
    } finally {
      setDetailUpdating(false);
    }
  };

  const handleFinishTask = async () => {
    if (!detailTask || detailUpdating) return;
    if (detailTask.status !== "in_progress" && detailTask.status !== "overdue")
      return;
    setDetailUpdating(true);
    try {
      await taskService.updateStatus(detailTask.id, "completed");
      closeDetailModal();
      await fetchTasks();
    } catch (err) {
      console.error("Failed to finish task:", err);
    } finally {
      setDetailUpdating(false);
    }
  };

  const closeDetailModal = () => {
    setDetailTask(null);
    setSuccessMessage(null);
    setDetailUpdating(false);
  };

  const grouped = useMemo(() => {
    const now = new Date();
    const allSorted = [...tasks].sort((a, b) => {
      const orderA = ALL_TASKS_STATUS_ORDER[a.status] ?? 6;
      const orderB = ALL_TASKS_STATUS_ORDER[b.status] ?? 6;
      return orderA - orderB;
    });
    return {
      all: allSorted,
      not_started: tasks.filter((t) => t.status === "not_started"),
      in_progress: tasks.filter((t) => t.status === "in_progress"),
      completed: tasks.filter((t) => t.status === "completed"),
      overdue: tasks.filter(
        (t) =>
          t.status === "overdue" ||
          (t.status !== "completed" && new Date(t.due_date) < now),
      ),
    };
  }, [tasks]);

  const list = grouped[tab];

  const TAB_LABELS: Record<TabKey, string> = {
    all: "All Tasks",
    not_started: "Not Started",
    in_progress: "In Progress",
    completed: "Completed",
    overdue: "Overdue",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
          Task List
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track and manage your assigned tasks
        </p>
      </div>

      {/* Tab Bar — dropdown on mobile, buttons on md+ */}
      <div>
        {/* Mobile dropdown */}
        <select
          value={tab}
          onChange={(e) => setTab(e.target.value as TabKey)}
          className="md:hidden w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-[#FF8800] focus:ring-2 focus:ring-[#FF8800]/20"
        >
          {(["all", "not_started", "in_progress", "completed", "overdue"] as TabKey[]).map((key) => (
            <option key={key} value={key}>
              {TAB_LABELS[key]} ({grouped[key].length})
            </option>
          ))}
        </select>

        {/* Desktop buttons */}
        <div className="hidden md:flex flex-wrap gap-2">
          {(["all", "not_started", "in_progress", "completed", "overdue"] as TabKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                tab === key
                  ? "bg-[#FF8800] text-white shadow-[0_0_12px_rgba(255,136,0,0.3)]"
                  : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-white/10"
              }`}
            >
              {TAB_LABELS[key]}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === key ? "bg-white/20" : "bg-gray-200 dark:bg-white/10"}`}>
                {grouped[key].length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Task Cards */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center py-16 text-gray-400">Loading tasks…</div>
        )}
        {!loading && list.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-white/5">
            No tasks available.
          </div>
        )}

        {!loading && list.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex"
          >
            {/* Priority bar */}
            <div className={`w-1.5 shrink-0 ${getPriorityBar(task.priority)}`} />

            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-bold text-gray-900 dark:text-white text-base leading-snug">
                  {task.title}
                </h2>
                <span className={`text-xs font-bold whitespace-nowrap ${getPriorityColor(task.priority)}`}>
                  ● {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </div>

              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {task.description}
              </p>

              {task.status === "rejected" && task.rejection_reason && (
                <div className="mt-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg text-sm text-red-700 dark:text-red-400">
                  <span className="font-bold">Rejection Reason: </span>
                  {task.rejection_reason}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs text-gray-400 dark:text-gray-500 space-x-3">
                  <span><span className="font-semibold">Created:</span> {fmt(task.created_at)}</span>
                  <span><span className="font-semibold">Due:</span> {fmt(task.due_date)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${getPillClass(task.status)}`}>
                    {STATUS_LABEL[task.status]}
                  </span>
                  <button
                    onClick={() => { setSuccessMessage(null); setDetailTask(task); }}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border border-[#FF8800] text-[#FF8800] hover:bg-[#FF8800] hover:text-white transition-all duration-200"
                  >
                    View Details <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeDetailModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/5 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                      {detailTask.title}
                    </h2>
                    <span className={`inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full ${getPillClass(detailTask.status)}`}>
                      {STATUS_LABEL[detailTask.status]}
                    </span>
                  </div>
                  <button
                    onClick={closeDetailModal}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Description</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {detailTask.description || "No description provided."}
                  </p>
                </div>

                {detailTask.status === "rejected" && detailTask.rejection_reason && (
                  <div className="mb-4 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-700 dark:text-red-400">
                    <span className="font-bold">Rejection Reason: </span>
                    {detailTask.rejection_reason}
                  </div>
                )}

                {/* Meta Grid */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl mb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Priority</p>
                    <p className={`text-sm font-bold ${getPriorityColor(detailTask.priority)}`}>
                      ● {detailTask.priority.charAt(0).toUpperCase() + detailTask.priority.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Created</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{fmt(detailTask.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Due Date</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{fmtDateTime(detailTask.due_date)}</p>
                  </div>
                </div>

                {detailTask.tools && detailTask.tools.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Tools &amp; Technologies</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detailTask.tools.map((t) => (
                        <span key={t} className="px-2.5 py-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl text-sm text-green-700 dark:text-green-400">
                    {successMessage}
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  {(detailTask.status === "not_started" || detailTask.status === "pending") && (
                    <button
                      onClick={handleStartTask}
                      disabled={detailUpdating}
                      className="px-5 py-2 rounded-xl bg-[#FF8800] text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-60 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(255,136,0,0.35)]"
                    >
                      {detailUpdating ? "Starting…" : "Start Task"}
                    </button>
                  )}
                  {(detailTask.status === "in_progress" || detailTask.status === "overdue") && (
                    <button
                      onClick={handleFinishTask}
                      disabled={detailUpdating}
                      className="px-5 py-2 rounded-xl bg-[#FF8800] text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-60 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(255,136,0,0.35)]"
                    >
                      {detailUpdating ? "Finishing…" : "Finish"}
                    </button>
                  )}
                  {detailTask.status === "rejected" && canUpdateStatus(detailTask.status) && (
                    <button
                      onClick={() => { closeDetailModal(); openStatusModal(detailTask); }}
                      className="px-5 py-2 rounded-xl bg-[#FF8800] text-white text-sm font-bold hover:bg-orange-600 transition-all duration-200"
                    >
                      Update Status
                    </button>
                  )}
                  <button
                    onClick={closeDetailModal}
                    className="px-5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Update Modal */}
      <AnimatePresence>
        {statusModalTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeStatusModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/5 shadow-2xl w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-black text-[#FF8800] mb-1">Update Task Status</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{statusModalTask.title}</p>

              <div className="space-y-2 mb-6">
                {UPDATABLE_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                      selectedStatus === status
                        ? "border-[#FF8800] bg-orange-50 dark:bg-orange-900/20 scale-[1.02]"
                        : "border-transparent hover:border-orange-200 dark:hover:border-orange-800/30 hover:bg-orange-50/50 dark:hover:bg-orange-900/10"
                    }`}
                  >
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getPillClass(status)}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={closeStatusModal}
                  className="px-5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusSave}
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-[#FF8800] text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-60 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(255,136,0,0.3)]"
                >
                  {updating ? "Saving…" : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
