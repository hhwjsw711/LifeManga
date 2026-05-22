import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { HomePage } from "./HomePage";
import { HistoryPage } from "./HistoryPage";
import { navigate } from "../lib/router";
import { LoadingSpinner } from "../components/LoadingSpinner";

export function ProjectShellPage({ projectId }: { projectId: Id<"projects"> }) {
  const project = useQuery(api.projects.get, { projectId });
  const [tab, setTab] = useState<"create" | "history">("create");

  if (project === undefined) {
    return <LoadingSpinner />;
  }

  if (project === null) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <p className="text-lg mb-2">工程不存在</p>
          <button
            onClick={() => navigate({ page: "projects" })}
            className="text-sm text-indigo-500 hover:text-indigo-600"
          >
            返回工程列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate({ page: "projects" })}
          className="text-slate-400 hover:text-slate-600"
        >
          ← 返回
        </button>
        <h1 className="text-xl font-bold">{project.name}</h1>
      </div>

      <div className="flex mb-4 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
        <button
          onClick={() => setTab("create")}
          className={`flex-1 py-2 text-sm rounded-md transition-colors ${
            tab === "create"
              ? "bg-white dark:bg-slate-700 shadow-sm font-medium"
              : "text-slate-500"
          }`}
        >
          创作
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 py-2 text-sm rounded-md transition-colors ${
            tab === "history"
              ? "bg-white dark:bg-slate-700 shadow-sm font-medium"
              : "text-slate-500"
          }`}
        >
          历史
        </button>
      </div>

      {tab === "create" ? (
        <HomePage projectId={projectId} />
      ) : (
        <HistoryPage projectId={projectId} />
      )}
    </div>
  );
}
