#!/usr/bin/env python3
"""
Script para importar dados de aeronaves de uma fonte de dados confiável.
Este script usa dados de aeronaves populares com valores pré-definidos.
"""
import os
import sys
import json
import time
from dotenv import load_dotenv

# Adicionar o diretório raiz ao caminho de importação
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

# Importar modelos do banco de dados
from api.models import db, Aircraft
from api.app import app

# Importar dados históricos
try:
    from scripts.historical_aircraft_data import get_all_historical_aircraft
    HISTORICAL_DATA_AVAILABLE = True
except ImportError:
    print("Aviso: Dados históricos não disponíveis. Usando apenas dados modernos.")
    HISTORICAL_DATA_AVAILABLE = False

# Dados de aeronaves populares
AIRCRAFT_DATA = [
    {
        "name": "Boeing 737-800",
        "manufacturer": "Boeing",
        "model": "737-800",
        "first_flight_year": 1997,
        "mtow": 79010,
        "wing_area": 124.6,
        "wingspan": 35.8,
        "cruise_speed": 842,
        "takeoff_speed": 250,
        "landing_speed": 230,
        "service_ceiling": 12500,
        "max_thrust": 107,
        "engine_type": "Turbofan",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/8/81/Ryanair_Boeing_737-800_EI-DLJ.jpg",
        "cruise_altitude": 10668,
        "max_speed": 876,
        "range": 5765,
        "max_roc": 2000
    },
    {
        "name": "Airbus A320neo",
        "manufacturer": "Airbus",
        "model": "A320neo",
        "first_flight_year": 2014,
        "mtow": 79000,
        "wing_area": 122.6,
        "wingspan": 35.8,
        "cruise_speed": 828,
        "takeoff_speed": 260,
        "landing_speed": 240,
        "service_ceiling": 12000,
        "max_thrust": 120,
        "engine_type": "Turbofan",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/0/09/A320neo_LUFTHANSA_D-AINC_310715.jpg",
        "cruise_altitude": 11277
    },
    {
        "name": "Embraer E190-E2",
        "manufacturer": "Embraer",
        "model": "E190-E2",
        "first_flight_year": 2016,
        "mtow": 56400,
        "wing_area": 92.5,
        "wingspan": 33.7,
        "cruise_speed": 829,
        "takeoff_speed": 240,
        "landing_speed": 220,
        "service_ceiling": 12500,
        "max_thrust": 100,
        "engine_type": "Turbofan",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/9/9f/E190-E2_landing_at_Zurich_Airport.jpg",
        "cruise_altitude": 12192
    },
    {
        "name": "Cessna 172",
        "manufacturer": "Cessna",
        "model": "172 Skyhawk",
        "first_flight_year": 1955,
        "mtow": 1157,
        "wing_area": 16.2,
        "wingspan": 11.0,
        "cruise_speed": 226,
        "takeoff_speed": 100,
        "landing_speed": 85,
        "service_ceiling": 4100,
        "max_thrust": 2.2,
        "engine_type": "Piston",
        "engine_count": 1,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/9/9d/Cessna_172_Skyhawk_%28D-EELM%29.jpg",
        "cruise_altitude": 4267
    },
    {
        "name": "Boeing 787-9",
        "manufacturer": "Boeing",
        "model": "787-9 Dreamliner",
        "first_flight_year": 2013,
        "mtow": 254000,
        "wing_area": 360,
        "wingspan": 60.1,
        "cruise_speed": 903,
        "takeoff_speed": 280,
        "landing_speed": 250,
        "service_ceiling": 13100,
        "max_thrust": 320,
        "engine_type": "Turbofan",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/4/4d/All_Nippon_Airways_Boeing_787-9_Dreamliner_JA873A_OKJ.jpg",
        "cruise_altitude": 12801
    },
    {
        "name": "Airbus A350-900",
        "manufacturer": "Airbus",
        "model": "A350-900",
        "first_flight_year": 2013,
        "mtow": 280000,
        "wing_area": 442,
        "wingspan": 64.8,
        "cruise_speed": 945,
        "takeoff_speed": 275,
        "landing_speed": 240,
        "service_ceiling": 13100,
        "max_thrust": 375,
        "engine_type": "Turbofan",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/d/d6/Qatar_Airways_A350-941_%28A7-ALA%29_landing_at_Frankfurt_Airport.jpg",
        "cruise_altitude": 13106
    },
    {
        "name": "Bombardier CRJ-900",
        "manufacturer": "Bombardier",
        "model": "CRJ-900",
        "first_flight_year": 2001,
        "mtow": 38330,
        "wing_area": 70.2,
        "wingspan": 24.9,
        "cruise_speed": 829,
        "takeoff_speed": 220,
        "landing_speed": 200,
        "service_ceiling": 12500,
        "max_thrust": 64,
        "engine_type": "Turbofan",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/5/52/Lufthansa_CityLine_Bombardier_CRJ900_D-ACNM.jpg",
        "cruise_altitude": 11582
    },
    {
        "name": "ATR 72-600",
        "manufacturer": "ATR",
        "model": "72-600",
        "first_flight_year": 2009,
        "mtow": 23000,
        "wing_area": 61,
        "wingspan": 27.05,
        "cruise_speed": 510,
        "takeoff_speed": 185,
        "landing_speed": 170,
        "service_ceiling": 7600,
        "max_thrust": 50,
        "engine_type": "Turboprop",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/5/58/ATR_72-600_of_Air_New_Zealand_Link.jpg",
        "cruise_altitude": 7620
    },
    {
        "name": "Embraer Phenom 300",
        "manufacturer": "Embraer",
        "model": "Phenom 300",
        "first_flight_year": 2008,
        "mtow": 8150,
        "wing_area": 28.5,
        "wingspan": 16.2,
        "cruise_speed": 834,
        "takeoff_speed": 190,
        "landing_speed": 170,
        "service_ceiling": 13700,
        "max_thrust": 15.6,
        "engine_type": "Turbofan",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/c/c9/Embraer_Phenom_300_photographed_at_Farnborough.jpg",
        "cruise_altitude": 13716
    },
    {
        "name": "Airbus A380-800",
        "manufacturer": "Airbus",
        "model": "A380-800",
        "first_flight_year": 2005,
        "mtow": 575000,
        "wing_area": 845,
        "wingspan": 79.8,
        "cruise_speed": 945,
        "takeoff_speed": 280,
        "landing_speed": 240,
        "service_ceiling": 13100,
        "max_thrust": 1340,
        "engine_type": "Turbofan",
        "engine_count": 4,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/0/09/Emirates_Airbus_A380-861_A6-EDD_MUC_2015_04.jpg",
        "cruise_altitude": 13106
    },
    {
        "name": "Boeing 747-8",
        "manufacturer": "Boeing",
        "model": "747-8",
        "first_flight_year": 2010,
        "mtow": 447700,
        "wing_area": 554,
        "wingspan": 68.4,
        "cruise_speed": 914,
        "takeoff_speed": 290,
        "landing_speed": 250,
        "service_ceiling": 13100,
        "max_thrust": 1000,
        "engine_type": "Turbofan",
        "engine_count": 4,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/a/a4/LUFTHANSA_B747-8_%2840272913674%29.jpg",
        "cruise_altitude": 13106
    },
    {
        "name": "Cirrus SR22",
        "manufacturer": "Cirrus",
        "model": "SR22",
        "first_flight_year": 2001,
        "mtow": 1542,
        "wing_area": 13.5,
        "wingspan": 11.7,
        "cruise_speed": 337,
        "takeoff_speed": 120,
        "landing_speed": 100,
        "service_ceiling": 5300,
        "max_thrust": 2.5,
        "engine_type": "Piston",
        "engine_count": 1,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Cirrus_SR22_N545CD.jpg",
        "cruise_altitude": 5486
    },
    {
        "name": "Pilatus PC-12",
        "manufacturer": "Pilatus",
        "model": "PC-12",
        "first_flight_year": 1991,
        "mtow": 4740,
        "wing_area": 25.8,
        "wingspan": 16.3,
        "cruise_speed": 500,
        "takeoff_speed": 170,
        "landing_speed": 150,
        "service_ceiling": 9150,
        "max_thrust": 15,
        "engine_type": "Turboprop",
        "engine_count": 1,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/8/82/Pilatus_PC-12_HB-FVD.jpg",
        "cruise_altitude": 9144
    },
    {
        "name": "Beechcraft King Air 350",
        "manufacturer": "Beechcraft",
        "model": "King Air 350",
        "first_flight_year": 1988,
        "mtow": 6800,
        "wing_area": 28.8,
        "wingspan": 17.7,
        "cruise_speed": 578,
        "takeoff_speed": 175,
        "landing_speed": 160,
        "service_ceiling": 10700,
        "max_thrust": 30,
        "engine_type": "Turboprop",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/3/3b/Beechcraft_B300_King_Air_350.jpg",
        "cruise_altitude": 10668
    },
    {
        "name": "Dassault Falcon 7X",
        "manufacturer": "Dassault",
        "model": "Falcon 7X",
        "first_flight_year": 2005,
        "mtow": 31750,
        "wing_area": 70.7,
        "wingspan": 26.2,
        "cruise_speed": 904,
        "takeoff_speed": 210,
        "landing_speed": 190,
        "service_ceiling": 15500,
        "max_thrust": 63,
        "engine_type": "Turbofan",
        "engine_count": 3,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Dassault_Falcon_7X_at_EBACE_2019.jpg",
        "cruise_altitude": 15544
    },
    {
        "name": "Gulfstream G650",
        "manufacturer": "Gulfstream",
        "model": "G650",
        "first_flight_year": 2009,
        "mtow": 45178,
        "wing_area": 102.5,
        "wingspan": 30.4,
        "cruise_speed": 956,
        "takeoff_speed": 220,
        "landing_speed": 200,
        "service_ceiling": 15500,
        "max_thrust": 146,
        "engine_type": "Turbofan",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Gulfstream_G650ER_N650GD.jpg",
        "cruise_altitude": 15544
    }
]

def categorize_aircraft(aircraft):
    """Classifica a aeronave nas categorias com base em seus dados"""
    
    # Valor padrão para campos não classificados
    result = {
        'category_type': None,
        'category_era': None,
        'category_engine': None,
        'category_size': None
    }
    
    # Classificar por Era/Geração com base no ano de primeiro voo
    if aircraft.get('first_flight_year'):
        year = aircraft['first_flight_year']
        if year <= 1930:
            result['category_era'] = 'pioneiros'
        elif year <= 1950:
            result['category_era'] = 'classica'
        elif year <= 1970:
            result['category_era'] = 'jato_inicial'
        elif year <= 2000:
            result['category_era'] = 'moderna'
        else:
            result['category_era'] = 'contemporanea'
    
    # Classificar por Tamanho com base no MTOW
    if aircraft.get('mtow'):
        mtow = aircraft['mtow']
        if mtow <= 5700:
            result['category_size'] = 'muito_leve'
        elif mtow <= 50000:
            result['category_size'] = 'regional'
        elif mtow <= 150000:
            result['category_size'] = 'medio'
        elif mtow <= 300000:
            result['category_size'] = 'grande'
        else:
            result['category_size'] = 'muito_grande'
    
    # Classificar por Tipo de Motor
    if aircraft.get('engine_type'):
        engine = aircraft['engine_type'].lower()
        if 'pistão' in engine or 'piston' in engine:
            result['category_engine'] = 'pistao'
        elif 'turboélice' in engine or 'turboprop' in engine:
            result['category_engine'] = 'turboelice'
        elif 'turbojato' in engine or 'turbojet' in engine:
            result['category_engine'] = 'turbojato'
        elif 'turbofan' in engine:
            result['category_engine'] = 'turbofan'
        elif any(term in engine for term in ['elétrico', 'electric', 'solar', 'híbrido', 'hybrid']):
            result['category_engine'] = 'especial'
    
    # Classificações específicas para aeronaves conhecidas
    name = aircraft.get('name', '').lower()
    
    # Aeronaves históricas/pioneiras
    if any(term in name for term in ['wright flyer', 'santos-dumont', '14-bis', 'fokker']):
        result['category_type'] = 'historica'
    
    # Classificar aeronaves militares
    elif any(term in name for term in ['f-', 'mirage', 'mig', 'sukhoi', 'c-130', 'hercules']):
        result['category_type'] = 'militar'
    
    # Classificar aeronaves executivas
    elif any(term in name for term in ['citation', 'learjet', 'gulfstream', 'challenger', 'phenom', 'king air']):
        result['category_type'] = 'executiva'
    
    # Classificar aeronaves de carga específicas
    elif any(term in name for term in ['freighter', 'cargo', 'cargueiro']):
        result['category_type'] = 'carga'
    
    # Classificar aviação geral
    elif any(term in name for term in ['cessna', 'piper', 'beechcraft', 'cirrus']) and aircraft.get('mtow', 0) < 5700:
        result['category_type'] = 'geral'
    
    # Classificar aviação comercial (maioria dos casos)
    elif any(term in name for term in ['airbus', 'boeing', 'embraer', 'bombardier', 'atr', 'fokker', 'mcdonnel', 'douglas']):
        # Se for um cargueiro específico
        if any(term in name for term in ['f', 'freighter', 'bcf']):
            result['category_type'] = 'carga'
        else:
            result['category_type'] = 'comercial'
    
    return result

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

def import_aircraft_data(max_aircraft=None):
    """
    Importa dados de aeronaves para o banco de dados.
    
    Args:
        max_aircraft (int, optional): Número máximo de aeronaves para importar.
            Se None, importa todas as aeronaves disponíveis.
    
    Returns:
        int: Número de aeronaves importadas com sucesso
    """
    # Combinar dados modernos e históricos
    all_aircraft_data = AIRCRAFT_DATA
    
    # Adicionar dados históricos se disponíveis
    if HISTORICAL_DATA_AVAILABLE:
        historical_data = get_all_historical_aircraft()
        all_aircraft_data = historical_data + all_aircraft_data
        print(f"Dados históricos disponíveis: {len(historical_data)} aeronaves")
    
    # Limitar o número de aeronaves se necessário
    if max_aircraft is not None:
        all_aircraft_data = all_aircraft_data[:max_aircraft]
    
    print(f"Importando {len(all_aircraft_data)} aeronaves...")
    
    # Adicionar classificação de categoria para cada aeronave
    categorized_data = []
    for aircraft in all_aircraft_data:
        categories = categorize_aircraft(aircraft)
        aircraft.update(categories)
        categorized_data.append(aircraft)
    
    # Importar cada aeronave
    imported_count = 0
    for data in categorized_data:
        success = import_aircraft_to_db(data)
        if success:
            imported_count += 1
    
    print(f"Importação concluída. {imported_count} aeronaves importadas com sucesso!")
    return imported_count

def main():
    """Função principal para importar dados de aeronaves."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Importar dados de aeronaves.')
    parser.add_argument('--max', '-m', type=int, default=None,
                        help='Número máximo de aeronaves para importar')
    
    args = parser.parse_args()
    
    # Inicializar o banco de dados
    with app.app_context():
        import_aircraft_data(args.max)

if __name__ == "__main__":
    main() 