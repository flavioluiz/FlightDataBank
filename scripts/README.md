# Scripts de Importação de Dados de Aeronaves

Este diretório contém scripts para importar dados de aeronaves de várias fontes online para o banco de dados local.

## Scripts Disponíveis

1. **data_scraper.py**: Busca dados no EUROCONTROL Aircraft Performance Database usando web scraping.
2. **aviation_api.py**: Busca dados na API do Aviation Stack (requer uma chave de API).
3. **wikipedia_scraper.py**: Busca dados na Wikipedia sobre aeronaves comerciais.
4. **import_aircraft_data.py**: Script principal que integra todas as fontes de dados.
5. **download_aircraft_images.py**: Script para baixar todas as imagens de aeronaves para um diretório local.
6. **fix_image_links.py**: Script para verificar e corrigir links quebrados de imagens.
7. **update_image_paths.py**: Script para atualizar todos os URLs de imagens no banco de dados para usar caminhos locais.

## Requisitos

Antes de usar os scripts, certifique-se de que todas as dependências estão instaladas:

```bash
pip install requests beautifulsoup4 python-dotenv pillow
```

## Como Usar

### Importar de Todas as Fontes

Para importar dados de todas as fontes disponíveis:

```bash
python scripts/import_aircraft_data.py
```

Por padrão, isso importará até 10 aeronaves de cada fonte.

### Importar de uma Fonte Específica

Para importar dados de uma fonte específica:

```bash
python scripts/import_aircraft_data.py --source eurocontrol
python scripts/import_aircraft_data.py --source aviation
python scripts/import_aircraft_data.py --source wikipedia
```

### Limitar o Número de Aeronaves

Para limitar o número de aeronaves importadas:

```bash
python scripts/import_aircraft_data.py --max 5
```

### Gerenciamento de Imagens

#### Baixar Imagens para Diretório Local

Para baixar todas as imagens de aeronaves para um diretório local:

```bash
python scripts/download_aircraft_images.py
```

Este script irá:
1. Criar diretórios `web/images/aircraft` e `web/images/fallback`
2. Baixar imagens para cada aeronave no banco de dados
3. Verificar se cada imagem é válida
4. Usar imagens de fallback para links quebrados
5. Atualizar o banco de dados com caminhos locais

#### Verificar e Corrigir Links de Imagens

Para verificar e corrigir links quebrados de imagens:

```bash
python scripts/fix_image_links.py
```

#### Atualizar Caminhos de Imagens

Para atualizar todos os URLs de imagens no banco de dados para usar caminhos locais:

```bash
python scripts/update_image_paths.py
```

### Usar a API do Aviation Stack

Para usar a API do Aviation Stack, você precisa de uma chave de API. Você pode obter uma chave gratuita em [aviationstack.com](https://aviationstack.com/).

Adicione sua chave de API ao arquivo `.env` na raiz do projeto:

```
AVIATION_STACK_API_KEY=sua_chave_api_aqui
```

## Notas Importantes

1. **Web Scraping**: Os scripts que usam web scraping (data_scraper.py e wikipedia_scraper.py) podem parar de funcionar se a estrutura dos sites mudar. Eles também incluem atrasos para não sobrecarregar os servidores.

2. **Limitações da API**: A versão gratuita da API do Aviation Stack tem limitações no número de requisições e nos dados disponíveis.

3. **Qualidade dos Dados**: Os dados importados podem estar incompletos ou imprecisos, dependendo da fonte. É recomendável revisar e complementar os dados manualmente após a importação.

4. **Imagens Locais**: Usar imagens locais melhora o desempenho e a confiabilidade da aplicação. O script `download_aircraft_images.py` baixa todas as imagens para um diretório local e atualiza o banco de dados.

## Exemplos de Uso

### Importar 20 aeronaves do EUROCONTROL

```bash
python scripts/import_aircraft_data.py --source eurocontrol --max 20
```

### Importar 5 aeronaves de cada fonte

```bash
python scripts/import_aircraft_data.py --max 5
```

### Executar um script específico diretamente

```bash
python scripts/wikipedia_scraper.py
```

### Baixar todas as imagens para um diretório local

```bash
python scripts/download_aircraft_images.py
``` 