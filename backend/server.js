import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import { existsSync } from "fs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import Notebook from "./models/Notebook.js";
import authRoutes from "./routes/auth.js";
import { protect } from "./middleware/auth.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USE_DOCKER = process.env.USE_DOCKER === "true";

const app = express();
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "https://py-note-sigma.vercel.app",
    "https://py-note-git-main-udhays-projects-c762f318.vercel.app"
  ],
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

console.log(`Running in ${USE_DOCKER ? "Docker (secure)" : "Direct Python (free)"} mode`);

// ── Rate Limiting ─────────────────────────────────────────────────────────

// General limit — 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth limit — prevent brute force attacks
// Only 10 login/register attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Execute limit — max 30 cell runs per minute per IP
const executeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many code executions. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general limiter to all routes
app.use(generalLimiter);

// ── MongoDB ───────────────────────────────────────────────────────────────

mongoose
  .connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// ── Auth Routes (with auth rate limiter) ──────────────────────────────────

app.use("/auth", authLimiter, authRoutes);

// ── Kernel Management ─────────────────────────────────────────────────────

const kernels = {};
const IDLE_TIMEOUT = 30 * 60 * 1000;
const MAX_KERNELS = USE_DOCKER ? 20 : 5;
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function startKernel(notebookId) {
  return new Promise((resolve, reject) => {
    const activeCount = Object.keys(kernels).length;
    if (activeCount >= MAX_KERNELS) {
      return reject(new Error(`Server at capacity (${MAX_KERNELS} kernels). Try again later.`));
    }

    const kernelPath = existsSync(path.join(__dirname, "Docker", "kernel.py"))
      ? path.join(__dirname, "Docker", "kernel.py")
      : path.join(__dirname, "docker", "kernel.py");
    const containerName = `kernel_${notebookId}_${randomBytes(4).toString("hex")}`;

    const venvWin = path.join(__dirname, "venv", "Scripts", "python.exe");
    const venvNix = path.join(__dirname, "venv", "bin", "python3");
    let pythonExec = process.env.PYTHON_PATH;
    if (!pythonExec) {
      if (existsSync(venvNix)) pythonExec = venvNix;
      else if (existsSync(venvWin)) pythonExec = venvWin;
      else pythonExec = process.platform === "win32" ? "python" : "python3";
    }

    const proc = USE_DOCKER
      ? spawn("docker", [
          "run", "--rm", "-i",
          "--name", containerName,
          "--network", "none",
          "--memory", "256m",
          "--cpus", "1.0",
          "python-sandbox",
          "python3", "/kernel.py",
        ])
      : spawn(pythonExec, [kernelPath]);

    const kernel = {
      process: proc,
      containerName: USE_DOCKER ? containerName : null,
      queue: [],
      busy: false,
      ready: false,
      lastUsed: Date.now(),
      notebookId,
    };

    proc.stdout.once("data", (data) => {
      if (data.toString().includes("KERNEL_READY")) {
        kernel.ready = true;
        kernels[notebookId] = kernel;
        console.log(`Kernel started [${notebookId}] mode=${USE_DOCKER ? "docker" : "direct"} active=${Object.keys(kernels).length}`);
        resolve(kernel);
      }
    });

    proc.stderr.on("data", (data) => {
      console.error(`Kernel stderr [${notebookId}]:`, data.toString());
    });

    proc.on("close", () => {
      console.log(`Kernel closed [${notebookId}]`);
      delete kernels[notebookId];
    });

    proc.on("error", (err) => {
      console.error(`Kernel error [${notebookId}]:`, err);
      reject(err);
    });

    setTimeout(() => {
      if (!kernel.ready) {
        proc.kill();
        reject(new Error("Kernel startup timed out"));
      }
    }, 60000);
  });
}

function runInKernel(kernel, code) {
  return new Promise((resolve) => {
    let output = "";
    kernel.lastUsed = Date.now();

    const onData = (data) => {
      output += data.toString();
      const lines = output.split("\n");
      for (const line of lines) {
        if (line.trim().startsWith("{")) {
          try {
            const result = JSON.parse(line.trim());
            kernel.process.stdout.removeListener("data", onData);
            kernel.busy = false;
            kernel.lastUsed = Date.now();
            processQueue(kernel);
            resolve(result);
            return;
          } catch {}
        }
      }
    };

    kernel.process.stdout.on("data", onData);
    const cleanCode = code.replace(/\r\n/g, "\n");
    kernel.process.stdin.write(cleanCode + "\n__END_CODE__\n");
    kernel.busy = true;

    setTimeout(() => {
      kernel.process.stdout.removeListener("data", onData);
      kernel.busy = false;
      processQueue(kernel);
      resolve({
        type: "error",
        content: "Cell execution timed out (120s)",
        success: false,
      });
    }, 120000);
  });
}

function processQueue(kernel) {
  if (kernel.queue.length > 0 && !kernel.busy) {
    const next = kernel.queue.shift();
    runInKernel(kernel, next.code).then(next.resolve);
  }
}

async function getOrCreateKernel(notebookId) {
  if (kernels[notebookId]?.ready) {
    kernels[notebookId].lastUsed = Date.now();
    return kernels[notebookId];
  }
  return await startKernel(notebookId);
}

// ── Idle kernel cleanup ───────────────────────────────────────────────────

function cleanIdleKernels() {
  const now = Date.now();
  let killed = 0;

  Object.entries(kernels).forEach(([id, kernel]) => {
    const idleTime = now - kernel.lastUsed;
    if (idleTime > IDLE_TIMEOUT) {
      console.log(`Killing idle kernel [${id}] idle=${Math.round(idleTime / 60000)}min`);
      try { kernel.process.kill(); } catch {}
      delete kernels[id];
      killed++;
    }
  });

  if (killed > 0) {
    console.log(`Cleanup: killed ${killed} kernel(s) — active=${Object.keys(kernels).length}`);
  }
}

setInterval(cleanIdleKernels, CLEANUP_INTERVAL);

// ── Notebook Routes ───────────────────────────────────────────────────────

app.get("/notebooks", protect, async (req, res) => {
  try {
    const notebooks = await Notebook.find(
      { userId: req.user._id },
      "notebookId title createdAt updatedAt"
    );
    res.json(notebooks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/notebooks/:id", protect, async (req, res) => {
  try {
    const notebook = await Notebook.findOne({
      notebookId: req.params.id,
      userId: req.user._id,
    });
    if (!notebook) return res.status(404).json({ error: "Notebook not found" });
    res.json(notebook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/notebooks", protect, async (req, res) => {
  try {
    const { notebookId, title, cells } = req.body;
    const notebook = new Notebook({
      notebookId,
      title,
      cells,
      userId: req.user._id,
    });
    await notebook.save();
    res.json(notebook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/notebooks/:id", protect, async (req, res) => {
  try {
    const { title, cells } = req.body;
    const notebook = await Notebook.findOneAndUpdate(
      { notebookId: req.params.id, userId: req.user._id },
      { title, cells },
      { new: true, upsert: true }
    );
    res.json(notebook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/notebooks/:id", protect, async (req, res) => {
  try {
    await Notebook.findOneAndDelete({
      notebookId: req.params.id,
      userId: req.user._id,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Execute (with execute rate limiter) ───────────────────────────────────

app.post("/execute", protect, executeLimiter, async (req, res) => {
  const { code, notebookId } = req.body;
  if (!code) {
    return res.json({ type: "error", content: "No code provided.", success: false });
  }

  try {
    const kernel = await getOrCreateKernel(notebookId);
    if (kernel.busy) {
      const result = await new Promise((resolve) => {
        kernel.queue.push({ code, resolve });
      });
      return res.json(result);
    }
    const result = await runInKernel(kernel, code);
    res.json(result);
  } catch (err) {
    res.json({ type: "error", content: err.message, success: false });
  }
});

app.post("/kernel/reset", protect, (req, res) => {
  const { notebookId } = req.body;
  if (kernels[notebookId]) {
    try { kernels[notebookId].process.kill(); } catch {}
    delete kernels[notebookId];
  }
  res.json({ success: true });
});

// ── Health ────────────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mode: USE_DOCKER ? "docker" : "direct",
    activeKernels: Object.keys(kernels).length,
    maxKernels: MAX_KERNELS,
    rateLimiting: {
      general: "100 requests per 15 minutes",
      auth: "10 attempts per 15 minutes",
      execute: "30 runs per minute",
    },
    kernels: Object.entries(kernels).map(([id, k]) => ({
      id,
      idleMinutes: Math.round((Date.now() - k.lastUsed) / 60000),
      busy: k.busy,
      queued: k.queue.length,
    })),
  });
});

// ── Serve Frontend Static Files (Single Deployment Mode) ───────────────────
const distPath = path.join(__dirname, "..", "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

process.on("SIGINT", () => {
  console.log("Shutting down — killing all kernels...");
  Object.values(kernels).forEach((k) => { try { k.process.kill(); } catch {} });
  process.exit(0);
});

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
);