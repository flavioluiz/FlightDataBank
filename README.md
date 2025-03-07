# FlightDataBank

Um banco de dados abrangente de aeronaves com visualizações interativas de dados de desempenho.

## Sobre o Projeto

FlightDataBank é uma aplicação web que permite visualizar e comparar dados de desempenho de diferentes aeronaves. O projeto inclui:

- Visualização de dados em gráficos interativos
- Comparação de velocidades, pesos e outros parâmetros
- Diagrama de voo mostrando a relação entre diferentes tipos de aeronaves
- Visualização de dados históricos e modernos

## Estrutura do Projeto

```
aircraft_databank/
├── web/                  # Aplicação web
│   ├── index.html        # Página principal
│   ├── app.js            # Lógica da aplicação
│   ├── styles.css        # Estilos
│   ├── data/             # Dados em formato JSON
│   └── images/           # Imagens de aeronaves
├── scripts/              # Scripts de utilidade
└── README.md             # Este arquivo
```

## Funcionalidades

- **Visualização de Dados**: Gráficos interativos mostrando relações entre diferentes parâmetros de aeronaves.
- **Diagrama de Voo**: Visualização que mostra como diferentes tipos de aeronaves se comparam em termos de velocidade e peso.
- **Detalhes de Aeronaves**: Informações detalhadas sobre cada aeronave, incluindo especificações técnicas e imagens.
- **Comparação de Velocidades**: Alternância entre velocidade verdadeira (TAS) e velocidade equivalente (VE) para comparações mais precisas.

## Dados

Os dados das aeronaves são armazenados em um único arquivo JSON (`web/data/aircraft.json`), facilitando a manutenção e atualização. Este arquivo contém informações detalhadas sobre cada aeronave, incluindo:

- Nome, fabricante e modelo
- Ano do primeiro voo
- Categoria e tipo
- Especificações técnicas (MTOW, área da asa, envergadura)
- Dados de desempenho (velocidades de cruzeiro, decolagem e pouso)
- Altitude de cruzeiro e teto de serviço
- Informações sobre motores
- Caminhos para imagens

## Scripts de Utilidade

O projeto inclui vários scripts para facilitar a manutenção dos dados:

- `scripts/create_aircraft_json.py`: Cria o arquivo JSON principal a partir dos dados existentes
- `scripts/update_cruise_altitudes.py`: Atualiza as altitudes de cruzeiro das aeronaves
- `scripts/download_aircraft_images.py`: Baixa imagens de aeronaves para uso local

## Como Usar

1. Clone o repositório
2. Abra o arquivo `web/index.html` em um navegador web
3. Explore os dados e visualizações

Para atualizar os dados:

1. Edite o arquivo `web/data/aircraft.json` diretamente
2. Ou use os scripts de utilidade para gerar um novo arquivo JSON

## Tecnologias Utilizadas

- HTML, CSS e JavaScript para a interface do usuário
- Chart.js para visualizações de dados
- Bootstrap para estilos e componentes
- Python para scripts de utilidade

## Contribuindo

Contribuições são bem-vindas! Se você quiser adicionar novas aeronaves ou melhorar os dados existentes, siga estas etapas:

1. Edite o arquivo `web/data/aircraft.json`
2. Adicione imagens na pasta `web/images/aircraft/`
3. Teste as alterações abrindo a aplicação no navegador

## Licença

Este projeto é distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 