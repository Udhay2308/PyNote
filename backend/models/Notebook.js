import mongoose from "mongoose";

const CellSchema = new mongoose.Schema({
  id: Number,
  code: { type: String, default: "" },
  markdown: { type: String, default: "" },
  output: mongoose.Schema.Types.Mixed,
  type: { type: String, default: "code" },
});

const NotebookSchema = new mongoose.Schema(
  {
    notebookId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "Untitled Notebook" },
    cells: [CellSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Notebook", NotebookSchema);