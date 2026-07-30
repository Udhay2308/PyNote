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

def install_package(pkg):
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "--break-system-packages"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", pkg], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass

# Non-blocking attempt to load matplotlib if already available
init_matplotlib()

# Shared globals — variables persist between cell runs
_globals = {}

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
            exec(compile(code, '<cell>', 'exec'), _globals)
        except ModuleNotFoundError as err:
            missing_pkg = err.name.split('.')[0] if err.name else None
            if missing_pkg:
                install_package(missing_pkg)
                if missing_pkg == "matplotlib":
                    init_matplotlib()
                exec(compile(code, '<cell>', 'exec'), _globals)
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