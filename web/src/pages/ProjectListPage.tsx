import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { navigate } from "../lib/router";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/Button";

export function ProjectListPage() {
  const projects = useQuery(api.projects.list);
  const createProject = useMutation(api.projects.create);
  const deleteProject = useMutation(api.projects.remove);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<Id<"projects"> | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const handleCreate = useCallback(async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await createProject({ name });
      setNewName("");
      setShowCreate(false);
    } catch (e) {
      console.error("创建工程失败:", e);
    }
  }, [newName, createProject]);

  const renameProject = useMutation(api.projects.rename);

  const handleRename = useCallback(
    async (projectId: Id<"projects">) => {
      const name = renameValue.trim();
      if (!name) return;
      try {
        await renameProject({ projectId, name });
        setRenamingId(null);
        setRenameValue("");
      } catch (e) {
        console.error("重命名失败:", e);
      }
    },
    [renameValue, renameProject],
  );

  if (!projects) {
    return <LoadingState />;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <PageHeader onCreate={() => setShowCreate(true)} />

      {showCreate && (
        <CreateForm
          name={newName}
          onNameChange={setNewName}
          onCreate={() => void handleCreate()}
          onCancel={() => {
            setShowCreate(false);
            setNewName("");
          }}
        />
      )}

      {projects.length === 0 && !showCreate && <EmptyState />}

      <ProjectList
        projects={projects}
        renamingId={renamingId}
        renameValue={renameValue}
        onRenameValueChange={setRenameValue}
        onProjectClick={(id) => navigate({ page: "project", projectId: id })}
        onStartRename={(id, name) => {
          setRenamingId(id);
          setRenameValue(name);
        }}
        onFinishRename={() => {
          if (renamingId) void handleRename(renamingId);
        }}
        onDelete={(args) => void deleteProject(args)}
      />
    </div>
  );
}

function LoadingState() {
  return <LoadingSpinner />;
}

function PageHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">工程</h1>
      <Button variant="primary" size="sm" onClick={onCreate}>
        + 新建工程
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-ink-muted">
      <p className="text-lg mb-2">还没有工程</p>
      <p className="text-sm">点击「新建工程」开始创作你的第一篇漫画</p>
    </div>
  );
}

function CreateForm({
  name,
  onNameChange,
  onCreate,
  onCancel,
}: {
  name: string;
  onNameChange: (name: string) => void;
  onCreate: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mb-4 p-4 bg-cream-light dark:bg-ink-medium rounded-card border-2 border-ember/30">
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onCreate()}
        placeholder="工程名称"
        className="w-full px-4 py-3 border-2 border-cream-dark dark:border-ink-light rounded-card bg-transparent mb-3 focus:outline-none focus:border-ember transition-colors"
        autoFocus
      />
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={onCreate}>
          创建
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          取消
        </Button>
      </div>
    </div>
  );
}

function ProjectList({
  projects,
  renamingId,
  renameValue,
  onRenameValueChange,
  onProjectClick,
  onStartRename,
  onFinishRename,
  onDelete,
}: {
  projects: Doc<"projects">[];
  renamingId: Id<"projects"> | null;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onProjectClick: (id: Id<"projects">) => void;
  onStartRename: (id: Id<"projects">, name: string) => void;
  onFinishRename: () => void;
  onDelete: (args: { projectId: Id<"projects"> }) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {projects.map((project) => (
        <ProjectCard
          key={project._id}
          project={project}
          isRenaming={renamingId === project._id}
          renameValue={renameValue}
          onRenameValueChange={onRenameValueChange}
          onClick={() => onProjectClick(project._id)}
          onStartRename={() => onStartRename(project._id, project.name)}
          onFinishRename={onFinishRename}
          onDelete={() => {
            if (confirm("确定删除此工程及其所有作品？")) {
              void onDelete({ projectId: project._id });
            }
          }}
        />
      ))}
    </div>
  );
}

function ProjectCard({
  project,
  isRenaming,
  renameValue,
  onRenameValueChange,
  onClick,
  onStartRename,
  onFinishRename,
  onDelete,
}: {
  project: Doc<"projects">;
  isRenaming: boolean;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onClick: () => void;
  onStartRename: () => void;
  onFinishRename: () => void;
  onDelete: () => void;
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-3 p-4 bg-cream-light dark:bg-ink-medium rounded-card border-2 border-cream-dark dark:border-ink-light hover:border-ember/50 dark:hover:border-ember/50 transition-colors cursor-pointer text-left w-full"
      onClick={onClick}
    >
      <div
        className="w-12 h-12 rounded-card bg-cream-medium dark:bg-ink-light flex items-center justify-center text-xl"
        aria-hidden="true"
      >
        📖
      </div>
      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => onRenameValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && renameValue.trim()) onFinishRename();
            }}
            onBlur={() => {
              if (renameValue.trim()) onFinishRename();
            }}
            className="w-full px-3 py-2 border-2 border-cream-dark dark:border-ink-light rounded-card bg-transparent text-sm focus:outline-none focus:border-ember transition-colors"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p className="font-medium truncate">{project.name}</p>
        )}
        <p className="text-xs text-ink-muted">
          {new Date(project._creationTime).toLocaleDateString("zh-CN")}
        </p>
      </div>
      <div className="flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartRename();
          }}
          className="px-2 py-1 text-xs text-ink-muted hover:text-ember transition-colors"
        >
          重命名
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="px-2 py-1 text-xs text-ink-muted hover:text-error transition-colors"
        >
          删除
        </button>
      </div>
    </button>
  );
}
