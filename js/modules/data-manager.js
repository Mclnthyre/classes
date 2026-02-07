// js/modules/data-manager.js

// Configuração do GitHub
let GITHUB_CONFIG = {
    username: '',
    repo: '',
    token: '',
    branch: 'main'
};

// Dados da aplicação
let appData = {
    classes: [],
    students: [],
    lessons: [],
    settings: {
        autoSave: true,
        theme: 'light'
    }
};

/**
 * Carrega dados do localStorage
 */
export function loadData() {
    const saved = localStorage.getItem('englishPlannerData');
    if (saved) {
        appData = JSON.parse(saved);
        return appData;
    }
    return null;
}

/**
 * Salva dados no localStorage
 */
export function saveData() {
    localStorage.setItem('englishPlannerData', JSON.stringify(appData));
    return appData;
}

/**
 * Retorna os dados da aplicação
 */
export function getAppData() {
    return appData;
}

/**
 * Define os dados da aplicação
 */
export function setAppData(data) {
    appData = data;
}

/**
 * Carrega configuração do GitHub
 */
export function loadGitHubConfig() {
    const savedConfig = localStorage.getItem('githubConfig');
    if (savedConfig) {
        GITHUB_CONFIG = JSON.parse(savedConfig);
    }
    return GITHUB_CONFIG;
}

/**
 * Salva configuração do GitHub
 */
export function saveGitHubConfig(config) {
    GITHUB_CONFIG = config;
    localStorage.setItem('githubConfig', JSON.stringify(GITHUB_CONFIG));
    return GITHUB_CONFIG;
}

/**
 * Retorna configuração do GitHub
 */
export function getGitHubConfig() {
    return GITHUB_CONFIG;
}

/**
 * Cria dados de exemplo para inicialização
 */
export function createSampleData() {
    return {
        classes: [
            {
                id: 1,
                name: "INT W (Seg-Qua) 16h",
                days: ["segunda", "quarta"],
                time: "16:00",
                color: "#3498db"
            },
            {
                id: 2,
                name: "INT X (Ter-Qui) 19h",
                days: ["terca", "quinta"],
                time: "19:00",
                color: "#e74c3c"
            },
            {
                id: 3,
                name: "ADV Y (Sáb) 10h",
                days: ["sabado"],
                time: "10:00",
                color: "#2ecc71"
            }
        ],
        students: [
            {
                id: 1,
                name: "Jhonata",
                classId: 1,
                lastLesson: "173",
                nextLesson: "174",
                nextLessonValue: 174,
                lastLessonValue: 173,
                fale: { F: "MB", A: "O", L: "B", E: "MB" },
                average: 3.0,
                attendance: [],
                peerHistory: []
            },
            {
                id: 2,
                name: "Letícia",
                classId: 1,
                lastLesson: "169",
                nextLesson: "RW1",
                nextLessonValue: 1001,
                lastLessonValue: 169,
                fale: { F: "B", A: "MB", L: "O", E: "B" },
                average: 2.5,
                attendance: [],
                peerHistory: []
            },
            {
                id: 3,
                name: "Cláudia",
                classId: 1,
                lastLesson: "229",
                nextLesson: "230",
                nextLessonValue: 230,
                lastLessonValue: 229,
                fale: { F: "O", A: "O", L: "MB", E: "O" },
                average: 3.75,
                attendance: [],
                peerHistory: []
            }
        ],
        lessons: [],
        settings: {
            autoSave: true,
            theme: 'light'
        }
    };
}
