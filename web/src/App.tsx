import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { useHashRoute, navigate, Route } from "./lib/router";
import { SignInForm } from "./components/SignInForm";
import { ProjectListPage } from "./pages/ProjectListPage";
import { ProjectShellPage } from "./pages/ProjectShellPage";
import { CharacterLibraryPage } from "./pages/CharacterLibraryPage";
import { PublishPage } from "./pages/PublishPage";
import { TaskManagerPage } from "./pages/TaskManagerPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  const route = useHashRoute();

  return (
    <div className="min-h-screen bg-light dark:bg-dark">
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center">
          <SignInForm />
        </div>
      </Unauthenticated>
      <Authenticated>
        <AppShell route={route}>
          <RouteRenderer route={route} />
        </AppShell>
      </Authenticated>
    </div>
  );
}

function RouteRenderer({ route }: { route: Route }) {
  switch (route.page) {
    case "projects":
      return <ProjectListPage />;
    case "project":
      return <ProjectShellPage projectId={route.projectId} />;
    case "characters":
      return <CharacterLibraryPage />;
    case "publish":
      return <PublishPage />;
    case "tasks":
      return <TaskManagerPage />;
    case "settings":
      return <SettingsPage />;
    default:
      return <ProjectListPage />;
  }
}

function AppShell({
  children,
  route,
}: {
  children: React.ReactNode;
  route: Route;
}) {
  const { signOut } = useAuthActions();
  const runningJobs = useQuery(api.jobs.listRunning);
  const runningCount = runningJobs?.length ?? 0;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-light dark:bg-dark border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold">LifeManga</h1>
          <button
            onClick={() => void signOut()}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="退出登录"
          >
            退出
          </button>
        </div>
      </header>

      <main className="flex-1 pb-20">{children}</main>

      <BottomNav route={route} runningCount={runningCount} />
    </div>
  );
}

function BottomNav({
  route,
  runningCount,
}: {
  route: Route;
  runningCount: number;
}) {
  const navItems: Array<{
    route: Route;
    icon: string;
    label: string;
    badge?: number;
  }> = [
    { route: { page: "projects" }, icon: "📖", label: "工程" },
    { route: { page: "characters" }, icon: "👤", label: "角色库" },
    { route: { page: "publish" }, icon: "📤", label: "发布" },
    {
      route: { page: "tasks" },
      icon: runningCount > 0 ? "⏳" : "📋",
      label: "任务",
      badge: runningCount > 0 ? runningCount : undefined,
    },
    { route: { page: "settings" }, icon: "⚙️", label: "设置" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-light dark:bg-dark border-t border-slate-200 dark:border-slate-800 z-10">
      <div className="max-w-2xl mx-auto flex">
        {navItems.map((item) => (
          <NavButton
            key={item.label}
            route={item.route}
            icon={item.icon}
            label={item.label}
            badge={item.badge}
            active={isRouteActive(route, item.route)}
          />
        ))}
      </div>
    </nav>
  );
}

function NavButton({
  route,
  active,
  icon,
  label,
  badge,
}: {
  route: Route;
  active: boolean;
  icon: string;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={() => navigate(route)}
      className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs relative transition-colors ${
        active
          ? "text-indigo-600 dark:text-indigo-400"
          : "text-slate-400 hover:text-slate-600"
      }`}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      <span className="text-lg" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
      {badge !== undefined && (
        <span className="absolute top-1 right-1/4 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function isRouteActive(current: Route, target: Route): boolean {
  if (current.page === target.page) {
    if (current.page === "project" && target.page === "project") {
      return current.projectId === target.projectId;
    }
    return true;
  }
  return false;
}
