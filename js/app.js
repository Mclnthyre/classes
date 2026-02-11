/* ============================================
   ENGLISH PLANNER PRO - APP COMPLETO
   ============================================ */

// ---------- ESTADO GLOBAL ----------
const AppState = {
    data: null,
    currentSection: 'dashboard',
    githubConfig: null,
    settings: null
};

// ---------- ESTRUTURAS PADRÃO ----------
const DEFAULT_DATA = {
    classes: [],
    students: [],
    lessons: [],      // Aulas planejadas/realizadas
    attendance: [],   // Registros de frequência (compatibilidade)
    settings: {
        autoSave: true,
        theme: 'light',
        notifications: true
    }
};

const DEFAULT_GITHUB = { username: '', repo: '', token: '' };

// Mapeamento de dias
const WEEK_DAYS = {
    segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta',
    quinta: 'Quinta', sexta: 'Sexta', sabado: 'Sábado'
};

// Mapeamento F.A.L.A (Fala, Audição, Leitura, Escrita)
const FALA_VALUES = { 'O': 4, 'MB': 3, 'B': 2, 'R': 1 };
const FALA_CLASSES = { 'O': 'bg-O', 'MB': 'bg-MB', 'B': 'bg-B', 'R': 'bg-R' };

// ---------- INICIALIZAÇÃO ----------
function initApp() {
    console.log('Iniciando English Planner...');
    loadData();
    loadSettings();
    loadGitHubConfig();
    setupEventListeners();
    setupNavigation();
    updateUI();
    initTheme();
    updateLastSave();
}

// ---------- PERSISTÊNCIA ----------
function loadData() {
    try {
        const saved = localStorage.getItem('englishPlannerData');
        AppState.data = saved ? JSON.parse(saved) : getSampleData();
        // Garante estrutura
        AppState.data = { ...DEFAULT_DATA, ...AppState.data,
            classes: AppState.data.classes || [],
            students: AppState.data.students || [],
            lessons: AppState.data.lessons || [],
            attendance: AppState.data.attendance || []
        };
        if (!saved) saveData();
    } catch(e) {
        console.error(e);
        AppState.data = getSampleData();
        saveData();
    }
}
function saveData() {
    localStorage.setItem('englishPlannerData', JSON.stringify(AppState.data));
    updateLastSave();
    if (AppState.settings?.autoSave) showNotification('Dados salvos', 'success');
}
function loadSettings() {
    const s = localStorage.getItem('englishPlannerSettings');
    AppState.settings = s ? JSON.parse(s) : DEFAULT_DATA.settings;
}
function saveSettings() {
    localStorage.setItem('englishPlannerSettings', JSON.stringify(AppState.settings));
}
function loadGitHubConfig() {
    const g = localStorage.getItem('githubConfig');
    AppState.githubConfig = g ? JSON.parse(g) : DEFAULT_GITHUB;
}
function saveGitHubConfig() {
    localStorage.setItem('githubConfig', JSON.stringify(AppState.githubConfig));
}

// ---------- DADOS DE EXEMPLO ----------
function getSampleData() {
    return {
        classes: [
            { id: 1, name: 'Kids A', days: ['segunda','quarta'], time: '16:00', color: '#4361ee' },
            { id: 2, name: 'Teens B', days: ['terca','quinta'], time: '17:00', color: '#7209b7' },
            { id: 3, name: 'Adults C', days: ['sexta'], time: '19:00', color: '#38b000' }
        ],
        students: [
            { id: 1, name: 'Ana Silva', classId: 1, lastLesson: '169', nextLesson: '170',
              lastLessonValue: 169, nextLessonValue: 170,
              fala: { F: 'O', A: 'MB', L: 'B', E: 'MB' }, average: 3.25,
              homework: 'sim', preparation: 'sim', evaluation: '', observation: '',
              attendance: [], peerHistory: [] },
            { id: 2, name: 'Carlos Oliveira', classId: 1, lastLesson: '170', nextLesson: '171',
              lastLessonValue: 170, nextLessonValue: 171,
              fala: { F: 'B', A: 'O', L: 'MB', E: 'B' }, average: 3.0,
              homework: 'parcial', preparation: 'sim', evaluation: '', observation: '',
              attendance: [], peerHistory: [] },
            { id: 3, name: 'Beatriz Santos', classId: 2, lastLesson: 'RW1', nextLesson: 'RW2',
              lastLessonValue: 1001, nextLessonValue: 1002,
              fala: { F: 'MB', A: 'MB', L: 'O', E: 'O' }, average: 3.5,
              homework: 'sim', preparation: 'sim', evaluation: '', observation: '',
              attendance: [], peerHistory: [] }
        ],
        lessons: [],
        attendance: [],
        settings: DEFAULT_DATA.settings
    };
}

// ---------- FUNÇÕES AUXILIARES ----------
function showNotification(msg, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-message alert alert-${type === 'error' ? 'danger' : type}`;
    alertDiv.innerHTML = `<i class="bi ${type==='success'?'bi-check-circle':type==='error'?'bi-exclamation-circle':'bi-info-circle'}"></i> ${msg}`;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}
function updateLastSave() {
    const el = document.getElementById('last-save');
    if (el) el.textContent = `Último salvamento: ${new Date().toLocaleTimeString('pt-BR')}`;
}
function toggleSidebar(show) {
    const s = document.getElementById('sidebar');
    s.classList.toggle('show', show);
}
function calculateLessonValue(lesson) {
    if (!lesson) return 0;
    return lesson.startsWith('RW') ? 1000 + parseInt(lesson.slice(2)||0) : parseInt(lesson)||0;
}
function calculateFalaAverage(fala) {
    if (!fala) return 0;
    const vals = [fala.F, fala.A, fala.L, fala.E].map(v => FALA_VALUES[v]||0);
    return vals.reduce((a,b)=>a+b,0) / vals.filter(v=>v>0).length || 0;
}
function getLessonType(val) {
    if (val >= 1000) return 'review';
    return val % 2 === 0 ? 'even' : 'odd';
}

// ---------- CRUD TURMAS ----------
function getClasses() { return AppState.data.classes; }
function getClassById(id) { return AppState.data.classes.find(c => c.id === id); }
function addClass(data) {
    const newId = AppState.data.classes.length ? Math.max(...AppState.data.classes.map(c=>c.id)) + 1 : 1;
    const newClass = { id: newId, ...data };
    AppState.data.classes.push(newClass);
    saveData();
    return newClass;
}
function updateClass(id, data) {
    const idx = AppState.data.classes.findIndex(c => c.id === id);
    if (idx !== -1) { AppState.data.classes[idx] = { id, ...data }; saveData(); return true; }
    return false;
}
function deleteClass(id) {
    const idx = AppState.data.classes.findIndex(c => c.id === id);
    if (idx !== -1) {
        AppState.data.students = AppState.data.students.filter(s => s.classId !== id);
        AppState.data.classes.splice(idx, 1);
        saveData();
        return true;
    }
    return false;
}
function getStudentsByClass(classId) {
    return AppState.data.students.filter(s => s.classId === classId);
}
function getClassStats(classId) {
    const students = getStudentsByClass(classId);
    const avg = students.reduce((sum,s)=>sum + (s.average||0),0) / (students.length||1);
    let totalPresent = 0, totalClasses = 0;
    students.forEach(s => {
        s.attendance?.forEach(a => { if (a.status === 'present') totalPresent++; totalClasses++; });
    });
    return {
        totalStudents: students.length,
        averageFale: avg,
        attendanceRate: totalClasses ? (totalPresent/totalClasses)*100 : 0,
        nextLessons: students.map(s => s.nextLesson)
    };
}

// ---------- CRUD ALUNOS ----------
function getStudents() { return AppState.data.students; }
function getStudentById(id) { return AppState.data.students.find(s => s.id === id); }
function addStudent(data) {
    const newId = AppState.data.students.length ? Math.max(...AppState.data.students.map(s=>s.id)) + 1 : 1;
    const student = {
        id: newId,
        attendance: [], peerHistory: [],
        lastLessonValue: calculateLessonValue(data.lastLesson),
        nextLessonValue: calculateLessonValue(data.nextLesson),
        average: calculateFalaAverage(data.fala),
        ...data
    };
    AppState.data.students.push(student);
    saveData();
    return student;
}
function updateStudent(id, data) {
    const idx = AppState.data.students.findIndex(s => s.id === id);
    if (idx !== -1) {
        const old = AppState.data.students[idx];
        AppState.data.students[idx] = {
            ...old, ...data,
            lastLessonValue: calculateLessonValue(data.lastLesson),
            nextLessonValue: calculateLessonValue(data.nextLesson),
            average: calculateFalaAverage(data.fala)
        };
        saveData();
        return true;
    }
    return false;
}
function deleteStudent(id) {
    const idx = AppState.data.students.findIndex(s => s.id === id);
    if (idx !== -1) { AppState.data.students.splice(idx,1); saveData(); return true; }
    return false;
}
function sortStudentsByLesson(students) {
    return [...students].sort((a,b) => {
        const aRev = a.nextLessonValue >= 1000, bRev = b.nextLessonValue >= 1000;
        if (aRev && !bRev) return 1;
        if (!aRev && bRev) return -1;
        const aEven = a.nextLessonValue % 2 === 0;
        const bEven = b.nextLessonValue % 2 === 0;
        if (aEven && !bEven) return -1;
        if (!aEven && bEven) return 1;
        return a.nextLessonValue - b.nextLessonValue;
    });
}

// ---------- SISTEMA DE AULAS (LESSONS) ----------
function saveLesson(lessonData) {
    if (!AppState.data.lessons) AppState.data.lessons = [];
    const idx = AppState.data.lessons.findIndex(l => l.classId === lessonData.classId && l.date === lessonData.date);
    lessonData.updatedAt = new Date().toISOString();
    if (idx !== -1) {
        lessonData.createdAt = AppState.data.lessons[idx].createdAt;
        AppState.data.lessons[idx] = lessonData;
    } else {
        lessonData.createdAt = new Date().toISOString();
        AppState.data.lessons.push(lessonData);
    }
    saveData();
    return lessonData;
}
function getLesson(classId, date) {
    return AppState.data.lessons?.find(l => l.classId === classId && l.date === date);
}
function getLessons(classId = null, month = null) {
    let lessons = AppState.data.lessons || [];
    if (classId) lessons = lessons.filter(l => l.classId === classId);
    if (month) lessons = lessons.filter(l => l.date.startsWith(month));
    return lessons.sort((a,b) => b.date.localeCompare(a.date));
}
function deleteLesson(classId, date) {
    const initial = AppState.data.lessons?.length || 0;
    AppState.data.lessons = AppState.data.lessons?.filter(l => !(l.classId === classId && l.date === date)) || [];
    saveData();
    return initial !== AppState.data.lessons.length;
}

// ---------- ORDEM DE ATENDIMENTO ----------
function generateAttendanceOrder(classId) {
    const students = getStudentsByClass(classId);
    const sorted = sortStudentsByLesson(students);
    return sorted.map((s,i) => ({
        order: i+1, studentId: s.id, studentName: s.name,
        nextLesson: s.nextLesson, lessonType: getLessonType(s.nextLessonValue),
        faleAverage: s.average
    }));
}

// ---------- SUGESTÃO DE PARES ----------
function suggestPeerPairs(classId) {
    let students = getStudentsByClass(classId).filter(s => s.nextLessonValue < 1000);
    if (students.length < 2) return [];
    students.sort((a,b) => a.nextLessonValue - b.nextLessonValue);
    const pairs = [], used = new Set();
    for (let i=0; i<students.length; i++) {
        if (used.has(students[i].id)) continue;
        let best = null, minDiff = Infinity;
        for (let j=i+1; j<students.length; j++) {
            if (used.has(students[j].id)) continue;
            const diff = Math.abs(students[i].nextLessonValue - students[j].nextLessonValue);
            if (diff <= 2 && diff < minDiff) { best = students[j]; minDiff = diff; }
        }
        if (best) {
            pairs.push({ student1: students[i], student2: best, difference: minDiff });
            used.add(students[i].id); used.add(best.id);
        }
    }
    const remaining = students.filter(s => !used.has(s.id));
    for (let i=0; i<remaining.length; i+=2) {
        if (i+1 < remaining.length) pairs.push({
            student1: remaining[i], student2: remaining[i+1],
            difference: Math.abs(remaining[i].nextLessonValue - remaining[i+1].nextLessonValue)
        });
    }
    return pairs;
}

// ---------- FREQUÊNCIA ----------
function getAttendanceByClassAndDate(classId, date) {
    const students = getStudentsByClass(classId);
    const lesson = getLesson(classId, date);
    return students.map(s => {
        const evalData = lesson?.studentEvaluations?.find(e => e.studentId === s.id) || {};
        const att = s.attendance?.find(a => a.date === date) || {};
        return {
            studentId: s.id, studentName: s.name,
            status: att.status || evalData.status || 'absent',
            homework: evalData.homework || 'nao',
            preparation: evalData.preparation || 'nao',
            evaluation: evalData.comment || '',
            observation: att.observation || ''
        };
    });
}
function registerAttendance(classId, date, data) {
    data.forEach(rec => {
        const student = getStudentById(rec.studentId);
        if (student) {
            if (!student.attendance) student.attendance = [];
            student.attendance = student.attendance.filter(a => a.date !== date);
            student.attendance.push({ date, status: rec.status, observation: rec.observation || '' });
        }
    });
    // Também salva como parte da aula, se existir
    const lesson = getLesson(classId, date);
    if (lesson) {
        if (!lesson.studentEvaluations) lesson.studentEvaluations = [];
        data.forEach(rec => {
            let evalRec = lesson.studentEvaluations.find(e => e.studentId === rec.studentId);
            if (evalRec) {
                evalRec.status = rec.status;
                evalRec.comment = rec.evaluation || evalRec.comment;
            } else {
                lesson.studentEvaluations.push({
                    studentId: rec.studentId,
                    status: rec.status,
                    homework: rec.homework,
                    preparation: rec.preparation,
                    comment: rec.evaluation
                });
            }
        });
        saveData();
    } else saveData();
}
function getStudentAttendanceStats(studentId) {
    const s = getStudentById(studentId);
    if (!s?.attendance) return { present:0, absent:0, justified:0, total:0, rate:0 };
    const stats = { present:0, absent:0, justified:0, total: s.attendance.length };
    s.attendance.forEach(a => {
        if (a.status === 'present') stats.present++;
        else if (a.status === 'absent') stats.absent++;
        else if (a.status === 'justified') stats.justified++;
    });
    stats.rate = stats.total ? (stats.present/stats.total)*100 : 0;
    return stats;
}

// ---------- RELATÓRIOS ----------
function generateProgressReport(classId = null) {
    const classes = classId ? [getClassById(classId)] : getClasses();
    let totalFale = 0, totalAtt = 0, count = 0;
    const classReports = classes.filter(c=>c).map(c => {
        const st = getClassStats(c.id);
        totalFale += st.averageFale; totalAtt += st.attendanceRate; count++;
        return { className: c.name, studentCount: st.totalStudents, averageFale: st.averageFale, attendanceRate: st.attendanceRate, nextLessons: st.nextLessons };
    });
    return {
        totalClasses: classes.length,
        totalStudents: AppState.data.students.length,
        averageFale: count ? totalFale/count : 0,
        attendanceRate: count ? totalAtt/count : 0,
        classes: classReports
    };
}
function generateAttendanceReport(classId = null) {
    const students = classId ? getStudentsByClass(classId) : getStudents();
    let totalPres = 0, totalCls = 0;
    const studs = students.map(s => {
        const st = getStudentAttendanceStats(s.id);
        totalPres += st.present; totalCls += st.total;
        return {
            studentName: s.name,
            className: getClassById(s.classId)?.name || 'Sem turma',
            present: st.present, absent: st.absent, justified: st.justified,
            attendanceRate: st.rate,
            lastAttendance: s.attendance?.slice(-1)[0]?.date || 'Nunca'
        };
    });
    return { totalStudents: students.length, overallAttendance: totalCls ? (totalPres/totalCls)*100 : 0, students: studs };
}
function generateFalaReport(classId = null) {
    const students = classId ? getStudentsByClass(classId) : getStudents();
    const dist = { O:0, MB:0, B:0, R:0 }, totals = { F:0, A:0, L:0, E:0 };
    let studCount = 0;
    const studs = students.filter(s=>s.fala).map(s => {
        Object.values(s.fala).forEach(v => { if (dist[v]!==undefined) dist[v]++; });
        if (s.fala.F) { totals.F += FALA_VALUES[s.fala.F]; studCount++; }
        if (s.fala.A) { totals.A += FALA_VALUES[s.fala.A]; }
        if (s.fala.L) { totals.L += FALA_VALUES[s.fala.L]; }
        if (s.fala.E) { totals.E += FALA_VALUES[s.fala.E]; }
        return {
            studentName: s.name,
            className: getClassById(s.classId)?.name || 'Sem turma',
            fala: s.fala,
            average: s.average,
            classification: s.average >= 3.5 ? 'Ótimo' : s.average >= 2.5 ? 'Muito Bom' : s.average >= 1.5 ? 'Bom' : 'Regular'
        };
    });
    return {
        totalStudents: students.length,
        distribution: dist,
        averages: { F: totals.F/studCount || 0, A: totals.A/studCount || 0, L: totals.L/studCount || 0, E: totals.E/studCount || 0 },
        students: studs
    };
}

// ---------- INTERFACE ----------
function setupEventListeners() {
    // Navegação
    document.querySelectorAll('[data-section]').forEach(el => {
        el.addEventListener('click', e => {
            e.preventDefault();
            navigateTo(el.dataset.section);
        });
    });
    document.getElementById('sidebarToggle')?.addEventListener('click', () => toggleSidebar(true));

    // Botão "Novo"
    document.getElementById('add-new-btn').addEventListener('click', () => {
        if (AppState.currentSection === 'classes') showClassModal();
        if (AppState.currentSection === 'students') showStudentModal();
    });

    // Turmas
    document.getElementById('add-class-btn')?.addEventListener('click', () => showClassModal());
    document.getElementById('saveClassBtn')?.addEventListener('click', saveClass);
    document.getElementById('class-search')?.addEventListener('input', filterClasses);
    document.getElementById('class-day-filter')?.addEventListener('change', filterClasses);

    // Alunos
    document.getElementById('add-student-btn')?.addEventListener('click', () => showStudentModal());
    document.getElementById('saveStudentBtn')?.addEventListener('click', saveStudent);
    document.getElementById('student-search')?.addEventListener('input', filterStudents);
    document.getElementById('student-class-filter')?.addEventListener('change', filterStudents);
    document.getElementById('student-fale-filter')?.addEventListener('change', filterStudents);

    // Aulas (Planejamento)
    document.getElementById('lesson-class-select')?.addEventListener('change', function() {
        if (this.value && document.getElementById('lesson-date').value)
            loadLessonData(parseInt(this.value), document.getElementById('lesson-date').value);
    });
    document.getElementById('lesson-date')?.addEventListener('change', function() {
        const cls = document.getElementById('lesson-class-select').value;
        if (cls && this.value) loadLessonData(parseInt(cls), this.value);
    });
    document.getElementById('generate-order-btn')?.addEventListener('click', function() {
        const cls = document.getElementById('lesson-class-select').value;
        if (cls) renderAttendanceOrder(generateAttendanceOrder(parseInt(cls)));
        else showNotification('Selecione uma turma', 'warning');
    });
    document.getElementById('suggest-pairs-btn')?.addEventListener('click', function() {
        const cls = document.getElementById('lesson-class-select').value;
        if (cls) renderPeerSuggestions(suggestPeerPairs(parseInt(cls)));
        else showNotification('Selecione uma turma', 'warning');
    });
    document.getElementById('save-lesson-btn')?.addEventListener('click', saveCurrentLesson);
    document.getElementById('load-lesson-btn')?.addEventListener('click', loadExistingLesson);
    document.getElementById('clear-lesson-btn')?.addEventListener('click', clearLessonForm);
    document.getElementById('add-peer-manual-btn')?.addEventListener('click', addManualPeer);
    document.getElementById('history-class-select')?.addEventListener('change', renderLessonHistory);
    document.getElementById('history-month')?.addEventListener('change', renderLessonHistory);
    document.getElementById('refresh-history-btn')?.addEventListener('click', renderLessonHistory);

    // Frequência
    document.getElementById('attendance-class-select')?.addEventListener('change', loadAttendanceTable);
    document.getElementById('attendance-date')?.addEventListener('change', loadAttendanceTable);
    document.getElementById('load-attendance-btn')?.addEventListener('click', loadAttendanceTable);
    document.getElementById('register-attendance-btn')?.addEventListener('click', showLegacyAttendanceModal); // simplificado

    // Relatórios
    document.getElementById('report-class-select')?.addEventListener('change', loadReports);
    document.getElementById('report-month')?.addEventListener('change', loadReports);
    document.getElementById('report-type')?.addEventListener('change', loadReports);
    document.getElementById('refresh-reports-btn')?.addEventListener('click', loadReports);
    document.getElementById('export-report-pdf-btn')?.addEventListener('click', exportReportPDF);
    document.getElementById('export-lesson-pdf-btn')?.addEventListener('click', exportLessonPDF);

    // Configurações
    document.getElementById('save-settings-btn')?.addEventListener('click', saveSettingsFromUI);
    document.getElementById('darkModeSwitch')?.addEventListener('change', toggleDarkMode);
    document.getElementById('theme-select')?.addEventListener('change', changeTheme);
    document.getElementById('export-data')?.addEventListener('click', exportData);
    document.getElementById('import-data')?.addEventListener('click', ()=>document.getElementById('import-file-input').click());
    document.getElementById('import-file-input')?.addEventListener('change', handleFileImport);
    document.getElementById('export-all-btn')?.addEventListener('click', exportData);
    document.getElementById('import-file-btn')?.addEventListener('click', ()=>document.getElementById('import-file-input').click());
    document.getElementById('github-save-btn')?.addEventListener('click', exportToGitHub);
    document.getElementById('github-load-btn')?.addEventListener('click', importFromGitHub);
}

function setupNavigation() { navigateTo('dashboard'); }

function navigateTo(section) {
    document.querySelectorAll('#main-menu .nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('d-none'));
    const target = document.getElementById(`${section}-section`);
    if (target) {
        target.classList.remove('d-none');
        AppState.currentSection = section;
        updateSectionTitle();
        updateSectionContent();
    }
    if (window.innerWidth < 768) toggleSidebar(false);
}

function updateSectionTitle() {
    const titles = {
        dashboard: 'Dashboard', classes: 'Turmas', students: 'Alunos',
        planning: 'Aulas', attendance: 'Frequência', reports: 'Relatórios', settings: 'Configurações'
    };
    const subtitles = {
        dashboard: 'Visão geral do sistema', classes: 'Gerenciamento de turmas',
        students: 'Gerenciamento de alunos', planning: 'Planejamento e registro de aulas',
        attendance: 'Registro de presenças', reports: 'Análises e estatísticas',
        settings: 'Configurações do sistema'
    };
    document.getElementById('current-section-title').textContent = titles[AppState.currentSection] || '';
    document.getElementById('current-section-subtitle').textContent = subtitles[AppState.currentSection] || '';
}

function updateSectionContent() {
    switch (AppState.currentSection) {
        case 'dashboard': updateDashboard(); break;
        case 'classes': updateClassesSection(); break;
        case 'students': updateStudentsSection(); break;
        case 'planning': updatePlanningSection(); break;
        case 'attendance': updateAttendanceSection(); break;
        case 'reports': updateReportsSection(); break;
        case 'settings': updateSettingsSection(); break;
    }
}

function updateUI() {
    updateDashboard();
    updateClassesSection();
    updateStudentsSection();
    updatePlanningSection();
    updateAttendanceSection();
    updateReportsSection();
    updateSettingsSection();
}

// ---------- DASHBOARD ----------
function updateDashboard() {
    document.getElementById('stats-classes').textContent = AppState.data.classes.length;
    document.getElementById('stats-students').textContent = AppState.data.students.length;
    const today = Object.keys(WEEK_DAYS)[new Date().getDay()-1];
    const todayClasses = AppState.data.classes.filter(c => c.days.includes(today)).length;
    document.getElementById('stats-today-classes').textContent = todayClasses;
    let totalAtt = 0, count = 0;
    AppState.data.classes.forEach(c => { const s = getClassStats(c.id); totalAtt += s.attendanceRate; count++; });
    document.getElementById('stats-attendance').textContent = `${count ? Math.round(totalAtt/count) : 0}%`;
    // Progresso
    const prog = document.getElementById('classes-progress');
    prog.innerHTML = AppState.data.classes.map(c => {
        const st = getClassStats(c.id);
        return `<div class="mb-2"><div class="d-flex justify-content-between"><span>${c.name}</span><span>${st.averageFale.toFixed(1)}</span></div><div class="progress"><div class="progress-bar" style="width:${st.averageFale*25}%"></div></div></div>`;
    }).join('') || '<p class="text-muted">Nenhuma turma</p>';
    // Próximas aulas
    const upcoming = document.getElementById('upcoming-classes');
    const todayCls = AppState.data.classes.filter(c => c.days.includes(today));
    upcoming.innerHTML = todayCls.map(c => `<div class="d-flex align-items-center mb-2"><span class="class-color-badge" style="background:${c.color}"></span><div><strong>${c.name}</strong><div class="text-muted">${c.time}</div></div></div>`).join('') || '<p class="text-muted">Nenhuma aula hoje</p>';
}

// ---------- TURMAS ----------
function updateClassesSection() {
    renderClassesList();
    document.getElementById('class-day-filter').innerHTML = '<option value="">Filtrar por dia</option>' + 
        Object.entries(WEEK_DAYS).map(([k,v]) => `<option value="${k}">${v}</option>`).join('');
}
function renderClassesList() {
    const container = document.getElementById('classes-list');
    const classes = getClasses();
    if (!classes.length) {
        container.innerHTML = '<div class="col-12"><div class="empty-state"><i class="bi bi-people-fill fs-1"></i><h5>Nenhuma turma</h5><button class="btn btn-primary" id="add-first-class-btn">Criar Primeira Turma</button></div></div>';
        document.getElementById('add-first-class-btn')?.addEventListener('click', ()=>showClassModal());
        return;
    }
    container.innerHTML = classes.map(cls => {
        const students = getStudentsByClass(cls.id);
        const stats = getClassStats(cls.id);
        const daysHtml = cls.days.map(d => `<span class="day-badge">${WEEK_DAYS[d]?.slice(0,3)}</span>`).join('');
        return `<div class="col-lg-6 col-xl-6">
            <div class="card class-card" data-class-id="${cls.id}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="d-flex align-items-center">
                            <span class="class-color-badge" style="background:${cls.color}"></span>
                            <h5 class="mb-0">${cls.name}</h5>
                        </div>
                        <span class="badge bg-primary">${students.length} alunos</span>
                    </div>
                    <p class="text-muted mb-2"><i class="bi bi-calendar-week"></i> ${cls.days.map(d=>WEEK_DAYS[d]).join(', ')} às ${cls.time}</p>
                    <div class="days-display">${daysHtml}</div>
                    <div class="mt-3"><small>Progresso</small><div class="progress mt-1"><div class="progress-bar" style="width:${stats.attendanceRate}%"></div></div></div>
                    <div class="stats-display">
                        <div class="stat-item"><span class="stat-value">${stats.averageFale.toFixed(1)}</span><span class="stat-label">F.A.L.A</span></div>
                        <div class="stat-item"><span class="stat-value">${Math.round(stats.attendanceRate)}%</span><span class="stat-label">Frequência</span></div>
                        <div class="stat-item"><span class="stat-value">${students.length}</span><span class="stat-label">Alunos</span></div>
                    </div>
                    <div class="mt-3 d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary view-class-btn" data-id="${cls.id}"><i class="bi bi-eye"></i> Detalhes</button>
                        <button class="btn btn-sm btn-outline-warning edit-class-btn" data-id="${cls.id}"><i class="bi bi-pencil"></i> Editar</button>
                        <button class="btn btn-sm btn-outline-danger delete-class-btn" data-id="${cls.id}"><i class="bi bi-trash"></i> Excluir</button>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
    // Event listeners
    container.querySelectorAll('.view-class-btn').forEach(b => b.addEventListener('click', e => showClassDetails(parseInt(e.target.closest('button').dataset.id))));
    container.querySelectorAll('.edit-class-btn').forEach(b => b.addEventListener('click', e => showClassModal(parseInt(e.target.closest('button').dataset.id))));
    container.querySelectorAll('.delete-class-btn').forEach(b => b.addEventListener('click', e => deleteClassWithConfirm(parseInt(e.target.closest('button').dataset.id))));
}
function filterClasses() {
    const term = document.getElementById('class-search').value.toLowerCase();
    const day = document.getElementById('class-day-filter').value;
    const cards = document.querySelectorAll('#classes-list .class-card');
    cards.forEach(c => {
        const cls = getClassById(parseInt(c.dataset.classId));
        if (!cls) return;
        const matchName = cls.name.toLowerCase().includes(term);
        const matchDay = !day || cls.days.includes(day);
        c.closest('.col-lg-6').style.display = (matchName && matchDay) ? '' : 'none';
    });
}
function showClassModal(id = null) {
    const modal = new bootstrap.Modal(document.getElementById('classModal'));
    const form = document.getElementById('classForm');
    form.reset();
    document.getElementById('classColor').value = '#4361ee';
    ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].forEach(d => document.getElementById(`day${d}`).checked = false);
    if (id) {
        const cls = getClassById(id);
        if (cls) {
            document.getElementById('classId').value = cls.id;
            document.getElementById('className').value = cls.name;
            document.getElementById('classTime').value = cls.time;
            document.getElementById('classColor').value = cls.color;
            cls.days.forEach(d => {
                const map = { segunda:'Monday', terca:'Tuesday', quarta:'Wednesday', quinta:'Thursday', sexta:'Friday', sabado:'Saturday' };
                const cb = document.getElementById(`day${map[d]}`);
                if (cb) cb.checked = true;
            });
        }
    }
    modal.show();
}
function saveClass() {
    const id = document.getElementById('classId').value;
    const name = document.getElementById('className').value.trim();
    const time = document.getElementById('classTime').value;
    const color = document.getElementById('classColor').value;
    const days = [];
    const map = { Monday:'segunda', Tuesday:'terca', Wednesday:'quarta', Thursday:'quinta', Friday:'sexta', Saturday:'sabado' };
    ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].forEach(day => {
        if (document.getElementById(`day${day}`).checked) days.push(map[day]);
    });
    if (!name || !days.length || !time) { showNotification('Preencha todos os campos', 'warning'); return; }
    if (id) { updateClass(parseInt(id), {name,days,time,color}); showNotification('Turma atualizada'); }
    else { addClass({name,days,time,color}); showNotification('Turma criada'); }
    bootstrap.Modal.getInstance(document.getElementById('classModal')).hide();
    updateUI();
}
function showClassDetails(id) {
    const cls = getClassById(id);
    if (!cls) return;
    const students = getStudentsByClass(id);
    const stats = getClassStats(id);
    const modal = new bootstrap.Modal(document.getElementById('classDetailModal'));
    document.getElementById('classDetailContent').innerHTML = `
        <div class="d-flex align-items-center mb-3"><span class="class-color-badge me-2" style="background:${cls.color}"></span><h4>${cls.name}</h4></div>
        <p><strong>Horário:</strong> ${cls.days.map(d=>WEEK_DAYS[d]).join(', ')} às ${cls.time}</p>
        <p><strong>Total de Alunos:</strong> ${students.length}</p>
        <div class="row mb-3"><div class="col-md-6"><div class="card text-center p-2"><h3>${stats.averageFale.toFixed(1)}</h3><small>Média F.A.L.A</small></div></div>
        <div class="col-md-6"><div class="card text-center p-2"><h3>${Math.round(stats.attendanceRate)}%</h3><small>Frequência</small></div></div></div>
        <h5>Alunos</h5>${students.length ? `<div class="table-responsive"><table class="table table-sm"><thead><tr><th>Nome</th><th>Próx. Lição</th><th>F.A.L.A</th></tr></thead><tbody>${students.map(s=>`<tr><td>${s.name}</td><td><span class="lesson-badge ${getLessonType(s.nextLessonValue)}">${s.nextLesson}</span></td><td>${['F','A','L','E'].map(l=>s.fala?.[l]?`<span class="fala-badge ${FALA_CLASSES[s.fala[l]]} me-1">${l}</span>`:'').join('')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="text-muted">Nenhum aluno</p>'}
    `;
    modal.show();
}
function deleteClassWithConfirm(id) {
    const cls = getClassById(id);
    if (cls && confirm(`Excluir turma "${cls.name}"? Isso removerá todos os alunos dela.`)) {
        deleteClass(id);
        showNotification('Turma excluída');
        updateUI();
    }
}

// ---------- ALUNOS ----------
function updateStudentsSection() {
    renderStudentsTable();
    const filter = document.getElementById('student-class-filter');
    if (filter) {
        filter.innerHTML = '<option value="">Todas as turmas</option>';
        getClasses().forEach(c => filter.innerHTML += `<option value="${c.id}">${c.name}</option>`);
    }
}
function renderStudentsTable() {
    const tbody = document.getElementById('students-table-body');
    const students = getStudents();
    if (!students.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center"><div class="empty-state"><i class="bi bi-person-vcard"></i><h5>Nenhum aluno</h5><button class="btn btn-primary" id="add-first-student-btn">Adicionar Aluno</button></div></td></tr>`;
        document.getElementById('add-first-student-btn')?.addEventListener('click', ()=>showStudentModal());
        return;
    }
    tbody.innerHTML = students.map(s => {
        const cls = getClassById(s.classId);
        const fala = s.fala || {};
        const badges = ['F','A','L','E'].map(l => fala[l] ? `<span class="fala-badge ${FALA_CLASSES[fala[l]]}" title="${l}">${l}</span>` : '').join(' ');
        return `<tr>
            <td><strong>${s.name}</strong> ${s.homework==='sim'?'<span class="badge bg-success">✓</span>':''} ${s.preparation==='sim'?'<span class="badge bg-info">📚</span>':''}</td>
            <td>${cls?.name||'Sem turma'}</td>
            <td><span class="lesson-badge ${getLessonType(s.lastLessonValue)}">${s.lastLesson}</span></td>
            <td><span class="lesson-badge ${getLessonType(s.nextLessonValue)}">${s.nextLesson}</span></td>
            <td>${badges}</td>
            <td><span class="badge ${s.average>=3.5?'bg-success':s.average>=2.5?'bg-warning':'bg-secondary'}">${s.average.toFixed(1)}</span></td>
            <td><div class="student-actions">
                <button class="btn btn-sm btn-outline-primary edit-student-btn" data-id="${s.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger delete-student-btn" data-id="${s.id}"><i class="bi bi-trash"></i></button>
            </div></td>
        </tr>`;
    }).join('');
    tbody.querySelectorAll('.edit-student-btn').forEach(b => b.addEventListener('click', e => showStudentModal(parseInt(e.target.closest('button').dataset.id))));
    tbody.querySelectorAll('.delete-student-btn').forEach(b => b.addEventListener('click', e => deleteStudentWithConfirm(parseInt(e.target.closest('button').dataset.id))));
}
function filterStudents() {
    const term = document.getElementById('student-search').value.toLowerCase();
    const classFilter = document.getElementById('student-class-filter').value;
    const falaFilter = document.getElementById('student-fale-filter').value;
    const rows = document.querySelectorAll('#students-table-body tr');
    rows.forEach(row => {
        if (row.querySelector('.empty-state')) return;
        const name = row.cells[0].textContent.toLowerCase();
        const className = row.cells[1].textContent;
        const falaSpans = row.cells[4].querySelectorAll('.fala-badge');
        const falaVals = Array.from(falaSpans).map(s => s.title);
        let match = name.includes(term);
        if (classFilter) match = match && className.includes(getClassById(parseInt(classFilter))?.name || '');
        if (falaFilter) match = match && falaVals.includes(falaFilter);
        row.style.display = match ? '' : 'none';
    });
}
function showStudentModal(id = null) {
    const modal = new bootstrap.Modal(document.getElementById('studentModal'));
    const form = document.getElementById('studentForm');
    form.reset();
    const select = document.getElementById('studentClass');
    select.innerHTML = '<option value="">Selecione uma turma</option>';
    getClasses().forEach(c => select.innerHTML += `<option value="${c.id}">${c.name}</option>`);
    if (id) {
        const s = getStudentById(id);
        if (s) {
            document.getElementById('studentId').value = s.id;
            document.getElementById('studentName').value = s.name;
            document.getElementById('studentClass').value = s.classId;
            document.getElementById('lastLesson').value = s.lastLesson || '';
            document.getElementById('nextLesson').value = s.nextLesson || '';
            if (s.fala) {
                document.getElementById('faleF').value = s.fala.F || '';
                document.getElementById('faleA').value = s.fala.A || '';
                document.getElementById('faleL').value = s.fala.L || '';
                document.getElementById('faleE').value = s.fala.E || '';
            }
        }
    }
    modal.show();
}
function saveStudent() {
    const id = document.getElementById('studentId').value;
    const name = document.getElementById('studentName').value.trim();
    const classId = parseInt(document.getElementById('studentClass').value);
    const lastLesson = document.getElementById('lastLesson').value.trim();
    const nextLesson = document.getElementById('nextLesson').value.trim();
    const fala = {
        F: document.getElementById('faleF').value,
        A: document.getElementById('faleA').value,
        L: document.getElementById('faleL').value,
        E: document.getElementById('faleE').value
    };
    if (!name || !classId) { showNotification('Nome e turma obrigatórios', 'warning'); return; }
    const data = { name, classId, lastLesson, nextLesson, fala };
    if (id) { updateStudent(parseInt(id), data); showNotification('Aluno atualizado'); }
    else { addStudent(data); showNotification('Aluno adicionado'); }
    bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
    updateUI();
}
function deleteStudentWithConfirm(id) {
    const s = getStudentById(id);
    if (s && confirm(`Excluir aluno "${s.name}"?`)) {
        deleteStudent(id);
        showNotification('Aluno excluído');
        updateUI();
    }
}

// ---------- AULAS (PLANEJAMENTO) ----------
function updatePlanningSection() {
    const select = document.getElementById('lesson-class-select');
    select.innerHTML = '<option value="">Selecione uma turma</option>';
    getClasses().forEach(c => select.innerHTML += `<option value="${c.id}">${c.name}</option>`);
    const date = document.getElementById('lesson-date');
    if (!date.value) date.value = new Date().toISOString().split('T')[0];
    const historySelect = document.getElementById('history-class-select');
    historySelect.innerHTML = '<option value="">Todas as turmas</option>';
    getClasses().forEach(c => historySelect.innerHTML += `<option value="${c.id}">${c.name}</option>`);
    document.getElementById('history-month').value = new Date().toISOString().slice(0,7);
    renderLessonHistory();
}
function loadLessonData(classId, date) {
    const lesson = getLesson(classId, date);
    // Ordem
    const order = generateAttendanceOrder(classId);
    renderAttendanceOrder(order);
    // Pares
    const pairs = suggestPeerPairs(classId);
    renderPeerSuggestions(pairs);
    // Notas
    document.getElementById('lesson-notes').value = lesson?.lessonNotes || '';
    // Avaliações
    renderStudentEvaluations(classId, date, lesson?.studentEvaluations || []);
}
function renderAttendanceOrder(order) {
    const cont = document.getElementById('attendance-order-list');
    if (!order.length) { cont.innerHTML = '<p class="text-muted">Nenhum aluno</p>'; return; }
    cont.innerHTML = order.map(o => `<div class="d-flex align-items-center mb-2 p-2 border rounded"><span class="badge bg-primary me-2">${o.order}</span><div><strong>${o.studentName}</strong><br><small>Lição ${o.nextLesson}</small></div></div>`).join('');
}
function renderPeerSuggestions(pairs) {
    const cont = document.getElementById('peer-suggestions');
    if (!pairs.length) { cont.innerHTML = '<p class="text-muted">Não há sugestões</p>'; return; }
    cont.innerHTML = pairs.map((p,i) => `
        <div class="pair-suggestion mb-2 p-2 border rounded">
            <div class="d-flex justify-content-between"><span class="badge bg-success">Par ${i+1}</span><small>Diferença: ${p.difference}</small></div>
            <div class="row mt-2">
                <div class="col-5"><strong>${p.student1.name}</strong><br><span class="lesson-badge ${getLessonType(p.student1.nextLessonValue)}">${p.student1.nextLesson}</span></div>
                <div class="col-2 text-center"><i class="bi bi-arrow-left-right"></i></div>
                <div class="col-5"><strong>${p.student2.name}</strong><br><span class="lesson-badge ${getLessonType(p.student2.nextLessonValue)}">${p.student2.nextLesson}</span></div>
            </div>
            <div class="mt-2"><button class="btn btn-sm btn-outline-success confirm-pair-btn" data-pair='${JSON.stringify(p)}'><i class="bi bi-check-circle"></i> Confirmar</button></div>
        </div>
    `).join('');
    cont.querySelectorAll('.confirm-pair-btn').forEach(b => b.addEventListener('click', e => {
        const pair = JSON.parse(e.target.closest('button').dataset.pair);
        addConfirmedPair(pair);
    }));
}
function addConfirmedPair(pair) {
    const cont = document.getElementById('peer-suggestions');
    // Adiciona um badge de confirmado
    const btn = event.target.closest('button');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Confirmado';
        btn.classList.remove('btn-outline-success');
        btn.classList.add('btn-success');
    }
    // Armazena em um array global? Vamos guardar na própria div como data.
    // Para salvar depois, coletaremos todos os pares com botão confirmado.
}
function addManualPeer() {
    // Simplificado: apenas abre prompt para IDs (em produção faria um modal)
    alert('Função para adicionar par manualmente (pode ser implementada com modal)');
}
function renderStudentEvaluations(classId, date, savedEvals = []) {
    const cont = document.getElementById('student-evaluations-container');
    const students = getStudentsByClass(classId);
    if (!students.length) { cont.innerHTML = '<p class="text-muted">Nenhum aluno na turma</p>'; return; }
    const evalsMap = {};
    savedEvals.forEach(e => evalsMap[e.studentId] = e);
    let html = `<div class="table-responsive"><table class="table table-sm table-bordered"><thead><tr>
        <th>Aluno</th><th>Lição</th><th>Fala</th><th>Audição</th><th>Leitura</th><th>Escrita</th>
        <th>Dever</th><th>Preparação</th><th>Comentário</th>
    </tr></thead><tbody>`;
    students.forEach(s => {
        const ev = evalsMap[s.id] || {};
        const fala = ev.fala || s.fala || {};
        html += `<tr>
            <td>${s.name}</td>
            <td>${s.nextLesson}</td>
            <td><select class="form-select form-select-sm eval-fala" data-student="${s.id}" data-cat="F">${optionsFALA(fala.F)}</select></td>
            <td><select class="form-select form-select-sm eval-fala" data-student="${s.id}" data-cat="A">${optionsFALA(fala.A)}</select></td>
            <td><select class="form-select form-select-sm eval-fala" data-student="${s.id}" data-cat="L">${optionsFALA(fala.L)}</select></td>
            <td><select class="form-select form-select-sm eval-fala" data-student="${s.id}" data-cat="E">${optionsFALA(fala.E)}</select></td>
            <td><select class="form-select form-select-sm eval-homework" data-student="${s.id}">${optionsHW(ev.homework||'nao')}</select></td>
            <td><select class="form-select form-select-sm eval-preparation" data-student="${s.id}">${optionsPrep(ev.preparation||'nao')}</select></td>
            <td><input type="text" class="form-control form-control-sm eval-comment" data-student="${s.id}" value="${ev.comment||''}"></td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    cont.innerHTML = html;
}
function optionsFALA(selected = '') {
    const opts = ['','O','MB','B','R'];
    return opts.map(v => `<option value="${v}" ${v===selected?'selected':''}>${v||'-'}</option>`).join('');
}
function optionsHW(sel) {
    const opts = { 'sim':'Feito', 'nao':'Não', 'parcial':'Parcial' };
    return Object.entries(opts).map(([v,l]) => `<option value="${v}" ${v===sel?'selected':''}>${l}</option>`).join('');
}
function optionsPrep(sel) {
    return `<option value="sim" ${sel==='sim'?'selected':''}>Sim</option><option value="nao" ${sel==='nao'?'selected':''}>Não</option>`;
}
function collectStudentEvaluations() {
    const evals = [];
    document.querySelectorAll('.eval-fala').forEach(sel => {
        const sid = parseInt(sel.dataset.student);
        const cat = sel.dataset.cat;
        let e = evals.find(x => x.studentId === sid);
        if (!e) { e = { studentId: sid, fala: {} }; evals.push(e); }
        if (!e.fala) e.fala = {};
        e.fala[cat] = sel.value;
    });
    document.querySelectorAll('.eval-homework').forEach(sel => {
        const sid = parseInt(sel.dataset.student);
        let e = evals.find(x => x.studentId === sid);
        if (!e) { e = { studentId: sid }; evals.push(e); }
        e.homework = sel.value;
    });
    document.querySelectorAll('.eval-preparation').forEach(sel => {
        const sid = parseInt(sel.dataset.student);
        let e = evals.find(x => x.studentId === sid);
        if (!e) { e = { studentId: sid }; evals.push(e); }
        e.preparation = sel.value;
    });
    document.querySelectorAll('.eval-comment').forEach(inp => {
        const sid = parseInt(inp.dataset.student);
        let e = evals.find(x => x.studentId === sid);
        if (!e) { e = { studentId: sid }; evals.push(e); }
        e.comment = inp.value;
    });
    return evals;
}
function saveCurrentLesson() {
    const classId = parseInt(document.getElementById('lesson-class-select').value);
    const date = document.getElementById('lesson-date').value;
    if (!classId || !date) { showNotification('Selecione turma e data', 'warning'); return; }

    // Coletar ordem de atendimento
    const orderItems = document.querySelectorAll('#attendance-order-list .d-flex');
    const attendanceOrder = Array.from(orderItems).map((item, idx) => {
        const name = item.querySelector('strong')?.textContent || '';
        const lesson = item.querySelector('small')?.textContent?.replace('Liçã', '').trim() || '';
        return { order: idx + 1, studentName: name, nextLesson: lesson };
    });

    // Coletar pares confirmados
    const peerPairs = [];
    document.querySelectorAll('#peer-suggestions .pair-suggestion').forEach((item, idx) => {
        const badge = item.querySelector('.badge.bg-success');
        const isConfirmed = badge && badge.textContent.includes('Confirmado');
        if (isConfirmed) {
            const names = item.querySelectorAll('strong');
            const lessons = item.querySelectorAll('.lesson-badge');
            const diff = item.querySelector('small')?.textContent?.replace('Diferença: ', '').replace(' lições', '') || '';
            peerPairs.push({
                pairNumber: idx + 1,
                student1Name: names[0]?.textContent || '',
                student2Name: names[1]?.textContent || '',
                student1Lesson: lessons[0]?.textContent || '',
                student2Lesson: lessons[1]?.textContent || '',
                difference: diff
            });
        }
    });

    // Observações
    const lessonNotes = document.getElementById('lesson-notes').value;

    // Avaliações dos alunos
    const studentEvaluations = collectStudentEvaluations();

    // Atualizar médias F.A.L.A dos alunos com base nas avaliações desta aula
    studentEvaluations.forEach(evalItem => {
        if (evalItem.fala) {
            const student = getStudentById(evalItem.studentId);
            if (student) {
                // Atualizar a avaliação F.A.L.A do aluno (média geral)
                const oldFala = student.fala || {};
                // Aqui podemos optar por atualizar a média cumulativa ou apenas a mais recente
                // Vamos atualizar para a mais recente (simples)
                student.fala = evalItem.fala;
                student.average = calculateFalaAverage(evalItem.fala);
            }
        }
    });

    const lessonData = {
        classId,
        date,
        attendanceOrder,
        peerPairs,
        lessonNotes,
        studentEvaluations,
        updatedAt: new Date().toISOString()
    };

    saveLesson(lessonData);
    showNotification('Aula salva com sucesso!', 'success');
    renderLessonHistory(); // atualiza histórico
}

function loadExistingLesson() {
    const classId = parseInt(document.getElementById('lesson-class-select').value);
    const date = document.getElementById('lesson-date').value;
    if (!classId || !date) { showNotification('Selecione turma e data', 'warning'); return; }
    const lesson = getLesson(classId, date);
    if (!lesson) { showNotification('Nenhuma aula encontrada para esta data', 'info'); return; }

    // Recarregar ordem (já deve estar visível, mas podemos recriar)
    const order = generateAttendanceOrder(classId);
    renderAttendanceOrder(order);
    // Recarregar pares
    const pairs = suggestPeerPairs(classId);
    renderPeerSuggestions(pairs);
    // Marcar pares que estavam confirmados
    if (lesson.peerPairs && lesson.peerPairs.length) {
        lesson.peerPairs.forEach(pair => {
            // Procurar o card do par e marcar como confirmado
            const cards = document.querySelectorAll('#peer-suggestions .pair-suggestion');
            cards.forEach(card => {
                const names = card.querySelectorAll('strong');
                const n1 = names[0]?.textContent;
                const n2 = names[1]?.textContent;
                if (n1 === pair.student1Name && n2 === pair.student2Name) {
                    const btn = card.querySelector('.confirm-pair-btn');
                    if (btn) {
                        btn.disabled = true;
                        btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Confirmado';
                        btn.classList.remove('btn-outline-success');
                        btn.classList.add('btn-success');
                    }
                }
            });
        });
    }
    // Notas
    document.getElementById('lesson-notes').value = lesson.lessonNotes || '';
    // Avaliações
    renderStudentEvaluations(classId, date, lesson.studentEvaluations || []);
}

function clearLessonForm() {
    document.getElementById('attendance-order-list').innerHTML = '<p class="text-muted">Selecione uma turma e clique em "Gerar Ordem".</p>';
    document.getElementById('peer-suggestions').innerHTML = '<p class="text-muted">Clique em "Sugerir Pares" para gerar combinações.</p>';
    document.getElementById('lesson-notes').value = '';
    document.getElementById('student-evaluations-container').innerHTML = '<p class="text-muted">Selecione uma turma para avaliar os alunos.</p>';
}

function renderLessonHistory() {
    const container = document.getElementById('lesson-history-list');
    const classId = document.getElementById('history-class-select').value;
    const month = document.getElementById('history-month').value;
    const lessons = getLessons(classId ? parseInt(classId) : null, month || null);
    if (!lessons.length) {
        container.innerHTML = '<p class="text-muted">Nenhuma aula encontrada.</p>';
        return;
    }
    let html = '';
    lessons.forEach(lesson => {
        const cls = getClassById(lesson.classId);
        const className = cls ? cls.name : 'Turma removida';
        const dateObj = new Date(lesson.date + 'T12:00:00');
        const formattedDate = dateObj.toLocaleDateString('pt-BR');
        html += `
            <div class="card mb-3 lesson-history-item">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="mb-1">${className} - ${formattedDate}</h6>
                            <small class="text-muted">Atualizado em: ${new Date(lesson.updatedAt).toLocaleString('pt-BR')}</small>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-primary edit-history-btn" data-class="${lesson.classId}" data-date="${lesson.date}">
                                <i class="bi bi-pencil"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-history-btn" data-class="${lesson.classId}" data-date="${lesson.date}">
                                <i class="bi bi-trash"></i> Excluir
                            </button>
                        </div>
                    </div>
                    <div class="mt-2">
                        <span class="badge bg-info">${lesson.attendanceOrder?.length || 0} alunos</span>
                        <span class="badge bg-success">${lesson.peerPairs?.length || 0} pares</span>
                        ${lesson.lessonNotes ? '<span class="badge bg-secondary">Com observações</span>' : ''}
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    // Event listeners
    container.querySelectorAll('.edit-history-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const classId = parseInt(btn.dataset.class);
            const date = btn.dataset.date;
            // Mudar para aba Nova Aula
            document.getElementById('new-lesson-tab').click();
            // Selecionar turma e data
            document.getElementById('lesson-class-select').value = classId;
            document.getElementById('lesson-date').value = date;
            // Carregar dados
            loadExistingLesson();
        });
    });
    container.querySelectorAll('.delete-history-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const classId = parseInt(btn.dataset.class);
            const date = btn.dataset.date;
            if (confirm('Excluir esta aula?')) {
                deleteLesson(classId, date);
                renderLessonHistory();
                showNotification('Aula excluída', 'success');
            }
        });
    });
}

// ---------- FREQUÊNCIA ----------
function updateAttendanceSection() {
    const select = document.getElementById('attendance-class-select');
    select.innerHTML = '<option value="">Selecione uma turma</option>';
    getClasses().forEach(c => select.innerHTML += `<option value="${c.id}">${c.name}</option>`);
    const date = document.getElementById('attendance-date');
    if (!date.value) date.value = new Date().toISOString().split('T')[0];
    // Estatísticas de frequência por turma
    updateAttendanceStats();
    // Histórico de frequência (últimas 5)
    updateAttendanceHistory();
}
function loadAttendanceTable() {
    const classId = document.getElementById('attendance-class-select').value;
    const date = document.getElementById('attendance-date').value;
    if (!classId || !date) {
        document.getElementById('attendance-table-container').innerHTML = '<p class="text-muted">Selecione uma turma e data.</p>';
        return;
    }
    const attendance = getAttendanceByClassAndDate(parseInt(classId), date);
    renderAttendanceTable(attendance);
}
function renderAttendanceTable(attendance) {
    const container = document.getElementById('attendance-table-container');
    let html = `<div class="table-responsive"><table class="table table-hover">
        <thead><tr><th>Aluno</th><th>Status</th><th>Dever</th><th>Preparação</th><th>Observação</th></tr></thead><tbody>`;
    attendance.forEach(a => {
        html += `<tr>
            <td>${a.studentName}</td>
            <td>
                <select class="form-select form-select-sm attendance-status" data-student="${a.studentId}">
                    <option value="present" ${a.status==='present'?'selected':''}>Presente</option>
                    <option value="absent" ${a.status==='absent'?'selected':''}>Ausente</option>
                    <option value="justified" ${a.status==='justified'?'selected':''}>Justificado</option>
                </select>
            </td>
            <td>
                <select class="form-select form-select-sm attendance-homework" data-student="${a.studentId}">
                    <option value="sim" ${a.homework==='sim'?'selected':''}>Feito</option>
                    <option value="nao" ${a.homework==='nao'?'selected':''}>Não</option>
                    <option value="parcial" ${a.homework==='parcial'?'selected':''}>Parcial</option>
                </select>
            </td>
            <td>
                <select class="form-select form-select-sm attendance-preparation" data-student="${a.studentId}">
                    <option value="sim" ${a.preparation==='sim'?'selected':''}>Sim</option>
                    <option value="nao" ${a.preparation==='nao'?'selected':''}>Não</option>
                </select>
            </td>
            <td><input type="text" class="form-control form-control-sm attendance-observation" data-student="${a.studentId}" value="${a.observation||''}"></td>
        </tr>`;
    });
    html += `</tbody></table></div><button class="btn btn-primary mt-2" id="save-attendance-btn"><i class="bi bi-save"></i> Salvar Frequência</button>`;
    container.innerHTML = html;
    document.getElementById('save-attendance-btn')?.addEventListener('click', saveAttendanceFromTable);
}
function saveAttendanceFromTable() {
    const classId = document.getElementById('attendance-class-select').value;
    const date = document.getElementById('attendance-date').value;
    if (!classId || !date) return;
    const data = [];
    const rows = document.querySelectorAll('#attendance-table-container tbody tr');
    rows.forEach(row => {
        const studentId = parseInt(row.querySelector('.attendance-status').dataset.student);
        const status = row.querySelector('.attendance-status').value;
        const homework = row.querySelector('.attendance-homework').value;
        const preparation = row.querySelector('.attendance-preparation').value;
        const observation = row.querySelector('.attendance-observation').value;
        data.push({ studentId, status, homework, preparation, observation, evaluation: '' });
    });
    registerAttendance(parseInt(classId), date, data);
    showNotification('Frequência salva!', 'success');
    updateAttendanceStats();
    updateAttendanceHistory();
}
function updateAttendanceStats() {
    const container = document.getElementById('attendance-by-class');
    const classes = getClasses();
    if (!classes.length) { container.innerHTML = '<p class="text-muted">Nenhuma turma</p>'; return; }
    let html = '';
    classes.forEach(c => {
        const stats = getClassAttendanceStats(c.id);
        html += `<div class="mb-2"><div class="d-flex justify-content-between"><span>${c.name}</span><span>${stats.averageRate.toFixed(0)}%</span></div>
            <div class="progress"><div class="progress-bar" style="width:${stats.averageRate}%"></div></div></div>`;
    });
    container.innerHTML = html;
}
function updateAttendanceHistory() {
    const container = document.getElementById('attendance-history');
    const allStudents = getStudents();
    let history = [];
    allStudents.forEach(s => {
        if (s.attendance) {
            s.attendance.forEach(a => {
                history.push({ date: a.date, student: s.name, status: a.status, class: getClassById(s.classId)?.name });
            });
        }
    });
    history.sort((a,b) => b.date.localeCompare(a.date));
    history = history.slice(0, 10); // últimos 10
    if (!history.length) { container.innerHTML = '<p class="text-muted">Nenhum registro</p>'; return; }
    let html = '<ul class="list-unstyled">';
    history.forEach(h => {
        let icon = h.status === 'present' ? 'bi-check-circle-fill text-success' : h.status === 'absent' ? 'bi-x-circle-fill text-danger' : 'bi-exclamation-circle-fill text-warning';
        html += `<li class="mb-2"><i class="bi ${icon} me-2"></i> ${h.date} - ${h.student} (${h.class})</li>`;
    });
    html += '</ul>';
    container.innerHTML = html;
}
// compatibilidade com modal antigo
function showLegacyAttendanceModal() {
    alert('Use a seção de Frequência acima para registrar presenças.');
}

// ---------- RELATÓRIOS ----------
function updateReportsSection() {
    const select = document.getElementById('report-class-select');
    select.innerHTML = '<option value="">Todas as turmas</option>';
    getClasses().forEach(c => select.innerHTML += `<option value="${c.id}">${c.name}</option>`);
    const month = document.getElementById('report-month');
    if (!month.value) month.value = new Date().toISOString().slice(0,7);
    loadReports();
}
function loadReports() {
    const classId = document.getElementById('report-class-select').value || null;
    const month = document.getElementById('report-month').value;
    const type = document.getElementById('report-type').value;
    updateProgressReport(classId);
    updateFalaDistribution(classId);
    updateDetailedReport(classId, type);
}
function updateProgressReport(classId) {
    const rep = generateProgressReport(classId);
    const cont = document.getElementById('progress-report');
    cont.innerHTML = `<p><strong>Média F.A.L.A:</strong> ${rep.averageFale.toFixed(1)}</p>
        <p><strong>Frequência média:</strong> ${rep.attendanceRate.toFixed(0)}%</p>
        <p><strong>Total de alunos:</strong> ${rep.totalStudents}</p>
        ${rep.classes.map(c => `<div class="mb-2"><div class="d-flex justify-content-between"><span>${c.className}</span><span>${c.averageFale.toFixed(1)}</span></div><div class="progress"><div class="progress-bar" style="width:${c.averageFale*25}%"></div></div></div>`).join('')}`;
}
function updateFalaDistribution(classId) {
    const rep = generateFalaReport(classId);
    const cont = document.getElementById('fale-distribution');
    cont.innerHTML = `<div class="row text-center">
        <div class="col-3"><span class="badge bg-O fs-6 p-2">Ótimo</span><h5>${rep.distribution.O||0}</h5></div>
        <div class="col-3"><span class="badge bg-MB fs-6 p-2">M.Bom</span><h5>${rep.distribution.MB||0}</h5></div>
        <div class="col-3"><span class="badge bg-B fs-6 p-2">Bom</span><h5>${rep.distribution.B||0}</h5></div>
        <div class="col-3"><span class="badge bg-R fs-6 p-2">Regular</span><h5>${rep.distribution.R||0}</h5></div>
    </div><hr><p><strong>Médias:</strong> F:${rep.averages.F.toFixed(1)} A:${rep.averages.A.toFixed(1)} L:${rep.averages.L.toFixed(1)} E:${rep.averages.E.toFixed(1)}</p>`;
}
function updateDetailedReport(classId, type) {
    const cont = document.getElementById('detailed-report');
    if (type === 'progress') {
        const rep = generateProgressReport(classId);
        cont.innerHTML = `<table class="table table-sm"><thead><tr><th>Turma</th><th>Alunos</th><th>Média F.A.L.A</th><th>Frequência</th></tr></thead><tbody>
            ${rep.classes.map(c => `<tr><td>${c.className}</td><td>${c.studentCount}</td><td>${c.averageFale.toFixed(1)}</td><td>${c.attendanceRate.toFixed(0)}%</td></tr>`).join('')}
        </tbody></table>`;
    } else if (type === 'attendance') {
        const rep = generateAttendanceReport(classId);
        cont.innerHTML = `<p><strong>Frequência geral:</strong> ${rep.overallAttendance.toFixed(1)}%</p>
            <table class="table table-sm"><thead><tr><th>Aluno</th><th>Turma</th><th>Presente</th><th>Ausente</th><th>Just.</th><th>Taxa</th></tr></thead><tbody>
            ${rep.students.map(s => `<tr><td>${s.studentName}</td><td>${s.className}</td><td>${s.present}</td><td>${s.absent}</td><td>${s.justified}</td><td>${s.attendanceRate.toFixed(0)}%</td></tr>`).slice(0,20).join('')}
        </tbody></table>`;
    } else if (type === 'fale') {
        const rep = generateFalaReport(classId);
        cont.innerHTML = `<table class="table table-sm"><thead><tr><th>Aluno</th><th>Turma</th><th>F</th><th>A</th><th>L</th><th>E</th><th>Média</th></tr></thead><tbody>
            ${rep.students.map(s => `<tr><td>${s.studentName}</td><td>${s.className}</td>
                <td><span class="fala-badge ${FALA_CLASSES[s.fala?.F]||''}">${s.fala?.F||'-'}</span></td>
                <td><span class="fala-badge ${FALA_CLASSES[s.fala?.A]||''}">${s.fala?.A||'-'}</span></td>
                <td><span class="fala-badge ${FALA_CLASSES[s.fala?.L]||''}">${s.fala?.L||'-'}</span></td>
                <td><span class="fala-badge ${FALA_CLASSES[s.fala?.E]||''}">${s.fala?.E||'-'}</span></td>
                <td>${s.average.toFixed(1)}</td></tr>`).slice(0,20).join('')}
        </tbody></table>`;
    }
}

// ---------- EXPORTAÇÃO PDF ----------
function exportReportPDF() {
    const type = document.getElementById('report-type').value;
    let title = '';
    if (type === 'progress') title = 'Relatório de Progresso';
    else if (type === 'attendance') title = 'Relatório de Frequência';
    else title = 'Relatório F.A.L.A';
    const content = document.getElementById('detailed-report').innerHTML;
    const progressHTML = document.getElementById('progress-report').innerHTML;
    const falaHTML = document.getElementById('fale-distribution').innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><title>${title}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>body{padding:20px;font-family:Poppins,sans-serif;}</style>
        </head><body>
        <h2>${title}</h2>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        <div class="row"><div class="col-md-6">${progressHTML}</div><div class="col-md-6">${falaHTML}</div></div>
        <hr>${content}
        <button class="btn btn-primary mt-3" onclick="window.print()">Imprimir/Salvar PDF</button>
        </body></html>
    `);
    win.document.close();
}
function exportLessonPDF() {
    const classId = parseInt(document.getElementById('lesson-class-select').value);
    const date = document.getElementById('lesson-date').value;
    if (!classId || !date) { showNotification('Selecione turma e data', 'warning'); return; }
    const cls = getClassById(classId);
    const lesson = getLesson(classId, date);
    const orderHTML = document.getElementById('attendance-order-list').innerHTML;
    const pairsHTML = document.getElementById('peer-suggestions').innerHTML;
    const notes = document.getElementById('lesson-notes').value;
    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><title>Planejamento - ${cls?.name} - ${date}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>body{padding:20px;}</style>
        </head><body>
        <h2>${cls?.name} - ${new Date(date+'T12:00:00').toLocaleDateString('pt-BR')}</h2>
        <h4>Ordem de Atendimento</h4>${orderHTML}
        <h4 class="mt-4">Peer Work</h4>${pairsHTML}
        <h4 class="mt-4">Observações</h4><p>${notes || 'Nenhuma'}</p>
        <button class="btn btn-primary mt-3" onclick="window.print()">Imprimir/Salvar PDF</button>
        </body></html>
    `);
    win.document.close();
}

// ---------- CONFIGURAÇÕES ----------
function updateSettingsSection() {
    document.getElementById('theme-select').value = AppState.settings.theme;
    document.getElementById('darkModeSwitch').checked = AppState.settings.theme === 'dark';
    document.getElementById('auto-save').checked = AppState.settings.autoSave;
    document.getElementById('notifications').checked = AppState.settings.notifications;
    document.getElementById('github-username').value = AppState.githubConfig.username || '';
    document.getElementById('github-repo').value = AppState.githubConfig.repo || '';
    document.getElementById('github-token').value = AppState.githubConfig.token || '';
}
function saveSettingsFromUI() {
    AppState.settings.theme = document.getElementById('theme-select').value;
    AppState.settings.autoSave = document.getElementById('auto-save').checked;
    AppState.settings.notifications = document.getElementById('notifications').checked;
    saveSettings();
    AppState.githubConfig.username = document.getElementById('github-username').value.trim();
    AppState.githubConfig.repo = document.getElementById('github-repo').value.trim();
    AppState.githubConfig.token = document.getElementById('github-token').value.trim();
    saveGitHubConfig();
    initTheme();
    showNotification('Configurações salvas', 'success');
}
function toggleDarkMode() {
    const isDark = document.getElementById('darkModeSwitch').checked;
    AppState.settings.theme = isDark ? 'dark' : 'light';
    saveSettings();
    initTheme();
}
function changeTheme() {
    AppState.settings.theme = document.getElementById('theme-select').value;
    saveSettings();
    initTheme();
}
function initTheme() {
    let theme = AppState.settings.theme;
    if (theme === 'auto') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.body.setAttribute('data-theme', theme);
    const sw = document.getElementById('darkModeSwitch');
    if (sw) sw.checked = theme === 'dark';
}

// ---------- GITHUB ----------
async function exportToGitHub() {
    if (!AppState.githubConfig.username || !AppState.githubConfig.repo) {
        showNotification('Configure usuário e repositório', 'warning');
        return false;
    }
    try {
        const data = { appData: AppState.data, settings: AppState.settings, exportedAt: new Date().toISOString() };
        const content = JSON.stringify(data, null, 2);
        const encoded = btoa(unescape(encodeURIComponent(content)));
        let url = `https://api.github.com/repos/${AppState.githubConfig.username}/${AppState.githubConfig.repo}/contents/data.json`;
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        if (AppState.githubConfig.token) headers['Authorization'] = `token ${AppState.githubConfig.token}`;
        let sha = null;
        try {
            const resp = await fetch(url, { headers });
            if (resp.ok) sha = (await resp.json()).sha;
        } catch(e) {}
        const body = { message: `Backup ${new Date().toLocaleString()}`, content: encoded, ...(sha && { sha }) };
        const put = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
        if (put.ok) { showNotification('Salvo no GitHub!', 'success'); return true; }
        else throw new Error((await put.json()).message);
    } catch(e) {
        showNotification('Erro GitHub: ' + e.message, 'error');
        return false;
    }
}
async function importFromGitHub() {
    if (!AppState.githubConfig.username || !AppState.githubConfig.repo) {
        showNotification('Configure usuário e repositório', 'warning');
        return false;
    }
    try {
        const url = `https://api.github.com/repos/${AppState.githubConfig.username}/${AppState.githubConfig.repo}/contents/data.json`;
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        if (AppState.githubConfig.token) headers['Authorization'] = `token ${AppState.githubConfig.token}`;
        const resp = await fetch(url, { headers });
        if (!resp.ok) throw new Error('Arquivo não encontrado');
        const file = await resp.json();
        const decoded = decodeURIComponent(escape(atob(file.content)));
        const data = JSON.parse(decoded);
        AppState.data = data.appData;
        AppState.settings = data.settings;
        saveData(); saveSettings();
        showNotification('Importado do GitHub!', 'success');
        updateUI();
        return true;
    } catch(e) {
        showNotification('Erro ao importar: ' + e.message, 'error');
        return false;
    }
}

// ---------- EXPORTAÇÃO/IMPORTAÇÃO ARQUIVO ----------
function exportData() {
    const data = { appData: AppState.data, settings: AppState.settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `english-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Dados exportados', 'success');
}
function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (!confirm('Substituir todos os dados atuais?')) return;
            if (!data.appData) throw new Error('Arquivo inválido');
            AppState.data = data.appData;
            AppState.settings = data.settings || DEFAULT_DATA.settings;
            saveData(); saveSettings();
            showNotification('Importado com sucesso!', 'success');
            updateUI();
        } catch(err) {
            showNotification('Erro no arquivo', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// Inicialização
document.addEventListener('DOMContentLoaded', initApp);
window.AppState = AppState;
window.getClasses = getClasses;
window.getStudents = getStudents;
window.saveData = saveData;
window.exportData = exportData;
