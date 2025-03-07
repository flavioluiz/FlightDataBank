#!/usr/bin/env python3
"""
Script para iniciar o banco de dados de aeronaves.
"""
import os
import sys
import webbrowser
import time
import socket
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

# Adiciona o diretório atual ao caminho de importação
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from api.app import app
from api.models import db, Aircraft

def get_local_ip():
    """Obtém o endereço IP local da máquina."""
    try:
        # Cria um socket para determinar qual interface de rede usar
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Não precisa ser uma conexão real
        s.connect(('8.8.8.8', 1))
        # Obtém o IP local
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return '127.0.0.1'  # Fallback para localhost

def main():
    """Inicia o servidor e abre o navegador."""
    port = int(os.environ.get('PORT', 5001))
    host = '0.0.0.0'  # Aceita conexões de qualquer endereço
    local_ip = get_local_ip()
    
    local_url = f"http://localhost:{port}"
    network_url = f"http://{local_ip}:{port}"
    
    print(f"Iniciando o servidor em:")
    print(f"- Local: {local_url}")
    print(f"- Rede: {network_url}")
    print("\nCompartilhe o URL da rede com outras pessoas na mesma rede para que possam acessar a aplicação.")
    print("\nPressione Ctrl+C para encerrar.")
    
    # Criar o banco de dados se não existir
    with app.app_context():
        db.create_all()
        print("Banco de dados inicializado.")
    
    # Abrir navegador após 1 segundo
    def open_browser():
        time.sleep(1)
        webbrowser.open_new(local_url)
    
    import threading
    threading.Thread(target=open_browser).start()
    
    # Iniciar servidor
    app.run(debug=True, host=host, port=port)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
        sys.exit(0) 