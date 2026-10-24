import { create } from "zustand";

export interface IBuild {
  splash: string;
  release: string;
  version: string;
  path: string;
  loading: boolean;
  open: boolean;
}

interface BuildStore {
  builds: Map<string, IBuild>;
  add: (path: string, build: IBuild) => void;
  remove: (path: string) => void;
  clear: () => void;
}
const normalizePath = (p: string) => p.replace(/\\/g, "/").toLowerCase();

const BuildStore = create<BuildStore>((set, get) => ({
  builds:
    typeof window !== "undefined"
      ? new Map(
          Object.entries(JSON.parse(localStorage.getItem("builds") || "{}"))
        )
      : new Map(),

  add: (path, build) => {
    if (typeof window === "undefined") return;
    const builds = get().builds;
    const key = normalizePath(path);
    builds.set(key, build);
    localStorage.setItem("builds", JSON.stringify(Object.fromEntries(builds)));
    set({ builds: new Map(builds) });
  },

  remove: (path) => {
    if (typeof window === "undefined") return;
    const builds = get().builds;
    const key = normalizePath(path);
    builds.delete(key);
    localStorage.setItem("builds", JSON.stringify(Object.fromEntries(builds)));
    set({ builds: new Map(builds) });
  },

  clear: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("builds");
    set({ builds: new Map() });
  },
}));

export default BuildStore;
