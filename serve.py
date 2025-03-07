import http.server
import socketserver
import os

# Configurar o diretório docs como diretório de trabalho
os.chdir('docs')

# Configurar o servidor
PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.js': 'application/javascript',
    '.json': 'application/json',
})

print(f"Iniciando servidor em http://localhost:{PORT}")
print("Pressione Ctrl+C para parar o servidor")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado") 