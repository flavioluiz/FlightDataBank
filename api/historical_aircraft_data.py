"""
Módulo que fornece dados históricos de aeronaves.
Usado para popular o banco de dados com exemplos iniciais de aeronaves.
"""

# Conjunto 1 de dados históricos - Aeronaves pioneiras e históricas
HISTORICAL_AIRCRAFT_DATA = [
    {
        "name": "Wright Flyer",
        "manufacturer": "Wright Brothers",
        "model": "Flyer I",
        "first_flight_year": 1903,
        "mtow": 338,
        "wing_area": 47.4,
        "wingspan": 12.3,
        "cruise_speed": 48,
        "engine_type": "Pistão",
        "engine_count": 1,
        "category_type": "historica",
        "category_era": "pioneiros",
        "category_engine": "pistao",
        "category_size": "muito_leve",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/First_flight2.jpg/1280px-First_flight2.jpg"
    },
    {
        "name": "Santos-Dumont 14-bis",
        "manufacturer": "Santos-Dumont",
        "model": "14-bis",
        "first_flight_year": 1906,
        "mtow": 300,
        "wing_area": 52,
        "wingspan": 12,
        "cruise_speed": 40,
        "engine_type": "Pistão",
        "engine_count": 1,
        "category_type": "historica",
        "category_era": "pioneiros",
        "category_engine": "pistao",
        "category_size": "muito_leve",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Alberto_Santos-Dumont_piloting_the_14-bis.jpg/1280px-Alberto_Santos-Dumont_piloting_the_14-bis.jpg"
    },
    {
        "name": "Douglas DC-3",
        "manufacturer": "Douglas Aircraft Company",
        "model": "DC-3",
        "first_flight_year": 1935,
        "mtow": 11430,
        "wing_area": 91.7,
        "wingspan": 29,
        "cruise_speed": 333,
        "takeoff_speed": 120,
        "landing_speed": 110,
        "service_ceiling": 7075,
        "engine_type": "Pistão Radial",
        "engine_count": 2,
        "category_type": "comercial",
        "category_era": "classica",
        "category_engine": "pistao",
        "category_size": "regional",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/C-47A_Skytrain_USAF.jpg/1280px-C-47A_Skytrain_USAF.jpg"
    }
]

# Conjunto 2 de dados históricos - Jatos comerciais e militares
HISTORICAL_AIRCRAFT_DATA_2 = [
    {
        "name": "Boeing 707",
        "manufacturer": "Boeing",
        "model": "707-320",
        "first_flight_year": 1957,
        "mtow": 151315,
        "wing_area": 283,
        "wingspan": 44.4,
        "cruise_speed": 977,
        "takeoff_speed": 290,
        "landing_speed": 240,
        "service_ceiling": 12800,
        "max_thrust": 80,
        "engine_type": "Turbojato",
        "engine_count": 4,
        "category_type": "comercial",
        "category_era": "jato_inicial",
        "category_engine": "turbojato",
        "category_size": "grande",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/BOAC_Boeing_707_Collins.jpg/1280px-BOAC_Boeing_707_Collins.jpg"
    },
    {
        "name": "Hawker Siddeley Trident",
        "manufacturer": "Hawker Siddeley",
        "model": "Trident 1C",
        "first_flight_year": 1962,
        "mtow": 63500,
        "wing_area": 140,
        "wingspan": 29.97,
        "cruise_speed": 974,
        "service_ceiling": 11900,
        "engine_type": "Turbojato",
        "engine_count": 3,
        "category_type": "comercial",
        "category_era": "jato_inicial",
        "category_engine": "turbojato",
        "category_size": "medio",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Hawker_Siddeley_HS-121_Trident_BEA_Heathrow_1964.jpg/1280px-Hawker_Siddeley_HS-121_Trident_BEA_Heathrow_1964.jpg"
    },
    {
        "name": "De Havilland Comet",
        "manufacturer": "De Havilland",
        "model": "Comet 4",
        "first_flight_year": 1949,
        "mtow": 71125,
        "wing_area": 197,
        "wingspan": 35,
        "cruise_speed": 795,
        "service_ceiling": 12800,
        "engine_type": "Turbojato",
        "engine_count": 4,
        "category_type": "comercial",
        "category_era": "jato_inicial",
        "category_engine": "turbojato",
        "category_size": "medio",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/BOAC_de_Havilland_DH-106_Comet_1_Heathrow_06.07.54_edited-4.jpg/1280px-BOAC_de_Havilland_DH-106_Comet_1_Heathrow_06.07.54_edited-4.jpg"
    }
]

# Conjunto 3 de dados históricos - Aeronaves modernas e contemporâneas
HISTORICAL_AIRCRAFT_DATA_3 = [
    {
        "name": "Boeing 747-400",
        "manufacturer": "Boeing",
        "model": "747-400",
        "first_flight_year": 1988,
        "mtow": 396890,
        "wing_area": 541.2,
        "wingspan": 64.4,
        "cruise_speed": 920,
        "takeoff_speed": 290,
        "landing_speed": 250,
        "service_ceiling": 13700,
        "max_thrust": 284,
        "engine_type": "Turbofan",
        "engine_count": 4,
        "category_type": "comercial",
        "category_era": "moderna",
        "category_engine": "turbofan",
        "category_size": "muito_grande",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Lufthansa_Boeing_747-400_D-ABVL.jpg/1280px-Lufthansa_Boeing_747-400_D-ABVL.jpg"
    },
    {
        "name": "Airbus A380",
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
        "max_thrust": 348,
        "engine_type": "Turbofan",
        "engine_count": 4,
        "category_type": "comercial",
        "category_era": "contemporanea",
        "category_engine": "turbofan",
        "category_size": "muito_grande",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/A6-EDY_A380_Emirates_31_mar_2012_jfk_%286876813096%29_%28cropped%29.jpg/1280px-A6-EDY_A380_Emirates_31_mar_2012_jfk_%286876813096%29_%28cropped%29.jpg"
    },
    {
        "name": "Boeing 777-300ER",
        "manufacturer": "Boeing",
        "model": "777-300ER",
        "first_flight_year": 2003,
        "mtow": 351500,
        "wing_area": 427.8,
        "wingspan": 64.8,
        "cruise_speed": 905,
        "takeoff_speed": 270,
        "landing_speed": 240,
        "service_ceiling": 13100,
        "max_thrust": 230,
        "engine_type": "Turbofan",
        "engine_count": 2,
        "category_type": "comercial",
        "category_era": "contemporanea",
        "category_engine": "turbofan",
        "category_size": "muito_grande",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Emirates_Boeing_777-300ER_%28A6-EBS%29_at_Frankfurt_Airport.jpg/1280px-Emirates_Boeing_777-300ER_%28A6-EBS%29_at_Frankfurt_Airport.jpg"
    },
    {
        "name": "Airbus A320neo",
        "manufacturer": "Airbus",
        "model": "A320-251N",
        "first_flight_year": 2014,
        "mtow": 79000,
        "wing_area": 122.6,
        "wingspan": 35.8,
        "cruise_speed": 833,
        "takeoff_speed": 260,
        "landing_speed": 230,
        "service_ceiling": 12000,
        "max_thrust": 120,
        "engine_type": "Turbofan",
        "engine_count": 2,
        "category_type": "comercial",
        "category_era": "contemporanea",
        "category_engine": "turbofan",
        "category_size": "medio",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Lufthansa_Airbus_A320neo_%28D-AINA%29_landing_at_Frankfurt_Airport_%28crop%29.jpg/1280px-Lufthansa_Airbus_A320neo_%28D-AINA%29_landing_at_Frankfurt_Airport_%28crop%29.jpg"
    }
]

def get_all_historical_aircraft():
    """
    Função que combina todos os conjuntos de dados históricos de aeronaves.
    
    Returns:
        list: Lista combinada com todos os dados históricos de aeronaves
    """
    # Combinar todos os conjuntos de dados em uma única lista
    all_data = []
    all_data.extend(HISTORICAL_AIRCRAFT_DATA)
    all_data.extend(HISTORICAL_AIRCRAFT_DATA_2)
    all_data.extend(HISTORICAL_AIRCRAFT_DATA_3)
    
    return all_data 