import os
import subprocess
import sys
import time


def _resolve_backend_python(backend_dir: str) -> str:
    candidates = [
        os.path.join(backend_dir, '.venv', 'Scripts', 'python.exe'),
        os.path.join(backend_dir, '.venv', 'bin', 'python'),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return ''


def _resolve_npm_cmd() -> list[str]:
    if os.name == 'nt':
        return ['cmd', '/c', 'npm', 'run', 'dev']
    return ['npm', 'run', 'dev']


def _terminate_process_tree(process: subprocess.Popen) -> None:
    if process.poll() is not None:
        return

    try:
        process.terminate()
        process.wait(timeout=5)
    except Exception:
        if os.name == 'nt':
            subprocess.call(
                ['taskkill', '/F', '/T', '/PID', str(process.pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        else:
            process.kill()


def main() -> int:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, 'backend')
    frontend_dir = os.path.join(base_dir, 'frontend')

    backend_python = _resolve_backend_python(backend_dir)
    if not backend_python:
        print('[ERROR] Could not find backend virtual environment Python.')
        print('Expected one of:')
        print(f"  - {os.path.join(backend_dir, '.venv', 'Scripts', 'python.exe')}")
        print(f"  - {os.path.join(backend_dir, '.venv', 'bin', 'python')}")
        print('Create backend venv first, then run this script again.')
        return 1

    if not os.path.exists(os.path.join(frontend_dir, 'package.json')):
        print('[ERROR] Frontend package.json not found.')
        print(f'Expected at: {os.path.join(frontend_dir, "package.json")}')
        return 1

    backend_host = os.environ.get('BACKEND_HOST', '127.0.0.1')
    backend_port = os.environ.get('BACKEND_PORT', '8000')
    frontend_port = os.environ.get('FRONTEND_PORT', '5173')

    print('==================================================')
    print('Starting Full Stack App')
    print(f'Backend:  http://{backend_host}:{backend_port}')
    print(f'Frontend: http://127.0.0.1:{frontend_port}')
    print(f'Docs:     http://{backend_host}:{backend_port}/docs')
    print('Press Ctrl+C to stop both servers')
    print('==================================================')

    backend_cmd = [
        backend_python,
        '-m',
        'uvicorn',
        'main:app',
        '--host',
        backend_host,
        '--port',
        backend_port,
        '--reload',
    ]

    frontend_cmd = _resolve_npm_cmd()
    frontend_env = os.environ.copy()
    frontend_env['PORT'] = frontend_port

    backend_process = None
    frontend_process = None

    try:
        print('[INFO] Starting backend...')
        backend_process = subprocess.Popen(backend_cmd, cwd=backend_dir, env=os.environ.copy())

        print('[INFO] Starting frontend...')
        frontend_process = subprocess.Popen(frontend_cmd, cwd=frontend_dir, env=frontend_env)

        while True:
            time.sleep(1)

            if backend_process.poll() is not None:
                print('\n[ERROR] Backend process exited unexpectedly.')
                return backend_process.returncode or 1

            if frontend_process.poll() is not None:
                print('\n[ERROR] Frontend process exited unexpectedly.')
                return frontend_process.returncode or 1

    except KeyboardInterrupt:
        print('\n[INFO] Keyboard interrupt received. Stopping servers...')
        return 0
    finally:
        if frontend_process is not None:
            _terminate_process_tree(frontend_process)
            print('[INFO] Frontend stopped.')

        if backend_process is not None:
            _terminate_process_tree(backend_process)
            print('[INFO] Backend stopped.')


if __name__ == '__main__':
    raise SystemExit(main())
