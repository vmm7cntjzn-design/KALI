#!/usr/bin/env python3
import http.server, socketserver, webbrowser, threading, os, socket, json, subprocess, tempfile

PORT = 8765
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
SAVE_FILE = os.path.join(DIRECTORY, 'kali_export.json')

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200); self.end_headers()

    def do_GET(self):
        path = self.path.split('?')[0]
        if path == '/load':
            if os.path.exists(SAVE_FILE):
                with open(SAVE_FILE, 'rb') as f:
                    data = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            else:
                self._json(404, {'error': 'Keine gespeicherte Datei gefunden'})
            return
        super().do_GET()

    def do_POST(self):
        path = self.path.split('?')[0]

        # ── /save ──────────────────────────────────────────────────────────────
        if path == '/save':
            try:
                length  = int(self.headers.get('Content-Length', 0))
                payload = self.rfile.read(length)
                # Validate JSON
                json.loads(payload)
                with open(SAVE_FILE, 'wb') as f:
                    f.write(payload)
                self._json(200, {'ok': True})
            except Exception as ex:
                self._json(500, {'error': str(ex)})
            return

        # ── /generate-pptx ──────────────────────────────────────────────────────
        if path == '/generate-pptx':
            try:
                length  = int(self.headers.get('Content-Length', 0))
                payload = self.rfile.read(length)
                data    = json.loads(payload)
                veranstalter = data.get('veranstalter', {})
                gen_script = os.path.join(DIRECTORY, 'kali_pptx_gen.js')
                if not os.path.exists(gen_script):
                    self._err(500, 'kali_pptx_gen.js nicht gefunden.')
                    return
                with tempfile.NamedTemporaryFile(suffix='.pptx', delete=False) as tmp:
                    out_path = tmp.name
                try:
                    result = subprocess.run(['node', gen_script, out_path], input=payload, capture_output=True, timeout=30)
                    if result.returncode != 0:
                        self._err(500, f'Node.js Fehler: {result.stderr.decode("utf-8", errors="replace")[:300]}')
                        return
                    with open(out_path, 'rb') as f:
                        pptx_bytes = f.read()
                    name = veranstalter.get('name', 'Export').replace(' ', '_')
                    fname = f"KALI_{name}.pptx"
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
                    self.send_header('Content-Disposition', f'attachment; filename="{fname}"')
                    self.send_header('Content-Length', str(len(pptx_bytes)))
                    self.end_headers()
                    self.wfile.write(pptx_bytes)
                finally:
                    try: os.unlink(out_path)
                    except: pass
            except Exception as ex:
                self._err(500, str(ex))
            return

        self.send_response(404); self.end_headers()

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _err(self, code, msg):
        self._json(code, {'error': msg})

    def log_message(self, format, *args): pass


def port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

print("=" * 50)
print("  KALI Server")
print("=" * 50)

if port_in_use(PORT):
    print(f"\n  Server laeuft bereits auf Port {PORT}.")
    print(f"  KALI: http://localhost:{PORT}/index.html\n")
else:
    print(f"\n  Adresse: http://localhost:{PORT}")
    print(f"  Ordner:  {DIRECTORY}")
    print(f"\n  KALI oeffnet sich im Browser.")
    print(f"  Fenster offen lassen. Beenden: Strg+C\n")
    threading.Thread(
        target=lambda: (__import__('time').sleep(0.8),
                        webbrowser.open(f'http://localhost:{PORT}/index.html')),
        daemon=True
    ).start()
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer beendet.")
