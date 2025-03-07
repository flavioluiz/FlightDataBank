#!/usr/bin/env python3
"""
Script para verificar se há aeronaves duplicadas no arquivo JSON.
"""

import json
from pathlib import Path

# Diretório raiz do projeto
ROOT_DIR = Path(__file__).parent.parent

def check_duplicates():
    """Verifica se há aeronaves duplicadas no arquivo JSON."""
    json_path = ROOT_DIR / "web" / "data" / "aircraft.json"
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    aircraft_list = data['aircraft']
    print(f"Total de aeronaves: {len(aircraft_list)}")
    
    # Verificar duplicatas por nome
    names = {}
    for aircraft in aircraft_list:
        name = aircraft['name']
        if name in names:
            names[name].append(aircraft['id'])
        else:
            names[name] = [aircraft['id']]
    
    # Listar duplicatas
    duplicates = {name: ids for name, ids in names.items() if len(ids) > 1}
    
    if duplicates:
        print("\nAeronaves com nomes duplicados:")
        for name, ids in duplicates.items():
            print(f"  - {name}: IDs {', '.join(map(str, ids))}")
    else:
        print("\nNão há aeronaves com nomes duplicados.")
    
    # Listar todas as aeronaves em ordem alfabética
    print("\nLista de todas as aeronaves:")
    for i, name in enumerate(sorted(names.keys())):
        print(f"{i+1}. {name} (ID: {', '.join(map(str, names[name]))})")

if __name__ == "__main__":
    check_duplicates() 