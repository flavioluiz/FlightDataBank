#!/usr/bin/env python3
"""
Script para atualizar as altitudes de cruzeiro das aeronaves.

Este script:
1. Carrega os dados de aeronaves do módulo aircraft_db_import.py
2. Adiciona altitudes de cruzeiro típicas com base no tipo de aeronave
3. Cria um arquivo JSON com os dados atualizados
4. Opcionalmente, atualiza o arquivo aircraft_db_import.py
"""

import os
import json
import sys
import importlib.util
from pathlib import Path

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
    
    # Aves (para comparação)
    'ave': {
        'default': 100,  # ~330 ft
        'migratory': 3000,  # ~10,000 ft
    }
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
    
    # Aviões militares
    'F-22 Raptor': 19800,
    'F-35 Lightning II': 15000,
    'F-16 Fighting Falcon': 15000,
    'F-15 Eagle': 18000,
    'F/A-18 Hornet': 15000,
    'Eurofighter Typhoon': 16800,
    'Dassault Rafale': 15000,
    'Sukhoi Su-35': 17000,
    'Sukhoi Su-57': 20000,
    'MiG-29': 17000,
    'B-2 Spirit': 15000,
    'B-1 Lancer': 18000,
    'B-52 Stratofortress': 15000,
    'C-17 Globemaster': 13700,
    'C-130 Hercules': 10000,
    
    # Aviões executivos
    'Gulfstream G650': 15500,
    'Gulfstream G550': 15500,
    'Bombardier Global 7500': 15500,
    'Bombardier Global 6000': 15500,
    'Dassault Falcon 8X': 15500,
    'Dassault Falcon 7X': 15500,
    'Cessna Citation X': 15500,
    'Cessna Citation Latitude': 13700,
    'Embraer Praetor': 13700,
    'Embraer Legacy': 13100,
    
    # Aviação geral
    'Cessna 172': 4000,
    'Cessna 182': 5500,
    'Cessna 206': 4800,
    'Piper PA-28': 3000,
    'Piper PA-32': 4500,
    'Beechcraft Bonanza': 5500,
    'Cirrus SR22': 3000,
    'Diamond DA40': 5000,
    'Diamond DA62': 6000,
    
    # Aeronaves históricas
    'Wright Flyer': 30,
    'Spirit of St. Louis': 5000,
    'Supermarine Spitfire': 9100,
    'Messerschmitt Bf 109': 10500,
    'North American P-51 Mustang': 12000,
    'Boeing B-17': 10600,
    'Douglas DC-3': 3000,
    'Lockheed Constellation': 7300,
    'de Havilland Comet': 12800,
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
    try:
        # Primeiro, tenta importar o módulo aircraft_db_import.py
        module_path = ROOT_DIR / "scripts" / "aircraft_db_import.py"
        if not module_path.exists():
            print(f"Arquivo não encontrado: {module_path}")
            return []
        
        spec = importlib.util.spec_from_file_location("aircraft_db_import", module_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        # Verifica se o módulo tem a variável AIRCRAFT_DATA
        if hasattr(module, 'AIRCRAFT_DATA'):
            print(f"Dados carregados do módulo aircraft_db_import.py")
            return module.AIRCRAFT_DATA
        else:
            print("Variável AIRCRAFT_DATA não encontrada no módulo")
            return []
    
    except Exception as e:
        print(f"Erro ao carregar dados do módulo: {e}")
        return []

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

def create_json_file(aircraft_data):
    """Cria um arquivo JSON com as altitudes de cruzeiro estimadas."""
    output_data = []
    
    for aircraft in aircraft_data:
        new_altitude = estimate_cruise_altitude(aircraft)
        
        # Criar uma cópia do avião com a altitude atualizada
        updated_aircraft = aircraft.copy()
        updated_aircraft['cruise_altitude'] = new_altitude
        
        output_data.append(updated_aircraft)
    
    output_path = ROOT_DIR / "cruise_altitudes.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"Arquivo JSON criado: {output_path}")
    return output_path

def update_aircraft_db_import(aircraft_data):
    """Atualiza o arquivo aircraft_db_import.py com as novas altitudes de cruzeiro."""
    module_path = ROOT_DIR / "scripts" / "aircraft_db_import.py"
    
    if not module_path.exists():
        print(f"Arquivo não encontrado: {module_path}")
        return False
    
    # Ler o conteúdo atual do arquivo
    with open(module_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Criar uma cópia de backup
    backup_path = module_path.with_suffix('.py.bak')
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Backup criado: {backup_path}")
    
    # Atualizar os dados de cada aeronave
    updated_count = 0
    category_updates = 0
    
    for i, aircraft in enumerate(aircraft_data):
        aircraft_name = aircraft['name'].replace("'", "\\'")
        search_pattern = f"'name': '{aircraft_name}'"
        
        # Se não encontrar com aspas simples, tentar com aspas duplas
        if search_pattern not in content:
            search_pattern = f'"name": "{aircraft_name}"'
        
        if search_pattern in content:
            updates_made = False
            
            # Verificar se precisa atualizar a altitude de cruzeiro
            if not aircraft.get('cruise_altitude') or aircraft['cruise_altitude'] == 0:
                new_altitude = estimate_cruise_altitude(aircraft)
                
                # Verificar se já existe um campo cruise_altitude
                if "'cruise_altitude':" in content.split(search_pattern)[1].split("},")[0] or '"cruise_altitude":' in content.split(search_pattern)[1].split("},")[0]:
                    # Substituir o valor existente
                    import re
                    pattern = r'(["\']cruise_altitude["\']:\s*)\d*,'
                    replacement = f"\\1{new_altitude},"
                    content = re.sub(pattern, replacement, content)
                else:
                    # Adicionar o campo cruise_altitude antes do último campo
                    import re
                    pattern = r'(.*?' + search_pattern + r'.*?)(\s*})'
                    replacement = f"\\1,\n        'cruise_altitude': {new_altitude}\\2"
                    content = re.sub(pattern, replacement, content)
                
                updated_count += 1
                updates_made = True
                print(f"Atualizado: {aircraft['name']} - Altitude de cruzeiro: {new_altitude}m")
            
            # Verificar se é o Concorde ou outra aeronave supersônica sem categoria
            if 'concorde' in aircraft['name'].lower() or 'tu-144' in aircraft['name'].lower():
                # Verificar se já tem categoria
                if not aircraft.get('category_type') or aircraft['category_type'] == '':
                    # Adicionar categoria 'comercial'
                    if "'category_type':" in content.split(search_pattern)[1].split("},")[0] or '"category_type":' in content.split(search_pattern)[1].split("},")[0]:
                        # Substituir o valor existente
                        import re
                        pattern = r'(["\']category_type["\']:\s*)["\'][^"\']*["\'],'
                        replacement = f"\\1'comercial',"
                        content = re.sub(pattern, replacement, content)
                    else:
                        # Adicionar o campo category_type
                        import re
                        pattern = r'(.*?' + search_pattern + r'.*?)(\s*})'
                        replacement = f"\\1,\n        'category_type': 'comercial'\\2"
                        content = re.sub(pattern, replacement, content)
                    
                    category_updates += 1
                    updates_made = True
                    print(f"Categoria atualizada: {aircraft['name']} - Categoria: comercial")
            
            if updates_made:
                print(f"Aeronave {aircraft['name']} atualizada com sucesso.")
    
    # Escrever o conteúdo atualizado
    with open(module_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\nArquivo atualizado: {module_path}")
    print(f"Aeronaves com altitude atualizada: {updated_count}")
    print(f"Aeronaves com categoria atualizada: {category_updates}")
    
    return True

def main():
    print("=== Atualizador de Altitudes de Cruzeiro ===")
    
    # Carregar dados de aeronaves
    aircraft_data = load_aircraft_data()
    
    if not aircraft_data:
        print("Nenhuma aeronave encontrada.")
        return
    
    print(f"Encontradas {len(aircraft_data)} aeronaves.")
    
    # Criar arquivo JSON com estimativas
    json_path = create_json_file(aircraft_data)
    
    # Mostrar algumas estimativas como exemplo
    print("\nExemplos de estimativas:")
    for i, aircraft in enumerate(aircraft_data[:5]):
        new_altitude = estimate_cruise_altitude(aircraft)
        current = aircraft.get('cruise_altitude', 0)
        print(f"{i+1}. {aircraft['name']}: {current}m -> {new_altitude}m")
    
    # Perguntar se deseja atualizar o arquivo aircraft_db_import.py
    update_file = input("\nDeseja atualizar o arquivo aircraft_db_import.py com as altitudes estimadas? (s/n): ").lower()
    
    if update_file == 's':
        # Atualizar o arquivo
        success = update_aircraft_db_import(aircraft_data)
        if success:
            print("\nProcesso concluído com sucesso.")
        else:
            print("\nFalha ao atualizar o arquivo.")
    else:
        print(f"\nNenhuma alteração foi feita no arquivo.")
        print(f"Você pode revisar as altitudes estimadas no arquivo: {json_path}")
    
    print("\nProcesso concluído.")

if __name__ == "__main__":
    main() 