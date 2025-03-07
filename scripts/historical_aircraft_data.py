#!/usr/bin/env python3
"""
Dados históricos de aeronaves para importação no banco de dados.
"""

historical_aircraft_data = [
    {
        "name": "Wright Flyer",
        "manufacturer": "Wright Brothers",
        "model": "Flyer I",
        "first_flight_year": 1903,
        "mtow": 338,
        "wing_area": 47,
        "wingspan": 12.3,
        "cruise_speed": 48,
        "takeoff_speed": 45,
        "landing_speed": 40,
        "engine_type": "Piston",
        "engine_count": 1,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/7/7d/Wright_Flyer_in_flight_1903.jpg",
        "cruise_altitude": 30
    },
    {
        "name": "Santos-Dumont 14-bis",
        "manufacturer": "Santos-Dumont",
        "model": "14-bis",
        "first_flight_year": 1906,
        "mtow": 300,
        "wing_area": 52,
        "wingspan": 11.2,
        "cruise_speed": 40,
        "takeoff_speed": 37,
        "landing_speed": 35,
        "engine_type": "Piston",
        "engine_count": 1,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/6/60/14bis_-_Primeiro_voo_-_1906.jpg",
        "cruise_altitude": 60
    },
    {
        "name": "Douglas DC-3",
        "manufacturer": "Douglas",
        "model": "DC-3",
        "first_flight_year": 1935,
        "mtow": 11430,
        "wing_area": 91.7,
        "wingspan": 29.0,
        "cruise_speed": 333,
        "takeoff_speed": 120,
        "landing_speed": 100,
        "service_ceiling": 7300,
        "engine_type": "Piston",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/b/b1/Douglas_DC-3%2C_N18121%2C_in_flight.jpg",
        "cruise_altitude": 3000
    },
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
        "service_ceiling": 13100,
        "max_thrust": 75.6,
        "engine_type": "Jet",
        "engine_count": 4,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/0/0c/Pan_Am_Boeing_707-321B_N880PA.jpg",
        "cruise_altitude": 11000
    },
    {
        "name": "Concorde",
        "manufacturer": "Aérospatiale/BAC",
        "model": "Concorde",
        "first_flight_year": 1969,
        "mtow": 185070,
        "wing_area": 358.25,
        "wingspan": 25.6,
        "cruise_speed": 2179,
        "takeoff_speed": 400,
        "landing_speed": 290,
        "service_ceiling": 18300,
        "max_thrust": 169.2,
        "engine_type": "Jet",
        "engine_count": 4,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/e/eb/British_Airways_Concorde_G-BOAC_03.jpg",
        "cruise_altitude": 18290
    },
    {
        "name": "Airbus A320",
        "manufacturer": "Airbus",
        "model": "A320-200",
        "first_flight_year": 1987,
        "mtow": 78000,
        "wing_area": 124,
        "wingspan": 35.8,
        "cruise_speed": 828,
        "takeoff_speed": 275,
        "landing_speed": 240,
        "service_ceiling": 11900,
        "max_thrust": 120,
        "engine_type": "Jet",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/b/bc/Airbus_A320-232%2C_Lufthansa_JP7436571.jpg",
        "cruise_altitude": 11280
    },
    {
        "name": "Boeing 747",
        "manufacturer": "Boeing",
        "model": "747-400",
        "first_flight_year": 1988,
        "mtow": 396890,
        "wing_area": 541.2,
        "wingspan": 64.4,
        "cruise_speed": 913,
        "takeoff_speed": 290,
        "landing_speed": 260,
        "service_ceiling": 13700,
        "max_thrust": 282,
        "engine_type": "Jet",
        "engine_count": 4,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/f/f0/Lufthansa_Boeing_747-400_D-ABVX.jpg",
        "cruise_altitude": 13100
    },
    {
        "name": "Airbus A380",
        "manufacturer": "Airbus",
        "model": "A380-800",
        "first_flight_year": 2005,
        "mtow": 575000,
        "wing_area": 845,
        "wingspan": 79.75,
        "cruise_speed": 903,
        "takeoff_speed": 280,
        "landing_speed": 250,
        "service_ceiling": 13100,
        "max_thrust": 374,
        "engine_type": "Jet",
        "engine_count": 4,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/0/09/A6-EDY_A380_Emirates_31_jan_2013_jfk_%288442269364%29_%28cropped%29.jpg"
    },
    {
        "name": "Embraer E190",
        "manufacturer": "Embraer",
        "model": "E190",
        "first_flight_year": 2004,
        "mtow": 51800,
        "wing_area": 92.5,
        "wingspan": 28.72,
        "cruise_speed": 850,
        "takeoff_speed": 260,
        "landing_speed": 220,
        "service_ceiling": 12500,
        "max_thrust": 82.3,
        "engine_type": "Jet",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Embraer_190_KLM_Cityhopper.jpg",
        "cruise_altitude": 12500
    },
    {
        "name": "Cessna Citation X",
        "manufacturer": "Cessna",
        "model": "Citation X",
        "first_flight_year": 1993,
        "mtow": 16375,
        "wing_area": 48.96,
        "wingspan": 19.48,
        "cruise_speed": 972,
        "takeoff_speed": 220,
        "landing_speed": 180,
        "service_ceiling": 15545,
        "max_thrust": 31.3,
        "engine_type": "Jet",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Cessna_Citation_X_N750GF.jpg",
        "cruise_altitude": 15545
    }
]

# Segunda parte dos dados históricos
HISTORICAL_AIRCRAFT_DATA_2 = [
    {
        "name": "Boeing 757-200",
        "manufacturer": "Boeing",
        "model": "757-200",
        "first_flight_year": 1982,
        "mtow": 115680,
        "wing_area": 185.3,
        "wingspan": 38.0,
        "cruise_speed": 850,
        "takeoff_speed": 260,
        "landing_speed": 220,
        "service_ceiling": 12800,
        "max_thrust": 400,
        "engine_type": "Turbofan",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/4/44/American_Airlines_Boeing_757-200.jpg",
        "cruise_altitude": 11890
    },
    {
        "name": "Boeing 767-200",
        "manufacturer": "Boeing",
        "model": "767-200",
        "first_flight_year": 1981,
        "mtow": 142880,
        "wing_area": 283.3,
        "wingspan": 47.6,
        "cruise_speed": 851,
        "takeoff_speed": 270,
        "landing_speed": 230,
        "service_ceiling": 13100,
        "max_thrust": 480,
        "engine_type": "Turbofan",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/8/88/United_Airlines_Boeing_767-222_N606UA.jpg",
        "cruise_altitude": 12500
    },
    {
        "name": "Boeing 777-200",
        "manufacturer": "Boeing",
        "model": "777-200",
        "first_flight_year": 1994,
        "mtow": 247200,
        "wing_area": 427.8,
        "wingspan": 60.9,
        "cruise_speed": 892,
        "takeoff_speed": 280,
        "landing_speed": 240,
        "service_ceiling": 13100,
        "max_thrust": 770,
        "engine_type": "Turbofan",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/3/3c/United_Airlines_Boeing_777-200_N786UA.jpg",
        "cruise_altitude": 13100
    },
    {
        "name": "Airbus A300B4",
        "manufacturer": "Airbus",
        "model": "A300B4",
        "first_flight_year": 1972,
        "mtow": 165000,
        "wing_area": 260,
        "wingspan": 44.8,
        "cruise_speed": 870,
        "takeoff_speed": 270,
        "landing_speed": 230,
        "service_ceiling": 12200,
        "max_thrust": 480,
        "engine_type": "Turbofan",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/d/d3/Lufthansa_Airbus_A300B4-603_D-AIAS.jpg",
        "cruise_altitude": 10670
    },
    {
        "name": "Airbus A310-300",
        "manufacturer": "Airbus",
        "model": "A310-300",
        "first_flight_year": 1982,
        "mtow": 150000,
        "wing_area": 219,
        "wingspan": 43.9,
        "cruise_speed": 850,
        "takeoff_speed": 260,
        "landing_speed": 230,
        "service_ceiling": 12500,
        "max_thrust": 420,
        "engine_type": "Turbofan",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/b/bc/Air_Transat_Airbus_A310-308_C-GTSF.jpg",
        "cruise_altitude": 11890
    },
    {
        "name": "Airbus A330-300",
        "manufacturer": "Airbus",
        "model": "A330-300",
        "first_flight_year": 1992,
        "mtow": 233000,
        "wing_area": 361.6,
        "wingspan": 60.3,
        "cruise_speed": 871,
        "takeoff_speed": 270,
        "landing_speed": 240,
        "service_ceiling": 12500,
        "max_thrust": 640,
        "engine_type": "Turbofan",
        "engine_count": 2,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/4/4d/Turkish_Airlines_Airbus_A330-300_TC-JNL.jpg",
        "cruise_altitude": 12500
    },
    {
        "name": "Airbus A340-300",
        "manufacturer": "Airbus",
        "model": "A340-300",
        "first_flight_year": 1991,
        "mtow": 276500,
        "wing_area": 361.6,
        "wingspan": 60.3,
        "cruise_speed": 871,
        "takeoff_speed": 280,
        "landing_speed": 240,
        "service_ceiling": 12500,
        "max_thrust": 680,
        "engine_type": "Turbofan",
        "engine_count": 4,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/8/81/Lufthansa_Airbus_A340-300_D-AIGO.jpg",
        "cruise_altitude": 12500
    },
    {
        "name": "Boeing 314 Clipper",
        "manufacturer": "Boeing",
        "model": "314 Clipper",
        "first_flight_year": 1938,
        "mtow": 38000,
        "wing_area": 250,
        "wingspan": 46,
        "cruise_speed": 300,
        "takeoff_speed": 140,
        "landing_speed": 130,
        "service_ceiling": 6000,
        "max_thrust": 30,
        "engine_type": "Piston",
        "engine_count": 4,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/c/c3/Boeing_314_Clipper_on_the_water.jpg",
        "cruise_altitude": 3960
    },
    {
        "name": "Boeing 377 Stratocruiser",
        "manufacturer": "Boeing",
        "model": "377 Stratocruiser",
        "first_flight_year": 1947,
        "mtow": 66000,
        "wing_area": 164.6,
        "wingspan": 43.1,
        "cruise_speed": 547,
        "takeoff_speed": 180,
        "landing_speed": 160,
        "service_ceiling": 9700,
        "max_thrust": 40,
        "engine_type": "Piston",
        "engine_count": 4,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Boeing_377_Stratocruiser_Pan_Am_Clipper_Rainbow.jpg"
    }
]

# Terceira parte dos dados históricos
HISTORICAL_AIRCRAFT_DATA_3 = [
    {
        "name": "Boeing 307 Stratoliner",
        "manufacturer": "Boeing",
        "model": "307 Stratoliner",
        "first_flight_year": 1938,
        "mtow": 19000,
        "wing_area": 138,
        "wingspan": 32.6,
        "cruise_speed": 350,
        "takeoff_speed": 150,
        "landing_speed": 140,
        "service_ceiling": 7900,
        "max_thrust": 25,
        "engine_type": "Piston",
        "engine_count": 4,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Boeing_307_Stratoliner_NC19903_TWA.jpg",
        "cruise_altitude": 6100
    },
    {
        "name": "Lockheed Constellation",
        "manufacturer": "Lockheed",
        "model": "L-1049 Super Constellation",
        "first_flight_year": 1943,
        "mtow": 54000,
        "wing_area": 153.5,
        "wingspan": 37.5,
        "cruise_speed": 547,
        "takeoff_speed": 170,
        "landing_speed": 150,
        "service_ceiling": 7600,
        "max_thrust": 35,
        "engine_type": "Piston",
        "engine_count": 4,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Lockheed_L-1049G_Super_Constellation_HB-RSC.jpg",
        "cruise_altitude": 7010
    },
    {
        "name": "Hawker Siddeley Trident",
        "manufacturer": "Hawker Siddeley",
        "model": "Trident",
        "first_flight_year": 1962,
        "mtow": 64000,
        "wing_area": 141.9,
        "wingspan": 29.9,
        "cruise_speed": 880,
        "takeoff_speed": 260,
        "landing_speed": 230,
        "service_ceiling": 11900,
        "max_thrust": 180,
        "engine_type": "Jet",
        "engine_count": 3,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/d/d6/Hawker_Siddeley_Trident_1C_G-ARPO.jpg",
        "cruise_altitude": 10670
    }
]

# Adicionar a variável HISTORICAL_AIRCRAFT para exportação
HISTORICAL_AIRCRAFT = historical_aircraft_data + HISTORICAL_AIRCRAFT_DATA_2 + HISTORICAL_AIRCRAFT_DATA_3

# Função para obter todos os dados históricos
def get_all_historical_aircraft():
    """Retorna todos os dados históricos de aeronaves."""
    return historical_aircraft_data + HISTORICAL_AIRCRAFT_DATA_2 + HISTORICAL_AIRCRAFT_DATA_3 