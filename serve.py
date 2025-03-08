import http.server
import socketserver
import os
import sys
import time

def find_available_port(start_port, max_attempts=10):
    for port in range(start_port, start_port + max_attempts):
        try:
            with socketserver.TCPServer(("", port), None) as s:
                s.server_close()
                return port
        except OSError:
            continue
    return None

# Configurar o servidor
initial_port = 8000
PORT = find_available_port(initial_port)

if PORT is None:
    print(f"Não foi possível encontrar uma porta disponível entre {initial_port} e {initial_port + 9}")
    sys.exit(1)

# Não precisa mais mudar para o diretório docs
# os.chdir('docs')

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.js': 'application/javascript',
    '.json': 'application/json',
})

print(f"Serving at http://localhost:{PORT}")
print("Pressione Ctrl+C para parar o servidor")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado")
        httpd.server_close()
    except Exception as e:
        print(f"\nErro: {e}")
        httpd.server_close() 