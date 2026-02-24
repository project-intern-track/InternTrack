import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TabKey = "all" | "in_progress" | "completed" | "overdue";

type TaskSkeleton = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  status: "In Progress" | "Completed" | "Overdue";
};

const DATA: Record<TabKey, TaskSkeleton[]> = {
  all: [
    {
      id: "1",
      title: "Task title goes here",
      description:
        "This is placeholder content. Backend data will appear here later.",
      dueDate: "MM/DD/YYYY",
      priority: "High",
      status: "In Progress",
    },
    {
      id: "2",
      title: "Another task title",
      description:
        "This is another placeholder card. This box is ready for backend.",
      dueDate: "MM/DD/YYYY",
      priority: "Medium",
      status: "Completed",
    },
  ],

  in_progress: [
    {
      id: "3",
      title: "In progress task",
      description: "This card represents an in-progress task.",
      dueDate: "MM/DD/YYYY",
      priority: "High",
      status: "In Progress",
    },
  ],

  completed: [
    {
      id: "4",
      title: "Completed task",
      description: "This card represents a completed task.",
      dueDate: "MM/DD/YYYY",
      priority: "Low",
      status: "Completed",
    },
  ],

  overdue: [
    {
      id: "5",
      title: "Overdue task",
      description: "This card represents an overdue task.",
      dueDate: "MM/DD/YYYY",
      priority: "Medium",
      status: "Overdue",
    },
  ],
};

function getPillStyleClass(status: string): string {
  if (status === "In Progress")
    return "bg-amber-50 text-amber-700 border border-amber-200";

  if (status === "Completed")
    return "bg-green-50 text-green-700 border border-green-200";

  if (status === "Overdue")
    return "bg-red-50 text-red-700 border border-red-200";

  return "bg-gray-50 text-gray-700 border border-gray-200";
}

function getPriorityColorClass(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'high': return 'bg-red-50 text-red-700 border-red-200';
    case 'medium': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'low': return 'bg-blue-50 text-blue-700 border-blue-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export default function TaskList() {
  const [tab, setTab] = useState<TabKey>("all");

  const counts = useMemo(() => {
    return {
      all: DATA.all.length,
      in_progress: DATA.in_progress.length,
      completed: DATA.completed.length,
      overdue: DATA.overdue.length,
    };
  }, []);

  const list = DATA[tab];

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen font-sans">
      {/* TITLE */}
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">Task List</h1>

      {/* PANEL */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[75vh]">
        {/* TABS */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-100 pb-5">
          <button
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
              tab === "all" ? "bg-gray-900 text-white shadow-sm" : "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
            onClick={() => setTab("all")}
          >
            All Tasks <span className={`ml-1.5 px-2 py-0.5 rounded-md text-xs ${tab === "all" ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-600"}`}>{counts.all}</span>
          </button>

          <button
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
              tab === "in_progress" ? "bg-gray-900 text-white shadow-sm" : "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
            onClick={() => setTab("in_progress")}
          >
            In Progress <span className={`ml-1.5 px-2 py-0.5 rounded-md text-xs ${tab === "in_progress" ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-600"}`}>{counts.in_progress}</span>
          </button>

          <button
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
              tab === "completed" ? "bg-gray-900 text-white shadow-sm" : "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
            onClick={() => setTab("completed")}
          >
            Completed <span className={`ml-1.5 px-2 py-0.5 rounded-md text-xs ${tab === "completed" ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-600"}`}>{counts.completed}</span>
          </button>

          <button
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
              tab === "overdue" ? "bg-gray-900 text-white shadow-sm" : "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
            onClick={() => setTab("overdue")}
          >
            Overdue <span className={`ml-1.5 px-2 py-0.5 rounded-md text-xs ${tab === "overdue" ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-600"}`}>{counts.overdue}</span>
          </button>
        </div>

        {/* TASK LIST */}
        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {list.map((task, index) => (
              <motion.div 
                key={task.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm transition-colors duration-300 group flex flex-col hover:border-orange-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="m-0 text-lg font-extrabold text-gray-900 leading-tight group-hover:text-[#ff7a00] transition-colors">{task.title}</h2>

                  <div className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider shrink-0 ml-4 ${getPriorityColorClass(task.priority)}`}>
                    {task.priority} Priority
                  </div>
                </div>

                <p className="text-gray-500 text-sm mt-1 mb-5 leading-relaxed">{task.description}</p>

                <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                  <div className="flex items-center text-xs font-bold text-gray-400 tracking-wide uppercase">
                    <span className="mr-1.5 opacity-70">Due:</span>
                    <span className="text-gray-600">{task.dueDate}</span>
                  </div>

                  <div className="flex gap-3 items-center">
                    <span
                      className={`px-3 py-1.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${getPillStyleClass(task.status)}`}
                    >
                      {task.status}
                    </span>

                    <button className="py-1.5 px-4 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-bold text-xs transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-1">
                      Mark Complete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {list.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-16 flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <span className="text-gray-400 text-3xl">📭</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No tasks found</h3>
              <p className="text-gray-500 font-medium">There are no tasks matching this filter.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
