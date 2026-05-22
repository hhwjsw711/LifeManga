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
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 text-ink-muted">
          <p className="text-lg mb-2">工程不存在</p>
          <button
            onClick={() => navigate({ page: "projects" })}
            className="text-sm text-ember hover:text-ember-dark"
          >
            返回工程列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate({ page: "projects" })}
          className="text-ink-muted hover:text-ink dark:hover:text-cream-light transition-colors"
        >
          ← 返回
        </button>
        <h1 className="text-xl font-bold">{project.name}</h1>
      </div>

      <div className="flex mb-4 bg-cream-medium dark:bg-ink-medium rounded-pill p-1">
        <button
          onClick={() => setTab("create")}
          className={`flex-1 py-2 text-sm rounded-pill transition-all ${
            tab === "create"
              ? "bg-cream-light dark:bg-ink-light shadow-sm font-medium text-ink dark:text-cream-light"
              : "text-ink-muted"
          }`}
        >
          创作
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 py-2 text-sm rounded-pill transition-all ${
            tab === "history"
              ? "bg-cream-light dark:bg-ink-light shadow-sm font-medium text-ink dark:text-cream-light"
              : "text-ink-muted"
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
