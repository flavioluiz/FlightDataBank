import os
import sys
import subprocess
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from .models import db, Aircraft
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from io import BytesIO
import base64
import json
import logging
from .historical_aircraft_data import get_all_historical_aircraft

app = Flask(__name__, static_folder='../web')
# Configurar CORS para permitir solicitações de qualquer origem
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuração do banco de dados
# Usar caminho absoluto para o banco de dados
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'aircraft.db')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', f'sqlite:///{db_path}')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicialização do banco de dados
db.init_app(app)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/test-modal')
def test_modal():
    return send_from_directory(app.static_folder, 'test-modal.html')

@app.route('/api-test')
def api_test():
    return send_from_directory(app.static_folder, 'api-test.html')

# Rota para servir arquivos estáticos
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/api/aircraft', methods=['GET'])
def get_all_aircraft():
    try:
        aircraft = Aircraft.query.all()
        aircraft_data = []
        
        for a in aircraft:
            try:
                aircraft_data.append(a.to_dict())
            except Exception as e:
                app.logger.error(f"Error converting aircraft ID {a.id} to dict: {str(e)}")
                # Continue with next aircraft instead of failing the entire request
                continue
        
        return jsonify(aircraft_data)
    except Exception as e:
        app.logger.error(f"Error getting all aircraft: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/aircraft/<int:id>', methods=['GET'])
def get_aircraft(id):
    try:
        aircraft = Aircraft.query.get_or_404(id)
        return jsonify(aircraft.to_dict())
    except Exception as e:
        app.logger.error(f"Error getting aircraft {id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/aircraft', methods=['POST'])
def create_aircraft():
    data = request.json
    
    new_aircraft = Aircraft(
        name=data.get('name'),
        manufacturer=data.get('manufacturer'),
        model=data.get('model'),
        first_flight_year=data.get('first_flight_year'),
        mtow=data.get('mtow'),
        wing_area=data.get('wing_area'),
        wingspan=data.get('wingspan'),
        cruise_speed=data.get('cruise_speed'),
        takeoff_speed=data.get('takeoff_speed'),
        landing_speed=data.get('landing_speed'),
        service_ceiling=data.get('service_ceiling'),
        max_thrust=data.get('max_thrust'),
        engine_type=data.get('engine_type'),
        engine_count=data.get('engine_count'),
        image_url=data.get('image_url')
    )
    
    db.session.add(new_aircraft)
    db.session.commit()
    
    return jsonify(new_aircraft.to_dict()), 201

@app.route('/api/aircraft/<int:id>', methods=['PUT'])
def update_aircraft(id):
    aircraft = Aircraft.query.get_or_404(id)
    data = request.json
    
    # Atualiza os campos
    for key, value in data.items():
        if hasattr(aircraft, key):
            setattr(aircraft, key, value)
    
    db.session.commit()
    return jsonify(aircraft.to_dict())

@app.route('/api/aircraft/<int:id>', methods=['DELETE'])
def delete_aircraft(id):
    aircraft = Aircraft.query.get_or_404(id)
    db.session.delete(aircraft)
    db.session.commit()
    return '', 204

@app.route('/api/stats/scatter', methods=['GET'])
def get_scatter_data():
    try:
        x_param = request.args.get('x', 'mtow')
        y_param = request.args.get('y', 'cruise_speed')
        
        aircraft = Aircraft.query.all()
        data = []
        
        for a in aircraft:
            try:
                a_dict = a.to_dict()
                if x_param in a_dict and y_param in a_dict and a_dict[x_param] is not None and a_dict[y_param] is not None:
                    data.append({
                        'id': a.id,
                        'name': f"{a.manufacturer or ''} {a.model or ''}".strip(),
                        'x': a_dict[x_param],
                        'y': a_dict[y_param]
                    })
            except Exception as aircraft_error:
                app.logger.error(f"Error processing aircraft {a.id} for scatter plot: {str(aircraft_error)}")
                continue
        
        return jsonify(data)
    except Exception as e:
        app.logger.error(f"Error getting scatter data: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/stats/timeline', methods=['GET'])
def get_timeline_data():
    try:
        param = request.args.get('param', 'mtow')
        
        aircraft = Aircraft.query.filter(Aircraft.first_flight_year.isnot(None)).order_by(Aircraft.first_flight_year).all()
        data = []
        
        for a in aircraft:
            try:
                a_dict = a.to_dict()
                if param in a_dict and a_dict[param] is not None and a.first_flight_year is not None:
                    data.append({
                        'id': a.id,
                        'name': f"{a.manufacturer or ''} {a.model or ''}".strip(),
                        'year': a.first_flight_year,
                        'value': a_dict[param]
                    })
            except Exception as aircraft_error:
                app.logger.error(f"Error processing aircraft {a.id} for timeline: {str(aircraft_error)}")
                continue
        
        return jsonify(data)
    except Exception as e:
        app.logger.error(f"Error getting timeline data: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/stats/comparison', methods=['GET'])
def get_comparison_data():
    ids = request.args.get('ids', '')
    if not ids:
        return jsonify([])
    
    id_list = [int(id) for id in ids.split(',')]
    aircraft = Aircraft.query.filter(Aircraft.id.in_(id_list)).all()
    
    if not aircraft:
        return jsonify([])
    
    # Parâmetros para comparação
    params = [
        'mtow', 'wing_area', 'wingspan', 'cruise_speed', 
        'takeoff_speed', 'landing_speed', 'service_ceiling',
        'max_thrust', 'wing_loading', 'cruise_cl', 'landing_cl'
    ]
    
    data = []
    for a in aircraft:
        a_dict = a.to_dict()
        aircraft_data = {
            'id': a.id,
            'name': f"{a.manufacturer} {a.model}"
        }
        
        for param in params:
            if param in a_dict:
                aircraft_data[param] = a_dict[param]
        
        data.append(aircraft_data)
    
    return jsonify(data)

@app.route('/api/import/sample', methods=['POST'])
def import_aircraft_data():
    """Import sample aircraft data."""
    try:
        # Get sample aircraft data from the historical_aircraft_data module
        sample_data = get_all_historical_aircraft()
        
        # Keep track of the number of aircraft imported
        count = 0
        
        # For each aircraft in the sample data
        for aircraft_data in sample_data:
            # Check if the aircraft already exists in the database
            existing_aircraft = Aircraft.query.filter_by(name=aircraft_data.get('name')).first()
            
            if existing_aircraft:
                # Update existing aircraft with new data
                for key, value in aircraft_data.items():
                    setattr(existing_aircraft, key, value)
            else:
                # Create a new aircraft
                new_aircraft = Aircraft(**aircraft_data)
                db.session.add(new_aircraft)
            
            # Increment count
            count += 1
        
        # Commit the changes to the database
        db.session.commit()
        
        return jsonify({"status": "success", "count": count})
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error importing aircraft data: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/import/birds', methods=['POST'])
def import_bird_data():
    """Import bird data."""
    try:
        app.logger.info("Iniciando importação de dados de aves")
        
        # Bird data (weight in Newtons, area in m²)
        bird_data = [
            {"name": "Common tern", "weight_newtons": 1.15, "wing_area": 0.050, "speed_mps": 7.8, "speed_mph": 18},
            {"name": "Dove prion", "weight_newtons": 1.70, "wing_area": 0.046, "speed_mps": 9.9, "speed_mph": 22},
            {"name": "Black-headed gull", "weight_newtons": 2.30, "wing_area": 0.075, "speed_mps": 9.0, "speed_mph": 20},
            {"name": "Black skimmer", "weight_newtons": 3.00, "wing_area": 0.089, "speed_mps": 9.4, "speed_mph": 21},
            {"name": "Common gull", "weight_newtons": 3.67, "wing_area": 0.115, "speed_mps": 9.2, "speed_mph": 21},
            {"name": "Kittiwake", "weight_newtons": 3.90, "wing_area": 0.101, "speed_mps": 10.1, "speed_mph": 23},
            {"name": "Royal tern", "weight_newtons": 4.70, "wing_area": 0.108, "speed_mps": 10.7, "speed_mph": 24},
            {"name": "Fulmar", "weight_newtons": 8.20, "wing_area": 0.124, "speed_mps": 13.2, "speed_mph": 30},
            {"name": "Herring gull", "weight_newtons": 9.40, "wing_area": 0.181, "speed_mps": 11.7, "speed_mph": 26},
            {"name": "Great skua", "weight_newtons": 13.5, "wing_area": 0.214, "speed_mps": 12.9, "speed_mph": 29},
            {"name": "Great black-billed gull", "weight_newtons": 19.2, "wing_area": 0.272, "speed_mps": 13.6, "speed_mph": 31},
            {"name": "Sooty albatross", "weight_newtons": 28.0, "wing_area": 0.340, "speed_mps": 14.7, "speed_mph": 33},
            {"name": "Black-browed albatross", "weight_newtons": 38.0, "wing_area": 0.360, "speed_mps": 16.7, "speed_mph": 38},
            {"name": "Wandering albatross", "weight_newtons": 87.0, "wing_area": 0.620, "speed_mps": 19.2, "speed_mph": 43}
        ]
        
        # Keep track of the number of birds imported
        count = 0
        
        # For each bird in the data
        for bird in bird_data:
            try:
                bird_name = f"Ave - {bird['name']}"
                app.logger.info(f"Processando ave: {bird_name}")
                
                # Convert weight from Newtons to kg (N = kg * 9.8)
                weight_kg = bird["weight_newtons"] / 9.8
                
                # Convert speed from m/s to km/h
                speed_kmh = bird["speed_mps"] * 3.6
                
                # Não precisamos mais calcular wing_loading aqui, pois será calculado automaticamente
                # como uma propriedade híbrida
                
                # Define image URLs for birds (generic bird images)
                bird_images = {
                    "Common tern": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Common_Tern_Sterna_hirundo.jpg/1280px-Common_Tern_Sterna_hirundo.jpg",
                    "Dove prion": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Antarctic_prion_%28Pachyptila_desolata%29.jpg/1280px-Antarctic_prion_%28Pachyptila_desolata%29.jpg",
                    "Black-headed gull": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Black-headed_Gull_-_St_James%27s_Park%2C_London_-_Nov_2006.jpg/1280px-Black-headed_Gull_-_St_James%27s_Park%2C_London_-_Nov_2006.jpg",
                    "Black skimmer": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Rynchops_niger_-Fort_Myers%2C_Florida%2C_USA_-flying-8.jpg/1280px-Rynchops_niger_-Fort_Myers%2C_Florida%2C_USA_-flying-8.jpg",
                    "Common gull": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Larus_canus2.jpg/1280px-Larus_canus2.jpg",
                    "Kittiwake": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Black-legged_Kittiwake_with_chicks.jpg/1280px-Black-legged_Kittiwake_with_chicks.jpg",
                    "Royal tern": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Sterna_maxima_-Cape_May%2C_New_Jersey%2C_USA-8.jpg/1280px-Sterna_maxima_-Cape_May%2C_New_Jersey%2C_USA-8.jpg",
                    "Fulmar": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Northern_Fulmar.jpg/1280px-Northern_Fulmar.jpg",
                    "Herring gull": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Larus_argentatus01.jpg/1280px-Larus_argentatus01.jpg",
                    "Great skua": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Great_Skua_on_Noss.jpg/1280px-Great_Skua_on_Noss.jpg",
                    "Great black-billed gull": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Larus_marinus_-_Laridae_-_Black-backed_Gull_-_Svartbag_-_Mantelmeeuw_-_Goeland_marin_07.jpg/1280px-Larus_marinus_-_Laridae_-_Black-backed_Gull_-_Svartbag_-_Mantelmeeuw_-_Goeland_marin_07.jpg",
                    "Sooty albatross": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Light-mantled_Albatross%2C_South_Georgia%2C_January_2006.jpg/1280px-Light-mantled_Albatross%2C_South_Georgia%2C_January_2006.jpg",
                    "Black-browed albatross": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Thalassarche_melanophris_-_SE_Tasmania.jpg/1280px-Thalassarche_melanophris_-_SE_Tasmania.jpg",
                    "Wandering albatross": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Wandering_Albatross_in_flight_-_SE_Tasmania.jpg/1280px-Wandering_Albatross_in_flight_-_SE_Tasmania.jpg"
                }
                
                # Get image URL or default
                image_url = bird_images.get(bird["name"], "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Wandering_Albatross_in_flight_-_SE_Tasmania.jpg/1280px-Wandering_Albatross_in_flight_-_SE_Tasmania.jpg")
                
                # Prepare aircraft data
                aircraft_data = {
                    "name": bird_name,
                    "manufacturer": "Natureza",
                    "model": bird["name"],
                    "mtow": round(weight_kg, 3),  # Rounded to 3 decimal places
                    "wing_area": bird["wing_area"],
                    "cruise_speed": round(speed_kmh, 1),  # Rounded to 1 decimal place
                    "category_type": "ave",
                    "category_era": "biologica",
                    "category_engine": "muscular",
                    "category_size": "muito_leve",
                    "image_url": image_url
                }
                
                # Check if the bird already exists in the database
                try:
                    # Consultar com segurança
                    existing_aircraft = Aircraft.query.filter_by(name=bird_name).first()
                    
                    if existing_aircraft:
                        app.logger.info(f"Atualizando ave existente: {bird_name}")
                        # Update existing bird with new data
                        for key, value in aircraft_data.items():
                            if hasattr(existing_aircraft, key):
                                setattr(existing_aircraft, key, value)
                    else:
                        app.logger.info(f"Criando nova ave: {bird_name}")
                        # Create a new aircraft entry for the bird
                        new_aircraft = Aircraft(**aircraft_data)
                        db.session.add(new_aircraft)
                    
                    # Increment count
                    count += 1
                    
                except Exception as query_error:
                    app.logger.error(f"Erro na consulta/atualização do banco de dados para {bird_name}: {str(query_error)}")
                    # Tentar uma alternativa
                    try:
                        app.logger.info(f"Tentando abordagem alternativa para {bird_name}")
                        # Tentar criar um novo registro sem verificar existência prévia
                        new_aircraft = Aircraft(**aircraft_data)
                        db.session.add(new_aircraft)
                        count += 1
                    except Exception as alt_error:
                        app.logger.error(f"Erro na abordagem alternativa para {bird_name}: {str(alt_error)}")
                        # Continuar para o próximo pássaro
                        continue
                
            except Exception as bird_error:
                app.logger.error(f"Erro ao processar ave {bird.get('name', 'desconhecida')}: {str(bird_error)}")
                # Continuar para o próximo pássaro
                continue
        
        # Commit the changes to the database
        db.session.commit()
        app.logger.info(f"Importação de aves concluída com sucesso: {count} aves importadas.")
        
        return jsonify({"status": "success", "count": count})
        
    except Exception as e:
        db.session.rollback()
        error_msg = f"Error importing bird data: {str(e)}"
        app.logger.error(error_msg)
        app.logger.exception("Detalhes completos do erro:")
        return jsonify({"status": "error", "message": error_msg}), 500

@app.route('/api/parameters', methods=['GET'])
def get_parameters():
    """Retorna a lista de parâmetros disponíveis para gráficos e filtros"""
    parameters = [
        {'id': 'mtow', 'name': 'MTOW (kg)', 'category': 'physical'},
        {'id': 'wing_area', 'name': 'Área da Asa (m²)', 'category': 'physical'},
        {'id': 'wingspan', 'name': 'Envergadura (m)', 'category': 'physical'},
        {'id': 'cruise_speed', 'name': 'Velocidade de Cruzeiro (km/h)', 'category': 'performance'},
        {'id': 'takeoff_speed', 'name': 'Velocidade de Decolagem (km/h)', 'category': 'performance'},
        {'id': 'landing_speed', 'name': 'Velocidade de Pouso (km/h)', 'category': 'performance'},
        {'id': 'service_ceiling', 'name': 'Teto de Serviço (m)', 'category': 'performance'},
        {'id': 'max_thrust', 'name': 'Tração Máxima (kN)', 'category': 'engine'},
        {'id': 'engine_count', 'name': 'Número de Motores', 'category': 'engine'},
        {'id': 'first_flight_year', 'name': 'Ano do Primeiro Voo', 'category': 'general'},
        {'id': 'wing_loading', 'name': 'Carga Alar (kg/m²)', 'category': 'calculated'},
        {'id': 'cruise_cl', 'name': 'CL de Cruzeiro', 'category': 'calculated'},
        {'id': 'landing_cl', 'name': 'CL de Pouso', 'category': 'calculated'}
    ]
    
    return jsonify(parameters)

@app.route('/api/import/online', methods=['POST'])
def import_online_data():
    """Importa dados de aeronaves de fontes online."""
    data = request.json
    source = data.get('source', 'predefined')  # Alterado para 'predefined' como padrão
    max_aircraft = min(int(data.get('max_aircraft', 10)), 50)  # Limitar a 50 aeronaves
    
    # Caminho para o script de importação
    script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'scripts', 'import_aircraft_data.py')
    
    if not os.path.exists(script_path):
        return jsonify({'error': 'Script de importação não encontrado'}), 404
    
    try:
        # Executar o script de importação como um processo separado
        cmd = [sys.executable, script_path, '--source', source, '--max', str(max_aircraft)]
        
        # Executar o comando e capturar a saída
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            return jsonify({
                'error': 'Erro ao executar o script de importação',
                'details': result.stderr
            }), 500
        
        # Extrair o número de aeronaves importadas da saída
        output = result.stdout
        import_count = 0
        
        # Tentar encontrar a linha com o total de aeronaves importadas
        for line in output.split('\n'):
            if 'Total de' in line and 'aeronaves importadas' in line:
                try:
                    import_count = int(line.split('Total de')[1].split('aeronaves')[0].strip())
                except ValueError:
                    pass
        
        return jsonify({
            'message': 'Importação concluída com sucesso',
            'count': import_count,
            'output': output
        })
    
    except Exception as e:
        return jsonify({
            'error': 'Erro ao importar dados',
            'details': str(e)
        }), 500

# Inicializa o banco de dados
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 