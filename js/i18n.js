// Language translations
const translations = {
    en: {
        nav: {
            list: "Aircraft List",
            scatter: "Comparative Charts",
            flight: "Flight Diagram",
            timeline: "Historical Evolution",
            about: "About"
        },
        titles: {
            main: "AeroDataBank",
            list: "Aircraft List",
            scatter: "Comparative Charts",
            flight: "Flight Diagram",
            timeline: "Historical Evolution",
            about: "About AeroDataBank"
        },
        table: {
            headers: {
                aircraft: "Aircraft",
                manufacturer: "Manufacturer",
                model: "Model",
                year: "Year",
                type: "Type",
                era: "Era",
                mtow: "MTOW (kg)"
            },
            no_data: "No data available.",
            no_name: "No name",
            error_rendering: "Error rendering table",
            no_results: "No aircraft found with the selected filters."
        },
        charts: {
            scatter: {
                x_param: "X Parameter",
                y_param: "Y Parameter",
                scale: "Chart Scale",
                log_scale_x: "Log Scale X",
                log_scale_y: "Log Scale Y",
                selected_aircraft: "Selected Aircraft",
                click_point: "Click on a point in the chart to see aircraft details."
            },
            flight: {
                select_diagram: "Select Diagram",
                wing_loading_mtow: "Wing Loading vs MTOW",
                speed_mtow: "True Airspeed (TAS) vs MTOW",
                speed_mtow_ve: "Equivalent Speed (VE) vs MTOW",
                wing_loading_speed: "Wing Loading vs True Airspeed (TAS)",
                wing_loading_speed_ve: "Wing Loading vs Equivalent Speed (VE)",
                chart_options: "Chart Options",
                log_scale_x: "Log Scale X",
                log_scale_y: "Log Scale Y",
                show_trendlines: "Show Trendlines",
                comparative_diagram: "Comparative Diagram",
                description: "This diagram allows comparing different aircraft and birds based on their aerodynamic characteristics. The chart uses logarithmic scale to allow visualization of aircraft of very different sizes."
            },
            timeline: {
                parameter: "Parameter",
                chart_scale: "Chart Scale",
                log_scale: "Logarithmic Scale (Y axis)"
            }
        },
        filters: {
            title: "Filter by Category",
            type: {
                label: "Type/Function:",
                all: "All",
                commercial: "Commercial Aviation",
                executive: "Business Aircraft",
                cargo: "Cargo Aviation",
                military: "Military Aviation",
                general: "General Aviation",
                historical: "Historical/Pioneer Aircraft",
                experimental: "Experimental Aircraft",
                bird: "Birds (Biological)"
            },
            era: {
                label: "Era/Generation:",
                all: "All",
                pioneers: "Pioneers (until 1930)",
                classic: "Classic Era (1930-1950)",
                early_jet: "Early Jet Era (1950-1970)",
                modern: "Modern Era (1970-2000)",
                contemporary: "Contemporary Era (2000+)",
                biological: "Biological (Birds)"
            },
            engine: {
                label: "Engine Type:",
                all: "All",
                piston: "Piston Engine",
                turboprop: "Turboprop",
                turbojet: "Turbojet",
                turbofan: "Turbofan",
                special: "Special Propulsion"
            },
            size: {
                label: "Size:",
                all: "All",
                very_light: "Very Light (up to 5,700 kg)",
                regional: "Regional (5,700-50,000 kg)",
                medium: "Medium Size (50,000-150,000 kg)",
                large: "Large Size (150,000-300,000 kg)",
                very_large: "Very Large (above 300,000 kg)"
            },
            clear: "Clear Filters"
        },
        aircraft: {
            edit: {
                title: "Add/Edit Aircraft",
                image_url: "Image URL",
                cancel: "Cancel",
                save: "Save",
                select: "Select..."
            },
            details: {
                title: "Aircraft Details",
                close: "Close",
                not_found: "Aircraft not found.",
                general: {
                    title: "General Information",
                    name: "Name",
                    manufacturer: "Manufacturer",
                    model: "Model",
                    first_flight_year: "First Flight Year",
                    engine_type: "Engine Type",
                    engine_count: "Number of Engines"
                },
                categories: {
                    title: "Categories",
                    type: "Type/Function",
                    era: "Era/Generation",
                    engine: "Engine Type",
                    size: "Size"
                },
                physical: {
                    title: "Physical Characteristics",
                    mtow: "Maximum Takeoff Weight",
                    wing_area: "Wing Area",
                    wingspan: "Wingspan",
                    wing_loading: "Wing Loading",
                    aspect_ratio: "Aspect Ratio"
                },
                speeds: {
                    title: "Speeds",
                    cruise: "Cruise Speed",
                    takeoff: "Takeoff Speed",
                    landing: "Landing Speed"
                },
                performance: {
                    title: "Other Characteristics",
                    service_ceiling: "Service Ceiling",
                    cruise_altitude: "Cruise Altitude",
                    max_thrust: "Maximum Thrust",
                    range: "Range"
                }
            },
            categories: {
                type: {
                    comercial: "Commercial Aviation",
                    executiva: "Business Aircraft",
                    carga: "Cargo Aviation",
                    militar: "Military Aviation",
                    geral: "General Aviation",
                    historica: "Historical Aircraft",
                    experimental: "Experimental Aircraft",
                    ave: "Bird"
                },
                era: {
                    pioneiros: "Pioneers (until 1930)",
                    classica: "Classic Era (1930-1950)",
                    jato_inicial: "Early Jet Era (1950-1970)",
                    moderna: "Modern Era (1970-2000)",
                    contemporanea: "Contemporary Era (2000+)",
                    biologica: "Biological"
                },
                engine: {
                    pistao: "Piston Engine",
                    turboelice: "Turboprop",
                    turbojato: "Turbojet",
                    turbofan: "Turbofan",
                    especial: "Special Propulsion",
                    muscular: "Muscular (Biological)"
                },
                size: {
                    muito_leve: "Very Light (up to 5,700 kg)",
                    regional: "Regional (5,700-50,000 kg)",
                    medio: "Medium Size (50,000-150,000 kg)",
                    grande: "Large Size (150,000-300,000 kg)",
                    muito_grande: "Very Large (above 300,000 kg)"
                }
            }
        },
        about: {
            intro: "This database was developed to support aircraft performance courses, enabling visualization and analysis of technical characteristics of various aircraft.",
            features: {
                title: "Features",
                items: [
                    "Storage of aircraft technical data (MTOW, wing area, wingspan, speeds, etc.)",
                    "Automatic calculation of performance parameters (lift coefficient, wing loading, etc.)",
                    "Web interface for viewing, adding, removing, and modifying aircraft",
                    "Comparative charts between different aircraft",
                    "Historical evolution visualization of performance characteristics"
                ]
            },
            scales: {
                title: "Chart Scales",
                intro: "The system allows data visualization in linear or logarithmic scales:",
                linear: "Linear Scale: Shows values in a uniform progression. Useful for comparing absolute differences between aircraft.",
                log: "Logarithmic Scale: Shows values in a progression where each increment represents multiplication by a constant factor. Useful for viewing data that varies by several orders of magnitude, such as comparing the MTOW of the Wright Flyer (338 kg) with that of the Airbus A380 (575,000 kg).",
                when_to_use: {
                    title: "When to use each scale:",
                    lin_lin: "Linear-Linear: For comparing similar aircraft or when absolute differences are important.",
                    log_lin: "Log-Linear or Linear-Log: When one parameter varies by very different orders of magnitude.",
                    log_log: "Log-Log: To identify power relationships between parameters (e.g., weight-power relationship) or when both parameters vary by very different orders of magnitude."
                }
            },
            data_sources: {
                title: "Data Sources",
                intro: "Aircraft data can be obtained from various sources, including:",
                sources: [
                    "EUROCONTROL Aircraft Performance Database",
                    "Manufacturer manuals",
                    "Aviation industry technical publications"
                ]
            }
        }
    },
    pt: {
        nav: {
            list: "Lista de Aeronaves",
            scatter: "Gráficos Comparativos",
            flight: "Diagrama do Voo",
            timeline: "Evolução Histórica",
            about: "Sobre"
        },
        titles: {
            main: "AeroDataBank",
            list: "Lista de Aeronaves",
            scatter: "Gráficos Comparativos",
            flight: "Diagrama do Voo",
            timeline: "Evolução Histórica",
            about: "Sobre o AeroDataBank"
        },
        table: {
            headers: {
                aircraft: "Aeronave",
                manufacturer: "Fabricante",
                model: "Modelo",
                year: "Ano",
                type: "Tipo",
                era: "Era",
                mtow: "MTOW (kg)"
            },
            no_data: "Nenhum dado disponível.",
            no_name: "Sem nome",
            error_rendering: "Erro ao renderizar tabela",
            no_results: "Nenhuma aeronave encontrada com os filtros selecionados."
        },
        charts: {
            scatter: {
                x_param: "Parâmetro X",
                y_param: "Parâmetro Y",
                scale: "Escala do Gráfico",
                log_scale_x: "Escala Log X",
                log_scale_y: "Escala Log Y",
                selected_aircraft: "Aeronave Selecionada",
                click_point: "Clique em um ponto no gráfico para ver os detalhes da aeronave."
            },
            flight: {
                select_diagram: "Selecionar Diagrama",
                wing_loading_mtow: "Carga Alar vs MTOW",
                speed_mtow: "Velocidade Real (TAS) vs MTOW",
                speed_mtow_ve: "Velocidade Equivalente (VE) vs MTOW",
                wing_loading_speed: "Carga Alar vs Velocidade Real (TAS)",
                wing_loading_speed_ve: "Carga Alar vs Velocidade Equivalente (VE)",
                chart_options: "Opções do Gráfico",
                log_scale_x: "Escala Log X",
                log_scale_y: "Escala Log Y",
                show_trendlines: "Mostrar Linhas de Tendência",
                comparative_diagram: "Diagrama Comparativo",
                description: "Este diagrama permite comparar diferentes aeronaves e aves com base em suas características aerodinâmicas. O gráfico usa escala logarítmica para permitir a visualização de aeronaves de tamanhos muito diferentes."
            },
            timeline: {
                parameter: "Parâmetro",
                chart_scale: "Escala do Gráfico",
                log_scale: "Escala Logarítmica (eixo Y)"
            }
        },
        filters: {
            title: "Filtrar por Categoria",
            type: {
                label: "Tipo/Função:",
                all: "Todos",
                commercial: "Aviação Comercial",
                executive: "Aeronaves Executivas",
                cargo: "Aviação de Carga",
                military: "Aviação Militar",
                general: "Aviação Geral",
                historical: "Aeronaves Históricas/Pioneiras",
                experimental: "Aeronaves Experimentais",
                bird: "Aves (Biológico)"
            },
            era: {
                label: "Era/Geração:",
                all: "Todos",
                pioneers: "Pioneiros (até 1930)",
                classic: "Era Clássica (1930-1950)",
                early_jet: "Era do Jato (1950-1970)",
                modern: "Era Moderna (1970-2000)",
                contemporary: "Era Contemporânea (2000+)",
                biological: "Biológico (Aves)"
            },
            engine: {
                label: "Motorização:",
                all: "Todos",
                piston: "Motor a Pistão",
                turboprop: "Turboélice",
                turbojet: "Turbojato",
                turbofan: "Turbofan",
                special: "Propulsão Especial"
            },
            size: {
                label: "Tamanho:",
                all: "Todos",
                very_light: "Muito Leve (até 5.700 kg)",
                regional: "Regional (5.700-50.000 kg)",
                medium: "Médio Porte (50.000-150.000 kg)",
                large: "Grande Porte (150.000-300.000 kg)",
                very_large: "Muito Grande (acima de 300.000 kg)"
            },
            clear: "Limpar Filtros"
        },
        aircraft: {
            edit: {
                title: "Adicionar/Editar Aeronave",
                image_url: "URL da Imagem",
                cancel: "Cancelar",
                save: "Salvar",
                select: "Selecione..."
            },
            details: {
                title: "Detalhes da Aeronave",
                close: "Fechar",
                not_found: "Aeronave não encontrada.",
                general: {
                    title: "Informações Gerais",
                    name: "Nome",
                    manufacturer: "Fabricante",
                    model: "Modelo",
                    first_flight_year: "Ano do Primeiro Voo",
                    engine_type: "Tipo de Motor",
                    engine_count: "Número de Motores"
                },
                categories: {
                    title: "Categorias",
                    type: "Tipo/Função",
                    era: "Era/Geração",
                    engine: "Motorização",
                    size: "Tamanho"
                },
                physical: {
                    title: "Características Físicas",
                    mtow: "Peso Máximo de Decolagem",
                    wing_area: "Área da Asa",
                    wingspan: "Envergadura",
                    wing_loading: "Carga Alar",
                    aspect_ratio: "Razão de Aspecto"
                },
                speeds: {
                    title: "Velocidades",
                    cruise: "Velocidade de Cruzeiro",
                    takeoff: "Velocidade de Decolagem",
                    landing: "Velocidade de Pouso"
                },
                performance: {
                    title: "Outras Características",
                    service_ceiling: "Teto de Serviço",
                    cruise_altitude: "Altitude de Cruzeiro",
                    max_thrust: "Tração Máxima",
                    range: "Alcance"
                }
            },
            categories: {
                type: {
                    comercial: "Aviação Comercial",
                    executiva: "Aeronaves Executivas",
                    carga: "Aviação de Carga",
                    militar: "Aviação Militar",
                    geral: "Aviação Geral",
                    historica: "Aeronaves Históricas",
                    experimental: "Aeronaves Experimentais",
                    ave: "Ave"
                },
                era: {
                    pioneiros: "Pioneiros (até 1930)",
                    classica: "Era Clássica (1930-1950)",
                    jato_inicial: "Era do Jato Inicial (1950-1970)",
                    moderna: "Era Moderna (1970-2000)",
                    contemporanea: "Era Contemporânea (2000+)",
                    biologica: "Biológico"
                },
                engine: {
                    pistao: "Motor a Pistão",
                    turboelice: "Turboélice",
                    turbojato: "Turbojato",
                    turbofan: "Turbofan",
                    especial: "Propulsão Especial",
                    muscular: "Muscular (Biológico)"
                },
                size: {
                    muito_leve: "Muito Leve (até 5.700 kg)",
                    regional: "Regional (5.700-50.000 kg)",
                    medio: "Médio Porte (50.000-150.000 kg)",
                    grande: "Grande Porte (150.000-300.000 kg)",
                    muito_grande: "Muito Grande (acima de 300.000 kg)"
                }
            }
        },
        about: {
            intro: "Este banco de dados foi desenvolvido para apoiar cursos de desempenho de aeronaves, permitindo a visualização e análise de características técnicas de diversas aeronaves.",
            features: {
                title: "Funcionalidades",
                items: [
                    "Armazenamento de dados técnicos de aeronaves (MTOW, área da asa, envergadura, velocidades, etc.)",
                    "Cálculo automático de parâmetros de desempenho (coeficiente de sustentação, carga alar, etc.)",
                    "Interface web para visualização, adição, remoção e modificação de aeronaves",
                    "Gráficos comparativos entre diferentes aeronaves",
                    "Visualização da evolução histórica das características de desempenho"
                ]
            },
            scales: {
                title: "Escalas dos Gráficos",
                intro: "O sistema permite visualizar os dados em escalas lineares ou logarítmicas:",
                linear: "Escala Linear: Mostra os valores em uma progressão uniforme. Útil para comparar diferenças absolutas entre aeronaves.",
                log: "Escala Logarítmica: Mostra os valores em uma progressão onde cada incremento representa uma multiplicação por um fator constante. Útil para visualizar dados que variam em várias ordens de magnitude, como comparar o MTOW do Wright Flyer (338 kg) com o do Airbus A380 (575.000 kg).",
                when_to_use: {
                    title: "Quando usar cada escala:",
                    lin_lin: "Linear-Linear: Para comparar aeronaves similares ou quando as diferenças absolutas são importantes.",
                    log_lin: "Log-Linear ou Linear-Log: Quando um dos parâmetros varia em ordens de magnitude muito diferentes.",
                    log_log: "Log-Log: Para identificar relações de potência entre parâmetros (ex: relação entre peso e potência) ou quando ambos os parâmetros variam em ordens de magnitude muito diferentes."
                }
            },
            data_sources: {
                title: "Fontes de Dados",
                intro: "Os dados das aeronaves podem ser obtidos de várias fontes, incluindo:",
                sources: [
                    "EUROCONTROL Aircraft Performance Database",
                    "Manuais de fabricantes",
                    "Publicações técnicas da indústria aeronáutica"
                ]
            }
        }
    }
};

// Current language
let currentLang = 'en';

// Function to get a nested translation using a dot notation path
function getTranslation(path) {
    console.log('Getting translation for path:', path);
    const result = path.split('.').reduce((obj, key) => obj && obj[key], translations[currentLang]);
    console.log('Translation result:', result);
    return result || path;
}

// Function to update all translations on the page
function updatePageTranslations() {
    console.log('Updating page translations. Current language:', currentLang);
    
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const path = element.getAttribute('data-i18n');
        console.log('Updating element with path:', path);
        const translation = getTranslation(path);
        element.textContent = translation;
    });

    // Update elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const path = element.getAttribute('data-i18n-placeholder');
        console.log('Updating placeholder with path:', path);
        const translation = getTranslation(path);
        element.placeholder = translation;
    });

    // Update page title
    document.title = getTranslation('titles.main');

    // Update language switcher active state
    document.querySelectorAll('.language-switcher img').forEach(img => {
        img.classList.toggle('active', img.getAttribute('data-lang') === currentLang);
    });
    
    console.log('Page translations updated');
}

// Function to change language
function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        document.documentElement.lang = lang;
        updatePageTranslations();
        // Trigger event for other components that need to update
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }
}

// Initialize language switcher
document.addEventListener('DOMContentLoaded', () => {
    // Set up language switcher clicks
    document.querySelectorAll('.language-switcher img').forEach(img => {
        img.addEventListener('click', () => {
            changeLanguage(img.getAttribute('data-lang'));
        });
    });

    // Initial translation
    updatePageTranslations();
}); 