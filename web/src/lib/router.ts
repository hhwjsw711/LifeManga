import { Id } from "../../convex/_generated/dataModel";
import { useState, useEffect } from "react";

export type Route =
  | { page: "projects" }
  | { page: "project"; projectId: Id<"projects"> }
  | { page: "characters" }
  | { page: "publish" }
  | { page: "tasks" }
  | { page: "settings" };

export function parseRoute(hash: string): Route {
  const path = hash.slice(1) || "/";

  if (path === "/" || path === "") return { page: "projects" };
  if (path === "/characters") return { page: "characters" };
  if (path === "/publish") return { page: "publish" };
  if (path === "/tasks") return { page: "tasks" };
  if (path === "/settings") return { page: "settings" };

  const projectMatch = path.match(/^\/project\/(.+)$/);
  if (projectMatch) {
    // The ID is passed through from the URL without validation.
    // Convex queries will fail gracefully if the ID is malformed,
    // resulting in a "project not found" state in the UI.
    return { page: "project", projectId: projectMatch[1] as Id<"projects"> };
  }

  return { page: "projects" };
}

export function navigate(route: Route): void {
  switch (route.page) {
    case "projects":
      window.location.hash = "#/";
      break;
    case "project":
      window.location.hash = `#/project/${route.projectId}`;
      break;
    case "characters":
      window.location.hash = "#/characters";
      break;
    case "publish":
      window.location.hash = "#/publish";
      break;
    case "tasks":
      window.location.hash = "#/tasks";
      break;
    case "settings":
      window.location.hash = "#/settings";
      break;
  }
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));

  useEffect(() => {
    const handleHash = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return route;
}
