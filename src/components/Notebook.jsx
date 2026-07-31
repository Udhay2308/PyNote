import { useCallback, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Cell from "./Cell";

function SortableCell(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.cell.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative",
    zIndex: isDragging ? 999 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Cell
        {...props}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={props.isAnyDragging}
      />
    </div>
  );
}

function Notebook({
  title,
  setTitle,
  isEditingTitle,
  setIsEditingTitle,
  cells,
  addCell,
  updateCell,
  deleteCell,
  runCell,
  submitInput,
  reorderCells,
  running,
  lastSaved,
  isDark,
  onExportIpynb,
  onExportPy,
  onResetKernel,
}) {
  const [isAnyDragging, setIsAnyDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback(() => {
    setIsAnyDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      setIsAnyDragging(false);

      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = cells.findIndex((c) => c.id === active.id);
      const newIndex = cells.findIndex((c) => c.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newCells = arrayMove(cells, oldIndex, newIndex);
      reorderCells(newCells);
    },
    [cells, reorderCells]
  );

  const handleDragCancel = useCallback(() => {
    setIsAnyDragging(false);
  }, []);

  const savedText = lastSaved
    ? `Auto-saved at ${lastSaved.toLocaleTimeString()}`
    : "Not saved yet";

  return (
    <div style={{ width: "100%", padding: "0 10px" }}>

      {/* Toolbar */}
      <div style={{
        position: "sticky",
        top: "-24px",
        zIndex: 100,
        background: isDark ? "#141414" : "#ffffff",
        padding: "16px 0",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "16px",
        flexWrap: "wrap",
        borderBottom: `1px solid ${isDark ? "#293243" : "#e0e0e0"}`,
      }}>
        {isEditingTitle ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              border: "none",
              borderBottom: "2px solid #4a90d9",
              outline: "none",
              background: "transparent",
              color: isDark ? "#fff" : "#111",
              flex: 1,
            }}
          />
        ) : (
          <h1
            onClick={() => setIsEditingTitle(true)}
            title="Click to rename"
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              flex: 1,
              color: isDark ? "#fff" : "#111",
              cursor: "pointer",
              margin: 0,
            }}
          >
            {title}
          </h1>
        )}

        <span style={{ fontSize: "12px", color: "#888" }}>{savedText}</span>
        <button onClick={onResetKernel} style={btnStyle("#8B1A1A", "#fff")}>↺ Reset Kernel</button>
        <button onClick={onExportPy} style={btnStyle("#8B1A1A", "#fff")}>Export .py</button>
        <button onClick={onExportIpynb} style={btnStyle("#8B1A1A", "#fff")}>Export .ipynb</button>
      </div>

      {/* Cells */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={cells.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cells.map((cell, index) => (
            <SortableCell
              key={cell.id}
              cell={cell}
              index={index}
              updateCell={updateCell}
              deleteCell={deleteCell}
              runCell={runCell}
              submitInput={submitInput}
              isRunning={!!running[cell.id]}
              isAnyDragging={isAnyDragging}
              isDark={isDark}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        onClick={addCell}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #8B1A1A",
          background: "#8B1A1A",
          color: "#fff",
          cursor: "pointer",
          fontSize: "15px",
          fontWeight: "500",
          marginTop: "8px",
        }}
      >
        + Add Cell
      </button>
    </div>
  );
}

const btnStyle = (bg, color) => ({
  padding: "5px 12px",
  borderRadius: "6px",
  border: `1px solid ${bg}`,
  background: bg,
  color,
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "500",
});

export default Notebook;