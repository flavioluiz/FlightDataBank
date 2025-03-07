#!/usr/bin/env python3
"""
Script para buscar dados de aeronaves usando a API do Aviation Stack.
Para usar este script, você precisa de uma chave de API do Aviation Stack.
Você pode obter uma chave gratuita em: https://aviationstack.com/
"""
import os
import sys
import requests
import json
import time
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Adicionar o diretório raiz ao caminho de importação
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

# Importar modelos do banco de dados
from api.models import db, Aircraft
from api.app import app

# Configurações da API
AVIATION_STACK_API_KEY = os.environ.get('AVIATION_STACK_API_KEY', '')
AVIATION_STACK_API_URL = 'http://api.aviationstack.com/v1/airplanes'

def get_aircraft_data(limit=100, offset=0):
    """
    Busca dados de aeronaves na API do Aviation Stack.
    
    Args:
        limit (int): Número máximo de resultados por página
        offset (int): Deslocamento para paginação
    
    Returns:
        list: Lista de dicionários com dados de aeronaves
    """
    if not AVIATION_STACK_API_KEY:
        print("Erro: Chave de API do Aviation Stack não encontrada.")
        print("Defina a variável de ambiente AVIATION_STACK_API_KEY ou adicione-a ao arquivo .env")
        return []
    
    params = {
        'access_key': AVIATION_STACK_API_KEY,
        'limit': limit,
        'offset': offset
    }
    
    try:
        response = requests.get(AVIATION_STACK_API_URL, params=params)
        
        if response.status_code != 200:
            print(f"Erro na requisição: {response.status_code}")
            print(response.text)
            return []
        
        data = response.json()
        
        if 'error' in data:
            print(f"Erro na API: {data['error']['message']}")
            return []
        
        return data.get('data', [])
    
    except Exception as e:
        print(f"Erro ao buscar dados: {str(e)}")
        return []

def map_aviation_data_to_aircraft(aviation_data):
    """
    Mapeia os dados da API do Aviation Stack para o formato do nosso banco de dados.
    
    Args:
        aviation_data (dict): Dados da aeronave da API
    
    Returns:
        dict: Dados formatados para o nosso modelo
    """
    # Extrair fabricante e modelo
    manufacturer = aviation_data.get('production_line', {}).get('manufacturer', {}).get('name', '')
    model = aviation_data.get('production_line', {}).get('model', {}).get('name', '')
    
    # Construir nome completo
    name = f"{manufacturer} {model}".strip()
    if not name:
        name = aviation_data.get('iata', '') or aviation_data.get('icao', '')
    
    # Mapear dados
    aircraft_data = {
        'name': name,
        'manufacturer': manufacturer,
        'model': model,
        'first_flight_year': aviation_data.get('first_flight_date', {}).get('year'),
        'engine_type': aviation_data.get('engines', {}).get('type'),
        'engine_count': aviation_data.get('engines', {}).get('count'),
    }
    
    # Adicionar dados técnicos se disponíveis
    if 'specifications' in aviation_data:
        specs = aviation_data['specifications']
        
        if 'length' in specs:
            aircraft_data['length'] = specs['length']
        
        if 'wingspan' in specs:
            aircraft_data['wingspan'] = specs['wingspan']
        
        if 'height' in specs:
            aircraft_data['height'] = specs['height']
        
        if 'mtow' in specs:
            # Converter de libras para kg (1 lb = 0.453592 kg)
            mtow_lb = specs['mtow']
            if mtow_lb:
                aircraft_data['mtow'] = mtow_lb * 0.453592
        
        if 'cruise_speed' in specs:
            aircraft_data['cruise_speed'] = specs['cruise_speed']
        
        if 'ceiling' in specs:
            aircraft_data['service_ceiling'] = specs['ceiling']
    
    return aircraft_data

def import_aircraft_to_db(aircraft_data):
    """
    Importa os dados de uma aeronave para o banco de dados local.
    
    Args:
        aircraft_data (dict): Dicionário com os dados da aeronave
    
    Returns:
        bool: True se a importação foi bem-sucedida, False caso contrário
    """
    try:
        # Verificar se a aeronave já existe no banco de dados
        existing_aircraft = Aircraft.query.filter_by(
            manufacturer=aircraft_data['manufacturer'],
            model=aircraft_data['model']
        ).first()
        
        if existing_aircraft:
            print(f"Aeronave {aircraft_data['name']} já existe no banco de dados. Atualizando...")
            
            # Atualizar campos existentes
            for key, value in aircraft_data.items():
                if hasattr(existing_aircraft, key) and value:
                    setattr(existing_aircraft, key, value)
            
            db.session.commit()
            return True
        
        # Criar nova aeronave
        new_aircraft = Aircraft(**aircraft_data)
        db.session.add(new_aircraft)
        db.session.commit()
        
        print(f"Aeronave {aircraft_data['name']} importada com sucesso!")
        return True
    
    except Exception as e:
        print(f"Erro ao importar aeronave {aircraft_data.get('name', 'desconhecida')}: {str(e)}")
        db.session.rollback()
        return False

def main():
    """Função principal para buscar e importar dados de aeronaves."""
    # Inicializar o banco de dados
    with app.app_context():
        # Buscar dados de aeronaves
        print("Buscando dados de aeronaves na API do Aviation Stack...")
        aviation_data = get_aircraft_data(limit=25)  # Limitar a 25 para teste
        
        if not aviation_data:
            print("Nenhum dado de aeronave encontrado")
            return
        
        print(f"Encontrados dados de {len(aviation_data)} aeronaves")
        
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
        
        print(f"Importação concluída. {imported_count} aeronaves importadas com sucesso!")

if __name__ == "__main__":
    main() 