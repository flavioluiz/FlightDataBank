#!/usr/bin/env python3
"""
Script para importar dados de aeronaves de várias fontes.
"""
import os
import sys
import argparse
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Adicionar o diretório raiz ao caminho de importação
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

# Importar scripts de importação
try:
    from scripts.data_scraper import get_aircraft_list as get_eurocontrol_list
    from scripts.data_scraper import get_aircraft_details as get_eurocontrol_details
    from scripts.data_scraper import import_aircraft_to_db
    
    from scripts.aviation_api import get_aircraft_data as get_aviation_data
    from scripts.aviation_api import map_aviation_data_to_aircraft
    
    from scripts.wikipedia_scraper import get_aircraft_list as get_wikipedia_list
    from scripts.wikipedia_scraper import get_aircraft_details as get_wikipedia_details
    
    from scripts.aircraft_db_import import import_aircraft_data as import_predefined_data
except ImportError as e:
    print(f"Erro ao importar scripts: {str(e)}")
    print("Certifique-se de que todos os scripts de importação estão no diretório 'scripts'")
    sys.exit(1)

# Importar modelos do banco de dados
from api.models import db, Aircraft
from api.app import app

def import_from_eurocontrol(max_aircraft=None, start_page=1, max_pages=None):
    """
    Importa dados de aeronaves do EUROCONTROL Aircraft Performance Database.
    
    Args:
        max_aircraft (int): Número máximo de aeronaves para importar (None para sem limite)
        start_page (int): Página inicial para buscar
        max_pages (int): Número máximo de páginas para buscar (None para sem limite)
    
    Returns:
        int: Número de aeronaves importadas com sucesso
    """
    print(f"Importando até {max_aircraft} aeronaves do EUROCONTROL...")
    
    try:
        # Buscar lista de aeronaves
        aircraft_list = get_eurocontrol_list(page=start_page, max_pages=max_pages)
        
        if not aircraft_list:
            print("Nenhuma aeronave encontrada no EUROCONTROL")
            return 0
        
        print(f"Encontradas {len(aircraft_list)} aeronaves no EUROCONTROL")
        
        # Limitar o número de aeronaves
        aircraft_list = aircraft_list[:max_aircraft]
        
        # Importar detalhes de cada aeronave
        imported_count = 0
        
        for aircraft in aircraft_list:
            icao = aircraft['icao']
            
            # Buscar detalhes da aeronave
            details = get_eurocontrol_details(icao)
            
            if not details:
                print(f"Não foi possível obter detalhes da aeronave {icao}")
                continue
            
            # Importar para o banco de dados
            success = import_aircraft_to_db(details)
            
            if success:
                imported_count += 1
        
        return imported_count
    except Exception as e:
        print(f"Erro ao importar do EUROCONTROL: {str(e)}")
        return 0

def import_from_aviation_api(max_aircraft=None):
    """
    Importa dados de aeronaves da API do Aviation Stack.
    
    Args:
        max_aircraft (int): Número máximo de aeronaves para importar (None para sem limite)
    
    Returns:
        int: Número de aeronaves importadas com sucesso
    """
    print(f"Importando até {max_aircraft} aeronaves da API do Aviation Stack...")
    
    try:
        # Verificar se a chave de API está definida
        api_key = os.environ.get('AVIATION_STACK_API_KEY', '')
        if not api_key:
            print("Erro: Chave de API do Aviation Stack não encontrada.")
            print("Defina a variável de ambiente AVIATION_STACK_API_KEY ou adicione-a ao arquivo .env")
            return 0
        
        # Buscar dados de aeronaves
        aviation_data = get_aviation_data(limit=max_aircraft)
        
        if not aviation_data:
            print("Nenhum dado de aeronave encontrado na API do Aviation Stack")
            return 0
        
        print(f"Encontrados dados de {len(aviation_data)} aeronaves na API do Aviation Stack")
        
        # Importar dados para o banco de dados
        imported_count = 0
        
        for aviation_item in aviation_data:
            # Mapear dados para o formato do nosso banco de dados
            aircraft_data = map_aviation_data_to_aircraft(aviation_item)
            
            # Verificar se temos dados suficientes
            if not aircraft_data.get('name') or not aircraft_data.get('manufacturer'):
                print(f"Dados insuficientes para a aeronave: {aviation_item.get('icao', 'desconhecida')}")
                continue
            
            # Importar para o banco de dados
            success = import_aircraft_to_db(aircraft_data)
            
            if success:
                imported_count += 1
        
        return imported_count
    except Exception as e:
        print(f"Erro ao importar da API do Aviation Stack: {str(e)}")
        return 0

def import_from_wikipedia(max_aircraft=None):
    """
    Importa dados de aeronaves da Wikipedia.
    
    Args:
        max_aircraft (int): Número máximo de aeronaves para importar (None para sem limite)
    
    Returns:
        int: Número de aeronaves importadas com sucesso
    """
    print(f"Importando até {max_aircraft} aeronaves da Wikipedia...")
    
    try:
        # Buscar lista de aeronaves
        aircraft_list = get_wikipedia_list()
        
        if not aircraft_list:
            print("Nenhuma aeronave encontrada na Wikipedia")
            return 0
        
        print(f"Encontradas {len(aircraft_list)} aeronaves na Wikipedia")
        
        # Limitar o número de aeronaves
        aircraft_list = aircraft_list[:max_aircraft]
        
        # Importar detalhes de cada aeronave
        imported_count = 0
        
        for aircraft in aircraft_list:
            url = aircraft['url']
            
            # Buscar detalhes da aeronave
            details = get_wikipedia_details(url)
            
            if not details:
                print(f"Não foi possível obter detalhes da aeronave {aircraft['name']}")
                continue
            
            # Importar para o banco de dados
            success = import_aircraft_to_db(details)
            
            if success:
                imported_count += 1
        
        return imported_count
    except Exception as e:
        print(f"Erro ao importar da Wikipedia: {str(e)}")
        return 0

def import_from_predefined(max_aircraft=None):
    """
    Importa dados de aeronaves pré-definidos.
    
    Args:
        max_aircraft (int): Número máximo de aeronaves para importar (None para sem limite)
    
    Returns:
        int: Número de aeronaves importadas com sucesso
    """
    print(f"Importando até {max_aircraft} aeronaves do banco de dados pré-definido...")
    
    try:
        # Importar dados pré-definidos
        imported_count = import_predefined_data(max_aircraft)
        return imported_count
    except Exception as e:
        print(f"Erro ao importar dados pré-definidos: {str(e)}")
        return 0

def main():
    """
    Função principal para importar dados de aeronaves.
    """
    parser = argparse.ArgumentParser(description='Import aircraft data from various sources')
    parser.add_argument('--source', choices=['eurocontrol', 'aviation', 'wikipedia', 'predefined', 'all'],
                      default='all',
                      help='Specific source to import from (default: all sources)')
    parser.add_argument('--max', type=int, default=None,
                      help='Maximum number of aircraft to import (default: no limit)')
    
    args = parser.parse_args()
    
    # Inicializar o banco de dados
    with app.app_context():
        total_imported = 0
        
        if args.source in ['eurocontrol', 'all']:
            try:
                imported = import_from_eurocontrol(max_aircraft=args.max, max_pages=None)
                total_imported += imported
                print(f"Importadas {imported} aeronaves do EUROCONTROL")
            except Exception as e:
                print(f"Erro ao importar do EUROCONTROL: {str(e)}")
        
        if args.source in ['aviation', 'all']:
            try:
                imported = import_from_aviation_api(max_aircraft=args.max)
                total_imported += imported
                print(f"Importadas {imported} aeronaves da API do Aviation Stack")
            except Exception as e:
                print(f"Erro ao importar da API do Aviation Stack: {str(e)}")
        
        if args.source in ['wikipedia', 'all']:
            try:
                imported = import_from_wikipedia(max_aircraft=args.max)
                total_imported += imported
                print(f"Importadas {imported} aeronaves da Wikipedia")
            except Exception as e:
                print(f"Erro ao importar da Wikipedia: {str(e)}")
        
        if args.source in ['predefined', 'all']:
            try:
                imported = import_from_predefined(max_aircraft=args.max)
                total_imported += imported
                print(f"Importadas {imported} aeronaves do banco de dados pré-definido")
            except Exception as e:
                print(f"Erro ao importar do banco de dados pré-definido: {str(e)}")
        
        print(f"Importação concluída. Total de {total_imported} aeronaves importadas com sucesso!")

if __name__ == '__main__':
    main() 