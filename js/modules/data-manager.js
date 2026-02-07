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

// Adicione estas funções após as funções de aluno:

// Funções de Presença
export function markAttendance(studentId, date, status) {
    const student = appData.students.find(s => s.id === studentId);
    if (!student) return false;

    // Garantir que attendance seja um array
    if (!Array.isArray(student.attendance)) {
        student.attendance = [];
    }

    // Verificar se já existe registro para esta data
    const existingIndex = student.attendance.findIndex(a => a.date === date);
    
    if (existingIndex > -1) {
        // Atualizar registro existente
        student.attendance[existingIndex] = { date, status };
    } else {
        // Adicionar novo registro
        student.attendance.push({ date, status });
    }

    saveData();
    return true;
}

export function getAttendanceReport(classId, startDate, endDate) {
    const students = appData.students.filter(s => s.classId === classId);
    const report = {
        classId,
        startDate,
        endDate,
        students: [],
        summary: {
            totalDays: 0,
            totalPresent: 0,
            totalAbsent: 0,
            totalExcused: 0,
            attendanceRate: 0
        }
    };

    // Gerar todas as datas no intervalo
    const dates = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    report.summary.totalDays = dates.length;

    // Processar cada aluno
    students.forEach(student => {
        const studentReport = {
            id: student.id,
            name: student.name,
            attendance: {},
            totals: {
                present: 0,
                absent: 0,
                excused: 0,
                total: 0
            }
        };

        dates.forEach(date => {
            const record = student.attendance?.find(a => a.date === date);
            studentReport.attendance[date] = record ? record.status : 'not-recorded';
            
            if (record) {
                switch (record.status) {
                    case 'present':
                        studentReport.totals.present++;
                        report.summary.totalPresent++;
                        break;
                    case 'absent':
                        studentReport.totals.absent++;
                        report.summary.totalAbsent++;
                        break;
                    case 'excused':
                        studentReport.totals.excused++;
                        report.summary.totalExcused++;
                        break;
                }
                studentReport.totals.total++;
            }
        });

        report.students.push(studentReport);
    });

    // Calcular taxa de presença geral
    const totalPossible = students.length * dates.length;
    const totalAttended = report.summary.totalPresent;
    report.summary.attendanceRate = totalPossible > 0 
        ? (totalAttended / totalPossible) * 100 
        : 0;

    return report;
}

// Funções de Histórico de Peer Work
export function confirmPeerWork(student1Id, student2Id, date = new Date().toISOString().split('T')[0]) {
    const student1 = appData.students.find(s => s.id === student1Id);
    const student2 = appData.students.find(s => s.id === student2Id);
    
    if (!student1 || !student2) return false;

    // Inicializar peerHistory se não existir
    if (!Array.isArray(student1.peerHistory)) student1.peerHistory = [];
    if (!Array.isArray(student2.peerHistory)) student2.peerHistory = [];

    // Adicionar ao histórico de ambos os alunos
    const peerRecord = {
        date,
        partnerId: student1Id === student1Id ? student2Id : student1Id,
        partnerName: student1Id === student1Id ? student2.name : student1.name,
        lesson: student1.nextLesson,
        confirmed: true
    };

    student1.peerHistory.push({ ...peerRecord, partnerId: student2Id, partnerName: student2.name });
    student2.peerHistory.push({ ...peerRecord, partnerId: student1Id, partnerName: student1.name });

    saveData();
    return true;
}

export function getPeerHistory(studentId, limit = 10) {
    const student = appData.students.find(s => s.id === studentId);
    if (!student || !Array.isArray(student.peerHistory)) return [];
    
    return student.peerHistory
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
}
