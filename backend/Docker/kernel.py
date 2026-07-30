import sys
import json
import base64
import io
import traceback
import signal
import subprocess

HAS_PLT = False
plt = None

def init_matplotlib():
    global HAS_PLT, plt
    if HAS_PLT:
        return True
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt_module
        plt = plt_module
        HAS_PLT = True
        return True
    except ImportError:
        return False

MODULE_MAP = {
    "sklearn": "scikit-learn",
    "PIL": "pillow",
    "cv2": "opencv-python",
    "bs4": "beautifulsoup4",
    "yaml": "pyyaml",
    "skimage": "scikit-image",
    "mpl_toolkits": "matplotlib",
    "fitz": "pymupdf",
    "docx": "python-docx",
    "pptx": "python-pptx",
    "wx": "wxpython",
    "crypto": "pycryptodome",
    "Crypto": "pycryptodome",
    "google": "protobuf",
}

def install_package(pkg):
    target_pkg = MODULE_MAP.get(pkg, pkg)
    try:
        import pip  # noqa: F401
    except ImportError:
        try:
            subprocess.check_call([sys.executable, "-m", "ensurepip", "--default-pip"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass

    for cmd in [
        [sys.executable, "-m", "pip", "install", target_pkg, "--break-system-packages"],
        [sys.executable, "-m", "pip", "install", target_pkg, "--user"],
        [sys.executable, "-m", "pip", "install", target_pkg],
    ]:
        try:
            subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        except Exception:
            continue
    return False

# Non-blocking attempt to load matplotlib if already available
init_matplotlib()

_input_call_count = 0

def _smart_input(prompt=""):
    global _input_call_count
    _input_call_count += 1

    # Smart variable inspector for guessing games / interactive logic
    target_val = None
    for k in ["secret", "target", "answer", "number", "solution", "num", "ans"]:
        if k in _globals and isinstance(_globals[k], (int, float, str)):
            target_val = str(_globals[k])
            break

    if target_val is not None and _input_call_count >= 2:
        val = target_val
    else:
        seq = ["10", "15", "5", "20", "1", "0"]
        val = seq[(_input_call_count - 1) % len(seq)]

    if prompt:
        print(f"{prompt}{val}")
    else:
        print(val)

    if _input_call_count > 10:
        raise EOFError("Interactive input stream ended")

    return val

# Shared globals — variables persist between cell runs
_globals = {
    "input": _smart_input,
}

def run_cell(code):
    global HAS_PLT, plt, _input_call_count
    _input_call_count = 0
    if not HAS_PLT:
        init_matplotlib()

    old_stdout = sys.stdout
    old_stderr = sys.stderr
    sys.stdout = io.StringIO()
    sys.stderr = io.StringIO()

    result = {}

    try:
        try:
            exec(compile(code, '<cell>', 'exec'), _globals)
        except (EOFError, KeyboardInterrupt):
            # Gracefully finish interactive loops without throwing red errors
            pass
        except ModuleNotFoundError as err:
            missing_pkg = err.name.split('.')[0] if err.name else None
            if missing_pkg:
                install_package(missing_pkg)
                if missing_pkg == "matplotlib":
                    init_matplotlib()
                try:
                    exec(compile(code, '<cell>', 'exec'), _globals)
                except (EOFError, KeyboardInterrupt):
                    pass
            else:
                raise err

        stdout = sys.stdout.getvalue()

        # Check for matplotlib figure
        if HAS_PLT and plt and plt.get_fignums():
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight')
            plt.close('all')
            buf.seek(0)
            img = base64.b64encode(buf.read()).decode('utf-8')
            result = {"type": "image", "content": img, "text": stdout, "success": True}
        else:
            result = {"type": "text", "content": stdout, "success": True}

    except Exception:
        result = {"type": "error", "content": traceback.format_exc(), "success": False}

    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    return result

# Main loop — reads code from stdin, executes, writes result to stdout
# Uses a special delimiter to separate messages
if __name__ == '__main__':
    # Signal ready
    sys.stdout.write('KERNEL_READY\n')
    sys.stdout.flush()

    while True:
        try:
            # Read lines until we get END_OF_CODE marker
            lines = []
            while True:
                line = sys.stdin.readline()
                if not line:
                    sys.exit(0)
                line = line.rstrip('\r\n')
                if line.strip() == '__END_CODE__':
                    break
                lines.append(line)

            code = '\n'.join(lines)
            result = run_cell(code)

            # Write result as single JSON line
            sys.stdout.write(json.dumps(result) + '\n')
            sys.stdout.flush()

        except Exception as e:
            sys.stdout.write(json.dumps({
                "type": "error",
                "content": str(e),
                "success": False
            }) + '\n')
            sys.stdout.flush()