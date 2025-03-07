from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.hybrid import hybrid_property
import math

db = SQLAlchemy()

def calculate_air_density(altitude):
    """
    Calcula a densidade do ar em função da altitude usando o modelo ISA.
    
    Args:
        altitude (float): Altitude em metros
    
    Returns:
        float: Densidade do ar em kg/m³
    """
    # Constantes da atmosfera ISA
    R = 287.05287  # Constante específica do ar [J/(kg·K)]
    g = 9.80665    # Aceleração da gravidade [m/s²]
    
    # Condições ao nível do mar
    p0 = 101325.0  # Pressão [Pa]
    T0 = 288.15    # Temperatura [K]
    rho0 = 1.225   # Densidade [kg/m³]
    
    # Gradientes de temperatura para cada camada [K/m]
    a0 = -0.0065   # Troposfera (0-11km)
    a1 = 0.0       # Tropopausa (11-20km)
    
    # Altitudes de transição [m]
    h1 = 11000     # Tropopausa
    
    if altitude < 0:
        return rho0
    
    # Troposfera (0-11km)
    if altitude <= h1:
        T = T0 + a0 * altitude
        p = p0 * (T/T0)**(-(g/(a0*R)))
        
    # Tropopausa (11-20km)
    else:
        # Primeiro calcula condições na base da tropopausa
        T1 = T0 + a0 * h1
        p1 = p0 * (T1/T0)**(-(g/(a0*R)))
        
        # Depois calcula na altitude desejada
        T = T1  # Temperatura constante na tropopausa
        dh = altitude - h1
        p = p1 * math.exp(-(g*dh)/(R*T))
    
    # Equação dos gases ideais
    rho = p/(R*T)
    
    return rho

class Aircraft(db.Model):
    """Modelo para aeronaves."""
    __tablename__ = 'aircraft'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    manufacturer = db.Column(db.String(100))
    model = db.Column(db.String(100))
    first_flight_year = db.Column(db.Integer)
    
    # Características físicas
    mtow = db.Column(db.Float)  # kg
    wing_area = db.Column(db.Float)  # m²
    wingspan = db.Column(db.Float)  # m
    
    # Velocidades
    cruise_speed = db.Column(db.Float)  # km/h
    takeoff_speed = db.Column(db.Float)  # km/h
    landing_speed = db.Column(db.Float)  # km/h
    
    # Outras características
    service_ceiling = db.Column(db.Float)  # m
    max_thrust = db.Column(db.Float)  # kN
    engine_type = db.Column(db.String(50))
    engine_count = db.Column(db.Integer)
    
    # Categorias (adicionadas posteriormente)
    category_type = db.Column(db.String(50))  # comercial, militar, geral, etc.
    category_era = db.Column(db.String(50))  # pioneiros, clássica, jato inicial, etc.
    category_engine = db.Column(db.String(50))  # pistão, turbohélice, turbojato, etc.
    category_size = db.Column(db.String(50))  # leve, medio, pesado, etc.
    
    # Campo para URL da imagem
    image_url = db.Column(db.String(500))
    
    # Desempenho
    max_speed = db.Column(db.Float)     # Velocidade máxima (kt)
    cruise_altitude = db.Column(db.Float) # Altitude de cruzeiro (ft)
    range = db.Column(db.Float)          # Alcance (nm)
    max_roc = db.Column(db.Float)        # Taxa máxima de subida (ft/min)
    
    @hybrid_property
    def wing_loading(self):
        """Carga alar (kg/m²)"""
        if self.mtow and self.wing_area and self.wing_area > 0:
            return self.mtow / self.wing_area
        return None
    
    @hybrid_property
    def air_density_cruise(self):
        """Calcula a densidade do ar na altitude de cruzeiro."""
        if self.cruise_altitude:
            return calculate_air_density(self.cruise_altitude)
        return None
    
    @hybrid_property
    def cruise_cl(self):
        """Calcula o coeficiente de sustentação em cruzeiro."""
        if self.mtow and self.wing_area and self.cruise_speed and self.cruise_altitude:
            # Usar densidade do ar na altitude de cruzeiro
            rho = self.air_density_cruise
            
            # Converter velocidade para m/s
            speed_ms = self.cruise_speed / 3.6
            
            # Fórmula: CL = 2 * W / (rho * S * V^2)
            # W = peso (N) = massa (kg) * 9.8 (m/s²)
            # S = área da asa (m²)
            # V = velocidade (m/s)
            # Considerar 90% do MTOW como peso típico em cruzeiro
            weight_newtons = self.mtow * 0.9 * 9.8
            
            return (2 * weight_newtons) / (rho * self.wing_area * speed_ms**2)
        return None
    
    @hybrid_property
    def landing_cl(self):
        """Calcula o coeficiente de sustentação em pouso."""
        if self.mtow and self.wing_area and self.landing_speed:
            # Densidade do ar padrão (kg/m³)
            rho = 1.225
            
            # Converter velocidade para m/s
            speed_ms = self.landing_speed / 3.6
            
            # Fórmula: CL = 2 * W / (rho * S * V^2)
            # W = peso (N) = massa (kg) * 9.8 (m/s²)
            # S = área da asa (m²)
            # V = velocidade (m/s)
            # Considerar 85% do MTOW como peso típico em pouso
            weight_newtons = self.mtow * 0.85 * 9.8
            
            return (2 * weight_newtons) / (rho * self.wing_area * speed_ms**2)
        return None
    
    @hybrid_property
    def aspect_ratio(self):
        """Alongamento"""
        if self.wingspan and self.wing_area and self.wing_area > 0:
            return (self.wingspan ** 2) / self.wing_area
        return None
    
    @hybrid_property
    def equivalent_airspeed(self):
        """
        Calcula a velocidade equivalente (VE) em km/h.
        VE = V * sqrt(rho/rho0), onde:
        - V é a velocidade verdadeira (TAS)
        - rho é a densidade do ar na altitude de cruzeiro
        - rho0 é a densidade do ar ao nível do mar (1.225 kg/m³)
        """
        if self.cruise_speed and self.cruise_altitude:
            rho = calculate_air_density(self.cruise_altitude)
            rho0 = 1.225  # Densidade do ar ao nível do mar
            return self.cruise_speed * math.sqrt(rho/rho0)
        return None
    
    def __repr__(self):
        return f'<Aircraft {self.manufacturer} {self.model}>'
    
    def to_dict(self):
        """Converte o modelo para um dicionário."""
        data = {
            'id': self.id,
            'name': self.name,
            'manufacturer': self.manufacturer,
            'model': self.model,
            'first_flight_year': self.first_flight_year,
            'mtow': self.mtow,
            'wing_area': self.wing_area,
            'wingspan': self.wingspan,
            'cruise_speed': self.cruise_speed,  # TAS - True Airspeed
            'takeoff_speed': self.takeoff_speed,
            'landing_speed': self.landing_speed,
            'service_ceiling': self.service_ceiling,
            'max_thrust': self.max_thrust,
            'engine_type': self.engine_type,
            'engine_count': self.engine_count,
            'category_type': self.category_type,
            'category_era': self.category_era,
            'category_engine': self.category_engine,
            'category_size': self.category_size,
            'image_url': self.image_url,
            'cruise_altitude': self.cruise_altitude,
            'max_speed': self.max_speed,
            'range': self.range,
            'max_roc': self.max_roc
        }
        
        # Adicionar propriedades calculadas de forma segura
        try:
            data['wing_loading'] = self.wing_loading
        except:
            data['wing_loading'] = None
            
        try:
            data['cruise_cl'] = self.cruise_cl
        except:
            data['cruise_cl'] = None
            
        try:
            data['landing_cl'] = self.landing_cl
        except:
            data['landing_cl'] = None
            
        try:
            data['aspect_ratio'] = self.aspect_ratio
        except:
            data['aspect_ratio'] = None
            
        try:
            data['equivalent_airspeed'] = self.equivalent_airspeed
        except:
            data['equivalent_airspeed'] = None
            
        # Adicionar densidade do ar na altitude de cruzeiro
        try:
            data['air_density_cruise'] = self.air_density_cruise
        except:
            data['air_density_cruise'] = None
        
        return data 