/* ============================================
   INICIALIZAÇÃO E CONFIGURAÇÃO
   ============================================ */

// Estado global da aplicação
const AppState = {
    data: null,
    currentSection: 'dashboard',
    selectedClassId: null,
    selectedDate: new Date().toISOString().split('T')[0],
    githubConfig: null,
    settings: null
};

// Estrutura padrão dos dados
const DEFAULT_DATA = {
    classes: [],
    students: [],
    attendance: [],
    planning: [],
    settings: {
        autoSave: true,
        theme: 'light',
        notifications: true,
        backupFrequency: 'daily'
    }
};

// Configuração padrão do GitHub
const DEFAULT_GITHUB_CONFIG = {
    username: '',
    repo: '',
    token: ''
};

// Mapeamento de dias da semana
const WEEK_DAYS = {
    segunda: 'Segunda-feira',
    terca: 'Terça-feira',
    quarta: 'Quarta-feira',
    quinta: 'Quinta-feira',
    sexta: 'Sexta-feira',
    sabado: 'Sábado'
};

// Mapeamento F.A.L.E para valores numéricos
const FALE_VALUES = {
    'O': 4,
    'MB': 3,
    'B': 2,
    'R': 1
};

// Mapeamento F.A.L.E para classes CSS
const FALE_CLASSES = {
    'O': 'bg-O',
    'MB': 'bg-MB',
    'B': 'bg-B',
    'R': 'bg-R'
};

/* ============================================
   FUNÇÕES DE INICIALIZAÇÃO
   ============================================ */

/**
 * Inicializa a aplicação
 */
function initApp() {
    console.log('Inicializando English Planner...');
    
    // Carrega dados do localStorage
    loadData();
    
    // Carrega configurações
    loadSettings();
    
    // Carrega configuração do GitHub
    loadGitHubConfig();
    
    // Configura event listeners
    setupEventListeners();
    
    // Configura navegação
    setupNavigation();
    
    // Atualiza interface
    updateUI();
    
    // Inicializa tema
    initTheme();
    
    // Atualiza última data de salvamento
    updateLastSave();
    
    console.log('Aplicação inicializada com sucesso!');
}

/**
 * Carrega dados do localStorage
 */
function loadData() {
    try {
        const savedData = localStorage.getItem('englishPlannerData');
        if (savedData) {
            AppState.data = JSON.parse(savedData);
            
            // Garante que a estrutura esteja completa
            AppState.data = {
                ...DEFAULT_DATA,
                ...AppState.data,
                classes: AppState.data.classes || [],
                students: AppState.data.students || [],
                attendance: AppState.data.attendance || [],
                planning: AppState.data.planning || []
            };
        } else {
            // Usa dados de exemplo para desenvolvimento
            AppState.data = getSampleData();
            saveData();
        }
        
        console.log(`Dados carregados: ${AppState.data.classes.length} turmas, ${AppState.data.students.length} alunos`);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        AppState.data = getSampleData();
        saveData();
    }
}

/**
 * Carrega configurações
 */
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('englishPlannerSettings');
        AppState.settings = savedSettings ? JSON.parse(savedSettings) : DEFAULT_DATA.settings;
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        AppState.settings = DEFAULT_DATA.settings;
    }
}

/**
 * Carrega configuração do GitHub
 */
function loadGitHubConfig() {
    try {
        const savedConfig = localStorage.getItem('githubConfig');
        AppState.githubConfig = savedConfig ? JSON.parse(savedConfig) : DEFAULT_GITHUB_CONFIG;
    } catch (error) {
        console.error('Erro ao carregar configuração do GitHub:', error);
        AppState.githubConfig = DEFAULT_GITHUB_CONFIG;
    }
}

/**
 * Salva dados no localStorage
 */
function saveData() {
    try {
        localStorage.setItem('englishPlannerData', JSON.stringify(AppState.data));
        updateLastSave();
        
        if (AppState.settings.autoSave) {
            showNotification('Dados salvos automaticamente!', 'success');
        }
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        showNotification('Erro ao salvar dados!', 'error');
    }
}

/**
 * Salva configurações
 */
function saveSettings() {
    try {
        localStorage.setItem('englishPlannerSettings', JSON.stringify(AppState.settings));
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
    }
}

/**
 * Salva configuração do GitHub
 */
function saveGitHubConfig() {
    try {
        localStorage.setItem('githubConfig', JSON.stringify(AppState.githubConfig));
    } catch (error) {
        console.error('Erro ao salvar configuração do GitHub:', error);
    }
}

/* ============================================
   DADOS DE EXEMPLO
   ============================================ */

/**
 * Retorna dados de exemplo para desenvolvimento
 */
function getSampleData() {
    const sampleClasses = [
        {
            id: 1,
            name: 'Turma Kids A',
            days: ['segunda', 'quarta'],
            time: '16:00',
            color: '#4361ee'
        },
        {
            id: 2,
            name: 'Turma Teens B',
            days: ['terca', 'quinta'],
            time: '17:00',
            color: '#7209b7'
        },
        {
            id: 3,
            name: 'Turma Adults C',
            days: ['sexta'],
            time: '19:00',
            color: '#38b000'
        }
    ];

    const sampleStudents = [
        {
            id: 1,
            name: 'Ana Silva',
            classId: 1,
            lastLesson: '169',
            nextLesson: '170',
            lastLessonValue: 169,
            nextLessonValue: 170,
            fale: { F: 'O', A: 'MB', L: 'B', E: 'MB' },
            average: 3.25,
            homework: 'sim',
            preparation: 'sim',
            evaluation: 'Aluna dedicada e participativa',
            observation: 'Aula produtiva, focada em conversação',
            attendance: [
                { date: '2024-01-15', status: 'present' },
                { date: '2024-01-17', status: 'present' }
            ],
            peerHistory: []
        },
        {
            id: 2,
            name: 'Carlos Oliveira',
            classId: 1,
            lastLesson: '170',
            nextLesson: '171',
            lastLessonValue: 170,
            nextLessonValue: 171,
            fale: { F: 'B', A: 'O', L: 'MB', E: 'B' },
            average: 3.0,
            homework: 'parcial',
            preparation: 'sim',
            evaluation: 'Boa pronúncia, precisa praticar mais conversação',
            observation: 'Dificuldade com phrasal verbs',
            attendance: [
                { date: '2024-01-15', status: 'present' },
                { date: '2024-01-17', status: 'justified' }
            ],
            peerHistory: []
        },
        {
            id: 3,
            name: 'Beatriz Santos',
            classId: 2,
            lastLesson: 'RW1',
            nextLesson: 'RW2',
            lastLessonValue: 1001,
            nextLessonValue: 1002,
            fale: { F: 'MB', A: 'MB', L: 'O', E: 'O' },
            average: 3.5,
            homework: 'sim',
            preparation: 'sim',
            evaluation: 'Excelente desempenho em todas as áreas',
            observation: 'Avançando bem nas revisões',
            attendance: [
                { date: '2024-01-16', status: 'present' },
                { date: '2024-01-18', status: 'present' }
            ],
            peerHistory: []
        }
    ];

    return {
        classes: sampleClasses,
        students: sampleStudents,
        attendance: [],
        planning: [],
        settings: DEFAULT_DATA.settings
    };
}

/* ============================================
   GESTÃO DE TURMAS (CRUD)
   ============================================ */

/**
 * Obtém todas as turmas
 */
function getClasses() {
    return AppState.data.classes;
}

/**
 * Obtém uma turma por ID
 */
function getClassById(id) {
    return AppState.data.classes.find(c => c.id === id);
}

/**
 * Adiciona uma nova turma
 */
function addClass(classData) {
    const newId = AppState.data.classes.length > 0 
        ? Math.max(...AppState.data.classes.map(c => c.id)) + 1 
        : 1;
    
    const newClass = {
        id: newId,
        ...classData
    };
    
    AppState.data.classes.push(newClass);
    saveData();
    return newClass;
}

/**
 * Atualiza uma turma existente
 */
function updateClass(id, classData) {
    const index = AppState.data.classes.findIndex(c => c.id === id);
    if (index !== -1) {
        AppState.data.classes[index] = { id, ...classData };
        saveData();
        return true;
    }
    return false;
}

/**
 * Remove uma turma
 */
function deleteClass(id) {
    const index = AppState.data.classes.findIndex(c => c.id === id);
    if (index !== -1) {
        // Remove alunos da turma
        AppState.data.students = AppState.data.students.filter(s => s.classId !== id);
        
        // Remove a turma
        AppState.data.classes.splice(index, 1);
        saveData();
        return true;
    }
    return false;
}

/**
 * Obtém alunos de uma turma
 */
function getStudentsByClass(classId) {
    return AppState.data.students.filter(s => s.classId === classId);
}

/**
 * Calcula estatísticas de uma turma
 */
function getClassStats(classId) {
    const students = getStudentsByClass(classId);
    const today = new Date().toISOString().split('T')[0];
    
    const stats = {
        totalStudents: students.length,
        averageFale: 0,
        attendanceRate: 0,
        nextLessons: students.map(s => s.nextLesson)
    };
    
    if (students.length > 0) {
        // Calcula média F.A.L.E
        const totalAverage = students.reduce((sum, student) => sum + (student.average || 0), 0);
        stats.averageFale = totalAverage / students.length;
        
        // Calcula taxa de frequência (últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        let totalAttendance = 0;
        let totalPossible = 0;
        
        students.forEach(student => {
            const recentAttendance = student.attendance?.filter(a => {
                const attendanceDate = new Date(a.date);
                return attendanceDate >= thirtyDaysAgo;
            }) || [];
            
            totalAttendance += recentAttendance.filter(a => a.status === 'present').length;
            totalPossible += recentAttendance.length;
        });
        
        if (totalPossible > 0) {
            stats.attendanceRate = (totalAttendance / totalPossible) * 100;
        }
    }
    
    return stats;
}

/* ============================================
   GESTÃO DE ALUNOS (CRUD COM F.A.L.E)
   ============================================ */

/**
 * Obtém todos os alunos
 */
function getStudents() {
    return AppState.data.students;
}

/**
 * Obtém um aluno por ID
 */
function getStudentById(id) {
    return AppState.data.students.find(s => s.id === id);
}

/**
 * Adiciona um novo aluno
 */
function addStudent(studentData) {
    // Calcula valores das lições
    const lastLessonValue = calculateLessonValue(studentData.lastLesson);
    const nextLessonValue = calculateLessonValue(studentData.nextLesson);
    
    // Calcula média F.A.L.E
    const average = calculateFaleAverage(studentData.fale);
    
    const newId = AppState.data.students.length > 0 
        ? Math.max(...AppState.data.students.map(s => s.id)) + 1 
        : 1;
    
    const newStudent = {
        id: newId,
        attendance: [],
        peerHistory: [],
        average: average,
        lastLessonValue: lastLessonValue,
        nextLessonValue: nextLessonValue,
        ...studentData
    };
    
    AppState.data.students.push(newStudent);
    saveData();
    return newStudent;
}

/**
 * Atualiza um aluno existente
 */
function updateStudent(id, studentData) {
    const index = AppState.data.students.findIndex(s => s.id === id);
    if (index !== -1) {
        // Calcula novos valores das lições
        const lastLessonValue = calculateLessonValue(studentData.lastLesson);
        const nextLessonValue = calculateLessonValue(studentData.nextLesson);
        
        // Calcula nova média F.A.L.E
        const average = calculateFaleAverage(studentData.fale);
        
        // Mantém dados históricos
        const existingStudent = AppState.data.students[index];
        
        AppState.data.students[index] = {
            ...existingStudent,
            ...studentData,
            lastLessonValue,
            nextLessonValue,
            average
        };
        
        saveData();
        return true;
    }
    return false;
}

/**
 * Remove um aluno
 */
function deleteStudent(id) {
    const index = AppState.data.students.findIndex(s => s.id === id);
    if (index !== -1) {
        AppState.data.students.splice(index, 1);
        saveData();
        return true;
    }
    return false;
}

/**
 * Calcula o valor numérico de uma lição
 */
function calculateLessonValue(lesson) {
    if (!lesson) return 0;
    
    if (lesson.startsWith('RW')) {
        // Revisões RW: RW1 = 1001, RW2 = 1002, etc.
        const rwNumber = parseInt(lesson.substring(2)) || 0;
        return 1000 + rwNumber;
    } else {
        // Lições regulares: "170" = 170
        return parseInt(lesson) || 0;
    }
}

/**
 * Calcula a média F.A.L.E
 */
function calculateFaleAverage(fale) {
    if (!fale) return 0;
    
    const values = [];
    if (fale.F) values.push(FALE_VALUES[fale.F] || 0);
    if (fale.A) values.push(FALE_VALUES[fale.A] || 0);
    if (fale.L) values.push(FALE_VALUES[fale.L] || 0);
    if (fale.E) values.push(FALE_VALUES[fale.E] || 0);
    
    if (values.length === 0) return 0;
    
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
}

/**
 * Obtém a classificação da média F.A.L.E
 */
function getFaleClassification(average) {
    if (average >= 3.5) return 'Ótimo';
    if (average >= 2.5) return 'Muito Bom';
    if (average >= 1.5) return 'Bom';
    return 'Regular';
}

/**
 * Ordena alunos por lição (pares → ímpares → revisões)
 */
function sortStudentsByLesson(students) {
    return [...students].sort((a, b) => {
        // Separa em grupos: pares, ímpares, revisões
        const aIsEven = a.nextLessonValue % 2 === 0;
        const bIsEven = b.nextLessonValue % 2 === 0;
        const aIsReview = a.nextLessonValue >= 1000;
        const bIsReview = b.nextLessonValue >= 1000;
        
        // Revisões por último
        if (aIsReview && !bIsReview) return 1;
        if (!aIsReview && bIsReview) return -1;
        
        // Pares antes de ímpares
        if (aIsEven && !bIsEven) return -1;
        if (!aIsEven && bIsEven) return 1;
        
        // Ordena por valor da lição (menor primeiro)
        return a.nextLessonValue - b.nextLessonValue;
    });
}

/* ============================================
   SISTEMA DE PRESENÇAS
   ============================================ */

/**
 * Registra presença de uma turma em uma data
 */
function registerAttendance(classId, date, attendanceData) {
    // Remove registros existentes para essa turma e data
    AppState.data.attendance = AppState.data.attendance.filter(
        a => !(a.classId === classId && a.date === date)
    );
    
    // Adiciona novos registros
    attendanceData.forEach(record => {
        AppState.data.attendance.push({
            classId,
            date,
            studentId: record.studentId,
            status: record.status,
            homework: record.homework,
            preparation: record.preparation,
            evaluation: record.evaluation,
            observation: record.observation
        });
        
        // Atualiza o histórico do aluno
        const student = getStudentById(record.studentId);
        if (student) {
            if (!student.attendance) student.attendance = [];
            
            // Remove registro existente para essa data
            student.attendance = student.attendance.filter(a => a.date !== date);
            
            // Adiciona novo registro
            student.attendance.push({
                date,
                status: record.status,
                homework: record.homework,
                preparation: record.preparation,
                evaluation: record.evaluation,
                observation: record.observation
            });
        }
    });
    
    saveData();
}

/**
 * Obtém presenças de uma turma em uma data
 */
function getAttendanceByClassAndDate(classId, date) {
    const students = getStudentsByClass(classId);
    
    return students.map(student => {
        // Procura registro específico
        const specificRecord = AppState.data.attendance.find(
            a => a.classId === classId && a.date === date && a.studentId === student.id
        );
        
        // Procura no histórico do aluno
        const studentRecord = student.attendance?.find(a => a.date === date);
        
        if (specificRecord || studentRecord) {
            const record = specificRecord || studentRecord;
            return {
                studentId: student.id,
                studentName: student.name,
                status: record.status || 'absent',
                homework: record.homework || 'nao',
                preparation: record.preparation || 'nao',
                evaluation: record.evaluation || '',
                observation: record.observation || ''
            };
        }
        
        // Retorna padrão se não houver registro
        return {
            studentId: student.id,
            studentName: student.name,
            status: 'absent',
            homework: 'nao',
            preparation: 'nao',
            evaluation: '',
            observation: ''
        };
    });
}

/**
 * Calcula estatísticas de frequência de um aluno
 */
function getStudentAttendanceStats(studentId) {
    const student = getStudentById(studentId);
    if (!student || !student.attendance) {
        return { present: 0, absent: 0, justified: 0, total: 0, rate: 0 };
    }
    
    const stats = {
        present: 0,
        absent: 0,
        justified: 0,
        total: student.attendance.length
    };
    
    student.attendance.forEach(record => {
        if (record.status === 'present') stats.present++;
        else if (record.status === 'absent') stats.absent++;
        else if (record.status === 'justified') stats.justified++;
    });
    
    stats.rate = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
    
    return stats;
}

/**
 * Calcula frequência geral da turma
 */
function getClassAttendanceStats(classId) {
    const students = getStudentsByClass(classId);
    const stats = {
        present: 0,
        absent: 0,
        justified: 0,
        totalClasses: 0,
        averageRate: 0
    };
    
    students.forEach(student => {
        const studentStats = getStudentAttendanceStats(student.id);
        stats.present += studentStats.present;
        stats.absent += studentStats.absent;
        stats.justified += studentStats.justified;
        stats.totalClasses += studentStats.total;
    });
    
    if (stats.totalClasses > 0) {
        stats.averageRate = (stats.present / stats.totalClasses) * 100;
    }
    
    return stats;
}

/* ============================================
   PLANEJAMENTO DE AULAS
   ============================================ */

/**
 * Gera ordem de atendimento para uma turma
 */
function generateAttendanceOrder(classId) {
    const students = getStudentsByClass(classId);
    const sortedStudents = sortStudentsByLesson(students);
    
    return sortedStudents.map((student, index) => ({
        order: index + 1,
        studentId: student.id,
        studentName: student.name,
        nextLesson: student.nextLesson,
        lessonType: getLessonType(student.nextLessonValue),
        faleAverage: student.average
    }));
}

/**
 * Sugere pares para peer work
 */
function suggestPeerPairs(classId) {
    const students = getStudentsByClass(classId);
    if (students.length < 2) return [];
    
    // Remove alunos em revisão (não participam de peer work)
    const availableStudents = students.filter(s => s.nextLessonValue < 1000);
    
    // Ordena por valor da lição
    availableStudents.sort((a, b) => a.nextLessonValue - b.nextLessonValue);
    
    const pairs = [];
    const usedStudents = new Set();
    
    // Tenta criar pares com diferença de até 2 lições
    for (let i = 0; i < availableStudents.length; i++) {
        if (usedStudents.has(availableStudents[i].id)) continue;
        
        let bestMatch = null;
        let minDifference = Infinity;
        
        for (let j = i + 1; j < availableStudents.length; j++) {
            if (usedStudents.has(availableStudents[j].id)) continue;
            
            const difference = Math.abs(
                availableStudents[i].nextLessonValue - availableStudents[j].nextLessonValue
            );
            
            if (difference <= 2 && difference < minDifference) {
                bestMatch = availableStudents[j];
                minDifference = difference;
            }
        }
        
        if (bestMatch) {
            pairs.push({
                student1: availableStudents[i],
                student2: bestMatch,
                difference: minDifference
            });
            
            usedStudents.add(availableStudents[i].id);
            usedStudents.add(bestMatch.id);
        }
    }
    
    // Se sobram alunos, tenta criar pares com diferença maior
    const remainingStudents = availableStudents.filter(s => !usedStudents.has(s.id));
    
    for (let i = 0; i < remainingStudents.length; i += 2) {
        if (i + 1 < remainingStudents.length) {
            pairs.push({
                student1: remainingStudents[i],
                student2: remainingStudents[i + 1],
                difference: Math.abs(
                    remainingStudents[i].nextLessonValue - remainingStudents[i + 1].nextLessonValue
                )
            });
        }
    }
    
    return pairs;
}

/**
 * Registra peer work realizado
 */
function registerPeerWork(classId, date, pairData) {
    if (!AppState.data.planning) AppState.data.planning = [];
    
    AppState.data.planning.push({
        classId,
        date,
        type: 'peer-work',
        pairs: pairData
    });
    
    // Atualiza histórico dos alunos
    pairData.forEach(pair => {
        const student1 = getStudentById(pair.student1Id);
        const student2 = getStudentById(pair.student2Id);
        
        if (student1) {
            if (!student1.peerHistory) student1.peerHistory = [];
            student1.peerHistory.push({
                date,
                partnerId: pair.student2Id,
                partnerName: pair.student2Name,
                lesson: pair.lesson
            });
        }
        
        if (student2) {
            if (!student2.peerHistory) student2.peerHistory = [];
            student2.peerHistory.push({
                date,
                partnerId: pair.student1Id,
                partnerName: pair.student1Name,
                lesson: pair.lesson
            });
        }
    });
    
    saveData();
}

/**
 * Obtém o tipo de lição
 */
function getLessonType(lessonValue) {
    if (lessonValue >= 1000) return 'review';
    if (lessonValue % 2 === 0) return 'even';
    return 'odd';
}

/* ============================================
   RELATÓRIOS
   ============================================ */

/**
 * Gera relatório de progresso
 */
function generateProgressReport(classId = null) {
    const classes = classId ? [getClassById(classId)] : AppState.data.classes;
    const report = {
        totalClasses: classes.length,
        totalStudents: AppState.data.students.length,
        averageFale: 0,
        attendanceRate: 0,
        classes: []
    };
    
    let totalFale = 0;
    let totalAttendance = 0;
    let classCount = 0;
    
    classes.forEach(cls => {
        if (!cls) return;
        
        const stats = getClassStats(cls.id);
        const classReport = {
            className: cls.name,
            studentCount: stats.totalStudents,
            averageFale: stats.averageFale,
            attendanceRate: stats.attendanceRate,
            nextLessons: stats.nextLessons
        };
        
        report.classes.push(classReport);
        
        totalFale += stats.averageFale;
        totalAttendance += stats.attendanceRate;
        classCount++;
    });
    
    if (classCount > 0) {
        report.averageFale = totalFale / classCount;
        report.attendanceRate = totalAttendance / classCount;
    }
    
    return report;
}

/**
 * Gera relatório de frequência
 */
function generateAttendanceReport(classId = null, startDate = null, endDate = null) {
    const students = classId 
        ? getStudentsByClass(classId) 
        : AppState.data.students;
    
    const report = {
        totalStudents: students.length,
        overallAttendance: 0,
        students: []
    };
    
    let totalPresent = 0;
    let totalClasses = 0;
    
    students.forEach(student => {
        const stats = getStudentAttendanceStats(student.id);
        const studentReport = {
            studentName: student.name,
            className: getClassById(student.classId)?.name || 'Sem turma',
            present: stats.present,
            absent: stats.absent,
            justified: stats.justified,
            attendanceRate: stats.rate,
            lastAttendance: student.attendance?.slice(-1)[0]?.date || 'Nunca'
        };
        
        report.students.push(studentReport);
        
        totalPresent += stats.present;
        totalClasses += stats.total;
    });
    
    if (totalClasses > 0) {
        report.overallAttendance = (totalPresent / totalClasses) * 100;
    }
    
    return report;
}

/**
 * Gera relatório F.A.L.E
 */
function generateFaleReport(classId = null) {
    const students = classId 
        ? getStudentsByClass(classId) 
        : AppState.data.students;
    
    const report = {
        totalStudents: students.length,
        distribution: { O: 0, MB: 0, B: 0, R: 0 },
        averages: { F: 0, A: 0, L: 0, E: 0 },
        students: []
    };
    
    const totals = { F: 0, A: 0, L: 0, E: 0 };
    let studentCount = 0;
    
    students.forEach(student => {
        if (student.fale) {
            report.students.push({
                studentName: student.name,
                className: getClassById(student.classId)?.name || 'Sem turma',
                fale: student.fale,
                average: student.average,
                classification: getFaleClassification(student.average)
            });
            
            // Atualiza distribuição
            Object.values(student.fale).forEach(value => {
                if (report.distribution[value] !== undefined) {
                    report.distribution[value]++;
                }
            });
            
            // Soma para médias
            if (student.fale.F) { totals.F += FALE_VALUES[student.fale.F]; studentCount++; }
            if (student.fale.A) { totals.A += FALE_VALUES[student.fale.A]; studentCount++; }
            if (student.fale.L) { totals.L += FALE_VALUES[student.fale.L]; studentCount++; }
            if (student.fale.E) { totals.E += FALE_VALUES[student.fale.E]; studentCount++; }
        }
    });
    
    // Calcula médias
    if (studentCount > 0) {
        report.averages.F = totals.F / studentCount;
        report.averages.A = totals.A / studentCount;
        report.averages.L = totals.L / studentCount;
        report.averages.E = totals.E / studentCount;
    }
    
    return report;
}

/* ============================================
   INTEGRAÇÃO GITHUB
   ============================================ */

/**
 * Exporta dados para GitHub
 */
async function exportToGitHub() {
    if (!AppState.githubConfig.username || !AppState.githubConfig.repo) {
        showNotification('Configure usuário e repositório do GitHub primeiro!', 'warning');
        return false;
    }
    
    try {
        const data = {
            appData: AppState.data,
            settings: AppState.settings,
            exportedAt: new Date().toISOString()
        };
        
        const content = JSON.stringify(data, null, 2);
        const encodedContent = btoa(unescape(encodeURIComponent(content)));
        
        let url = `https://api.github.com/repos/${AppState.githubConfig.username}/${AppState.githubConfig.repo}/contents/data.json`;
        
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
        
        if (AppState.githubConfig.token) {
            headers['Authorization'] = `token ${AppState.githubConfig.token}`;
        }
        
        // Tenta obter o SHA do arquivo existente
        let sha = null;
        try {
            const response = await fetch(url, { headers });
            if (response.ok) {
                const fileData = await response.json();
                sha = fileData.sha;
            }
        } catch (error) {
            // Arquivo não existe ainda
        }
        
        const body = {
            message: `Backup English Planner - ${new Date().toLocaleString()}`,
            content: encodedContent,
            ...(sha && { sha })
        };
        
        const putResponse = await fetch(url, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body)
        });
        
        if (putResponse.ok) {
            showNotification('Dados salvos no GitHub com sucesso!', 'success');
            return true;
        } else {
            const error = await putResponse.json();
            throw new Error(error.message || 'Erro ao salvar no GitHub');
        }
    } catch (error) {
        console.error('Erro ao exportar para GitHub:', error);
        showNotification(`Erro ao exportar: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Importa dados do GitHub
 */
async function importFromGitHub() {
    if (!AppState.githubConfig.username || !AppState.githubConfig.repo) {
        showNotification('Configure usuário e repositório do GitHub primeiro!', 'warning');
        return false;
    }
    
    try {
        const url = `https://api.github.com/repos/${AppState.githubConfig.username}/${AppState.githubConfig.repo}/contents/data.json`;
        
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };
        
        if (AppState.githubConfig.token) {
            headers['Authorization'] = `token ${AppState.githubConfig.token}`;
        }
        
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
            throw new Error('Arquivo não encontrado no GitHub');
        }
        
        const fileData = await response.json();
        const decodedContent = decodeURIComponent(escape(atob(fileData.content)));
        const data = JSON.parse(decodedContent);
        
        // Atualiza dados
        AppState.data = data.appData;
        AppState.settings = data.settings;
        
        saveData();
        saveSettings();
        
        showNotification('Dados importados do GitHub com sucesso!', 'success');
        updateUI();
        
        return true;
    } catch (error) {
        console.error('Erro ao importar do GitHub:', error);
        showNotification(`Erro ao importar: ${error.message}`, 'error');
        return false;
    }
}

/* ============================================
   GESTÃO DE INTERFACE (UI)
   ============================================ */

/**
 * Configura todos os event listeners
 */
function setupEventListeners() {
    // Navegação
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.closest('a').getAttribute('data-section');
            navigateTo(section);
        });
    });
    
    // Toggle sidebar em mobile
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
    
    // Botão "Novo"
    document.getElementById('add-new-btn').addEventListener('click', () => {
        switch (AppState.currentSection) {
            case 'classes':
                showClassModal();
                break;
            case 'students':
                showStudentModal();
                break;
            case 'attendance':
                showAttendanceModal();
                break;
        }
    });
    
    // Botões específicos
    document.getElementById('add-class-btn')?.addEventListener('click', showClassModal);
    document.getElementById('add-student-btn')?.addEventListener('click', showStudentModal);
    document.getElementById('register-attendance-btn')?.addEventListener('click', showAttendanceModal);
    
    // Botões de ação
    document.getElementById('generate-order-btn')?.addEventListener('click', generateAndShowOrder);
    document.getElementById('suggest-pairs-btn')?.addEventListener('click', generateAndShowPairs);
    
    // Salvar turma
    document.getElementById('saveClassBtn')?.addEventListener('click', saveClass);
    
    // Salvar aluno
    document.getElementById('saveStudentBtn')?.addEventListener('click', saveStudent);
    
    // Salvar frequência
    document.getElementById('saveAttendanceBtn')?.addEventListener('click', saveAttendance);
    
    // Exportar/Importar
    document.getElementById('export-data')?.addEventListener('click', exportData);
    document.getElementById('import-data')?.addEventListener('click', importData);
    document.getElementById('export-all-btn')?.addEventListener('click', exportData);
    document.getElementById('import-file-btn')?.addEventListener('click', () => {
        document.getElementById('import-file-input').click();
    });
    document.getElementById('import-file-input')?.addEventListener('change', handleFileImport);
    
    // GitHub
    document.getElementById('github-save-btn')?.addEventListener('click', exportToGitHub);
    document.getElementById('github-load-btn')?.addEventListener('click', importFromGitHub);
    
    // Configurações
    document.getElementById('save-settings-btn')?.addEventListener('click', saveSettingsFromUI);
    document.getElementById('darkModeSwitch')?.addEventListener('change', toggleDarkMode);
    document.getElementById('theme-select')?.addEventListener('change', changeTheme);
    
    // Filtros de turmas
    const classSearch = document.getElementById('class-search');
    const classDayFilter = document.getElementById('class-day-filter');
    
    if (classSearch) {
        classSearch.addEventListener('input', filterClasses);
    }
    
    if (classDayFilter) {
        classDayFilter.addEventListener('change', filterClasses);
    }
    
    // Filtros de alunos
    const studentSearch = document.getElementById('student-search');
    const studentClassFilter = document.getElementById('student-class-filter');
    const studentFaleFilter = document.getElementById('student-fale-filter');
    
    if (studentSearch) {
        studentSearch.addEventListener('input', filterStudents);
    }
    
    if (studentClassFilter) {
        studentClassFilter.addEventListener('change', filterStudents);
    }
    
    if (studentFaleFilter) {
        studentFaleFilter.addEventListener('change', filterStudents);
    }
    
    // Planejamento
    const planningClassSelect = document.getElementById('planning-class-select');
    const planningDate = document.getElementById('planning-date');
    const generateOrderBtn = document.getElementById('generate-order-btn');
    const suggestPairsBtn = document.getElementById('suggest-pairs-btn');
    
    if (planningClassSelect) {
        planningClassSelect.addEventListener('change', loadPlanningSection);
    }
    
    if (planningDate) {
        planningDate.addEventListener('change', loadPlanningSection);
    }
    
    if (generateOrderBtn) {
        generateOrderBtn.addEventListener('click', generateAndShowOrder);
    }
    
    if (suggestPairsBtn) {
        suggestPairsBtn.addEventListener('click', generateAndShowPairs);
    }
    
    // Frequência
    const attendanceClassSelect = document.getElementById('attendance-class-select');
    const attendanceDate = document.getElementById('attendance-date');
    const loadAttendanceBtn = document.getElementById('load-attendance-btn');
    
    if (attendanceClassSelect) {
        attendanceClassSelect.addEventListener('change', loadAttendanceTable);
    }
    
    if (attendanceDate) {
        attendanceDate.addEventListener('change', loadAttendanceTable);
    }
    
    if (loadAttendanceBtn) {
        loadAttendanceBtn.addEventListener('click', loadAttendanceTable);
    }
    
    // Relatórios
    const reportClassSelect = document.getElementById('report-class-select');
    const reportMonth = document.getElementById('report-month');
    const reportType = document.getElementById('report-type');
    const refreshReportsBtn = document.getElementById('refresh-reports-btn');
    
    if (reportClassSelect) {
        reportClassSelect.addEventListener('change', loadReports);
    }
    
    if (reportMonth) {
        reportMonth.addEventListener('change', loadReports);
    }
    
    if (reportType) {
        reportType.addEventListener('change', loadReports);
    }
    
    if (refreshReportsBtn) {
        refreshReportsBtn.addEventListener('click', loadReports);
    }
    
    // Fechar modais com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => {
                bootstrap.Modal.getInstance(modal).hide();
            });
        }
    });
}

/**
 * Configura navegação
 */
function setupNavigation() {
    // Define a seção inicial
    navigateTo('dashboard');
    
    // Atualiza título da seção
    updateSectionTitle();
}

/**
 * Navega para uma seção específica
 */
function navigateTo(section) {
    // Remove classe active de todos os links
    document.querySelectorAll('#main-menu .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Adiciona classe active ao link clicado
    const activeLink = document.querySelector(`[data-section="${section}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Esconde todas as seções
    document.querySelectorAll('.content-section').forEach(sectionEl => {
        sectionEl.classList.add('d-none');
    });
    
    // Mostra a seção selecionada
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.remove('d-none');
        AppState.currentSection = section;
        
        // Atualiza título da seção
        updateSectionTitle();
        
        // Atualiza conteúdo específico da seção
        updateSectionContent();
    }
    
    // Fecha sidebar em mobile
    if (window.innerWidth < 768) {
        toggleSidebar(false);
    }
}

/**
 * Atualiza título da seção atual
 */
function updateSectionTitle() {
    const titles = {
        dashboard: { title: 'Dashboard', subtitle: 'Visão geral do sistema' },
        classes: { title: 'Turmas', subtitle: 'Gerenciamento de turmas' },
        students: { title: 'Alunos', subtitle: 'Gerenciamento de alunos' },
        planning: { title: 'Planejamento', subtitle: 'Ordem de atendimento e peer work' },
        attendance: { title: 'Frequência', subtitle: 'Registro e histórico de presenças' },
        reports: { title: 'Relatórios', subtitle: 'Análises e estatísticas' },
        settings: { title: 'Configurações', subtitle: 'Configurações do sistema' }
    };
    
    const section = titles[AppState.currentSection] || titles.dashboard;
    
    document.getElementById('current-section-title').textContent = section.title;
    document.getElementById('current-section-subtitle').textContent = section.subtitle;
}

/**
 * Atualiza conteúdo da seção atual
 */
function updateSectionContent() {
    switch (AppState.currentSection) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'classes':
            updateClassesSection();
            break;
        case 'students':
            updateStudentsSection();
            break;
        case 'planning':
            updatePlanningSection();
            break;
        case 'attendance':
            updateAttendanceSection();
            break;
        case 'reports':
            updateReportsSection();
            break;
        case 'settings':
            updateSettingsSection();
            break;
    }
}

/**
 * Atualiza toda a interface
 */
function updateUI() {
    updateDashboard();
    updateClassesSection();
    updateStudentsSection();
    updatePlanningSection();
    updateAttendanceSection();
    updateReportsSection();
    updateSettingsSection();
}

/**
 * Atualiza dashboard
 */
function updateDashboard() {
    if (AppState.currentSection !== 'dashboard') return;
    
    const stats = {
        classes: AppState.data.classes.length,
        students: AppState.data.students.length,
        todayClasses: 0,
        attendance: 0
    };
    
    // Calcula aulas de hoje
    const today = new Date();
    const todayName = Object.keys(WEEK_DAYS)[today.getDay() - 1]; // Ajuste para array brasileiro
    stats.todayClasses = AppState.data.classes.filter(c => 
        c.days.includes(todayName)
    ).length;
    
    // Calcula frequência média
    let totalAttendance = 0;
    let classCount = 0;
    
    AppState.data.classes.forEach(cls => {
        const classStats = getClassStats(cls.id);
        totalAttendance += classStats.attendanceRate;
        classCount++;
    });
    
    stats.attendance = classCount > 0 ? Math.round(totalAttendance / classCount) : 0;
    
    // Atualiza estatísticas
    document.getElementById('stats-classes').textContent = stats.classes;
    document.getElementById('stats-students').textContent = stats.students;
    document.getElementById('stats-today-classes').textContent = stats.todayClasses;
    document.getElementById('stats-attendance').textContent = `${stats.attendance}%`;
    
    // Atualiza progresso das turmas
    updateClassesProgress();
    
    // Atualiza próximas aulas
    updateUpcomingClasses();
}

/**
 * Atualiza seção de turmas
 */
function updateClassesSection() {
    if (AppState.currentSection !== 'classes') return;
    
    // Atualiza lista de turmas
    renderClassesList();
    
    // Atualiza filtros
    updateClassFilters();
    
    // Configura data atual no filtro de data se existir
    const today = new Date().toISOString().split('T')[0];
    const dateFilter = document.getElementById('class-date-filter');
    if (dateFilter) {
        dateFilter.value = today;
    }
}

/**
 * Atualiza seção de alunos
 */
function updateStudentsSection() {
    if (AppState.currentSection !== 'students') return;
    
    // Atualiza tabela de alunos
    renderStudentsTable();
    
    // Atualiza filtros
    updateStudentFilters();
}

/**
 * Atualiza seção de planejamento
 */
function updatePlanningSection() {
    if (AppState.currentSection !== 'planning') return;
    
    // Atualiza seletor de turmas
    updatePlanningClassSelect();
    
    // Define data atual se vazia
    const planningDate = document.getElementById('planning-date');
    if (planningDate && !planningDate.value) {
        planningDate.value = new Date().toISOString().split('T')[0];
    }
    
    // Carrega dados se uma turma estiver selecionada
    const classSelect = document.getElementById('planning-class-select');
    if (classSelect && classSelect.value) {
        loadPlanningSection();
    }
}

/**
 * Atualiza seção de frequência
 */
function updateAttendanceSection() {
    if (AppState.currentSection !== 'attendance') return;
    
    // Atualiza seletor de turmas
    updateAttendanceClassSelect();
    
    // Define data atual se vazia
    const attendanceDate = document.getElementById('attendance-date');
    if (attendanceDate && !attendanceDate.value) {
        attendanceDate.value = new Date().toISOString().split('T')[0];
    }
    
    // Carrega dados se uma turma estiver selecionada
    const classSelect = document.getElementById('attendance-class-select');
    if (classSelect && classSelect.value) {
        loadAttendanceTable();
    }
}

/**
 * Atualiza seção de relatórios
 */
function updateReportsSection() {
    if (AppState.currentSection !== 'reports') return;
    
    // Atualiza seletor de turmas
    updateReportClassSelect();
    
    // Define mês atual se vazia
    const reportMonth = document.getElementById('report-month');
    if (reportMonth && !reportMonth.value) {
        const now = new Date();
        reportMonth.value = now.toISOString().slice(0, 7);
    }
    
    // Carrega relatórios
    loadReports();
}

/**
 * Atualiza seção de configurações
 */
function updateSettingsSection() {
    if (AppState.currentSection !== 'settings') return;
    
    // Carrega configurações na interface
    loadSettingsToUI();
}

/**
 * Renderiza lista de turmas
 */
function renderClassesList() {
    const container = document.getElementById('classes-list');
    const classes = getClasses();
    
    if (classes.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="bi bi-people-fill" style="font-size: 3rem;"></i>
                    <h5>Nenhuma turma cadastrada</h5>
                    <p>Comece criando sua primeira turma!</p>
                    <button class="btn btn-primary mt-3" id="add-first-class-btn">
                        <i class="bi bi-plus-circle"></i> Criar Primeira Turma
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('add-first-class-btn')?.addEventListener('click', showClassModal);
        return;
    }
    
    container.innerHTML = classes.map(cls => {
        const students = getStudentsByClass(cls.id);
        const stats = getClassStats(cls.id);
        
        // Formata os dias da semana
        const daysDisplay = cls.days.map(day => 
            `<span class="day-badge">${WEEK_DAYS[day]?.substring(0, 3)}</span>`
        ).join('');
        
        return `
            <div class="col-lg-6 col-xl-6">
                <div class="card class-card" data-class-id="${cls.id}" style="min-height: 350px;">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="d-flex align-items-center">
                                <span class="class-color-badge" style="background-color: ${cls.color}"></span>
                                <h5 class="card-title mb-0">${cls.name}</h5>
                            </div>
                            <span class="badge bg-primary">${students.length} aluno${students.length !== 1 ? 's' : ''}</span>
                        </div>
                        
                        <div class="mb-3">
                            <p class="text-muted mb-2">
                                <i class="bi bi-calendar-week"></i>
                                ${cls.days.map(day => WEEK_DAYS[day]).join(', ')} às ${cls.time}
                            </p>
                            <div class="days-display">
                                ${daysDisplay}
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <small class="text-muted d-block mb-2">Progresso da turma</small>
                            <div class="progress">
                                <div class="progress-bar" 
                                     style="width: ${stats.attendanceRate}%"
                                     title="Frequência: ${stats.attendanceRate.toFixed(0)}%">
                                </div>
                            </div>
                        </div>
                        
                        <div class="stats-display">
                            <div class="stat-item">
                                <span class="stat-value">${stats.averageFale.toFixed(1)}</span>
                                <span class="stat-label">Média F.A.L.E</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${Math.round(stats.attendanceRate)}%</span>
                                <span class="stat-label">Frequência</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${students.length}</span>
                                <span class="stat-label">Alunos</span>
                            </div>
                        </div>
                        
                        <div class="mt-3 d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary view-class-btn" data-id="${cls.id}">
                                <i class="bi bi-eye"></i> Detalhes
                            </button>
                            <button class="btn btn-sm btn-outline-warning edit-class-btn" data-id="${cls.id}">
                                <i class="bi bi-pencil"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-class-btn" data-id="${cls.id}">
                                <i class="bi bi-trash"></i> Excluir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Adiciona event listeners aos botões
    addClassCardEventListeners();
}

/**
 * Adiciona event listeners aos botões dos cards de turma
 */
function addClassCardEventListeners() {
    const container = document.getElementById('classes-list');
    
    container.querySelectorAll('.view-class-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const classId = parseInt(e.target.closest('button').getAttribute('data-id'));
            showClassDetails(classId);
        });
    });
    
    container.querySelectorAll('.edit-class-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const classId = parseInt(e.target.closest('button').getAttribute('data-id'));
            showClassModal(classId);
        });
    });
    
    container.querySelectorAll('.delete-class-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const classId = parseInt(e.target.closest('button').getAttribute('data-id'));
            deleteClassWithConfirmation(classId);
        });
    });
}

/**
 * Renderiza tabela de alunos
 */
function renderStudentsTable() {
    const tbody = document.getElementById('students-table-body');
    const students = getStudents();
    
    if (students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="empty-state py-4">
                        <i class="bi bi-person-vcard"></i>
                        <h5>Nenhum aluno cadastrado</h5>
                        <p>Comece adicionando seu primeiro aluno!</p>
                        <button class="btn btn-primary" id="add-first-student-btn">
                            <i class="bi bi-plus-circle"></i> Adicionar Primeiro Aluno
                        </button>
                    </div>
                </td>
            </tr>
        `;
        
        document.getElementById('add-first-student-btn')?.addEventListener('click', showStudentModal);
        return;
    }
    
    tbody.innerHTML = students.map(student => {
        const cls = getClassById(student.classId);
        const fale = student.fale || {};
        
        const faleBadges = ['F', 'A', 'L', 'E'].map(letter => {
            const value = fale[letter];
            return value ? `<span class="fale-badge ${FALE_CLASSES[value]}" title="${letter}: ${value}">${letter}</span>` : '';
        }).join(' ');
        
        return `
            <tr>
                <td>
                    <strong>${student.name}</strong>
                    ${student.homework === 'sim' ? '<span class="badge bg-success ms-2" title="Dever feito">✓</span>' : ''}
                    ${student.preparation === 'sim' ? '<span class="badge bg-info ms-1" title="Preparação feita">📚</span>' : ''}
                </td>
                <td>${cls ? cls.name : 'Sem turma'}</td>
                <td><span class="lesson-badge ${getLessonType(student.lastLessonValue)}">${student.lastLesson}</span></td>
                <td><span class="lesson-badge ${getLessonType(student.nextLessonValue)}">${student.nextLesson}</span></td>
                <td>${faleBadges}</td>
                <td>
                    <span class="badge ${student.average >= 3.5 ? 'bg-success' : student.average >= 2.5 ? 'bg-warning' : 'bg-secondary'}">
                        ${student.average ? student.average.toFixed(1) : '0.0'}
                    </span>
                </td>
                <td>
                    <div class="student-actions">
                        <button class="btn btn-sm btn-outline-primary edit-student-btn" data-id="${student.id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-student-btn" data-id="${student.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Adiciona event listeners aos botões
    tbody.querySelectorAll('.edit-student-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const studentId = parseInt(e.target.closest('button').getAttribute('data-id'));
            showStudentModal(studentId);
        });
    });
    
    tbody.querySelectorAll('.delete-student-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const studentId = parseInt(e.target.closest('button').getAttribute('data-id'));
            deleteStudentWithConfirmation(studentId);
        });
    });
}

/* ============================================
   FUNÇÕES DE FILTRO COMPLETAS
   ============================================ */

/**
 * Atualiza filtros de turmas
 */
function updateClassFilters() {
    const dayFilter = document.getElementById('class-day-filter');
    if (dayFilter) {
        // Já está preenchido no HTML
        dayFilter.innerHTML = `
            <option value="">Filtrar por dia</option>
            <option value="segunda">Segunda-feira</option>
            <option value="terca">Terça-feira</option>
            <option value="quarta">Quarta-feira</option>
            <option value="quinta">Quinta-feira</option>
            <option value="sexta">Sexta-feira</option>
            <option value="sabado">Sábado</option>
        `;
    }
}

/**
 * Atualiza filtros de alunos
 */
function updateStudentFilters() {
    const classFilter = document.getElementById('student-class-filter');
    const faleFilter = document.getElementById('student-fale-filter');
    
    if (classFilter) {
        // Limpa opções existentes (exceto a primeira)
        while (classFilter.options.length > 1) {
            classFilter.remove(1);
        }
        
        // Adiciona todas as turmas
        getClasses().forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = cls.name;
            classFilter.appendChild(option);
        });
    }
    
    if (faleFilter) {
        // Já está preenchido no HTML
        faleFilter.innerHTML = `
            <option value="">Filtrar por F.A.L.E</option>
            <option value="O">Ótimo</option>
            <option value="MB">Muito Bom</option>
            <option value="B">Bom</option>
            <option value="R">Regular</option>
        `;
    }
}

/**
 * Filtra lista de turmas
 */
function filterClasses() {
    const searchTerm = document.getElementById('class-search').value.toLowerCase();
    const dayFilter = document.getElementById('class-day-filter').value;
    
    const container = document.getElementById('classes-list');
    const classes = getClasses();
    
    if (classes.length === 0) return;
    
    // Filtra as turmas
    const filteredClasses = classes.filter(cls => {
        const matchesSearch = cls.name.toLowerCase().includes(searchTerm);
        const matchesDay = !dayFilter || cls.days.includes(dayFilter);
        return matchesSearch && matchesDay;
    });
    
    // Se não houver turmas após o filtro, mostra mensagem
    if (filteredClasses.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="bi bi-search"></i>
                    <h5>Nenhuma turma encontrada</h5>
                    <p>Tente outros termos de busca ou remova os filtros.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Gera o HTML para as turmas filtradas
    container.innerHTML = filteredClasses.map(cls => {
        const students = getStudentsByClass(cls.id);
        const stats = getClassStats(cls.id);
        
        const daysDisplay = cls.days.map(day => 
            `<span class="day-badge">${WEEK_DAYS[day]?.substring(0, 3)}</span>`
        ).join('');
        
        return `
            <div class="col-lg-6 col-xl-6">
                <div class="card class-card" data-class-id="${cls.id}" style="min-height: 350px;">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="d-flex align-items-center">
                                <span class="class-color-badge" style="background-color: ${cls.color}"></span>
                                <h5 class="card-title mb-0">${cls.name}</h5>
                            </div>
                            <span class="badge bg-primary">${students.length} aluno${students.length !== 1 ? 's' : ''}</span>
                        </div>
                        
                        <div class="mb-3">
                            <p class="text-muted mb-2">
                                <i class="bi bi-calendar-week"></i>
                                ${cls.days.map(day => WEEK_DAYS[day]).join(', ')} às ${cls.time}
                            </p>
                            <div class="days-display">
                                ${daysDisplay}
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <small class="text-muted d-block mb-2">Progresso da turma</small>
                            <div class="progress">
                                <div class="progress-bar" 
                                     style="width: ${stats.attendanceRate}%"
                                     title="Frequência: ${stats.attendanceRate.toFixed(0)}%">
                                </div>
                            </div>
                        </div>
                        
                        <div class="stats-display">
                            <div class="stat-item">
                                <span class="stat-value">${stats.averageFale.toFixed(1)}</span>
                                <span class="stat-label">Média F.A.L.E</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${Math.round(stats.attendanceRate)}%</span>
                                <span class="stat-label">Frequência</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${students.length}</span>
                                <span class="stat-label">Alunos</span>
                            </div>
                        </div>
                        
                        <div class="mt-3 d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary view-class-btn" data-id="${cls.id}">
                                <i class="bi bi-eye"></i> Detalhes
                            </button>
                            <button class="btn btn-sm btn-outline-warning edit-class-btn" data-id="${cls.id}">
                                <i class="bi bi-pencil"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-class-btn" data-id="${cls.id}">
                                <i class="bi bi-trash"></i> Excluir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Reatribui os event listeners
    addClassCardEventListeners();
}

/**
 * Filtra tabela de alunos
 */
function filterStudents() {
    const searchTerm = document.getElementById('student-search').value.toLowerCase();
    const classFilter = document.getElementById('student-class-filter').value;
    const faleFilter = document.getElementById('student-fale-filter').value;
    
    const tbody = document.getElementById('students-table-body');
    const students = getStudents();
    
    // Filtra os alunos
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm);
        const matchesClass = !classFilter || student.classId.toString() === classFilter;
        
        // Filtro por F.A.L.E
        let matchesFale = true;
        if (faleFilter && student.fale) {
            // Verifica se algum dos valores F.A.L.E corresponde ao filtro
            const faleValues = Object.values(student.fale);
            matchesFale = faleValues.includes(faleFilter);
        }
        
        return matchesSearch && matchesClass && matchesFale;
    });
    
    // Se não houver alunos, mostra mensagem
    if (filteredStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="empty-state py-4">
                        <i class="bi bi-search"></i>
                        <h5>Nenhum aluno encontrado</h5>
                        <p>Tente outros termos de busca ou remova os filtros.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Gera as linhas da tabela
    tbody.innerHTML = filteredStudents.map(student => {
        const cls = getClassById(student.classId);
        const fale = student.fale || {};
        
        const faleBadges = ['F', 'A', 'L', 'E'].map(letter => {
            const value = fale[letter];
            return value ? `<span class="fale-badge ${FALE_CLASSES[value]}" title="${letter}: ${value}">${letter}</span>` : '';
        }).join(' ');
        
        return `
            <tr>
                <td>
                    <strong>${student.name}</strong>
                    ${student.homework === 'sim' ? '<span class="badge bg-success ms-2" title="Dever feito">✓</span>' : ''}
                    ${student.preparation === 'sim' ? '<span class="badge bg-info ms-1" title="Preparação feita">📚</span>' : ''}
                </td>
                <td>${cls ? cls.name : 'Sem turma'}</td>
                <td><span class="lesson-badge ${getLessonType(student.lastLessonValue)}">${student.lastLesson}</span></td>
                <td><span class="lesson-badge ${getLessonType(student.nextLessonValue)}">${student.nextLesson}</span></td>
                <td>${faleBadges}</td>
                <td>
                    <span class="badge ${student.average >= 3.5 ? 'bg-success' : student.average >= 2.5 ? 'bg-warning' : 'bg-secondary'}">
                        ${student.average ? student.average.toFixed(1) : '0.0'}
                    </span>
                </td>
                <td>
                    <div class="student-actions">
                        <button class="btn btn-sm btn-outline-primary edit-student-btn" data-id="${student.id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-student-btn" data-id="${student.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Reatribui os event listeners
    tbody.querySelectorAll('.edit-student-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const studentId = parseInt(e.target.closest('button').getAttribute('data-id'));
            showStudentModal(studentId);
        });
    });
    
    tbody.querySelectorAll('.delete-student-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const studentId = parseInt(e.target.closest('button').getAttribute('data-id'));
            deleteStudentWithConfirmation(studentId);
        });
    });
}

/**
 * Preenche seletor de turmas
 */
function populateClassSelect(selectId, includeAllOption = true) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Salva valor atual
    const currentValue = select.value;
    
    // Limpa opções
    select.innerHTML = '';
    
    // Adiciona opção "todas as turmas" se solicitado
    if (includeAllOption) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Todas as turmas';
        select.appendChild(option);
    } else {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Selecione uma turma';
        select.appendChild(option);
    }
    
    // Adiciona turmas
    getClasses().forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = cls.name;
        select.appendChild(option);
    });
    
    // Restaura valor anterior se ainda existir
    if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
        select.value = currentValue;
    }
}

/**
 * Atualiza seletor de turmas no planejamento
 */
function updatePlanningClassSelect() {
    populateClassSelect('planning-class-select', false);
}

/**
 * Atualiza seletor de turmas na frequência
 */
function updateAttendanceClassSelect() {
    populateClassSelect('attendance-class-select', false);
}

/**
 * Atualiza seletor de turmas nos relatórios
 */
function updateReportClassSelect() {
    populateClassSelect('report-class-select', true);
}

/**
 * Carrega seção de planejamento
 */
function loadPlanningSection() {
    const classId = document.getElementById('planning-class-select').value;
    const date = document.getElementById('planning-date').value || new Date().toISOString().split('T')[0];
    
    if (!classId) {
        document.getElementById('attendance-order-list').innerHTML = 
            '<p class="text-muted">Selecione uma turma para gerar a ordem de atendimento.</p>';
        document.getElementById('peer-suggestions').innerHTML = 
            '<p class="text-muted">Selecione uma turma para gerar sugestões de pares.</p>';
        return;
    }
    
    const students = getStudentsByClass(parseInt(classId));
    
    if (students.length === 0) {
        document.getElementById('attendance-order-list').innerHTML = 
            '<p class="text-muted">Não há alunos nesta turma.</p>';
        document.getElementById('peer-suggestions').innerHTML = 
            '<p class="text-muted">Não há alunos para sugerir pares.</p>';
        return;
    }
    
    // Gera ordem de atendimento
    const order = generateAttendanceOrder(parseInt(classId));
    renderAttendanceOrder(order);
    
    // Gera sugestões de pares
    const pairs = suggestPeerPairs(parseInt(classId));
    renderPeerSuggestions(pairs);
}

/**
 * Renderiza ordem de atendimento
 */
function renderAttendanceOrder(order) {
    const container = document.getElementById('attendance-order-list');
    
    if (order.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum aluno na turma.</p>';
        return;
    }
    
    const html = order.map(item => `
        <div class="d-flex align-items-center mb-3 p-3 border rounded bg-light">
            <div class="me-3">
                <span class="badge bg-primary fs-6">${item.order}</span>
            </div>
            <div class="flex-grow-1">
                <h6 class="mb-1">${item.studentName}</h6>
                <div class="d-flex align-items-center gap-2">
                    <span class="lesson-badge ${item.lessonType}">${item.nextLesson}</span>
                    <small class="text-muted">Média: ${item.faleAverage.toFixed(1)}</small>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

/**
 * Renderiza sugestões de pares
 */
function renderPeerSuggestions(pairs) {
    const container = document.getElementById('peer-suggestions');
    
    if (pairs.length === 0) {
        container.innerHTML = '<p class="text-muted">Não há sugestões de pares disponíveis.</p>';
        return;
    }
    
    const html = pairs.map((pair, index) => `
        <div class="pair-suggestion mb-3 p-3 border rounded bg-light">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-success">Par ${index + 1}</span>
                <small class="text-muted">Diferença: ${pair.difference} lições</small>
            </div>
            
            <div class="row">
                <div class="col-5">
                    <div class="d-flex align-items-center">
                        <div class="me-2">
                            <i class="bi bi-person-circle fs-4"></i>
                        </div>
                        <div>
                            <strong>${pair.student1.name}</strong>
                            <div class="lesson-badge ${getLessonType(pair.student1.nextLessonValue)}">
                                ${pair.student1.nextLesson}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-2 text-center">
                    <i class="bi bi-arrow-left-right fs-4 text-muted"></i>
                </div>
                
                <div class="col-5">
                    <div class="d-flex align-items-center">
                        <div class="me-2">
                            <i class="bi bi-person-circle fs-4"></i>
                        </div>
                        <div>
                            <strong>${pair.student2.name}</strong>
                            <div class="lesson-badge ${getLessonType(pair.student2.nextLessonValue)}">
                                ${pair.student2.nextLesson}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-3 text-center">
                <button class="btn btn-sm btn-outline-success confirm-pair-btn" 
                        data-pair-index="${index}">
                    <i class="bi bi-check-circle"></i> Confirmar Par
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
    
    // Adiciona event listeners aos botões de confirmar
    container.querySelectorAll('.confirm-pair-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pairIndex = parseInt(e.target.closest('button').getAttribute('data-pair-index'));
            confirmPeerPair(pairs[pairIndex]);
        });
    });
}

/**
 * Gera e mostra ordem de atendimento
 */
function generateAndShowOrder() {
    const classId = document.getElementById('planning-class-select').value;
    if (classId) {
        loadPlanningSection();
        showNotification('Ordem de atendimento gerada!', 'success');
    } else {
        showNotification('Selecione uma turma primeiro!', 'warning');
    }
}

/**
 * Gera e mostra sugestões de pares
 */
function generateAndShowPairs() {
    const classId = document.getElementById('planning-class-select').value;
    if (classId) {
        loadPlanningSection();
        showNotification('Sugestões de pares geradas!', 'success');
    } else {
        showNotification('Selecione uma turma primeiro!', 'warning');
    }
}

/**
 * Carrega tabela de frequência
 */
function loadAttendanceTable() {
    const classId = document.getElementById('attendance-class-select').value;
    const date = document.getElementById('attendance-date').value || 
                 new Date().toISOString().split('T')[0];
    
    if (!classId) {
        document.getElementById('attendance-table-container').innerHTML = 
            '<p class="text-muted">Selecione uma turma para ver a frequência.</p>';
        return;
    }
    
    const students = getStudentsByClass(parseInt(classId));
    
    if (students.length === 0) {
        document.getElementById('attendance-table-container').innerHTML = 
            '<p class="text-muted">Não há alunos nesta turma.</p>';
        return;
    }
    
    // Obtém presenças
    const attendance = getAttendanceByClassAndDate(parseInt(classId), date);
    
    // Renderiza tabela
    renderAttendanceTable(attendance);
}

/**
 * Renderiza tabela de frequência
 */
function renderAttendanceTable(attendance) {
    const container = document.getElementById('attendance-table-container');
    
    const html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Aluno</th>
                        <th>Status</th>
                        <th>Dever de Casa</th>
                        <th>Preparação</th>
                        <th>Avaliação</th>
                        <th>Observação</th>
                    </tr>
                </thead>
                <tbody>
                    ${attendance.map(item => `
                        <tr>
                            <td>${item.studentName}</td>
                            <td>
                                <select class="form-select form-select-sm attendance-status" 
                                        data-student-id="${item.studentId}">
                                    <option value="present" ${item.status === 'present' ? 'selected' : ''}>
                                        Presente
                                    </option>
                                    <option value="absent" ${item.status === 'absent' ? 'selected' : ''}>
                                        Ausente
                                    </option>
                                    <option value="justified" ${item.status === 'justified' ? 'selected' : ''}>
                                        Justificado
                                    </option>
                                </select>
                            </td>
                            <td>
                                <select class="form-select form-select-sm homework-status" 
                                        data-student-id="${item.studentId}">
                                    <option value="sim" ${item.homework === 'sim' ? 'selected' : ''}>
                                        Feito
                                    </option>
                                    <option value="nao" ${item.homework === 'nao' ? 'selected' : ''}>
                                        Não Feito
                                    </option>
                                    <option value="parcial" ${item.homework === 'parcial' ? 'selected' : ''}>
                                        Parcial
                                    </option>
                                </select>
                            </td>
                            <td>
                                <select class="form-select form-select-sm preparation-status" 
                                        data-student-id="${item.studentId}">
                                    <option value="sim" ${item.preparation === 'sim' ? 'selected' : ''}>
                                        Feita
                                    </option>
                                    <option value="nao" ${item.preparation === 'nao' ? 'selected' : ''}>
                                        Não Feita
                                    </option>
                                </select>
                            </td>
                            <td>
                                <textarea class="form-control form-control-sm evaluation-text" 
                                          data-student-id="${item.studentId}"
                                          rows="1">${item.evaluation || ''}</textarea>
                            </td>
                            <td>
                                <textarea class="form-control form-control-sm observation-text" 
                                          data-student-id="${item.studentId}"
                                          rows="1">${item.observation || ''}</textarea>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="mt-3">
            <button class="btn btn-primary" id="save-attendance-table-btn">
                <i class="bi bi-save"></i> Salvar Alterações
            </button>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Adiciona event listener ao botão de salvar
    document.getElementById('save-attendance-table-btn')?.addEventListener('click', saveAttendanceTable);
}

/**
 * Carrega conteúdo do modal de frequência
 */
function loadAttendanceModalContent() {
    const classId = document.getElementById('modalClassSelect').value;
    const date = document.getElementById('modalDate').value;
    
    if (!classId) {
        document.getElementById('attendanceModalContent').innerHTML = 
            '<p class="text-muted">Selecione uma turma.</p>';
        return;
    }
    
    const attendance = getAttendanceByClassAndDate(parseInt(classId), date);
    const cls = getClassById(parseInt(classId));
    
    let html = `
        <h6>Registrar Frequência</h6>
        <p class="text-muted">Turma: ${cls.name} - Data: ${date}</p>
        <div class="table-responsive">
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Aluno</th>
                        <th>Status</th>
                        <th>Dever</th>
                        <th>Preparação</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    attendance.forEach(item => {
        html += `
            <tr>
                <td>${item.studentName}</td>
                <td>
                    <select class="form-select form-select-sm modal-attendance-status" data-student-id="${item.studentId}">
                        <option value="present" ${item.status === 'present' ? 'selected' : ''}>Presente</option>
                        <option value="absent" ${item.status === 'absent' ? 'selected' : ''}>Ausente</option>
                        <option value="justified" ${item.status === 'justified' ? 'selected' : ''}>Justificado</option>
                    </select>
                </td>
                <td>
                    <select class="form-select form-select-sm modal-homework-status" data-student-id="${item.studentId}">
                        <option value="sim" ${item.homework === 'sim' ? 'selected' : ''}>Feito</option>
                        <option value="nao" ${item.homework === 'nao' ? 'selected' : ''}>Não Feito</option>
                        <option value="parcial" ${item.homework === 'parcial' ? 'selected' : ''}>Parcial</option>
                    </select>
                </td>
                <td>
                    <select class="form-select form-select-sm modal-preparation-status" data-student-id="${item.studentId}">
                        <option value="sim" ${item.preparation === 'sim' ? 'selected' : ''}>Feita</option>
                        <option value="nao" ${item.preparation === 'nao' ? 'selected' : ''}>Não Feita</option>
                    </select>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('attendanceModalContent').innerHTML = html;
}

/**
 * Salva tabela de frequência
 */
function saveAttendanceTable() {
    const classId = document.getElementById('attendance-class-select').value;
    const date = document.getElementById('attendance-date').value;
    
    if (!classId || !date) {
        showNotification('Selecione uma turma e data!', 'warning');
        return;
    }
    
    const attendanceData = [];
    const rows = document.querySelectorAll('#attendance-table-container tbody tr');
    
    rows.forEach(row => {
        const studentId = parseInt(row.querySelector('.attendance-status').getAttribute('data-student-id'));
        const status = row.querySelector('.attendance-status').value;
        const homework = row.querySelector('.homework-status').value;
        const preparation = row.querySelector('.preparation-status').value;
        const evaluation = row.querySelector('.evaluation-text').value.trim();
        const observation = row.querySelector('.observation-text').value.trim();
        
        attendanceData.push({
            studentId,
            status,
            homework,
            preparation,
            evaluation,
            observation
        });
    });
    
    registerAttendance(parseInt(classId), date, attendanceData);
    showNotification('Frequência salva com sucesso!', 'success');
}

/**
 * Salva frequência do modal
 */
function saveAttendance() {
    const classId = document.getElementById('modalClassSelect').value;
    const date = document.getElementById('modalDate').value;
    
    if (!classId || !date) {
        showNotification('Selecione uma turma e data!', 'warning');
        return;
    }
    
    const attendanceData = [];
    const rows = document.querySelectorAll('#attendanceModalContent tbody tr');
    
    rows.forEach(row => {
        const studentId = parseInt(row.querySelector('.modal-attendance-status').getAttribute('data-student-id'));
        const status = row.querySelector('.modal-attendance-status').value;
        const homework = row.querySelector('.modal-homework-status').value;
        const preparation = row.querySelector('.modal-preparation-status').value;
        
        attendanceData.push({
            studentId,
            status,
            homework,
            preparation,
            evaluation: '',
            observation: ''
        });
    });
    
    registerAttendance(parseInt(classId), date, attendanceData);
    bootstrap.Modal.getInstance(document.getElementById('attendanceModal')).hide();
    showNotification('Frequência salva com sucesso!', 'success');
    updateUI();
}

/**
 * Confirma par de peer work
 */
function confirmPeerPair(pair) {
    const date = document.getElementById('planning-date').value;
    const classId = document.getElementById('planning-class-select').value;
    
    if (!date || !classId) {
        showNotification('Selecione uma data e turma!', 'warning');
        return;
    }
    
    const pairData = [{
        student1Id: pair.student1.id,
        student1Name: pair.student1.name,
        student2Id: pair.student2.id,
        student2Name: pair.student2.name,
        lesson: `${pair.student1.nextLesson} ↔ ${pair.student2.nextLesson}`
    }];
    
    registerPeerWork(parseInt(classId), date, pairData);
    showNotification('Par confirmado e salvo no histórico!', 'success');
}

/**
 * Exclui turma com confirmação
 */
function deleteClassWithConfirmation(classId) {
    const cls = getClassById(classId);
    if (!cls) return;
    
    if (confirm(`Tem certeza que deseja excluir a turma "${cls.name}"?\n\nEsta ação também excluirá todos os alunos desta turma e não pode ser desfeita.`)) {
        deleteClass(classId);
        showNotification(`Turma "${cls.name}" excluída com sucesso!`, 'success');
        updateUI();
    }
}

/**
 * Exclui aluno com confirmação
 */
function deleteStudentWithConfirmation(studentId) {
    const student = getStudentById(studentId);
    if (!student) return;
    
    if (confirm(`Tem certeza que deseja excluir o aluno "${student.name}"?\n\nEsta ação não pode ser desfeita.`)) {
        deleteStudent(studentId);
        showNotification(`Aluno "${student.name}" excluído com sucesso!`, 'success');
        updateUI();
    }
}

/**
 * Atualiza progresso das turmas no dashboard
 */
function updateClassesProgress() {
    const container = document.getElementById('classes-progress');
    const classes = getClasses();
    
    if (classes.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhuma turma cadastrada.</p>';
        return;
    }
    
    const html = classes.map(cls => {
        const stats = getClassStats(cls.id);
        return `
            <div class="mb-3">
                <div class="d-flex justify-content-between">
                    <span>${cls.name}</span>
                    <span>${stats.averageFale.toFixed(1)}</span>
                </div>
                <div class="progress" style="height: 10px;">
                    <div class="progress-bar" style="width: ${stats.averageFale * 25}%"></div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

/**
 * Atualiza próximas aulas no dashboard
 */
function updateUpcomingClasses() {
    const container = document.getElementById('upcoming-classes');
    const today = new Date();
    const dayName = Object.keys(WEEK_DAYS)[today.getDay() - 1]; // Ajuste para array brasileiro
    
    const todayClasses = getClasses().filter(cls => cls.days.includes(dayName));
    
    if (todayClasses.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhuma aula agendada para hoje.</p>';
        return;
    }
    
    const html = todayClasses.map(cls => `
        <div class="d-flex align-items-center mb-2">
            <span class="class-color-badge me-2" style="background-color: ${cls.color}"></span>
            <div>
                <strong>${cls.name}</strong>
                <div class="text-muted">${cls.time}</div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

/**
 * Carrega configurações na interface
 */
function loadSettingsToUI() {
    // Tema
    document.getElementById('theme-select').value = AppState.settings.theme;
    document.getElementById('darkModeSwitch').checked = AppState.settings.theme === 'dark';
    
    // Auto-save
    document.getElementById('auto-save').checked = AppState.settings.autoSave;
    
    // Notificações
    document.getElementById('notifications').checked = AppState.settings.notifications;
    
    // GitHub
    document.getElementById('github-username').value = AppState.githubConfig.username || '';
    document.getElementById('github-repo').value = AppState.githubConfig.repo || '';
    document.getElementById('github-token').value = AppState.githubConfig.token || '';
}

/**
 * Salva configurações da interface
 */
function saveSettingsFromUI() {
    // Tema
    AppState.settings.theme = document.getElementById('theme-select').value;
    AppState.settings.autoSave = document.getElementById('auto-save').checked;
    AppState.settings.notifications = document.getElementById('notifications').checked;
    
    // GitHub
    AppState.githubConfig.username = document.getElementById('github-username').value.trim();
    AppState.githubConfig.repo = document.getElementById('github-repo').value.trim();
    AppState.githubConfig.token = document.getElementById('github-token').value.trim();
    
    saveSettings();
    saveGitHubConfig();
    initTheme(); // Aplica o tema
    
    showNotification('Configurações salvas com sucesso!', 'success');
}

/**
 * Carrega relatórios
 */
function loadReports() {
    const classId = document.getElementById('report-class-select').value || null;
    const month = document.getElementById('report-month').value;
    const reportType = document.getElementById('report-type').value;
    
    // Atualiza containers
    updateProgressReport(classId);
    updateFaleDistribution(classId);
    updateDetailedReport(classId, reportType);
}

/**
 * Atualiza relatório de progresso
 */
function updateProgressReport(classId = null) {
    const container = document.getElementById('progress-report');
    
    const report = generateProgressReport(classId);
    
    const html = `
        <div class="mb-3">
            <h6 class="text-muted">Estatísticas Gerais</h6>
            <div class="row">
                <div class="col-6">
                    <div class="text-center p-3 border rounded bg-light">
                        <div class="fs-4 fw-bold">${report.averageFale.toFixed(1)}</div>
                        <small class="text-muted">Média F.A.L.E</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-center p-3 border rounded bg-light">
                        <div class="fs-4 fw-bold">${report.attendanceRate.toFixed(0)}%</div>
                        <small class="text-muted">Frequência</small>
                    </div>
                </div>
            </div>
        </div>
        
        ${report.classes.length > 0 ? `
            <h6 class="text-muted mt-4">Progresso por Turma</h6>
            ${report.classes.map(cls => `
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-1">
                        <span>${cls.className}</span>
                        <span>${cls.averageFale.toFixed(1)}</span>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar" 
                             style="width: ${cls.averageFale * 25}%" 
                             title="Média: ${cls.averageFale.toFixed(1)}"></div>
                    </div>
                </div>
            `).join('')}
        ` : ''}
    `;
    
    container.innerHTML = html;
}

/**
 * Atualiza distribuição F.A.L.E
 */
function updateFaleDistribution(classId = null) {
    const container = document.getElementById('fale-distribution');
    
    const report = generateFaleReport(classId);
    const total = report.totalStudents;
    
    if (total === 0) {
        container.innerHTML = '<p class="text-muted">Não há dados disponíveis.</p>';
        return;
    }
    
    const distribution = report.distribution;
    
    const html = `
        <div class="mb-3">
            <div class="row text-center">
                <div class="col-3">
                    <div class="p-2">
                        <div class="fs-4 fw-bold text-success">${distribution.O || 0}</div>
                        <small class="text-muted">Ótimo</small>
                    </div>
                </div>
                <div class="col-3">
                    <div class="p-2">
                        <div class="fs-4 fw-bold text-primary">${distribution.MB || 0}</div>
                        <small class="text-muted">Muito Bom</small>
                    </div>
                </div>
                <div class="col-3">
                    <div class="p-2">
                        <div class="fs-4 fw-bold text-warning">${distribution.B || 0}</div>
                        <small class="text-muted">Bom</small>
                    </div>
                </div>
                <div class="col-3">
                    <div class="p-2">
                        <div class="fs-4 fw-bold text-danger">${distribution.R || 0}</div>
                        <small class="text-muted">Regular</small>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mt-4">
            <h6 class="text-muted mb-3">Médias por Competência</h6>
            <div class="row">
                <div class="col-3 text-center">
                    <div class="p-2 border rounded">
                        <div class="fw-bold">${report.averages.F.toFixed(1)}</div>
                        <small class="text-muted">Fluência</small>
                    </div>
                </div>
                <div class="col-3 text-center">
                    <div class="p-2 border rounded">
                        <div class="fw-bold">${report.averages.A.toFixed(1)}</div>
                        <small class="text-muted">Pronúncia</small>
                    </div>
                </div>
                <div class="col-3 text-center">
                    <div class="p-2 border rounded">
                        <div class="fw-bold">${report.averages.L.toFixed(1)}</div>
                        <small class="text-muted">Compreensão</small>
                    </div>
                </div>
                <div class="col-3 text-center">
                    <div class="p-2 border rounded">
                        <div class="fw-bold">${report.averages.E.toFixed(1)}</div>
                        <small class="text-muted">Expressão</small>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Atualiza relatório detalhado
 */
function updateDetailedReport(classId = null, reportType = 'progress') {
    const container = document.getElementById('detailed-report');
    
    let report;
    let title;
    
    switch (reportType) {
        case 'progress':
            report = generateProgressReport(classId);
            title = 'Relatório de Progresso';
            break;
        case 'attendance':
            report = generateAttendanceReport(classId);
            title = 'Relatório de Frequência';
            break;
        case 'fale':
            report = generateFaleReport(classId);
            title = 'Relatório F.A.L.E';
            break;
        default:
            report = generateProgressReport(classId);
            title = 'Relatório de Progresso';
    }
    
    let content = '';
    
    if (reportType === 'progress') {
        content = `
            <h5>${title}</h5>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Turma</th>
                            <th>Alunos</th>
                            <th>Média F.A.L.E</th>
                            <th>Frequência</th>
                            <th>Últimas Lições</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.classes.map(cls => `
                            <tr>
                                <td>${cls.className}</td>
                                <td>${cls.studentCount}</td>
                                <td>${cls.averageFale.toFixed(1)}</td>
                                <td>${cls.attendanceRate.toFixed(0)}%</td>
                                <td>
                                    <small class="text-muted">
                                        ${cls.nextLessons.slice(0, 3).join(', ')}
                                        ${cls.nextLessons.length > 3 ? '...' : ''}
                                    </small>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (reportType === 'attendance') {
        content = `
            <h5>${title}</h5>
            <p class="text-muted">Frequência geral: ${report.overallAttendance.toFixed(1)}%</p>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Aluno</th>
                            <th>Turma</th>
                            <th>Presente</th>
                            <th>Ausente</th>
                            <th>Justificado</th>
                            <th>Taxa</th>
                            <th>Última</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.students.map(student => `
                            <tr>
                                <td>${student.studentName}</td>
                                <td>${student.className}</td>
                                <td class="text-success">${student.present}</td>
                                <td class="text-danger">${student.absent}</td>
                                <td class="text-warning">${student.justified}</td>
                                <td>
                                    <span class="badge ${student.attendanceRate >= 90 ? 'bg-success' : 
                                                         student.attendanceRate >= 70 ? 'bg-warning' : 
                                                         'bg-danger'}">
                                        ${student.attendanceRate.toFixed(1)}%
                                    </span>
                                </td>
                                <td><small>${student.lastAttendance}</small></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (reportType === 'fale') {
        content = `
            <h5>${title}</h5>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Aluno</th>
                            <th>Turma</th>
                            <th>F</th>
                            <th>A</th>
                            <th>L</th>
                            <th>E</th>
                            <th>Média</th>
                            <th>Classificação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.students.map(student => `
                            <tr>
                                <td>${student.studentName}</td>
                                <td>${student.className}</td>
                                <td>
                                    <span class="fale-badge ${FALE_CLASSES[student.fale.F] || ''}">
                                        ${student.fale.F || '-'}
                                    </span>
                                </td>
                                <td>
                                    <span class="fale-badge ${FALE_CLASSES[student.fale.A] || ''}">
                                        ${student.fale.A || '-'}
                                    </span>
                                </td>
                                <td>
                                    <span class="fale-badge ${FALE_CLASSES[student.fale.L] || ''}">
                                        ${student.fale.L || '-'}
                                    </span>
                                </td>
                                <td>
                                    <span class="fale-badge ${FALE_CLASSES[student.fale.E] || ''}">
                                        ${student.fale.E || '-'}
                                    </span>
                                </td>
                                <td>${student.average.toFixed(1)}</td>
                                <td>
                                    <span class="badge ${student.classification === 'Ótimo' ? 'bg-success' : 
                                                         student.classification === 'Muito Bom' ? 'bg-primary' : 
                                                         student.classification === 'Bom' ? 'bg-warning' : 
                                                         'bg-secondary'}">
                                        ${student.classification}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    container.innerHTML = content;
}

/* ============================================
   MODAIS
   ============================================ */

/**
 * Mostra modal de turma
 */
function showClassModal(classId = null) {
    const modal = new bootstrap.Modal(document.getElementById('classModal'));
    const form = document.getElementById('classForm');
    const title = document.getElementById('classModalTitle');
    
    // Limpa formulário
    form.reset();
    document.getElementById('classColor').value = '#4361ee';
    
    // Desmarca todos os checkboxes
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(day => {
        document.getElementById(`day${day}`).checked = false;
    });
    
    if (classId) {
        // Modo edição
        title.textContent = 'Editar Turma';
        const cls = getClassById(classId);
        
        if (cls) {
            document.getElementById('classId').value = cls.id;
            document.getElementById('className').value = cls.name;
            document.getElementById('classTime').value = cls.time;
            document.getElementById('classColor').value = cls.color;
            
            // Marca os dias
            cls.days.forEach(day => {
                const dayMap = {
                    'segunda': 'Monday',
                    'terca': 'Tuesday',
                    'quarta': 'Wednesday',
                    'quinta': 'Thursday',
                    'sexta': 'Friday',
                    'sabado': 'Saturday'
                };
                const checkboxId = `day${dayMap[day]}`;
                const checkbox = document.getElementById(checkboxId);
                if (checkbox) checkbox.checked = true;
            });
        }
    } else {
        // Modo adição
        title.textContent = 'Nova Turma';
        document.getElementById('classId').value = '';
    }
    
    modal.show();
}

/**
 * Atualiza seletor de turmas no modal de aluno
 */
function updateStudentClassSelect() {
    const select = document.getElementById('studentClass');
    if (!select) return;
    
    // Salva valor atual
    const currentValue = select.value;
    
    // Limpa opções
    select.innerHTML = '<option value="">Selecione uma turma</option>';
    
    // Adiciona turmas
    getClasses().forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = cls.name;
        select.appendChild(option);
    });
    
    // Restaura valor anterior se ainda existir
    if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
        select.value = currentValue;
    }
}

/**
 * Mostra modal de aluno
 */
function showStudentModal(studentId = null) {
    const modal = new bootstrap.Modal(document.getElementById('studentModal'));
    const form = document.getElementById('studentForm');
    const title = document.getElementById('studentModalTitle');
    
    // Limpa formulário
    form.reset();
    
    // Atualiza seletor de turmas
    updateStudentClassSelect();
    
    if (studentId) {
        // Modo edição
        title.textContent = 'Editar Aluno';
        const student = getStudentById(studentId);
        
        if (student) {
            document.getElementById('studentId').value = student.id;
            document.getElementById('studentName').value = student.name;
            document.getElementById('studentClass').value = student.classId;
            document.getElementById('lastLesson').value = student.lastLesson || '';
            document.getElementById('nextLesson').value = student.nextLesson || '';
            
            // F.A.L.E
            document.getElementById('faleF').value = student.fale?.F || '';
            document.getElementById('faleA').value = student.fale?.A || '';
            document.getElementById('faleL').value = student.fale?.L || '';
            document.getElementById('faleE').value = student.fale?.E || '';
            
            // Dever de casa
            if (student.homework) {
                document.querySelector(`input[name="homework"][value="${student.homework}"]`).checked = true;
            }
            
            // Preparação
            if (student.preparation) {
                document.querySelector(`input[name="preparation"][value="${student.preparation}"]`).checked = true;
            }
            
            // Avaliação e observação
            document.getElementById('studentEvaluation').value = student.evaluation || '';
            document.getElementById('classObservation').value = student.observation || '';
        }
    } else {
        // Modo adição
        title.textContent = 'Novo Aluno';
        document.getElementById('studentId').value = '';
    }
    
    modal.show();
}

/**
 * Mostra modal de frequência
 */
function showAttendanceModal() {
    const modal = new bootstrap.Modal(document.getElementById('attendanceModal'));
    
    // Limpa e atualiza seletor de turmas
    const classSelect = document.getElementById('modalClassSelect');
    classSelect.innerHTML = '<option value="">Selecione uma turma</option>';
    
    getClasses().forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = cls.name;
        classSelect.appendChild(option);
    });
    
    // Define data atual
    document.getElementById('modalDate').value = new Date().toISOString().split('T')[0];
    
    // Limpa conteúdo
    document.getElementById('attendanceModalContent').innerHTML = 
        '<p class="text-muted">Selecione uma turma para ver os alunos.</p>';
    
    // Event listener para mudança de turma
    classSelect.addEventListener('change', loadAttendanceModalContent);
    
    modal.show();
}

/**
 * Mostra detalhes da turma
 */
function showClassDetails(classId) {
    const cls = getClassById(classId);
    if (!cls) return;
    
    const students = getStudentsByClass(classId);
    const stats = getClassStats(classId);
    
    const modal = new bootstrap.Modal(document.getElementById('classDetailModal'));
    const content = document.getElementById('classDetailContent');
    
    content.innerHTML = `
        <div class="mb-4">
            <div class="d-flex align-items-center mb-3">
                <span class="class-color-badge me-2" style="background-color: ${cls.color}; width: 24px; height: 24px;"></span>
                <h4 class="mb-0">${cls.name}</h4>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <p><strong>Horário:</strong> ${cls.days.map(day => WEEK_DAYS[day]).join(', ')} às ${cls.time}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Total de Alunos:</strong> ${students.length}</p>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="mb-0">${stats.averageFale.toFixed(1)}</h3>
                            <small>Média F.A.L.E</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="mb-0">${Math.round(stats.attendanceRate)}%</h3>
                            <small>Frequência</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <h5 class="mb-3">Alunos da Turma</h5>
            ${students.length > 0 ? `
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Última Lição</th
                                                                <th>Próxima Lição</th>
                                <th>F.A.L.E</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students.map(student => `
                                <tr>
                                    <td>${student.name}</td>
                                    <td><span class="lesson-badge ${getLessonType(student.lastLessonValue)}">${student.lastLesson}</span></td>
                                    <td><span class="lesson-badge ${getLessonType(student.nextLessonValue)}">${student.nextLesson}</span></td>
                                    <td>
                                        ${['F', 'A', 'L', 'E'].map(letter => {
                                            const value = student.fale?.[letter];
                                            return value ? `<span class="badge ${FALE_CLASSES[value]} me-1">${letter}: ${value}</span>` : '';
                                        }).join('')}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p class="text-muted">Nenhum aluno nesta turma.</p>'}
        </div>
    `;
    
    modal.show();
}

/**
 * Salva turma
 */
function saveClass() {
    const id = document.getElementById('classId').value;
    const name = document.getElementById('className').value.trim();
    const time = document.getElementById('classTime').value;
    const color = document.getElementById('classColor').value;
    
    // Coleta dias selecionados
    const days = [];
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(day => {
        const checkbox = document.getElementById(`day${day}`);
        if (checkbox.checked) {
            const dayMap = {
                'Monday': 'segunda',
                'Tuesday': 'terca',
                'Wednesday': 'quarta',
                'Thursday': 'quinta',
                'Friday': 'sexta',
                'Saturday': 'sabado'
            };
            days.push(dayMap[day]);
        }
    });
    
    // Validação
    if (!name || days.length === 0 || !time) {
        showNotification('Preencha todos os campos obrigatórios!', 'warning');
        return;
    }
    
    const classData = { name, days, time, color };
    
    if (id) {
        // Edição
        updateClass(parseInt(id), classData);
        showNotification('Turma atualizada com sucesso!', 'success');
    } else {
        // Adição
        addClass(classData);
        showNotification('Turma criada com sucesso!', 'success');
    }
    
    // Fecha modal e atualiza interface
    bootstrap.Modal.getInstance(document.getElementById('classModal')).hide();
    updateUI();
}

/**
 * Salva aluno
 */
function saveStudent() {
    const id = document.getElementById('studentId').value;
    const name = document.getElementById('studentName').value.trim();
    const classId = parseInt(document.getElementById('studentClass').value);
    const lastLesson = document.getElementById('lastLesson').value.trim();
    const nextLesson = document.getElementById('nextLesson').value.trim();
    
    // F.A.L.E
    const fale = {
        F: document.getElementById('faleF').value,
        A: document.getElementById('faleA').value,
        L: document.getElementById('faleL').value,
        E: document.getElementById('faleE').value
    };
    
    // Dever de casa
    const homework = document.querySelector('input[name="homework"]:checked')?.value || 'nao';
    
    // Preparação
    const preparation = document.querySelector('input[name="preparation"]:checked')?.value || 'nao';
    
    // Avaliação e observação
    const evaluation = document.getElementById('studentEvaluation').value.trim();
    const observation = document.getElementById('classObservation').value.trim();
    
    // Validação
    if (!name || !classId) {
        showNotification('Preencha todos os campos obrigatórios!', 'warning');
        return;
    }
    
    const studentData = {
        name,
        classId,
        lastLesson: lastLesson || '0',
        nextLesson: nextLesson || '0',
        fale,
        homework,
        preparation,
        evaluation,
        observation
    };
    
    if (id) {
        // Edição
        updateStudent(parseInt(id), studentData);
        showNotification('Aluno atualizado com sucesso!', 'success');
    } else {
        // Adição
        addStudent(studentData);
        showNotification('Aluno adicionado com sucesso!', 'success');
    }
    
    // Fecha modal e atualiza interface
    bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
    updateUI();
}

/* ============================================
   UTILITÁRIOS
   ============================================ */

/**
 * Mostra notificação
 */
function showNotification(message, type = 'info') {
    // Remove notificações existentes
    const existingAlerts = document.querySelectorAll('.alert-message');
    existingAlerts.forEach(alert => alert.remove());
    
    // Cria nova notificação
    const alert = document.createElement('div');
    alert.className = `alert-message alert alert-${type === 'error' ? 'danger' : type}`;
    alert.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi ${type === 'success' ? 'bi-check-circle' : type === 'error' ? 'bi-exclamation-circle' : 'bi-info-circle'} me-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(alert);
    
    // Remove após 3 segundos
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 3000);
}

/**
 * Atualiza última data de salvamento
 */
function updateLastSave() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const element = document.getElementById('last-save');
    if (element) {
        element.textContent = `Último salvamento: ${timeString}`;
    }
}

/**
 * Alterna sidebar em mobile
 */
function toggleSidebar(show = null) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (show === null) {
        show = !sidebar.classList.contains('show');
    }
    
    if (show) {
        sidebar.classList.add('show');
        if (overlay) overlay.classList.add('show');
    } else {
        sidebar.classList.remove('show');
        if (overlay) overlay.classList.remove('show');
    }
}

/**
 * Inicializa tema
 */
function initTheme() {
    const savedTheme = AppState.settings.theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let theme = savedTheme;
    if (theme === 'auto') {
        theme = prefersDark ? 'dark' : 'light';
    }
    
    document.body.setAttribute('data-theme', theme);
    
    // Atualiza controles
    const darkModeSwitch = document.getElementById('darkModeSwitch');
    const themeSelect = document.getElementById('theme-select');
    
    if (darkModeSwitch) {
        darkModeSwitch.checked = theme === 'dark';
    }
    
    if (themeSelect) {
        themeSelect.value = savedTheme;
    }
}

/**
 * Alterna modo escuro
 */
function toggleDarkMode() {
    const isDark = document.getElementById('darkModeSwitch').checked;
    const theme = isDark ? 'dark' : 'light';
    
    document.body.setAttribute('data-theme', theme);
    AppState.settings.theme = theme;
    saveSettings();
}

/**
 * Muda tema
 */
function changeTheme() {
    const theme = document.getElementById('theme-select').value;
    AppState.settings.theme = theme;
    saveSettings();
    initTheme();
}

/**
 * Exporta dados
 */
function exportData() {
    const data = {
        appData: AppState.data,
        settings: AppState.settings,
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `english-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Dados exportados com sucesso!', 'success');
}

/**
 * Importa dados
 */
function importData() {
    document.getElementById('import-file-input').click();
}

/**
 * Lida com importação de arquivo
 */
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Confirmação
            if (!confirm('Tem certeza que deseja importar estes dados? Isso substituirá todos os dados atuais.')) {
                return;
            }
            
            // Valida dados
            if (!data.appData || !data.appData.classes || !data.appData.students) {
                throw new Error('Arquivo inválido');
            }
            
            // Atualiza dados
            AppState.data = data.appData;
            AppState.settings = data.settings || DEFAULT_DATA.settings;
            
            saveData();
            saveSettings();
            
            showNotification('Dados importados com sucesso!', 'success');
            updateUI();
            
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            showNotification('Erro ao importar dados. Arquivo inválido.', 'error');
        }
    };
    
    reader.readAsText(file);
    
    // Limpa o input para permitir reimportação do mesmo arquivo
    event.target.value = '';
}

/* ============================================
   INICIALIZAÇÃO DA APLICAÇÃO
   ============================================ */

// Inicializa quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initApp);

// Exporta funções principais para debug
window.AppState = AppState;
window.getClasses = getClasses;
window.getStudents = getStudents;
window.saveData = saveData;
window.exportData = exportData;
