import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import { useRef, useState } from "react";

function Cell({
  cell,
  index,
  updateCell,
  deleteCell,
  runCell,
  submitInput,
  isRunning,
  dragHandleProps,
  isDragging,
  isDark,
}) {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      runCell(cell.id, "next");
    } else if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      runCell(cell.id, "stay");
    }
  };

  const updateEditorHeight = (editor) => {
    const lineCount = editor.getModel()?.getLineCount() || 1;
    const lineHeight = 19;
    const padding = 20;
    const minHeight = 100;
    const newHeight = Math.max(minHeight, lineCount * lineHeight + padding);
    if (containerRef.current) {
      containerRef.current.style.height = `${newHeight}px`;
    }
    editor.layout();
  };

  const renderOutput = () => {
    if (!cell.output || cell.output === "") {
      return <span style={{ color: isDark ? "#9AA4B2" : "#888" }}>No output yet</span>;
    }
    if (typeof cell.output === "string") {
      return <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: isDark ? "#F5F7FA" : "#111" }}>{cell.output}</pre>;
    }
    if (cell.output.type === "error") {
      return (
        <pre style={{ color: "#ff5555", margin: 0, whiteSpace: "pre-wrap" }}>
          {cell.output.content}
        </pre>
      );
    }
    if (cell.output.type === "input_request") {
      return (
        <div>
          {cell.output.text && (
            <pre style={{ margin: "0 0 8px", whiteSpace: "pre-wrap", color: isDark ? "#F5F7FA" : "#111" }}>
              {cell.output.text}
            </pre>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = inputValue;
              setInputValue("");
              submitInput(cell.id, val);
            }}
            style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}
          >
            <span style={{ color: "#4A90E2", fontWeight: "600", fontSize: "13px" }}>
              {cell.output.prompt || "Input:"}
            </span>
            <input
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type input and press Enter..."
              style={{
                flex: 1,
                padding: "6px 12px",
                borderRadius: "6px",
                border: `1px solid ${isDark ? "#384458" : "#ccc"}`,
                background: isDark ? "#171F2D" : "#fff",
                color: isDark ? "#fff" : "#111",
                fontSize: "13px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={isRunning}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "none",
                background: "#4A90E2",
                color: "#fff",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Submit
            </button>
          </form>
        </div>
      );
    }
    if (cell.output.type === "image") {
      return (
        <>
          {cell.output.text && (
            <pre style={{ margin: "0 0 8px", whiteSpace: "pre-wrap", color: isDark ? "#F5F7FA" : "#111" }}>
              {cell.output.text}
            </pre>
          )}
          <img
            src={`data:image/png;base64,${cell.output.content}`}
            alt="plot output"
            style={{ maxWidth: "100%", borderRadius: "4px" }}
          />
        </>
      );
    }
    return (
      <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: isDark ? "#F5F7FA" : "#111" }}>
        {cell.output.content ?? ""}
      </pre>
    );
  };

  // Theme colors
  const cellBg = isDark ? "#171F2D" : "#ffffff";
  const cellBorder = isDark ? "#293243" : "#e0e0e0";
  const headerBg = isDark ? "#141A26" : "#f8f8f8";
  const outputBg = isDark ? "#0F1625" : "#f5f5f5";
  const outputBorder = isDark ? "#2D3748" : "#e0e0e0";
  const cellText = isDark ? "#F5F7FA" : "#111";

  return (
    <div style={{
      border: `1px solid ${cellBorder}`,
      borderRadius: "14px",
      marginBottom: "20px",
      background: cellBg,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 15px",
        borderBottom: `1px solid ${cellBorder}`,
        background: headerBg,
        gap: "10px",
      }}>
        <span
          {...dragHandleProps}
          title="Drag to reorder"
          style={{ cursor: "grab", color: "#9AA4B2", fontSize: "18px", userSelect: "none" }}
        >
          ⠿
        </span>

        <span style={{ color: cellText, fontWeight: "600", fontSize: "13px" }}>
          Cell {index + 1}
        </span>

        {/* Code / Notes toggle */}
        <div style={{
          marginLeft: "auto",
          display: "flex",
          background: isDark ? "#0B0F19" : "#e8e8e8",
          borderRadius: "8px",
          padding: "3px",
          gap: "2px",
        }}>
          <button
            onClick={() => updateCell(cell.id, undefined, "code")}
            style={{
              padding: "4px 14px",
              borderRadius: "6px",
              border: "none",
              background: cell.type !== "markdown" ? "#8B1A1A" : "transparent",
              color: cell.type !== "markdown" ? "#fff" : isDark ? "#9AA4B2" : "#666",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "500",
              transition: "all 0.15s",
            }}
          >
            Code
          </button>
          <button
            onClick={() => updateCell(cell.id, undefined, "markdown")}
            style={{
              padding: "4px 14px",
              borderRadius: "6px",
              border: "none",
              background: cell.type === "markdown" ? "#8B1A1A" : "transparent",
              color: cell.type === "markdown" ? "#fff" : isDark ? "#9AA4B2" : "#666",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "500",
              transition: "all 0.15s",
            }}
          >
            Notes
          </button>
        </div>
      </div>

      {/* Code section */}
      {cell.type !== "markdown" && (
        <div style={{ padding: "12px 15px 0", background: cellBg }}>
          <div
            ref={containerRef}
            onKeyDown={handleKeyDown}
            style={{ height: "100px" }}
          >
            {isDragging ? (
              <div style={{
                height: "100%", minHeight: "100px",
                background: isDark ? "#2a2a2a" : "#f0f0f0",
                borderRadius: "4px",
                display: "flex", alignItems: "center", paddingLeft: "12px",
                color: "#9AA4B2", fontSize: "13px", fontFamily: "monospace",
              }}>
                {cell.code?.split("\n")[0] || "..."}
              </div>
            ) : (
              <Editor
                key={cell.id}
                height="100%"
                defaultLanguage="python"
                value={cell.code}
                theme={isDark ? "vs-dark" : "light"}
                onChange={(value) => {
                  updateCell(cell.id, value ?? "");
                  if (editorRef.current) updateEditorHeight(editorRef.current);
                }}
                onMount={(editor) => {
                  editorRef.current = editor;
                  updateEditorHeight(editor);
                  editor.onDidChangeModelContent(() => updateEditorHeight(editor));
                }}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  scrollbar: { vertical: "hidden", horizontal: "hidden", handleMouseWheel: false },
                  overviewRulerLanes: 0,
                  wordWrap: "on",
                }}
              />
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "8px", margin: "10px 0" }}>
            <button
              onClick={() => runCell(cell.id)}
              disabled={isRunning}
              style={{
                padding: "6px 16px",
                borderRadius: "8px",
                border: "none",
                background: isRunning ? "#384458" : "#8B1A1A",
                color: "#fff",
                cursor: isRunning ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "13px",
                boxShadow: isRunning ? "none" : "0 4px 12px rgba(139,26,26,0.3)",
                transition: ".2s",
              }}
            >
              {isRunning ? "Running…" : "▶ Run"}
            </button>

            <button
              onClick={() => deleteCell(cell.id)}
              disabled={isRunning}
              style={{
                padding: "6px 16px",
                borderRadius: "8px",
                border: `1px solid ${isDark ? "#384458" : "#ddd"}`,
                background: "transparent",
                color: "#EF4444",
                cursor: isRunning ? "not-allowed" : "pointer",
                fontSize: "13px",
                transition: ".2s",
              }}
            >
              Delete
            </button>
          </div>

          {/* Output */}
          <div style={{
            padding: "12px",
            background: outputBg,
            borderTop: `1px solid ${outputBorder}`,
            borderRadius: "0 0 14px 14px",
            minHeight: "40px",
          }}>
            <div style={{ fontSize: "11px", color: "#9AA4B2", marginBottom: "6px", letterSpacing: "0.5px" }}>
              OUTPUT
            </div>
            {isRunning
              ? <span style={{ color: "#9AA4B2" }}>Running…</span>
              : renderOutput()
            }
          </div>
        </div>
      )}

      {/* Notes section */}
      {cell.type === "markdown" && (
        <div style={{ padding: "12px 15px", background: cellBg }}>
          {editingNotes ? (
            <textarea
              autoFocus
              value={cell.markdown || ""}
              onChange={(e) => updateCell(cell.id, e.target.value, "markdown", "markdown")}
              onBlur={() => setEditingNotes(false)}
              placeholder="Write your notes here... (Markdown supported)"
              style={{
                width: "100%", minHeight: "120px",
                background: isDark ? "#FFF8E7" : "#FFF8E7",
                border: "1px solid #8B1A1A",
                borderRadius: "8px", color: "#4B3D00",
                padding: "12px", fontSize: "14px",
                fontFamily: "Inter, sans-serif", outline: "none",
                resize: "vertical", boxSizing: "border-box", lineHeight: "1.6",
              }}
            />
          ) : (
            <div
              onClick={() => setEditingNotes(true)}
              style={{
                minHeight: "80px", padding: "12px",
                background: "#FFF8E7",
                borderRadius: "8px", color: "#4B3D00",
                cursor: "text", lineHeight: "1.6", fontSize: "14px",
              }}
            >
              {cell.markdown ? (
                <ReactMarkdown>{cell.markdown}</ReactMarkdown>
              ) : (
                <span style={{ color: "#9B8B6B", fontStyle: "italic" }}>
                  Click to write notes... (Markdown supported)
                </span>
              )}
            </div>
          )}

          <div style={{ marginTop: "10px" }}>
            <button
              onClick={() => deleteCell(cell.id)}
              style={{
                padding: "6px 16px", borderRadius: "8px",
                border: `1px solid ${isDark ? "#384458" : "#ddd"}`,
                background: "transparent", color: "#EF4444",
                cursor: "pointer", fontSize: "13px",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cell;