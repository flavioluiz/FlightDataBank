#!/usr/bin/env python3
"""
Script para buscar dados de aeronaves online no EUROCONTROL Aircraft Performance Database
e outras fontes, e importá-los para o banco de dados local.
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
EUROCONTROL_BASE_URL = "https://contentzone.eurocontrol.int/aircraftperformance"
EUROCONTROL_SEARCH_URL = f"{EUROCONTROL_BASE_URL}/default.aspx"
EUROCONTROL_DETAILS_URL = f"{EUROCONTROL_BASE_URL}/details.aspx"

# Headers para simular um navegador
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}

def get_aircraft_list(page=1, max_pages=5):
    """
    Busca a lista de aeronaves disponíveis no EUROCONTROL Aircraft Performance Database.
    
    Args:
        page (int): Página inicial para buscar
        max_pages (int): Número máximo de páginas para buscar
    
    Returns:
        list: Lista de dicionários com informações básicas das aeronaves
    """
    all_aircraft = []
    current_page = page
    
    while current_page <= max_pages:
        print(f"Buscando página {current_page}...")
        
        # Fazer requisição para a página de busca
        try:
            if current_page == 1:
                response = requests.get(EUROCONTROL_SEARCH_URL, headers=HEADERS, timeout=30)
            else:
                # Para páginas subsequentes, é necessário usar o mecanismo de paginação do site
                response = requests.get(
                    f"{EUROCONTROL_SEARCH_URL}?__doPostBack('ctl00$MainContent$wsBasicSearchGridView','Page${current_page}')",
                    headers=HEADERS,
                    timeout=30
                )
            
            if response.status_code != 200:
                print(f"Erro ao acessar a página {current_page}: {response.status_code}")
                print(f"Resposta: {response.text[:500]}...")  # Mostrar parte da resposta para depuração
                break
            
            # Salvar o HTML para depuração
            debug_file = f"eurocontrol_page_{current_page}.html"
            with open(debug_file, "w", encoding="utf-8") as f:
                f.write(response.text)
            print(f"HTML da página salvo em {debug_file} para depuração")
            
            # Parsear o HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Tentar diferentes IDs de tabela, pois o site pode ter mudado
            table_ids = [
                'ctl00_MainContent_wsBasicSearchGridView',
                'MainContent_wsBasicSearchGridView',
                'wsBasicSearchGridView'
            ]
            
            table = None
            for table_id in table_ids:
                table = soup.find('table', {'id': table_id})
                if table:
                    print(f"Tabela encontrada com ID: {table_id}")
                    break
            
            # Se ainda não encontrou, tentar por classe ou estrutura
            if not table:
                print("Tentando encontrar tabela por classe ou estrutura...")
                tables = soup.find_all('table')
                print(f"Encontradas {len(tables)} tabelas na página")
                
                # Procurar por tabelas que parecem conter dados de aeronaves
                for i, t in enumerate(tables):
                    headers = t.find_all('th')
                    if headers and len(headers) >= 3:
                        header_texts = [h.text.strip() for h in headers]
                        print(f"Tabela {i} tem cabeçalhos: {header_texts}")
                        if any('ICAO' in h for h in header_texts) or any('Aircraft' in h for h in header_texts):
                            table = t
                            print(f"Tabela {i} parece ser a tabela de resultados")
                            break
            
            if not table:
                print("Tabela de resultados não encontrada")
                print("Estrutura da página:")
                main_divs = soup.find_all('div', {'class': 'container'})
                for i, div in enumerate(main_divs):
                    print(f"Div principal {i}: {div.get('id', 'sem id')}")
                    print(f"Conteúdo: {div.text[:100]}...")
                break
            
            # Encontrar todas as linhas da tabela (exceto o cabeçalho)
            rows = table.find_all('tr')[1:]  # Ignorar a primeira linha (cabeçalho)
            
            if not rows:
                print("Nenhuma aeronave encontrada nesta página")
                break
            
            print(f"Encontradas {len(rows)} linhas na tabela")
            
            # Extrair informações de cada linha
            for row in rows:
                cells = row.find_all('td')
                if len(cells) < 2:
                    continue
                
                # Extrair o código ICAO e o nome da aeronave
                icao_link = cells[0].find('a')
                if not icao_link:
                    continue
                
                icao = icao_link.text.strip()
                
                # Extrair o link para a página de detalhes
                detail_link = cells[0].find('a', href=True)
                if not detail_link:
                    continue
                
                detail_url = detail_link['href']
                
                # Extrair o nome completo da aeronave
                name_link = cells[1].find('a') if len(cells) > 1 else None
                if not name_link:
                    # Tentar extrair o texto diretamente da célula
                    name = cells[1].text.strip() if len(cells) > 1 else "Unknown"
                else:
                    name = name_link.text.strip()
                
                # Adicionar à lista de aeronaves
                aircraft_info = {
                    'icao': icao,
                    'name': name,
                    'detail_url': f"{EUROCONTROL_BASE_URL}/{detail_url}"
                }
                
                all_aircraft.append(aircraft_info)
                print(f"Adicionada aeronave: {icao} - {name}")
            
            print(f"Encontradas {len(rows)} aeronaves na página {current_page}")
            
            # Verificar se há mais páginas
            next_page_link = soup.find('a', text=str(current_page + 1))
            if not next_page_link:
                print(f"Não há mais páginas após a página {current_page}")
                break
            
            current_page += 1
            
            # Aguardar um pouco para não sobrecarregar o servidor
            time.sleep(2)
            
        except Exception as e:
            print(f"Erro ao processar a página {current_page}: {str(e)}")
            break
    
    return all_aircraft

def get_aircraft_details(icao):
    """
    Obtém detalhes de uma aeronave específica do EUROCONTROL.
    
    Args:
        icao (str): Código ICAO da aeronave
    
    Returns:
        dict: Dicionário com os detalhes da aeronave
    """
    try:
        print(f"Buscando detalhes da aeronave {icao}...")
        
        # Fazer requisição para a página de detalhes
        response = requests.get(f"{EUROCONTROL_DETAILS_URL}?ICAO={icao}", headers=HEADERS)
        
        if response.status_code != 200:
            print(f"Erro ao acessar os detalhes da aeronave {icao}: {response.status_code}")
            return None
        
        # Parsear o HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extrair informações básicas
        aircraft_name = soup.find('h1', {'id': 'ctl00_MainContent_AircraftNameLabel'})
        if not aircraft_name:
            print(f"Nome da aeronave {icao} não encontrado")
            return None
        
        name = aircraft_name.text.strip()
        
        # Extrair fabricante e modelo
        name_parts = name.split(' by ')
        model = name_parts[0].strip() if len(name_parts) > 0 else ""
        manufacturer = name_parts[1].strip() if len(name_parts) > 1 else ""
        
        # Extrair imagem
        image_url = None
        image_tag = soup.find('img', {'id': 'ctl00_MainContent_AircraftImage'})
        if image_tag and 'src' in image_tag.attrs:
            image_url = f"{EUROCONTROL_BASE_URL}/{image_tag['src']}"
        
        # Extrair detalhes técnicos
        details = {}
        
        # Extrair tipo de aeronave, WTC, etc.
        type_info = soup.find('div', {'id': 'ctl00_MainContent_AircraftTypePanel'})
        if type_info:
            type_text = type_info.text.strip()
            
            # Extrair tipo (L2J, etc.)
            type_match = re.search(r'Type:\s+([A-Z0-9]+)', type_text)
            if type_match:
                details['aircraft_type'] = type_match.group(1)
            
            # Extrair categoria de peso (H, M, L)
            wtc_match = re.search(r'WTC:\s+([A-Z])', type_text)
            if wtc_match:
                details['weight_category'] = wtc_match.group(1)
        
        # Extrair dados de desempenho
        performance_tables = soup.find_all('table', {'class': 'performanceTable'})
        
        for table in performance_tables:
            # Encontrar o título da tabela
            title_row = table.find('tr', {'class': 'performanceTableTitle'})
            if not title_row:
                continue
            
            title = title_row.text.strip()
            
            # Extrair dados da tabela
            data_rows = table.find_all('tr', {'class': 'performanceTableItem'})
            for row in data_rows:
                cells = row.find_all('td')
                if len(cells) < 2:
                    continue
                
                param_name = cells[0].text.strip().lower().replace(' ', '_')
                param_value = cells[1].text.strip()
                
                # Converter valores numéricos
                if param_value.isdigit():
                    param_value = int(param_value)
                elif re.match(r'^\d+\.\d+$', param_value):
                    param_value = float(param_value)
                
                details[f"{title.lower().replace(' ', '_')}_{param_name}"] = param_value
        
        # Mapear os dados para o formato do nosso banco de dados
        aircraft_data = {
            'name': f"{manufacturer} {model}".strip(),
            'manufacturer': manufacturer,
            'model': model,
            'image_url': image_url,
            'engine_type': details.get('aircraft_type', ''),
        }
        
        # Mapear velocidades
        if 'cruise_tas' in details:
            aircraft_data['cruise_speed'] = details['cruise_tas']
        
        if 'approach_ias' in details:
            aircraft_data['landing_speed'] = details['approach_ias']
        
        if 'initial_climb_ias' in details:
            aircraft_data['takeoff_speed'] = details['initial_climb_ias']
        
        # Mapear teto de serviço
        if 'cruise_ceiling' in details:
            ceiling_str = details['cruise_ceiling']
            if isinstance(ceiling_str, str) and 'FL' in ceiling_str:
                # Converter FL (Flight Level) para metros (1 FL = 100 pés, 1 pé = 0.3048 metros)
                try:
                    fl_value = int(ceiling_str.replace('FL', '').strip())
                    aircraft_data['service_ceiling'] = fl_value * 100 * 0.3048
                except ValueError:
                    pass
        
        # Extrair dados de desempenho
        performance_data = soup.find('div', {'id': 'performance'})
        if performance_data:
            cruise_altitude_element = performance_data.find('td', text=re.compile('Cruise altitude', re.IGNORECASE))
            if cruise_altitude_element:
                cruise_altitude_text = cruise_altitude_element.find_next('td').text.strip()
                # Converter para número (removendo 'ft' e convertendo para float)
                cruise_altitude = float(re.sub(r'[^\d.]', '', cruise_altitude_text))
                aircraft_data['cruise_altitude'] = cruise_altitude
        
        return aircraft_data
    except Exception as e:
        print(f"Erro ao obter detalhes da aeronave {icao}: {str(e)}")
        return None

def import_aircraft_to_db(aircraft_data):
    """
    Importa dados de uma aeronave para o banco de dados.
    
    Args:
        aircraft_data (dict): Dicionário com os dados da aeronave
    
    Returns:
        bool: True se a importação foi bem sucedida, False caso contrário
    """
    try:
        # Verificar se a aeronave já existe
        existing_aircraft = Aircraft.query.filter_by(name=aircraft_data['name']).first()
        
        if existing_aircraft:
            # Atualizar dados existentes
            for key, value in aircraft_data.items():
                if hasattr(existing_aircraft, key):
                    setattr(existing_aircraft, key, value)
            aircraft = existing_aircraft
        else:
            # Criar nova aeronave
            aircraft = Aircraft(**aircraft_data)
        
        db.session.add(aircraft)
        db.session.commit()
        return True
    except Exception as e:
        print(f"Erro ao importar aeronave para o banco de dados: {str(e)}")
        db.session.rollback()
        return False

def main():
    """Função principal para buscar e importar dados de aeronaves."""
    # Inicializar o banco de dados
    with app.app_context():
        # Buscar lista de aeronaves
        aircraft_list = get_aircraft_list(page=1, max_pages=2)  # Limitar a 2 páginas para teste
        
        if not aircraft_list:
            print("Nenhuma aeronave encontrada")
            return
        
        print(f"Encontradas {len(aircraft_list)} aeronaves no total")
        
        # Perguntar ao usuário quantas aeronaves deseja importar
        max_import = min(len(aircraft_list), 10)  # Limitar a 10 para teste
        
        print(f"Importando até {max_import} aeronaves...")
        
        # Importar detalhes de cada aeronave
        imported_count = 0
        
        for i, aircraft in enumerate(aircraft_list[:max_import]):
            icao = aircraft['icao']
            
            # Buscar detalhes da aeronave
            details = get_aircraft_details(icao)
            
            if not details:
                print(f"Não foi possível obter detalhes da aeronave {icao}")
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