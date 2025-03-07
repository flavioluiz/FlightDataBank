#!/usr/bin/env python3
"""
Script para buscar dados de aeronaves comerciais populares na Wikipedia.
"""
import os
import sys
import requests
from bs4 import BeautifulSoup
import re
import json
import time
from dotenv import load_dotenv

# Adicionar o diretório raiz ao caminho de importação
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

# Importar modelos do banco de dados
from api.models import db, Aircraft
from api.app import app

# URLs e configurações
WIKIPEDIA_COMMERCIAL_AIRCRAFT_URL = "https://en.wikipedia.org/wiki/List_of_commercial_aircraft"
WIKIPEDIA_BASE_URL = "https://en.wikipedia.org"

# Headers para simular um navegador
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}

def get_aircraft_list():
    """
    Busca a lista de aeronaves comerciais na Wikipedia.
    
    Returns:
        list: Lista de dicionários com informações básicas das aeronaves
    """
    print("Buscando lista de aeronaves comerciais na Wikipedia...")
    
    # Fazer requisição para a página
    response = requests.get(WIKIPEDIA_COMMERCIAL_AIRCRAFT_URL, headers=HEADERS)
    
    if response.status_code != 200:
        print(f"Erro ao acessar a página: {response.status_code}")
        return []
    
    # Parsear o HTML
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Encontrar todas as tabelas
    tables = soup.find_all('table', {'class': 'wikitable'})
    
    all_aircraft = []
    
    for table in tables:
        # Verificar se é uma tabela de aeronaves
        header_row = table.find('tr')
        if not header_row:
            continue
        
        headers = [th.text.strip() for th in header_row.find_all(['th', 'td'])]
        
        # Verificar se a tabela tem as colunas esperadas
        if 'Aircraft' not in headers and 'Model' not in headers:
            continue
        
        # Encontrar o índice das colunas relevantes
        aircraft_idx = headers.index('Aircraft') if 'Aircraft' in headers else headers.index('Model')
        manufacturer_idx = headers.index('Manufacturer') if 'Manufacturer' in headers else -1
        
        # Processar as linhas da tabela
        rows = table.find_all('tr')[1:]  # Ignorar a primeira linha (cabeçalho)
        
        for row in rows:
            cells = row.find_all(['td', 'th'])
            
            if len(cells) <= aircraft_idx:
                continue
            
            # Extrair nome da aeronave e link para a página
            aircraft_cell = cells[aircraft_idx]
            aircraft_link = aircraft_cell.find('a')
            
            if not aircraft_link:
                continue
            
            aircraft_name = aircraft_link.text.strip()
            aircraft_url = aircraft_link.get('href', '')
            
            if not aircraft_url.startswith('/wiki/'):
                continue
            
            # Extrair fabricante
            manufacturer = ""
            if manufacturer_idx >= 0 and len(cells) > manufacturer_idx:
                manufacturer_cell = cells[manufacturer_idx]
                manufacturer_link = manufacturer_cell.find('a')
                
                if manufacturer_link:
                    manufacturer = manufacturer_link.text.strip()
                else:
                    manufacturer = manufacturer_cell.text.strip()
            
            # Adicionar à lista de aeronaves
            aircraft_info = {
                'name': aircraft_name,
                'manufacturer': manufacturer,
                'url': f"{WIKIPEDIA_BASE_URL}{aircraft_url}"
            }
            
            all_aircraft.append(aircraft_info)
    
    print(f"Encontradas {len(all_aircraft)} aeronaves na Wikipedia")
    return all_aircraft

def get_aircraft_details(url):
    """
    Busca os detalhes de uma aeronave específica na Wikipedia.
    
    Args:
        url (str): URL da página da aeronave na Wikipedia
    
    Returns:
        dict: Dicionário com os detalhes da aeronave
    """
    print(f"Buscando detalhes da aeronave em {url}...")
    
    # Fazer requisição para a página
    response = requests.get(url, headers=HEADERS)
    
    if response.status_code != 200:
        print(f"Erro ao acessar a página: {response.status_code}")
        return None
    
    # Parsear o HTML
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Extrair nome da aeronave
    title = soup.find('h1', {'id': 'firstHeading'})
    if not title:
        print("Título da página não encontrado")
        return None
    
    aircraft_name = title.text.strip()
    
    # Extrair imagem
    image_url = None
    infobox = soup.find('table', {'class': 'infobox'})
    if infobox:
        image = infobox.find('img')
        if image and 'src' in image.attrs:
            image_url = f"https:{image['src']}"
    
    # Extrair informações da infobox
    details = {}
    
    if infobox:
        # Extrair linhas da infobox
        rows = infobox.find_all('tr')
        
        for row in rows:
            # Verificar se a linha tem um cabeçalho e um valor
            header = row.find('th')
            value = row.find('td')
            
            if not header or not value:
                continue
            
            # Extrair o texto do cabeçalho e do valor
            header_text = header.text.strip().lower().replace(' ', '_').replace(':', '')
            value_text = value.text.strip()
            
            # Adicionar ao dicionário de detalhes
            details[header_text] = value_text
    
    # Extrair fabricante e modelo
    manufacturer = details.get('manufacturer', '')
    model = aircraft_name
    
    # Se o nome já inclui o fabricante, extrair o modelo
    if manufacturer and aircraft_name.startswith(manufacturer):
        model = aircraft_name[len(manufacturer):].strip()
    
    # Mapear os dados para o formato do nosso banco de dados
    aircraft_data = {
        'name': aircraft_name,
        'manufacturer': manufacturer,
        'model': model,
        'image_url': image_url,
    }
    
    # Extrair ano do primeiro voo
    first_flight = details.get('first_flight', '')
    if first_flight:
        # Tentar extrair o ano
        year_match = re.search(r'\b(19|20)\d{2}\b', first_flight)
        if year_match:
            aircraft_data['first_flight_year'] = int(year_match.group(0))
    
    # Extrair MTOW
    mtow = details.get('maximum_takeoff_weight', '') or details.get('mtow', '')
    if mtow:
        # Tentar extrair o valor em kg
        kg_match = re.search(r'([\d,]+)\s*kg', mtow)
        if kg_match:
            mtow_str = kg_match.group(1).replace(',', '')
            try:
                aircraft_data['mtow'] = float(mtow_str)
            except ValueError:
                pass
        else:
            # Tentar extrair o valor em lb e converter para kg
            lb_match = re.search(r'([\d,]+)\s*lb', mtow)
            if lb_match:
                mtow_lb_str = lb_match.group(1).replace(',', '')
                try:
                    mtow_lb = float(mtow_lb_str)
                    aircraft_data['mtow'] = mtow_lb * 0.453592  # Converter lb para kg
                except ValueError:
                    pass
    
    # Extrair envergadura
    wingspan = details.get('wingspan', '')
    if wingspan:
        # Tentar extrair o valor em metros
        m_match = re.search(r'([\d.]+)\s*m', wingspan)
        if m_match:
            try:
                aircraft_data['wingspan'] = float(m_match.group(1))
            except ValueError:
                pass
        else:
            # Tentar extrair o valor em pés e converter para metros
            ft_match = re.search(r'([\d.]+)\s*ft', wingspan)
            if ft_match:
                try:
                    wingspan_ft = float(ft_match.group(1))
                    aircraft_data['wingspan'] = wingspan_ft * 0.3048  # Converter pés para metros
                except ValueError:
                    pass
    
    # Extrair área da asa
    wing_area = details.get('wing_area', '')
    if wing_area:
        # Tentar extrair o valor em metros quadrados
        m2_match = re.search(r'([\d.]+)\s*m2', wing_area) or re.search(r'([\d.]+)\s*m²', wing_area)
        if m2_match:
            try:
                aircraft_data['wing_area'] = float(m2_match.group(1))
            except ValueError:
                pass
        else:
            # Tentar extrair o valor em pés quadrados e converter para metros quadrados
            ft2_match = re.search(r'([\d.]+)\s*ft2', wing_area) or re.search(r'([\d.]+)\s*sq\s*ft', wing_area)
            if ft2_match:
                try:
                    wing_area_ft2 = float(ft2_match.group(1))
                    aircraft_data['wing_area'] = wing_area_ft2 * 0.092903  # Converter pés² para metros²
                except ValueError:
                    pass
    
    # Extrair velocidade de cruzeiro
    cruise_speed = details.get('cruise_speed', '')
    if cruise_speed:
        # Tentar extrair o valor em km/h
        kmh_match = re.search(r'([\d.]+)\s*km/h', cruise_speed)
        if kmh_match:
            try:
                aircraft_data['cruise_speed'] = float(kmh_match.group(1))
            except ValueError:
                pass
        else:
            # Tentar extrair o valor em nós e converter para km/h
            knots_match = re.search(r'([\d.]+)\s*kn', cruise_speed) or re.search(r'([\d.]+)\s*knots', cruise_speed)
            if knots_match:
                try:
                    cruise_knots = float(knots_match.group(1))
                    aircraft_data['cruise_speed'] = cruise_knots * 1.852  # Converter nós para km/h
                except ValueError:
                    pass
            else:
                # Tentar extrair o valor em mph e converter para km/h
                mph_match = re.search(r'([\d.]+)\s*mph', cruise_speed)
                if mph_match:
                    try:
                        cruise_mph = float(mph_match.group(1))
                        aircraft_data['cruise_speed'] = cruise_mph * 1.60934  # Converter mph para km/h
                    except ValueError:
                        pass
    
    # Extrair teto de serviço
    ceiling = details.get('service_ceiling', '') or details.get('ceiling', '')
    if ceiling:
        # Tentar extrair o valor em metros
        m_match = re.search(r'([\d,]+)\s*m', ceiling)
        if m_match:
            try:
                aircraft_data['service_ceiling'] = float(m_match.group(1).replace(',', ''))
            except ValueError:
                pass
        else:
            # Tentar extrair o valor em pés e converter para metros
            ft_match = re.search(r'([\d,]+)\s*ft', ceiling)
            if ft_match:
                try:
                    ceiling_ft = float(ft_match.group(1).replace(',', ''))
                    aircraft_data['service_ceiling'] = ceiling_ft * 0.3048  # Converter pés para metros
                except ValueError:
                    pass
    
    # Extrair número de motores
    powerplant = details.get('powerplant', '')
    if powerplant:
        # Tentar extrair o número de motores
        engines_match = re.search(r'(\d+)\s*×', powerplant)
        if engines_match:
            try:
                aircraft_data['engine_count'] = int(engines_match.group(1))
            except ValueError:
                pass
        
        # Tentar extrair o tipo de motor
        if 'turbofan' in powerplant.lower():
            aircraft_data['engine_type'] = 'Turbofan'
        elif 'turboprop' in powerplant.lower():
            aircraft_data['engine_type'] = 'Turboprop'
        elif 'piston' in powerplant.lower():
            aircraft_data['engine_type'] = 'Piston'
        elif 'jet' in powerplant.lower():
            aircraft_data['engine_type'] = 'Jet'
    
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
        # Buscar lista de aeronaves
        aircraft_list = get_aircraft_list()
        
        if not aircraft_list:
            print("Nenhuma aeronave encontrada")
            return
        
        # Perguntar ao usuário quantas aeronaves deseja importar
        max_import = min(len(aircraft_list), 10)  # Limitar a 10 para teste
        
        print(f"Importando até {max_import} aeronaves...")
        
        # Importar detalhes de cada aeronave
        imported_count = 0
        
        for i, aircraft in enumerate(aircraft_list[:max_import]):
            url = aircraft['url']
            
            # Buscar detalhes da aeronave
            details = get_aircraft_details(url)
            
            if not details:
                print(f"Não foi possível obter detalhes da aeronave {aircraft['name']}")
                continue
            
            # Importar para o banco de dados
            success = import_aircraft_to_db(details)
            
            if success:
                imported_count += 1
            
            # Aguardar um pouco para não sobrecarregar o servidor
            time.sleep(1)
        
        print(f"Importação concluída. {imported_count} aeronaves importadas com sucesso!")

if __name__ == "__main__":
    main() 