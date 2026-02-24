import { useMemo, useState } from "react";

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
    return "bg-[#f5f0a6] text-[#333]";

  if (status === "Completed")
    return "bg-[#bcd8ff] text-[#333]";

  return "bg-[#ffc2c2] text-[#333]";
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
    <div className="p-[20px]">
      {/* TITLE */}
      <h1 className="text-[#ff7a00] text-[26px] font-extrabold mb-[14px]">Task List</h1>

      {/* PANEL */}
      <div className="bg-[#efeae4] rounded-[16px] p-[16px] h-[75vh]">
        {/* TABS */}
        <div className="flex gap-[10px] mb-[12px]">
          <button
            className={`border-none py-[8px] px-[12px] rounded-[12px] cursor-pointer font-semibold ${tab === "all" ? "bg-[#ffcf96]" : "bg-transparent"}`}
            onClick={() => setTab("all")}
          >
            All Tasks ({counts.all})
          </button>

          <button
            className={`border-none py-[8px] px-[12px] rounded-[12px] cursor-pointer font-semibold ${tab === "in_progress" ? "bg-[#ffcf96]" : "bg-transparent"}`}
            onClick={() => setTab("in_progress")}
          >
            In Progress ({counts.in_progress})
          </button>

          <button
            className={`border-none py-[8px] px-[12px] rounded-[12px] cursor-pointer font-semibold ${tab === "completed" ? "bg-[#ffcf96]" : "bg-transparent"}`}
            onClick={() => setTab("completed")}
          >
            Completed ({counts.completed})
          </button>

          <button
            className={`border-none py-[8px] px-[12px] rounded-[12px] cursor-pointer font-semibold ${tab === "overdue" ? "bg-[#ffcf96]" : "bg-transparent"}`}
            onClick={() => setTab("overdue")}
          >
            Overdue ({counts.overdue})
          </button>
        </div>

        {/* TASK LIST */}
        <div className="flex flex-col gap-[12px]">
          {list.map((task) => (
            <div key={task.id} className="bg-white rounded-[14px] border-2 border-[#ff8a00] p-[14px]">
              <div className="flex justify-between">
                <h2 className="m-0 text-[18px] font-black">{task.title}</h2>

                <div className="text-[12px] font-bold">
                  {task.priority} Priority
                </div>
              </div>

              <p className="mt-[25px] mb-[30px]">{task.description}</p>

              <div className="flex justify-between items-center">
                <div>
                  <span className="opacity-70 font-bold">Due:</span>{" "}
                  {task.dueDate}
                </div>

                <div className="flex gap-[10px] items-center">
                  <span
                    className={`px-[10px] py-[6px] rounded-full font-bold text-[12px] ${getPillStyleClass(task.status)}`}
                  >
                    {task.status}
                  </span>

                  <button className="py-[6px] px-[12px] rounded-full border-none bg-[#bcd8ff] font-bold cursor-pointer">
                    Completed
                  </button>
                </div>
              </div>
            </div>
          ))}

          {list.length === 0 && (
            <div className="p-[20px] text-center opacity-70">
              No tasks available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
