# Aircraft Performance Database

Um banco de dados de aeronaves com interface web para apoiar cursos de desempenho de aeronaves.

## Funcionalidades

- Armazenamento de dados técnicos de aeronaves (MTOW, área da asa, envergadura, velocidades, etc.)
- Cálculo automático de parâmetros de desempenho (coeficiente de sustentação, carga alar, etc.)
- Interface web para visualização, adição, remoção e modificação de aeronaves
- Gráficos comparativos entre diferentes aeronaves
- Tabelas com filtros para análise de dados
- Visualização da evolução histórica das características de desempenho
- **Importação de dados online** de várias fontes (EUROCONTROL, Wikipedia, etc.)

## Estrutura do Projeto

- `database/`: Esquema e scripts do banco de dados
- `api/`: API Python para acesso ao banco de dados
- `web/`: Interface web em HTML/CSS/JavaScript
- `scripts/`: Scripts para importação de dados de fontes externas

## Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/aircraft_databank.git
cd aircraft_databank

# Instale as dependências
pip install -r requirements.txt

# Inicie o servidor
python run.py
```

Acesse a interface web em `http://localhost:5001`

## Importação de Dados Online

O sistema permite importar dados de aeronaves de várias fontes online:

1. **EUROCONTROL Aircraft Performance Database**: Dados técnicos e de desempenho de aeronaves.
2. **Wikipedia**: Informações sobre aeronaves comerciais.

Para importar dados online:

1. Clique no botão "Importar Online" na página principal
2. Selecione a fonte de dados
3. Defina o número máximo de aeronaves para importar
4. Clique em "Iniciar Importação"

Você também pode importar dados usando a linha de comando:

```bash
python scripts/import_aircraft_data.py --source eurocontrol --max 10
```

Para mais informações sobre os scripts de importação, consulte o [README dos scripts](scripts/README.md).

## Fontes de Dados

Os dados das aeronaves podem ser obtidos de várias fontes, incluindo:
- [EUROCONTROL Aircraft Performance Database](https://contentzone.eurocontrol.int/aircraftperformance/default.aspx)
- Wikipedia
- Manuais de fabricantes
- Publicações técnicas da indústria aeronáutica 