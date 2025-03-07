"""
Script para migrar o banco de dados.
"""
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.sql import text

# Adicionar o diretório raiz ao caminho de importação
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

def check_cruise_altitudes():
    """Verifica aeronaves sem altitude de cruzeiro."""
    try:
        # Conectar ao banco de dados
        engine = create_engine('sqlite:///api/aircraft.db')
        
        with engine.connect() as conn:
            # Buscar aeronaves sem altitude de cruzeiro
            result = conn.execute(text("""
                SELECT name, manufacturer, model, cruise_altitude 
                FROM aircraft 
                ORDER BY name;
            """))
            
            rows = result.fetchall()
            
            print("\nVerificação de altitudes de cruzeiro:")
            print("=====================================")
            
            missing_altitude = []
            has_altitude = []
            
            for row in rows:
                if row[3] is None:
                    missing_altitude.append(f"{row[0]} ({row[1]} {row[2]})")
                else:
                    has_altitude.append(f"{row[0]}: {row[3]} metros")
            
            print(f"\nTotal de aeronaves: {len(rows)}")
            print(f"Com altitude de cruzeiro: {len(has_altitude)}")
            print(f"Sem altitude de cruzeiro: {len(missing_altitude)}")
            
            if missing_altitude:
                print("\nAeronaves sem altitude de cruzeiro:")
                for aircraft in missing_altitude:
                    print(f"- {aircraft}")
            
            print("\nAeronaves com altitude de cruzeiro:")
            for aircraft in has_altitude:
                print(f"- {aircraft}")
            
            return True
    except Exception as e:
        print(f"Erro durante a verificação: {str(e)}")
        return False

def migrate():
    """Executa as migrações necessárias no banco de dados."""
    try:
        # Conectar ao banco de dados
        engine = create_engine('sqlite:///api/aircraft.db')
        
        # Adicionar coluna cruise_altitude se não existir
        with engine.connect() as conn:
            # Verificar se a coluna já existe
            result = conn.execute(text("PRAGMA table_info(aircraft)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'cruise_altitude' not in columns:
                conn.execute(text("ALTER TABLE aircraft ADD COLUMN cruise_altitude FLOAT"))
                print("Coluna cruise_altitude adicionada com sucesso!")
            else:
                print("Coluna cruise_altitude já existe.")
            
            conn.commit()
        
        print("Migração concluída com sucesso!")
        return True
    except Exception as e:
        print(f"Erro durante a migração: {str(e)}")
        return False

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--check':
        check_cruise_altitudes()
    else:
        migrate() 