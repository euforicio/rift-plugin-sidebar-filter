// bb-plugin-runtime-shim:react
var runtime = globalThis.__bbPluginRuntime;
if (runtime == null || runtime.react == null) {
  throw new Error('Cannot load "react": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod = runtime.react;
var {
  Activity,
  Children,
  Component,
  Fragment,
  Profiler,
  PureComponent,
  StrictMode,
  Suspense,
  act,
  cache,
  cacheSignal,
  captureOwnerStack,
  cloneElement,
  createContext,
  createElement,
  createRef,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  startTransition,
  unstable_useCacheRefresh,
  use,
  useActionState,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useId,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useOptimistic,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  version
} = mod;

// node_modules/@riftlabs/plugin-sdk/dist/app.js
var runtime2 = globalThis.__riftPluginRuntime?.pluginSdkApp ?? {};
var definePluginApp = runtime2.definePluginApp;
var ThreadChat = runtime2.ThreadChat;
var Markdown = runtime2.Markdown;
var experimental_FileLink = runtime2.experimental_FileLink;
var UrlLink = runtime2.UrlLink;
var experimental_NewThreadComposer = runtime2.experimental_NewThreadComposer;
var experimental_ProviderModelPicker = runtime2.experimental_ProviderModelPicker;
var experimental_PermissionModePicker = runtime2.experimental_PermissionModePicker;
var experimental_SourceCode = runtime2.experimental_SourceCode;
var experimental_Diff = runtime2.experimental_Diff;
var useRpc = runtime2.useRpc;
var useRealtime = runtime2.useRealtime;
var useRealtimeConnectionState = runtime2.useRealtimeConnectionState;
var useSettings = runtime2.useSettings;
var useRiftContext = runtime2.useRiftContext;
var useRiftNavigate = runtime2.useRiftNavigate;
var experimental_useAppPanel = runtime2.experimental_useAppPanel;
var experimental_useFixedTabTarget = runtime2.experimental_useFixedTabTarget;
var useComposer = runtime2.useComposer;
var useComposerView = runtime2.useComposerView;
var experimental_useSidebarThreads = runtime2.experimental_useSidebarThreads;
var experimental_useSidebarThreadActions = runtime2.experimental_useSidebarThreadActions;
var experimental_useSidebarThreadPullRequest = runtime2.experimental_useSidebarThreadPullRequest;
var experimental_useSidebarThreadSplit = runtime2.experimental_useSidebarThreadSplit;
var experimental_useProviders = runtime2.experimental_useProviders;
var experimental_useCodeTheme = runtime2.experimental_useCodeTheme;

// bb-plugin-runtime-shim:react/jsx-runtime
var runtime3 = globalThis.__bbPluginRuntime;
if (runtime3 == null || runtime3.jsxRuntime == null) {
  throw new Error('Cannot load "react/jsx-runtime": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod2 = runtime3.jsxRuntime;
var {
  Fragment: Fragment2,
  jsx,
  jsxs
} = mod2;

// app.tsx
var COLLAPSED_KEY = "bb-plugin-sidebar-filter.collapsed-projects";
function activityRunning(thread) {
  const a = thread.activity;
  return a.workflows + a.backgroundAgents + a.backgroundCommands + a.planMode + a.goals > 0;
}
function isActiveThread(thread, mode) {
  if (mode === "running") {
    return thread.indicator === "runtime" || activityRunning(thread);
  }
  return !thread.isArchived;
}
function matchesQuery(thread, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return `${thread.title ?? ""} ${thread.titleFallback ?? ""}`.toLowerCase().includes(q);
}
function statusDotClass(thread) {
  if (thread.indicator === "runtime" || activityRunning(thread)) {
    return "bg-primary animate-pulse";
  }
  if (thread.indicator === "unread-error") return "bg-destructive";
  if (thread.indicator === "waiting-for-input" || thread.hasPendingInteraction) {
    return "bg-foreground";
  }
  if (thread.isUnread) return "bg-foreground/60";
  return "bg-subtle-foreground/40";
}
function statusDotAria(thread) {
  return thread.indicatorLabel ?? (thread.isUnread ? "Unread" : "Idle");
}
function threadTitle(thread) {
  return thread.title ?? thread.titleFallback ?? "Untitled";
}
function FilteredProjectList(props) {
  const { status, threads, projects } = experimental_useSidebarThreads();
  const { values } = useSettings();
  const hideEmpty = (values?.hideEmptyProjects ?? true) !== false;
  const activeMode = values?.activeMode === "running" ? "running" : "exists";
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem(COLLAPSED_KEY);
      return raw ? new Set(JSON.parse(raw)) : /* @__PURE__ */ new Set();
    } catch {
      return /* @__PURE__ */ new Set();
    }
  });
  const toggleCollapsed = (projectId) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...next]));
      } catch {
      }
      return next;
    });
  };
  const pinned = useMemo(
    () => threads.filter(
      (t) => t.isPinned && !t.isArchived && matchesQuery(t, props.searchQuery)
    ).sort((a, b) => b.updatedAt - a.updatedAt),
    [threads, props.searchQuery]
  );
  const { visibleProjects, forests } = useMemo(() => {
    const byId = new Map(threads.map((t) => [t.id, t]));
    const matched = threads.filter(
      (t) => !t.isPinned && isActiveThread(t, activeMode) && matchesQuery(t, props.searchQuery)
    );
    const showSet = /* @__PURE__ */ new Set();
    const addWithAncestors = (thread) => {
      let current = thread;
      while (current && !showSet.has(current.id)) {
        showSet.add(current.id);
        current = current.parentThreadId ? byId.get(current.parentThreadId) : void 0;
      }
    };
    for (const thread of matched) addWithAncestors(thread);
    const byProject = /* @__PURE__ */ new Map();
    for (const project of projects) byProject.set(project.id, []);
    for (const thread of threads) {
      if (!showSet.has(thread.id)) continue;
      byProject.get(thread.projectId)?.push(thread);
    }
    const sortByUpdated = (a, b) => b.updatedAt - a.updatedAt;
    const builtForests = /* @__PURE__ */ new Map();
    for (const project of projects) {
      const projectThreads = byProject.get(project.id) ?? [];
      const childrenOf = /* @__PURE__ */ new Map();
      const roots = [];
      for (const thread of projectThreads) {
        if (thread.parentThreadId && showSet.has(thread.parentThreadId) && byId.has(thread.parentThreadId)) {
          const siblings = childrenOf.get(thread.parentThreadId) ?? [];
          siblings.push(thread);
          childrenOf.set(thread.parentThreadId, siblings);
        } else {
          roots.push(thread);
        }
      }
      roots.sort(sortByUpdated);
      for (const siblings of childrenOf.values()) siblings.sort(sortByUpdated);
      builtForests.set(project.id, { roots, childrenOf });
    }
    const visible = projects.filter(
      (p) => !hideEmpty || (builtForests.get(p.id)?.roots.length ?? 0) > 0
    );
    return { visibleProjects: visible, forests: builtForests };
  }, [projects, threads, activeMode, hideEmpty, props.searchQuery]);
  if (status === "loading") {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-2 p-2", role: "status", "aria-label": "Loading threads", children: [
      /* @__PURE__ */ jsx("div", { className: "h-4 w-3/4 rounded-sm bg-sidebar-border/50" }),
      /* @__PURE__ */ jsx("div", { className: "h-4 w-2/3 rounded-sm bg-sidebar-border/50" }),
      /* @__PURE__ */ jsx("div", { className: "h-4 w-1/2 rounded-sm bg-sidebar-border/50" })
    ] });
  }
  if (status === "error") {
    return /* @__PURE__ */ jsx("div", { className: "p-3 text-xs text-muted-foreground", children: "Threads are unavailable right now." });
  }
  return /* @__PURE__ */ jsxs(MenuProvider, { children: [
    pinned.length > 0 ? /* @__PURE__ */ jsxs("section", { className: "space-y-0.5 py-1", "aria-label": "Pinned threads", children: [
      /* @__PURE__ */ jsx("div", { className: "px-2 pb-0.5 pt-1 text-[11px] font-medium uppercase tracking-wide text-subtle-foreground/70", children: "Pinned" }),
      pinned.map((thread) => /* @__PURE__ */ jsx(
        ThreadRow,
        {
          thread,
          depth: 0,
          childrenOf: null,
          activeThreadId: props.activeThreadId,
          isCompactViewport: props.isCompactViewport,
          onNavigate: props.onNavigate
        },
        thread.id
      ))
    ] }) : null,
    /* @__PURE__ */ jsx("section", { className: "space-y-0.5 py-1", "aria-label": "Projects", children: visibleProjects.length === 0 ? /* @__PURE__ */ jsx("div", { className: "px-2 py-3 text-xs text-subtle-foreground/60", children: "No projects with active threads." }) : visibleProjects.map((project) => {
      const forest = forests.get(project.id);
      if (!forest || forest.roots.length === 0) return null;
      return /* @__PURE__ */ jsx(
        ProjectGroup,
        {
          project,
          forest,
          isCollapsed: collapsed.has(project.id),
          onToggleCollapsed: () => toggleCollapsed(project.id),
          activeThreadId: props.activeThreadId,
          activeProjectId: props.activeProjectId,
          isCompactViewport: props.isCompactViewport,
          onNavigate: props.onNavigate
        },
        project.id
      );
    }) })
  ] });
}
function ProjectGroup({
  project,
  forest,
  isCollapsed,
  onToggleCollapsed,
  activeThreadId,
  activeProjectId,
  isCompactViewport,
  onNavigate
}) {
  const isActiveProject = project.id === activeProjectId;
  const menu = useMenu();
  const totalCount = forest.roots.length + [...forest.childrenOf.values()].reduce((n, siblings) => n + siblings.length, 0);
  const handleNewThread = () => experimental_useSidebarThreadActions().openNewThread({ projectId: project.id });
  return /* @__PURE__ */ jsxs("div", { className: "group/project", children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `flex min-w-0 items-center gap-1 rounded-md px-1.5 py-1 text-sm ${isActiveProject ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50"}`,
        children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onToggleCollapsed,
              "aria-expanded": !isCollapsed,
              "aria-label": `${isCollapsed ? "Expand" : "Collapse"} project ${project.name}`,
              className: "flex min-w-0 shrink-0 items-center justify-center rounded p-0.5 text-subtle-foreground hover:text-foreground",
              children: /* @__PURE__ */ jsx(
                "span",
                {
                  "aria-hidden": "true",
                  className: `inline-block text-[10px] leading-none transition-transform ${isCollapsed ? "-rotate-90" : ""}`,
                  children: "\u25B8"
                }
              )
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: onToggleCollapsed,
              className: "min-w-0 flex-1 truncate text-left font-medium",
              title: project.name,
              children: [
                project.name,
                totalCount > 0 ? /* @__PURE__ */ jsx("span", { className: "ml-1.5 text-xs font-normal text-subtle-foreground/70", children: totalCount }) : null
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              "aria-label": `Project actions for ${project.name}`,
              "aria-haspopup": "menu",
              title: "Project actions",
              onClick: (event) => {
                event.stopPropagation();
                const rect = event.currentTarget.getBoundingClientRect();
                menu.openProject(
                  project.id,
                  rect.right,
                  rect.bottom,
                  event.currentTarget
                );
              },
              className: `rounded p-0.5 text-subtle-foreground transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 ${isCompactViewport || isActiveProject ? "opacity-100" : "opacity-0 group-hover/project:opacity-100"}`,
              children: /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\u22EF" })
            }
          )
        ]
      }
    ),
    !isCollapsed ? /* @__PURE__ */ jsx("div", { className: "mt-px space-y-px", children: forest.roots.map((thread) => /* @__PURE__ */ jsx(
      ThreadRow,
      {
        thread,
        depth: 0,
        childrenOf: forest.childrenOf,
        activeThreadId,
        isCompactViewport,
        onNavigate
      },
      thread.id
    )) }) : null
  ] });
}
function ThreadRow({
  thread,
  depth,
  childrenOf,
  activeThreadId,
  isCompactViewport,
  onNavigate
}) {
  const actions = experimental_useSidebarThreadActions();
  const { splitProps, isAvailable } = experimental_useSidebarThreadSplit(
    thread.id
  );
  const menu = useMenu();
  const isActive = thread.id === activeThreadId;
  const title = threadTitle(thread);
  const secondary = thread.environment?.branchName ?? thread.host?.name ?? null;
  const children = childrenOf?.get(thread.id) ?? [];
  const handleOpen = (event) => {
    event.preventDefault();
    actions.open(thread.id);
    onNavigate();
  };
  const row = /* @__PURE__ */ jsxs(
    "div",
    {
      className: `group/row relative rounded-md ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`,
      onContextMenu: (event) => {
        event.preventDefault();
        menu.openThread(thread.id, event.clientX, event.clientY, null);
      },
      children: [
        /* @__PURE__ */ jsxs(
          "a",
          {
            "data-sidebar-thread-shortcut-target": "",
            "data-sidebar-thread-id": thread.id,
            href: "#",
            onClick: handleOpen,
            onAuxClick: (event) => {
              if (event.button === 1) {
                event.preventDefault();
                actions.open(thread.id, { split: true });
                onNavigate();
              }
            },
            title: `${title} \u2014 ${statusDotAria(thread)}`,
            style: { paddingLeft: 8 + depth * 14 },
            className: `flex min-w-0 items-center gap-2 rounded-md py-1 pr-8 text-sm ${thread.isUnread && !isActive ? "font-medium text-foreground" : "text-muted-foreground"}`,
            children: [
              /* @__PURE__ */ jsx(
                "span",
                {
                  "aria-hidden": "true",
                  className: `size-1.5 shrink-0 rounded-full ${statusDotClass(thread)}`
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate", children: title }),
              isAvailable && !isCompactViewport ? /* @__PURE__ */ jsx(
                "span",
                {
                  ...splitProps,
                  "aria-hidden": "true",
                  className: "shrink-0 text-[10px] text-subtle-foreground/50 opacity-0 transition-opacity group-hover/row:opacity-100",
                  children: "\u2922"
                }
              ) : null,
              secondary && !isCompactViewport ? /* @__PURE__ */ jsx("span", { className: "shrink-0 max-w-28 truncate text-[11px] text-subtle-foreground/60", children: secondary }) : null
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            "aria-label": `Actions for ${title}`,
            "aria-haspopup": "menu",
            "aria-expanded": menu.activeThreadId === thread.id,
            title: "Thread actions",
            onClick: (event) => {
              event.stopPropagation();
              const rect = event.currentTarget.getBoundingClientRect();
              menu.openThread(
                thread.id,
                rect.right,
                rect.bottom,
                event.currentTarget
              );
            },
            className: `absolute right-1 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-base leading-none text-subtle-foreground transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 ${isCompactViewport || isActive ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"}`,
            children: /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\u22EF" })
          }
        )
      ]
    }
  );
  if (children.length === 0) return row;
  return /* @__PURE__ */ jsxs("div", { children: [
    row,
    /* @__PURE__ */ jsx("div", { className: "space-y-px", children: children.map((child) => /* @__PURE__ */ jsx(
      ThreadRow,
      {
        thread: child,
        depth: depth + 1,
        childrenOf,
        activeThreadId,
        isCompactViewport,
        onNavigate
      },
      child.id
    )) })
  ] });
}
var MenuContext = createContext(null);
function MenuProvider({ children }) {
  const [menu, setMenu] = useState(null);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (event) => {
      if (event.key === "Escape") {
        menu.returnFocus?.focus();
        close();
      }
    };
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);
  const openThread = (threadId, x, y, returnFocus) => setMenu({ kind: "thread", threadId, x, y, returnFocus });
  const openProject = (projectId, x, y, returnFocus) => setMenu({ kind: "project", projectId, x, y, returnFocus });
  return /* @__PURE__ */ jsxs(
    MenuContext.Provider,
    {
      value: {
        activeThreadId: menu?.kind === "thread" ? menu.threadId : null,
        activeProjectId: menu?.kind === "project" ? menu.projectId : null,
        openThread,
        openProject
      },
      children: [
        children,
        menu?.kind === "thread" ? /* @__PURE__ */ jsx(RowMenu, { menu, onClose: () => setMenu(null) }) : null,
        menu?.kind === "project" ? /* @__PURE__ */ jsx(ProjectMenu, { menu, onClose: () => setMenu(null) }) : null
      ]
    }
  );
}
function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu outside MenuProvider");
  return ctx;
}
function focusableItems(container) {
  return Array.from(
    container.querySelectorAll('[role="menuitem"]')
  );
}
function clampStyle(x, y, width, height) {
  return {
    left: Math.max(4, Math.min(x, window.innerWidth - width)),
    top: Math.max(4, Math.min(y, window.innerHeight - height))
  };
}
var menuItemClass = "w-full rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-accent focus:bg-accent focus:outline-none";
function MenuShell({
  label,
  menu,
  onClose,
  children
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (containerRef.current) focusableItems(containerRef.current).at(0)?.focus();
  }, [menu.kind, menu.kind === "thread" ? menu.threadId : menu.projectId]);
  const handleKeyDown = (event) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = focusableItems(event.currentTarget);
    const current = items.indexOf(
      document.activeElement
    );
    if (event.key === "Home") items[0]?.focus();
    else if (event.key === "End") items.at(-1)?.focus();
    else if (event.key === "ArrowDown")
      items[(current + 1 + items.length) % items.length]?.focus();
    else items[(current - 1 + items.length) % items.length]?.focus();
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: containerRef,
      role: "menu",
      "aria-label": label,
      className: "fixed z-50 min-w-40 rounded-md border border-border bg-popover p-1 shadow-lg",
      style: clampStyle(menu.x, menu.y, 196, 260),
      onClick: (event) => event.stopPropagation(),
      onKeyDown: handleKeyDown,
      children
    }
  );
}
function RowMenu({
  menu,
  onClose
}) {
  const actions = experimental_useSidebarThreadActions();
  const { threads: allThreads } = experimental_useSidebarThreads();
  const thread = allThreads.find((t) => t.id === menu.threadId);
  if (!thread) return null;
  const title = threadTitle(thread);
  return /* @__PURE__ */ jsxs(
    MenuShell,
    {
      label: `Actions for ${title}`,
      menu,
      onClose,
      children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            role: "menuitem",
            className: menuItemClass,
            onClick: () => {
              void actions.setPinned(thread.id, !thread.isPinned);
              onClose();
            },
            children: thread.isPinned ? "Unpin" : "Pin"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            role: "menuitem",
            className: menuItemClass,
            onClick: () => {
              void actions.setRead(thread.id, thread.isUnread);
              onClose();
            },
            children: thread.isUnread ? "Mark as read" : "Mark as unread"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "my-1 h-px bg-border", role: "separator" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            role: "menuitem",
            className: menuItemClass,
            onClick: () => {
              const nextTitle = window.prompt("Rename thread", title);
              if (nextTitle?.trim()) void actions.rename(thread.id, nextTitle.trim());
              onClose();
            },
            children: "Rename\u2026"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            role: "menuitem",
            className: menuItemClass,
            onClick: () => {
              void navigator.clipboard?.writeText(thread.id).catch(() => void 0);
              onClose();
            },
            children: "Copy thread ID"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "my-1 h-px bg-border", role: "separator" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            role: "menuitem",
            className: menuItemClass,
            onClick: () => {
              actions.archive(thread.id);
              onClose();
            },
            children: "Archive"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            role: "menuitem",
            className: `${menuItemClass} text-destructive`,
            onClick: () => {
              actions.requestDelete(thread.id);
              onClose();
            },
            children: "Delete\u2026"
          }
        )
      ]
    }
  );
}
function ProjectMenu({
  menu,
  onClose
}) {
  const actions = experimental_useSidebarThreadActions();
  const rpc = useRpc();
  const { projects: allProjects } = experimental_useSidebarThreads();
  const project = allProjects.find((p) => p.id === menu.projectId);
  if (!project) return null;
  const projectName = project.name;
  return /* @__PURE__ */ jsxs(
    MenuShell,
    {
      label: `Project actions for ${projectName}`,
      menu,
      onClose,
      children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            role: "menuitem",
            className: menuItemClass,
            onClick: () => {
              actions.openNewThread({ projectId: project.id });
              onClose();
            },
            children: "New thread"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            role: "menuitem",
            className: menuItemClass,
            onClick: () => {
              const nextName = window.prompt("Rename project", projectName);
              if (nextName?.trim()) {
                void rpc.call("renameProject", { projectId: project.id, name: nextName.trim() }).catch(() => void 0);
              }
              onClose();
            },
            children: "Rename\u2026"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            role: "menuitem",
            className: menuItemClass,
            onClick: () => {
              void rpc.call("archiveAllThreads", { projectId: project.id }).catch(() => void 0);
              onClose();
            },
            children: "Archive all threads"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "my-1 h-px bg-border", role: "separator" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            role: "menuitem",
            className: `${menuItemClass} text-destructive`,
            onClick: () => {
              if (window.confirm(`Delete project "${projectName}"?`)) {
                void rpc.call("deleteProject", { projectId: project.id }).catch(() => void 0);
              }
              onClose();
            },
            children: "Delete project\u2026"
          }
        )
      ]
    }
  );
}
var app_default = definePluginApp((app) => {
  app.slots.experimental_threadList({
    id: "project-filter",
    title: "Sidebar Project Filter",
    description: "Project-grouped thread list that hides projects without active threads.",
    component: FilteredProjectList
  });
});
export {
  app_default as default
};
