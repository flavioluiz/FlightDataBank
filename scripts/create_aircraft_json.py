#!/usr/bin/env python3
"""
Script para criar um único arquivo JSON com todos os dados de aeronaves.

Este script:
1. Carrega dados de aeronaves do módulo aircraft_db_import.py
2. Tenta carregar dados históricos, se disponíveis
3. Adiciona altitudes de cruzeiro estimadas para aeronaves que não as têm
4. Garante que todas as aeronaves tenham categorias apropriadas
5. Salva tudo em um único arquivo JSON para uso pelo site
"""

import os
import json
import sys
import importlib.util
from pathlib import Path
import datetime

# Diretório raiz do projeto
ROOT_DIR = Path(__file__).parent.parent

# Mapeamento de altitudes de cruzeiro típicas por tipo de aeronave
# Valores em metros
TYPICAL_CRUISE_ALTITUDES = {
    # Aviação Comercial
    'comercial': {
        'default': 10000,  # ~33,000 ft
        'regional': 7600,  # ~25,000 ft
        'widebody': 11000,  # ~36,000 ft
        'narrowbody': 10000,  # ~33,000 ft
        'supersonic': 15000,  # ~50,000 ft
    },
    
    # Aviação Militar
    'militar': {
        'default': 9000,  # ~30,000 ft
        'fighter': 12000,  # ~40,000 ft
        'bomber': 11000,  # ~36,000 ft
        'transport': 8500,  # ~28,000 ft
        'reconnaissance': 15000,  # ~50,000 ft
    },
    
    # Aviação Geral
    'geral': {
        'default': 3000,  # ~10,000 ft
        'light': 3000,  # ~10,000 ft
        'ultralight': 1500,  # ~5,000 ft
        'business': 12000,  # ~40,000 ft
    },
    
    # Aeronaves Executivas
    'executiva': {
        'default': 12000,  # ~40,000 ft
        'light': 9000,  # ~30,000 ft
        'midsize': 12000,  # ~40,000 ft
        'heavy': 13000,  # ~43,000 ft
    },
    
    # Aviação de Carga
    'carga': {
        'default': 9000,  # ~30,000 ft
        'heavy': 10000,  # ~33,000 ft
    },
    
    # Aeronaves Históricas
    'historica': {
        'default': 3000,  # ~10,000 ft
        'ww1': 2000,  # ~6,500 ft
        'ww2': 6000,  # ~20,000 ft
        'early_jet': 9000,  # ~30,000 ft
    },
    
    # Aeronaves Experimentais
    'experimental': {
        'default': 3000,  # ~10,000 ft
        'high_altitude': 15000,  # ~50,000 ft
    },
}

# Mapeamento específico para aeronaves conhecidas
KNOWN_AIRCRAFT = {
    # Aviões comerciais modernos
    'Airbus A380': 13100,
    'Airbus A350': 13100,
    'Airbus A340': 12500,
    'Airbus A330': 11900,
    'Airbus A320': 11900,
    'Airbus A319': 11900,
    'Airbus A318': 11900,
    'Airbus A310': 11900,
    'Airbus A300': 10600,
    'Boeing 747': 13100,
    'Boeing 777': 13100,
    'Boeing 787': 13100,
    'Boeing 767': 12800,
    'Boeing 757': 12800,
    'Boeing 737': 11900,
    'Boeing 727': 10600,
    'Boeing 707': 10600,
    'Embraer E-Jet': 12500,
    'Embraer ERJ': 11900,
    'Bombardier CRJ': 12500,
    'Bombardier Dash': 7600,
    'ATR 72': 7600,
    'ATR 42': 7600,
    'Concorde': 18300,
    'Tu-144': 18000,  # Tupolev Tu-144, concorrente soviético do Concorde
}

# Mapeamento de categorias para aeronaves específicas
AIRCRAFT_CATEGORIES = {
    'comercial': [
        'Airbus', 'Boeing', 'Embraer', 'Bombardier', 'ATR', 
        'Concorde', 'Tu-144', 'McDonnell Douglas', 'Douglas', 
        'Fokker', 'BAe', 'Tupolev', 'Ilyushin', 'Antonov',
        'Sukhoi Superjet', 'COMAC', 'Mitsubishi'
    ],
    'militar': [
        'F-', 'MiG', 'Sukhoi Su-', 'B-', 'C-', 'A-', 'P-', 'E-', 'KC-',
        'Eurofighter', 'Rafale', 'Gripen', 'Tornado', 'Harrier',
        'Mirage', 'Phantom', 'Warthog', 'Hercules', 'Globemaster'
    ],
    'executiva': [
        'Gulfstream', 'Falcon', 'Citation', 'Learjet', 'Hawker',
        'Challenger', 'Global Express', 'Praetor', 'Legacy', 'Phenom'
    ],
    'geral': [
        'Cessna', 'Piper', 'Beechcraft', 'Cirrus', 'Diamond', 'Mooney',
        'Robin', 'Grumman', 'Socata', 'Tecnam'
    ],
    'historica': [
        'Wright', 'Spirit of St. Louis', 'Spitfire', 'Messerschmitt',
        'P-51', 'B-17', 'DC-3', 'Constellation', 'Comet'
    ]
}

# Lista de aeronaves supersônicas conhecidas
SUPERSONIC_AIRCRAFT = [
    'Concorde', 'Tu-144', 'SR-71', 'X-15', 'X-43', 'X-51',
    'F-22', 'F-35', 'F-15', 'F-14', 'F-16', 'F/A-18', 'MiG-25', 'MiG-31',
    'Sukhoi Su-27', 'Sukhoi Su-30', 'Sukhoi Su-35', 'Sukhoi Su-57',
    'Eurofighter Typhoon', 'Dassault Rafale', 'Saab JAS 39 Gripen'
]

def load_aircraft_data():
    """Carrega dados de aeronaves do módulo aircraft_db_import.py."""
    all_aircraft = []
    
    try:
        # Primeiro, tenta importar o módulo aircraft_db_import.py
        module_path = ROOT_DIR / "scripts" / "aircraft_db_import.py"
        if not module_path.exists():
            print(f"Arquivo não encontrado: {module_path}")
        else:
            spec = importlib.util.spec_from_file_location("aircraft_db_import", module_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            
            # Verifica se o módulo tem a variável AIRCRAFT_DATA
            if hasattr(module, 'AIRCRAFT_DATA'):
                print(f"Dados carregados do módulo aircraft_db_import.py: {len(module.AIRCRAFT_DATA)} aeronaves")
                all_aircraft.extend(module.AIRCRAFT_DATA)
            else:
                print("Variável AIRCRAFT_DATA não encontrada no módulo")
    
    except Exception as e:
        print(f"Erro ao carregar dados do módulo aircraft_db_import.py: {e}")
    
    try:
        # Tenta importar dados históricos, se disponíveis
        module_path = ROOT_DIR / "scripts" / "historical_aircraft_data.py"
        if not module_path.exists():
            print(f"Arquivo de dados históricos não encontrado: {module_path}")
        else:
            spec = importlib.util.spec_from_file_location("historical_aircraft_data", module_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            
            # Verifica se o módulo tem a função get_all_historical_aircraft ou a variável HISTORICAL_AIRCRAFT
            if hasattr(module, 'get_all_historical_aircraft'):
                historical_data = module.get_all_historical_aircraft()
                print(f"Dados históricos carregados via função: {len(historical_data)} aeronaves")
                all_aircraft.extend(historical_data)
            elif hasattr(module, 'HISTORICAL_AIRCRAFT'):
                print(f"Dados históricos carregados via variável: {len(module.HISTORICAL_AIRCRAFT)} aeronaves")
                all_aircraft.extend(module.HISTORICAL_AIRCRAFT)
            elif hasattr(module, 'historical_aircraft_data'):
                print(f"Dados históricos carregados diretamente: {len(module.historical_aircraft_data)} aeronaves")
                all_aircraft.extend(module.historical_aircraft_data)
            else:
                print("Nenhuma fonte de dados históricos encontrada no módulo")
    
    except Exception as e:
        print(f"Erro ao carregar dados históricos: {e}")
        import traceback
        traceback.print_exc()
    
    print(f"Total de aeronaves carregadas: {len(all_aircraft)}")
    
    # Verificar se há dados de imagens locais
    try:
        image_mapping_path = ROOT_DIR / "web" / "images" / "aircraft_images.json"
        if image_mapping_path.exists():
            with open(image_mapping_path, 'r', encoding='utf-8') as f:
                image_mapping = json.load(f)
                print(f"Mapeamento de imagens carregado: {len(image_mapping)} imagens")
                
                # Atualizar URLs de imagens para caminhos locais
                for aircraft in all_aircraft:
                    aircraft_id = aircraft.get('id', None)
                    if aircraft_id and str(aircraft_id) in image_mapping:
                        aircraft['image_url'] = image_mapping[str(aircraft_id)]['image_path']
                        print(f"Atualizada imagem para {aircraft['name']}: {aircraft['image_url']}")
    
    except Exception as e:
        print(f"Erro ao carregar mapeamento de imagens: {e}")
    
    return all_aircraft

def estimate_cruise_altitude(aircraft):
    """Estima a altitude de cruzeiro com base no tipo de aeronave."""
    # Verificar se já tem altitude de cruzeiro
    if aircraft.get('cruise_altitude') and aircraft['cruise_altitude'] > 0:
        return aircraft['cruise_altitude']
    
    # Verificar se é uma aeronave conhecida
    for name, altitude in KNOWN_AIRCRAFT.items():
        if name.lower() in aircraft['name'].lower():
            return altitude
    
    # Determinar a categoria da aeronave se não estiver definida
    category = aircraft.get('category_type')
    if not category or category == '':
        # Tentar determinar a categoria com base no nome
        aircraft_name = aircraft['name'].lower()
        
        # Verificar cada categoria
        for cat, keywords in AIRCRAFT_CATEGORIES.items():
            for keyword in keywords:
                if keyword.lower() in aircraft_name:
                    category = cat
                    break
            if category:
                break
        
        # Se ainda não tiver categoria, usar 'geral' como padrão
        if not category:
            category = 'geral'
    
    # Selecionar subcategoria com base em características
    subcategory = 'default'
    
    # Verificar se é uma aeronave supersônica
    is_supersonic = False
    if aircraft.get('cruise_speed') and aircraft['cruise_speed'] > 1200:
        is_supersonic = True
    else:
        # Verificar se está na lista de aeronaves supersônicas conhecidas
        aircraft_name = aircraft['name'].lower()
        for supersonic in SUPERSONIC_AIRCRAFT:
            if supersonic.lower() in aircraft_name:
                is_supersonic = True
                break
    
    # Ajustar categoria para o Concorde e outras aeronaves supersônicas comerciais
    if 'concorde' in aircraft['name'].lower() or 'tu-144' in aircraft['name'].lower():
        category = 'comercial'
        subcategory = 'supersonic'
    
    if category == 'comercial':
        if is_supersonic:
            subcategory = 'supersonic'
        elif aircraft.get('mtow') and aircraft['mtow'] > 350000:
            subcategory = 'widebody'
        elif aircraft.get('mtow') and aircraft['mtow'] < 50000:
            subcategory = 'regional'
        else:
            subcategory = 'narrowbody'
    
    elif category == 'militar':
        if 'fighter' in aircraft['name'].lower() or any(f.lower() in aircraft['name'].lower() for f in ['f-', 'mig', 'sukhoi']):
            subcategory = 'fighter'
        elif 'bomber' in aircraft['name'].lower() or 'b-' in aircraft['name'].lower():
            subcategory = 'bomber'
        elif 'transport' in aircraft['name'].lower() or 'c-' in aircraft['name'].lower():
            subcategory = 'transport'
    
    elif category == 'geral':
        if aircraft.get('mtow') and aircraft['mtow'] < 1500:
            subcategory = 'light'
        elif aircraft.get('mtow') and aircraft['mtow'] < 600:
            subcategory = 'ultralight'
    
    elif category == 'executiva':
        if aircraft.get('mtow') and aircraft['mtow'] > 30000:
            subcategory = 'heavy'
        elif aircraft.get('mtow') and aircraft['mtow'] > 15000:
            subcategory = 'midsize'
        else:
            subcategory = 'light'
    
    elif category == 'historica':
        if aircraft.get('first_flight_year') and aircraft['first_flight_year'] < 1920:
            subcategory = 'ww1'
        elif aircraft.get('first_flight_year') and aircraft['first_flight_year'] < 1945:
            subcategory = 'ww2'
        elif aircraft.get('first_flight_year') and aircraft['first_flight_year'] < 1960:
            subcategory = 'early_jet'
    
    # Obter altitude típica para esta categoria/subcategoria
    try:
        altitude = TYPICAL_CRUISE_ALTITUDES[category][subcategory]
    except KeyError:
        altitude = TYPICAL_CRUISE_ALTITUDES.get(category, {}).get('default', 3000)
    
    # Ajustar com base na velocidade de cruzeiro (se disponível)
    if aircraft.get('cruise_speed'):
        # Aeronaves mais rápidas geralmente voam mais alto
        if is_supersonic:
            altitude = max(altitude, 15000)  # Supersônicas voam muito alto
        elif aircraft['cruise_speed'] > 900:  # Jatos rápidos
            altitude = max(altitude, 11000)
        elif aircraft['cruise_speed'] > 750:  # Jatos médios
            altitude = max(altitude, 10000)
        elif aircraft['cruise_speed'] > 500:  # Turboélices rápidos
            altitude = max(altitude, 7500)
        elif aircraft['cruise_speed'] < 250:  # Aeronaves lentas
            altitude = min(altitude, 5000)
    
    # Ajustar com base no teto de serviço (se disponível)
    if aircraft.get('service_ceiling'):
        # A altitude de cruzeiro geralmente é 85-90% do teto de serviço
        ceiling_based_altitude = aircraft['service_ceiling'] * 0.85
        # Usar o menor valor entre o estimado e o baseado no teto
        altitude = min(altitude, ceiling_based_altitude)
    
    return int(altitude)

def process_aircraft_data(aircraft_data):
    """Processa os dados de aeronaves, adicionando informações faltantes."""
    processed_data = []
    next_id = 1
    
    # Primeiro, encontrar o maior ID existente
    for aircraft in aircraft_data:
        if aircraft.get('id') and aircraft['id'] >= next_id:
            next_id = aircraft['id'] + 1
    
    for aircraft in aircraft_data:
        # Criar uma cópia para não modificar o original
        processed = aircraft.copy()
        
        # Garantir que tenha um ID
        if not processed.get('id'):
            processed['id'] = next_id
            next_id += 1
        
        # Garantir que tenha uma categoria
        if not processed.get('category_type') or processed['category_type'] == '':
            # Determinar categoria com base no nome
            aircraft_name = processed['name'].lower()
            
            for cat, keywords in AIRCRAFT_CATEGORIES.items():
                for keyword in keywords:
                    if keyword.lower() in aircraft_name:
                        processed['category_type'] = cat
                        print(f"Categoria adicionada para {processed['name']}: {cat}")
                        break
                if processed.get('category_type'):
                    break
            
            # Se ainda não tiver categoria, usar 'geral' como padrão
            if not processed.get('category_type'):
                processed['category_type'] = 'geral'
                print(f"Categoria padrão 'geral' adicionada para {processed['name']}")
        
        # Garantir que tenha altitude de cruzeiro
        if not processed.get('cruise_altitude') or processed['cruise_altitude'] == 0:
            altitude = estimate_cruise_altitude(processed)
            processed['cruise_altitude'] = altitude
            print(f"Altitude de cruzeiro estimada para {processed['name']}: {altitude}m")
        
        # Garantir que tenha uma URL de imagem
        if not processed.get('image_url') or processed['image_url'] == '':
            # Usar uma imagem padrão baseada na categoria
            category = processed.get('category_type', 'geral')
            processed['image_url'] = f"/images/fallback/{category}.jpg"
            print(f"Imagem padrão adicionada para {processed['name']}: {processed['image_url']}")
        
        # Adicionar à lista processada
        processed_data.append(processed)
    
    return processed_data

def create_json_file(aircraft_data):
    """Cria um arquivo JSON com todos os dados de aeronaves."""
    # Processar os dados
    processed_data = process_aircraft_data(aircraft_data)
    
    # Criar o objeto JSON final
    output_data = {
        "metadata": {
            "count": len(processed_data),
            "generated_at": datetime.datetime.now().isoformat(),
            "version": "1.0"
        },
        "aircraft": processed_data
    }
    
    # Salvar em arquivo JSON
    output_path = ROOT_DIR / "web" / "data" / "aircraft.json"
    
    # Garantir que o diretório exista
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\nArquivo JSON criado: {output_path}")
    print(f"Total de aeronaves: {len(processed_data)}")
    
    return output_path

def main():
    print("=== Criador de Arquivo JSON de Aeronaves ===")
    
    # Carregar dados de aeronaves
    aircraft_data = load_aircraft_data()
    
    if not aircraft_data:
        print("Nenhuma aeronave encontrada.")
        return
    
    # Criar arquivo JSON
    json_path = create_json_file(aircraft_data)
    
    print("\nProcesso concluído com sucesso.")
    print(f"O arquivo JSON foi criado em: {json_path}")
    print("Agora você pode usar este arquivo como fonte única de dados para o site.")

if __name__ == "__main__":
    main() 