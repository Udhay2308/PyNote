import sys
import json
import base64
import io
import traceback
import signal
import subprocess

HAS_PLT = False
plt = None
INSTALLED_PACKAGES = set()
FAILED_PACKAGES = set()

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
    if pkg in FAILED_PACKAGES or pkg in INSTALLED_PACKAGES:
        return pkg in INSTALLED_PACKAGES

    target_pkg = MODULE_MAP.get(pkg, pkg)
    
    # Try fast single pip install command with timeout
    cmd = [sys.executable, "-m", "pip", "install", "--no-cache-dir", target_pkg]
    try:
        subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=15)
        INSTALLED_PACKAGES.add(pkg)
        return True
    except Exception:
        # Fallback try without --no-cache-dir
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", target_pkg], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=15)
            INSTALLED_PACKAGES.add(pkg)
            return True
        except Exception:
            FAILED_PACKAGES.add(pkg)
            return False

# Non-blocking attempt to load matplotlib if already available
init_matplotlib()

def _interactive_input(prompt=""):
    captured = sys.stdout.getvalue()
    sys.__stdout__.write(json.dumps({
        "type": "input_request",
        "prompt": str(prompt or ""),
        "text": captured
    }, separators=(',', ':')) + "\n")
    sys.__stdout__.flush()

    user_line = sys.__stdin__.readline()
    if not user_line:
        return ""
    clean_val = user_line.rstrip("\r\n")
    sys.stdout.write(f"{prompt}{clean_val}\n")
    return clean_val

# Shared globals — variables persist between cell runs
_globals = {
    "input": _interactive_input,
}

def run_cell(code):
    global HAS_PLT, plt
    if not HAS_PLT:
        init_matplotlib()

    old_stdout = sys.stdout
    old_stderr = sys.stderr
    sys.stdout = io.StringIO()
    sys.stderr = io.StringIO()

    result = {}

    try:
        try:
            compiled_code = compile(code, '<cell>', 'exec')
            exec(compiled_code, _globals)
        except (EOFError, KeyboardInterrupt):
            pass
        except ModuleNotFoundError as err:
            missing_pkg = err.name.split('.')[0] if err.name else None
            if missing_pkg and missing_pkg not in FAILED_PACKAGES:
                if install_package(missing_pkg):
                    if missing_pkg == "matplotlib":
                        init_matplotlib()
                    try:
                        exec(compile(code, '<cell>', 'exec'), _globals)
                    except (EOFError, KeyboardInterrupt):
                        pass
                else:
                    raise err
            else:
                raise err

        stdout = sys.stdout.getvalue()
        stderr = sys.stderr.getvalue()
        combined_output = stdout + (f"\n[stderr]\n{stderr}" if stderr else "")

        # Check for matplotlib figure
        if HAS_PLT and plt and plt.get_fignums():
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=90, bbox_inches='tight')
            plt.close('all')
            buf.seek(0)
            img = base64.b64encode(buf.read()).decode('utf-8')
            result = {"type": "image", "content": img, "text": combined_output, "success": True}
        else:
            result = {"type": "text", "content": combined_output, "success": True}

    except Exception:
        result = {"type": "error", "content": traceback.format_exc(), "success": False}

    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    return result

# Main loop — reads code from stdin, executes, writes result to stdout
if __name__ == '__main__':
    # Signal ready
    sys.stdout.write('KERNEL_READY\n')
    sys.stdout.flush()

    while True:
        try:
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

            # Write result as compact single JSON line
            sys.stdout.write(json.dumps(result, separators=(',', ':')) + '\n')
            sys.stdout.flush()

        except Exception as e:
            sys.stdout.write(json.dumps({
                "type": "error",
                "content": str(e),
                "success": False
            }, separators=(',', ':')) + '\n')
            sys.stdout.flush()