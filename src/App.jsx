import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AuthCallback from "./pages/AuthCallback";
import Sidebar from "./components/Sidebar";
import Notebook from "./components/Notebook";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const createNotebook = (name = "Untitled Notebook") => ({
  notebookId: `nb_${Date.now()}`,
  title: name,
  cells: [
    {
      id: Date.now() + 1,
      code: 'print("Hello from Cell 1")',
      markdown: "",
      output: "",
      type: "code",
    },
  ],
});
function App() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [authPage, setAuthPage] = useState("login");

  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") !== "light");
  const [notebooks, setNotebooks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [running, setRunning] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auth headers helper
  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  // ── Load notebooks on startup (only when logged in) ───────────────────

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const loadNotebooks = async () => {
      try {
        const res = await fetch(`${API}/notebooks`, {
          headers: authHeaders(),
        });
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          const firstRes = await fetch(`${API}/notebooks/${data[0].notebookId}`, {
            headers: authHeaders(),
          });
          const firstFull = await firstRes.json();

          setNotebooks([
            normalizeNotebook(firstFull),
            ...data.slice(1).map((nb) => ({
              notebookId: nb.notebookId,
              title: nb.title,
              cells: [],
            })),
          ]);
          setActiveId(firstFull.notebookId);
        } else {
          const nb = createNotebook();
          const createRes = await fetch(`${API}/notebooks`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(nb),
          });
          const saved = await createRes.json();
          setNotebooks([normalizeNotebook(saved)]);
          setActiveId(saved.notebookId);
        }
      } catch (err) {
        console.error("Failed to load notebooks:", err);
      } finally {
        setLoading(false);
      }
    };

    loadNotebooks();
  }, [token]);

  // Load full notebook when switching to one with empty cells
  useEffect(() => {
    if (!activeId || !token) return;
    const current = notebooks.find((nb) => nb.notebookId === activeId);
    if (current && current.cells.length === 0) {
      fetch(`${API}/notebooks/${activeId}`, { headers: authHeaders() })
        .then((r) => r.json())
        .then((full) => {
          setNotebooks((prev) =>
            prev.map((nb) => (nb.notebookId === activeId ? normalizeNotebook(full) : nb))
          );
        })
        .catch((err) => console.error("Failed to load notebook:", err));
    }
  }, [activeId]);

  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Ensures every cell has both `code` and `markdown` fields,
  // even for notebooks saved before the markdown field existed.
  const normalizeNotebook = (nb) => ({
    ...nb,
    cells: (nb.cells || []).map((c) => ({
      ...c,
      code: c.code ?? "",
      markdown: c.markdown ?? "",
    })),
  });

  const saveNotebook = useCallback(async (notebook) => {
    if (!token) return;
    try {
      await fetch(`${API}/notebooks/${notebook.notebookId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ title: notebook.title, cells: notebook.cells }),
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error("Save failed:", err);
    }
  }, [token]);

  const activeNotebook = notebooks.find((nb) => nb.notebookId === activeId);

  // ── Notebook helpers ──────────────────────────────────────────────────

  const addNotebook = async () => {
    try {
      const nb = createNotebook(`Notebook ${notebooks.length + 1}`);
      const res = await fetch(`${API}/notebooks`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(nb),
      });
      const saved = await res.json();
      setNotebooks((prev) => [...prev, normalizeNotebook(saved)]);
      setActiveId(saved.notebookId);
    } catch (err) {
      console.error("Failed to create notebook:", err);
    }
  };

  const deleteNotebook = async (notebookId) => {
    if (notebooks.length === 1) return;
    try {
      await fetch(`${API}/notebooks/${notebookId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const updated = notebooks.filter((nb) => nb.notebookId !== notebookId);
      setNotebooks(updated);
      if (notebookId === activeId) {
        setActiveId(updated[0].notebookId);
      }
    } catch (err) {
      console.error("Failed to delete notebook:", err);
    }
  };

  const importNotebook = async (fileContent, fileName) => {
    try {
      const parsed = JSON.parse(fileContent);
      const cells = (parsed.cells || []).map((cell) => {
        const isMarkdown = cell.cell_type === "markdown";
        const source = Array.isArray(cell.source) ? cell.source.join("") : cell.source || "";
        return {
          id: Date.now() + Math.random(),
          type: isMarkdown ? "markdown" : "code",
          code: isMarkdown ? "" : source,
          markdown: isMarkdown ? source : "",
          output: "",
        };
      });

      const nb = {
        notebookId: `nb_${Date.now()}`,
        title: fileName.replace(".ipynb", ""),
        cells: cells.length > 0
          ? cells
          : [{ id: Date.now() + 1, code: "", markdown: "", output: "", type: "code" }],
      };

      const res = await fetch(`${API}/notebooks`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(nb),
      });
      const saved = await res.json();
      setNotebooks((prev) => [...prev, normalizeNotebook(saved)]);
      setActiveId(saved.notebookId);
    } catch (err) {
      alert("Failed to import notebook.");
    }
  };

  const setTitle = (title) => {
    setNotebooks((prev) =>
      prev.map((nb) => (nb.notebookId === activeId ? { ...nb, title } : nb))
    );
  };

  useEffect(() => {
    if (!isEditingTitle && activeNotebook) {
      saveNotebook(activeNotebook);
    }
  }, [isEditingTitle]);

  // ── Cell helpers ──────────────────────────────────────────────────────

  const updateCells = (updater) => {
    setNotebooks((prev) =>
      prev.map((nb) => {
        if (nb.notebookId !== activeId) return nb;
        const updated = { ...nb, cells: updater(nb.cells) };
        saveNotebook(updated);
        return updated;
      })
    );
  };

  const addCell = () => {
    updateCells((cells) => [
      ...cells,
      { id: Date.now(), code: "", markdown: "", output: "", type: "code" },
    ]);
  };

  const deleteCell = (id) => {
    updateCells((cells) => cells.filter((c) => c.id !== id));
  };

  // Accepts a partial object of changes, e.g. updateCell(id, { code: "..." })
  // or updateCell(id, { type: "markdown" }). Only the passed fields are merged,
  // so updating code never touches markdown and vice versa.
const updateCell = (id, value, type, field = "code") => {
  updateCells((cells) =>
    cells.map((c) => {
      if (c.id !== id) return c;
      const updated = { ...c };
      if (type !== undefined) updated.type = type;
      if (value !== undefined) updated[field] = value;
      return updated;
    })
  );
};

  const reorderCells = useCallback((newCells) => {
    setNotebooks((prev) =>
      prev.map((nb) => {
        if (nb.notebookId !== activeId) return nb;
        const updated = { ...nb, cells: newCells };
        saveNotebook(updated);
        return updated;
      })
    );
  }, [activeId]);

  // ── Run cell ──────────────────────────────────────────────────────────

  const runCell = async (id) => {
    const currentCode = notebooks
      .find((nb) => nb.notebookId === activeId)
      ?.cells.find((c) => c.id === id)?.code;

    if (!currentCode) return;

    setRunning((prev) => ({ ...prev, [id]: true }));

    try {
      const response = await fetch(`${API}/execute`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ code: currentCode, notebookId: activeId }),
      });
      const data = await response.json();
      updateCells((cells) =>
        cells.map((c) => (c.id === id ? { ...c, output: data } : c))
      );
    } catch {
      updateCells((cells) =>
        cells.map((c) =>
          c.id === id
            ? { ...c, output: { type: "error", content: "Backend connection failed" } }
            : c
        )
      );
    } finally {
      setRunning((prev) => ({ ...prev, [id]: false }));
    }
  };

  // ── Kernel reset ──────────────────────────────────────────────────────

  const resetKernel = async () => {
    await fetch(`${API}/kernel/reset`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ notebookId: activeId }),
    });
    updateCells((cells) => cells.map((c) => ({ ...c, output: "" })));
  };

  // ── Export ────────────────────────────────────────────────────────────

  const exportPy = () => {
    const code = activeNotebook.cells
      .filter((c) => c.type === "code")
      .map((c, i) => `# Cell ${i + 1}\n${c.code}`)
      .join("\n\n");
    download(`${activeNotebook.title}.py`, code, "text/plain");
  };

  const exportIpynb = () => {
    const ipynb = {
      nbformat: 4,
      nbformat_minor: 5,
      metadata: {
        kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
      },
      cells: activeNotebook.cells.map((c) => {
        const isMarkdown = c.type === "markdown" || c.type === "markdown-edit";
        const content = isMarkdown ? c.markdown : c.code;
        return {
          cell_type: isMarkdown ? "markdown" : "code",
          source: (content || "").split("\n").map((l, i, arr) =>
            i < arr.length - 1 ? l + "\n" : l
          ),
          metadata: {},
          outputs: [],
          ...(!isMarkdown && { execution_count: null }),
        };
      }),
    };
    download(
      `${activeNotebook.title}.ipynb`,
      JSON.stringify(ipynb, null, 2),
      "application/json"
    );
  };

  const download = (filename, content, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ────────────────────────────────────────────────────────────

  const bg = isDark ? "#141414" : "#ffffff";

  // Handle Google OAuth callback
  if (window.location.pathname === "/auth/callback") {
    return <AuthCallback />;
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100%", background: "#141414", color: "#fff", fontSize: "18px",
      }}>
        Loading...
      </div>
    );
  }

  // Show login/register if not logged in
  if (!user) {
    return authPage === "login"
      ? <LoginPage onSwitch={() => setAuthPage("register")} />
      : <RegisterPage onSwitch={() => setAuthPage("login")} />;
  }

  // Show loading while fetching notebooks
  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        background: "#141414",
        color: "#fff",
        gap: "16px",
      }}>
        <div style={{ fontSize: "32px" }}>📓</div>
        <div style={{ fontSize: "18px", fontWeight: "600" }}>Loading notebooks...</div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      background: bg,
    }}>
      <Sidebar
        notebooks={notebooks}
        activeId={activeId}
        onSelect={(id) => setActiveId(id)}
        onAdd={addNotebook}
        onDelete={deleteNotebook}
        onImport={importNotebook}
        onLogout={logout}
        user={user}
        isDark={isDark}
        toggleDark={() => setIsDark((d) => !d)}
      />

      <div style={{ flex: 1, padding: "24px", overflowY: "auto", height: "100%" }}>
        {activeNotebook ? (
          <Notebook
            notebookId={activeId}
            title={activeNotebook.title}
            setTitle={setTitle}
            isEditingTitle={isEditingTitle}
            setIsEditingTitle={setIsEditingTitle}
            cells={activeNotebook.cells}
            addCell={addCell}
            updateCell={updateCell}
            deleteCell={deleteCell}
            runCell={runCell}
            reorderCells={reorderCells}
            running={running}
            lastSaved={lastSaved}
            isDark={isDark}
            onExportIpynb={exportIpynb}
            onExportPy={exportPy}
            onResetKernel={resetKernel}
          />
        ) : (
          <p style={{ color: isDark ? "#fff" : "#111" }}>No notebook selected.</p>
        )}
      </div>
    </div>
  );
}
export default App;
