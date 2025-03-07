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
    return path.split('.').reduce((obj, key) => obj && obj[key], translations[currentLang]) || path;
}

// Function to update all translations on the page
function updatePageTranslations() {
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const path = element.getAttribute('data-i18n');
        element.textContent = getTranslation(path);
    });

    // Update page title
    document.title = getTranslation('titles.main');

    // Update language switcher active state
    document.querySelectorAll('.language-switcher img').forEach(img => {
        img.classList.toggle('active', img.getAttribute('data-lang') === currentLang);
    });
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