# FlightDataBank

Um banco de dados abrangente de aeronaves com visualizações interativas de dados de desempenho.

## Sobre o Projeto

FlightDataBank é uma aplicação web que permite visualizar e comparar dados de desempenho de diferentes aeronaves, incluindo comparações com aves. O projeto inclui:

- Visualização de dados em gráficos interativos
- Comparação de velocidades, pesos e outros parâmetros
- Diagrama de voo mostrando a relação entre diferentes tipos de aeronaves e aves
- Visualização de dados históricos e modernos
- Análise de tendências e padrões de design

## Estrutura do Projeto

```
aircraft_databank/
├── web/                  # Aplicação web
│   ├── index.html       # Página principal
│   ├── app.js          # Lógica da aplicação
│   ├── styles.css      # Estilos
│   ├── data/          # Dados em formato JSON
│   │   ├── aircraft.json  # Dados das aeronaves
│   │   └── birds.json    # Dados das aves
│   └── images/        # Imagens de aeronaves e aves
├── scripts/           # Scripts de utilidade
│   ├── create_aircraft_json.py  # Geração de JSON
│   ├── check_duplicates.py     # Validação de dados
│   └── historical_aircraft_data.py  # Dados históricos
└── README.md         # Este arquivo
```

## Funcionalidades

- **Visualização de Dados**: Gráficos interativos mostrando relações entre diferentes parâmetros de aeronaves e aves.
- **Diagrama de Voo**: Visualização que mostra como diferentes tipos de aeronaves e aves se comparam em termos de velocidade e peso.
- **Linhas de Tendência**: Análise de tendências em carga alar vs. peso e velocidade.
- **Detalhes Técnicos**: Informações detalhadas sobre cada aeronave e ave, incluindo especificações técnicas e imagens.
- **Comparação de Velocidades**: Alternância entre velocidade verdadeira (TAS) e velocidade equivalente (VE) para comparações mais precisas.

## Dados

Os dados são armazenados em dois arquivos JSON principais:

### aircraft.json
Contém dados de aeronaves com os seguintes campos:
- `id`: Identificador único
- `name`: Nome da aeronave
- `manufacturer`: Fabricante
- `model`: Modelo
- `first_flight_year`: Ano do primeiro voo
- `category_type`: Tipo (comercial, militar, executiva, etc.)
- `category_era`: Era histórica
- `mtow_N`: Peso máximo de decolagem em Newtons
- `wing_area_m2`: Área da asa em metros quadrados
- `wingspan_m`: Envergadura em metros
- `cruise_speed_ms`: Velocidade de cruzeiro em m/s
- `cruise_altitude_m`: Altitude de cruzeiro em metros
- `engine_type`: Tipo de motor
- `engine_count`: Número de motores
- `image_url`: Caminho para a imagem

### birds.json
Contém dados de aves para comparação, com campos similares adaptados para características biológicas.

## Scripts de Utilidade

- `create_aircraft_json.py`: Script principal para geração e atualização dos arquivos JSON
- `check_duplicates.py`: Verifica e remove duplicatas nos dados
- `historical_aircraft_data.py`: Contém dados históricos de referência

## Como Usar

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/aircraft_databank.git
cd aircraft_databank
```

2. Inicie o servidor local:
```bash
python serve.py
```

3. Abra o navegador e acesse:
```
http://localhost:8000
```

O servidor local é necessário para que o navegador possa carregar os arquivos JSON e imagens corretamente.

Para atualizar os dados:
1. Edite os arquivos JSON em `web/data/` diretamente
2. Ou use o script `create_aircraft_json.py` para gerar novos arquivos
# FlightDataBank

Um banco de dados abrangente de aeronaves com visualizações interativas de dados de desempenho.

## Sobre o Projeto

FlightDataBank é uma aplicação web que permite visualizar e comparar dados de desempenho de diferentes aeronaves, incluindo comparações com aves. O projeto inclui:

- Visualização de dados em gráficos interativos
- Comparação de velocidades, pesos e outros parâmetros
- Diagrama de voo mostrando a relação entre diferentes tipos de aeronaves e aves
- Visualização de dados históricos e modernos
- Análise de tendências e padrões de design

## Estrutura do Projeto

```
aircraft_databank/
├── web/                  # Aplicação web
│   ├── index.html       # Página principal
│   ├── app.js          # Lógica da aplicação
│   ├── styles.css      # Estilos
│   ├── data/          # Dados em formato JSON
│   │   ├── aircraft.json  # Dados das aeronaves
│   │   └── birds.json    # Dados das aves
│   └── images/        # Imagens de aeronaves e aves
├── scripts/           # Scripts de utilidade
│   ├── create_aircraft_json.py  # Geração de JSON
│   ├── check_duplicates.py     # Validação de dados
│   └── historical_aircraft_data.py  # Dados históricos
└── README.md         # Este arquivo
```

## Funcionalidades

- **Visualização de Dados**: Gráficos interativos mostrando relações entre diferentes parâmetros de aeronaves e aves.
- **Diagrama de Voo**: Visualização que mostra como diferentes tipos de aeronaves e aves se comparam em termos de velocidade e peso.
- **Linhas de Tendência**: Análise de tendências em carga alar vs. peso e velocidade.
- **Detalhes Técnicos**: Informações detalhadas sobre cada aeronave e ave, incluindo especificações técnicas e imagens.
- **Comparação de Velocidades**: Alternância entre velocidade verdadeira (TAS) e velocidade equivalente (VE) para comparações mais precisas.

## Dados

Os dados são armazenados em dois arquivos JSON principais:

### aircraft.json
Contém dados de aeronaves com os seguintes campos:
- `id`: Identificador único
- `name`: Nome da aeronave
- `manufacturer`: Fabricante
- `model`: Modelo
- `first_flight_year`: Ano do primeiro voo
- `category_type`: Tipo (comercial, militar, executiva, etc.)
- `category_era`: Era histórica
- `mtow_N`: Peso máximo de decolagem em Newtons
- `wing_area_m2`: Área da asa em metros quadrados
- `wingspan_m`: Envergadura em metros
- `cruise_speed_ms`: Velocidade de cruzeiro em m/s
- `cruise_altitude_m`: Altitude de cruzeiro em metros
- `engine_type`: Tipo de motor
- `engine_count`: Número de motores
- `image_url`: Caminho para a imagem

### birds.json
Contém dados de aves para comparação, com campos similares adaptados para características biológicas.

## Scripts de Utilidade

- `create_aircraft_json.py`: Script principal para geração e atualização dos arquivos JSON
- `check_duplicates.py`: Verifica e remove duplicatas nos dados
- `historical_aircraft_data.py`: Contém dados históricos de referência

## Como Usar

1. Clone o repositório
2. Abra o arquivo `web/index.html` em um navegador web moderno
3. Explore os dados e visualizações

Para atualizar os dados:
1. Edite os arquivos JSON em `web/data/` diretamente
2. Ou use o script `create_aircraft_json.py` para gerar novos arquivos
3. Adicione imagens na pasta `web/images/`

## Tecnologias Utilizadas

- HTML5, CSS3 e JavaScript ES6+
- Chart.js para visualizações de dados
- Bootstrap 5 para interface responsiva
- Python 3.8+ para scripts de utilidade

## Contribuindo

Contribuições são bem-vindas! Para adicionar ou modificar dados:

1. Fork o repositório
2. Edite os arquivos JSON em `web/data/`
3. Adicione imagens em `web/images/`
4. Teste as alterações localmente
5. Envie um Pull Request

### Validação de Dados

Use o script `check_duplicates.py` para validar suas alterações antes de enviar:
```bash
python scripts/check_duplicates.py
```

## Licença

Este projeto é distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 