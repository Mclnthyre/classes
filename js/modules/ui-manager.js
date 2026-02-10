// js/modules/ui-manager.js

import { 
    getAppData, 
    saveData, 
    exportData, 
    importData,
    addClass, 
    updateClass, 
    deleteClass,
    addStudent, 
    updateStudent, 
    deleteStudent,
    markAttendance, 
    getAttendanceReport,
    confirmPeerWork,
    getPeerHistory
} from './data-manager.js';

import { 
    getLessonValue, 
    getLessonDisplay, 
    isEvenLessonValue,
    calculateAverage,
    getLessonType,
    formatLesson
} from '../utils/lesson-utils.js';

import { 
    generateAttendanceOrder, 
    generatePeerWorkSuggestions 
} from './planning-manager.js';

import { 
    getGitHubConfig, 
    saveGitHubConfig, 
    saveToGitHub, 
    loadFromGitHub,
    checkGitHubStatus
} from './github-service.js';

// Referência global para os dados
let appData;

/**
 * Inicializa a aplicação
 */
export function initApp() {
    // Carregar dados
    appData = getAppData();
    
    // Inicializar componentes
    setupDeleteConfirmations();
    setupAttendanceModal();
    setupGitHubConfig();
    
    // Atualizar UI inicial
    updateUI();
    updateCurrentDate();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Mostrar dashboard por padrão
    showSection('dashboard');
    
    // Atualizar data a cada minuto
    setInterval(updateCurrentDate, 60000);
    
    // Auto-save a cada 30 segundos
    setInterval(() => {
        if (document.getElementById('autoSave')?.checked) {
            saveData();
        }
    }, 30000);
}

/**
 * Gerencia a exibição de seções
 */
export function showSection(sectionId) {
    // Esconder todas as seções
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostrar a seção selecionada
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    }
    
    // Atualizar menu ativo
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Marcar item ativo no menu
    const activeItem = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    // Fechar sidebar no mobile
    if (window.innerWidth <= 992) {
        toggleSidebar();
    }
    
    // Atualizar conteúdo específico da seção
    switch(sectionId) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'classes':
            updateClassesList();
            break;
        case 'students':
            updateStudentsList();
            break;
        case 'lessons':
            updatePlanningSection();
            break;
        case 'reports':
            updateReportsSection();
            break;
        case 'attendance-report':
            renderAttendanceReport();
            break;
        case 'settings':
            updateSettingsSection();
            break;
        case 'week-view':
            updateWeekView();
            break;
    }
}

/**
 * Alterna sidebar em dispositivos móveis
 */
export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileSidebarOverlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    
    if (sidebar.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
}

/**
 * Mostra alerta
 */
export function showAlert(message, type = 'info', duration = 3000) {
    // Remover alertas anteriores
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert alert alert-${type} alert-dismissible fade show`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 500px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-dismiss após duration
    setTimeout(() => {
        if (alertDiv.parentNode) {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }
    }, duration);
}

/**
 * Mostra/oculta tela de carregamento
 */
export function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('d-none');
    } else {
        overlay.classList.add('d-none');
    }
}

/**
 * Atualiza a data atual no navbar
 */
export function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('pt-BR', options);
    }
}

/**
 * Atualiza toda a interface
 */
export function updateUI() {
    updateClassSelects();
    updateDashboard();
    updateClassesList();
    updateStudentsList();
    updateWeekView();
    updateNextClasses();
}

/**
 * Atualiza os selects de turmas
 */
export function updateClassSelects() {
    const selects = ['#studentClass', '#selectClassForPlanning', '#reportClassSelect', '#filterClass', '#attendanceClass'];
    
    selects.forEach(selector => {
        const select = document.querySelector(selector);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Selecione uma turma</option>';
            
            appData.classes.forEach(cls => {
                select.innerHTML += `<option value="${cls.id}">${cls.name}</option>`;
            });
            
            if (currentValue) {
                select.value = currentValue;
            }
        }
    });
}

/**
 * Atualiza o dashboard
 */
export function updateDashboard() {
    appData = getAppData();
    
    // Estatísticas
    document.getElementById('totalClasses').textContent = appData.classes.length;
    document.getElementById('totalStudents').textContent = appData.students.length;
    
    // Calcular aulas esta semana
    const today = new Date();
    const weekClasses = appData.classes.filter(cls => {
        return cls.days.some(day => {
            const dayIndex = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
                .indexOf(day.toLowerCase());
            return dayIndex >= 0;
        });
    }).length;
    document.getElementById('weekClasses').textContent = weekClasses;
    
    // Planejamentos pendentes (alunos sem próxima lição)
    const pendingPlanning = appData.students.filter(s => !s.nextLesson || s.nextLesson === '').length;
    document.getElementById('pendingPlanning').textContent = pendingPlanning;
    
    // Aula de hoje
    updateTodayClass();
    updateUpcomingClasses();
}

/**
 * Atualiza a aula de hoje
 */
function updateTodayClass() {
    const container = document.getElementById('todayClass');
    if (!container) return;
    
    const todayWeekday = new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
    const todayClasses = appData.classes.filter(cls => cls.days.includes(todayWeekday));
    
    if (todayClasses.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-emoji-smile display-4 text-muted"></i>
                <h5 class="mt-3">Nenhuma aula hoje!</h5>
                <p class="text-muted">Aproveite para planejar as próximas aulas</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="list-group">';
    todayClasses.forEach(cls => {
        const students = appData.students.filter(s => s.classId === cls.id);
        
        html += `
            <div class="list-group-item border-0">
                <h6>
                    <span class="class-badge" style="background:${cls.color};color:white;">
                        ${cls.name}
                    </span>
                </h6>
                <p class="mb-2">
                    <i class="bi bi-clock me-1"></i> ${cls.time} |
                    <i class="bi bi-people ms-2 me-1"></i> ${students.length} alunos
                </p>
                <button class="btn btn-sm btn-primary" onclick="showClassDetails(${cls.id})">
                    <i class="bi bi-eye me-1"></i> Ver Detalhes
                </button>
                <button class="btn btn-sm btn-success ms-2" onclick="openAttendanceModal(${cls.id})">
                    <i class="bi bi-calendar-check me-1"></i> Registrar Presenças
                </button>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

/**
 * Atualiza próximas aulas
 */
function updateUpcomingClasses() {
    const container = document.getElementById('upcomingClasses');
    const nextClasses = document.getElementById('nextClassesList');
    if (!container || !nextClasses) return;
    
    // Próximos 3 dias
    const upcoming = [];
    for (let i = 1; i <= 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
        
        const dayClasses = appData.classes.filter(cls => cls.days.includes(weekday));
        
        if (dayClasses.length > 0) {
            upcoming.push({
                date: date.toLocaleDateString('pt-BR'),
                weekday: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
                classes: dayClasses
            });
        }
    }
    
    if (upcoming.length === 0) {
        container.innerHTML = '<div class="text-center py-4"><p class="text-muted">Nenhuma aula nos próximos dias</p></div>';
        nextClasses.innerHTML = '<p class="text-muted small">Nenhuma aula agendada</p>';
        return;
    }
    
    // Dashboard
    let html = '<div class="list-group">';
    upcoming.slice(0, 2).forEach(day => {
        html += `
            <div class="list-group-item border-0">
                <h6 class="mb-1">${day.weekday} - ${day.date}</h6>
                ${day.classes.map(cls => `
                    <p class="mb-1 small">
                        <span class="badge" style="background:${cls.color}">${cls.name}</span>
                        às ${cls.time}
                    </p>
                `).join('')}
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
    
    // Sidebar
    let sidebarHtml = '';
    upcoming.forEach(day => {
        sidebarHtml += `
            <div class="mb-2">
                <div class="small text-muted">${day.weekday}</div>
                ${day.classes.map(cls => `
                    <div class="d-flex justify-content-between align-items-center mt-1">
                        <span class="small">${cls.name}</span>
                        <span class="small">${cls.time}</span>
                    </div>
                `).join('')}
            </div>
        `;
    });
    nextClasses.innerHTML = sidebarHtml;
}

/**
 * Atualiza lista de turmas
 */
export function updateClassesList() {
    const container = document.getElementById('classesList');
    if (!container) return;
    
    appData = getAppData();
    
    if (appData.classes.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-people display-1 text-muted"></i>
                <h5 class="mt-3">Nenhuma turma cadastrada</h5>
                <p class="text-muted">Clique em "Nova Turma" para começar</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    appData.classes.forEach(cls => {
        const studentCount = appData.students.filter(s => s.classId === cls.id).length;
        
        const card = document.createElement('div');
        card.className = 'card mb-3';
        card.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="mb-1">
                            <span class="class-badge" style="background:${cls.color};color:white;">
                                ${cls.name}
                            </span>
                        </h5>
                        <p class="text-muted mb-1">
                            <i class="bi bi-calendar-week me-1"></i>
                            ${cls.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                            às ${cls.time}
                        </p>
                        <p class="mb-0">
                            <i class="bi bi-people me-1"></i>
                            ${studentCount} aluno${studentCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary" onclick="showAddClassModal(${cls.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger ms-2" onclick="deleteClass(${cls.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * Atualiza lista de alunos
 */
export function updateStudentsList() {
    const container = document.getElementById('studentsList');
    if (!container) return;
    
    appData = getAppData();
    
    if (appData.students.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-person display-1 text-muted"></i>
                <h5 class="mt-3">Nenhum aluno cadastrado</h5>
                <p class="text-muted">Clique em "Novo Aluno" para começar</p>
            </div>
        `;
        return;
    }
    
    let filteredStudents = [...appData.students];
    const searchTerm = document.getElementById('searchStudent')?.value.toLowerCase() || '';
    const classFilter = document.getElementById('filterClass')?.value;
    const lessonFilter = document.getElementById('filterLesson')?.value;
    
    if (searchTerm) {
        filteredStudents = filteredStudents.filter(s => s.name.toLowerCase().includes(searchTerm));
    }
    if (classFilter) {
        filteredStudents = filteredStudents.filter(s => s.classId == classFilter);
    }
    if (lessonFilter) {
        filteredStudents = filteredStudents.filter(s => s.nextLesson == lessonFilter);
    }
    
    if (filteredStudents.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-search display-1 text-muted"></i>
                <h5 class="mt-3">Nenhum aluno encontrado</h5>
                <p class="text-muted">Tente alterar os filtros de busca</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    filteredStudents.forEach(student => {
        const cls = appData.classes.find(c => c.id == student.classId);
        const className = cls ? cls.name : 'Turma não encontrada';
        const classColor = cls ? cls.color : '#cccccc';
        const lessonValue = getLessonValue(student.nextLesson);
        const isReview = lessonValue >= 1000;
        const isEven = !isReview && (lessonValue % 2 === 0);
        const lessonType = isReview ? 'RW' : (isEven ? 'PAR' : 'ÍMPAR');
        const lessonClass = isReview ? 'lesson-review' : (isEven ? 'lesson-even' : 'lesson-odd');
        
        const studentItem = document.createElement('div');
        studentItem.className = `student-item ${lessonClass} mb-3 p-3 rounded`;
        studentItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">${student.name}</h6>
                    <p class="mb-1 text-muted small">
                        <span class="badge" style="background:${classColor};color:white;">
                            ${className}
                        </span>
                        <span class="ms-2">
                            Lição ${getLessonDisplay(student.nextLesson)} (${lessonType})
                        </span>
                    </p>
                    <div class="mt-2">
                        <span class="fale-badge fale-${student.fale.F}" title="Fluência">F</span>
                        <span class="fale-badge fale-${student.fale.A}" title="Pronúncia">A</span>
                        <span class="fale-badge fale-${student.fale.L}" title="Compreensão">L</span>
                        <span class="fale-badge fale-${student.fale.E}" title="Expressão">E</span>
                        <span class="ms-2 small">
                            Média: ${student.average.toFixed(1)}
                        </span>
                    </div>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-primary" onclick="showAddStudentModal(${student.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger ms-2" onclick="deleteStudent(${student.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(studentItem);
    });
}

/**
 * Atualiza a visão semanal
 */
export function updateWeekView() {
    const weekDays = document.getElementById('weekDays');
    if (!weekDays) return;
    
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    
    weekDays.innerHTML = '';
    days.forEach(day => {
        const dayClasses = appData.classes.filter(cls => 
            cls.days.map(d => d.toLowerCase()).includes(day.toLowerCase())
        );
        
        const col = document.createElement('div');
        col.className = 'col';
        col.innerHTML = `
            <div class="card h-100">
                <div class="card-header">
                    <h6 class="mb-0">${day}</h6>
                </div>
                <div class="card-body">
                    ${dayClasses.length > 0 ? 
                        dayClasses.map(cls => `
                            <div class="mb-2">
                                <div class="small">${cls.name}</div>
                                <div class="text-muted small">${cls.time}</div>
                            </div>
                        `).join('') : 
                        '<p class="text-muted small">Nenhuma aula</p>'
                    }
                </div>
            </div>
        `;
        weekDays.appendChild(col);
    });
}

/**
 * Atualiza seção de planejamento
 */
function updatePlanningSection() {
    const selectClass = document.getElementById('selectClassForPlanning');
    const planningDate = document.getElementById('planningDate');
    
    if (planningDate && !planningDate.value) {
        planningDate.value = new Date().toISOString().split('T')[0];
    }
    
    if (selectClass && selectClass.value) {
        generateAttendanceOrder();
    }
}

/**
 * Atualiza seção de relatórios
 */
function updateReportsSection() {
    // Implementar se necessário
}

/**
 * Atualiza seção de configurações
 */
function updateSettingsSection() {
    const config = getGitHubConfig();
    if (config) {
        document.getElementById('githubUsername').value = config.username || '';
        document.getElementById('githubRepo').value = config.repo || '';
        document.getElementById('githubToken').value = config.token || '';
    }
}

/**
 * Configura event listeners
 */
function setupEventListeners() {
    // Busca de alunos
    const searchStudent = document.getElementById('searchStudent');
    if (searchStudent) {
        searchStudent.addEventListener('input', updateStudentsList);
    }
    
    // Filtro de turma
    const filterClass = document.getElementById('filterClass');
    if (filterClass) {
        filterClass.addEventListener('change', function() {
            updateStudentsList();
            updateLessonFilter();
        });
    }
    
    // Filtro de lições
    const filterLesson = document.getElementById('filterLesson');
    if (filterLesson) {
        filterLesson.addEventListener('change', updateStudentsList);
    }
    
    // Configurações
    const autoSave = document.getElementById('autoSave');
    if (autoSave) {
        autoSave.addEventListener('change', function() {
            appData.settings = appData.settings || {};
            appData.settings.autoSave = this.checked;
            saveData();
        });
    }
    
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            document.body.setAttribute('data-theme', this.value);
            appData.settings = appData.settings || {};
            appData.settings.theme = this.value;
            saveData();
        });
    }
}

/**
 * Atualiza filtro de lições
 */
export function updateLessonFilter() {
    const filter = document.getElementById('filterLesson');
    if (!filter) return;
    
    const currentValue = filter.value;
    const classFilter = document.getElementById('filterClass')?.value;
    
    let students = appData.students;
    if (classFilter) {
        students = students.filter(s => s.classId == classFilter);
    }
    
    const lessons = [...new Set(students.map(s => s.nextLesson))].sort((a, b) => {
        const aVal = getLessonValue(a);
        const bVal = getLessonValue(b);
        return aVal - bVal;
    });
    
    filter.innerHTML = '<option value="">Todas as lições</option>';
    lessons.forEach(lesson => {
        filter.innerHTML += `<option value="${lesson}">Lição ${getLessonDisplay(lesson)}</option>`;
    });
    
    if (currentValue && lessons.includes(currentValue)) {
        filter.value = currentValue;
    }
}

/**
 * Atualiza próximas aulas no sidebar
 */
function updateNextClasses() {
    const nextClasses = document.getElementById('nextClassesList');
    if (!nextClasses) return;
    
    const today = new Date();
    const nextClassesData = [];
    
    for (let i = 1; i <= 5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
        
        const dayClasses = appData.classes.filter(cls => cls.days.includes(weekday));
        if (dayClasses.length > 0) {
            dayClasses.forEach(cls => {
                nextClassesData.push({
                    day: weekday.charAt(0).toUpperCase() + weekday.slice(1),
                    time: cls.time,
                    name: cls.name,
                    color: cls.color
                });
            });
        }
    }
    
    if (nextClassesData.length === 0) {
        nextClasses.innerHTML = '<p class="text-muted small">Nenhuma aula agendada</p>';
        return;
    }
    
    let html = '';
    nextClassesData.slice(0, 3).forEach(cls => {
        html += `
            <div class="mb-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="small">${cls.name}</span>
                    </div>
                    <div>
                        <span class="badge small" style="background:${cls.color}">${cls.time}</span>
                    </div>
                </div>
            </div>
        `;
    });
    nextClasses.innerHTML = html;
}

/**
 * Gera ordem de atendimento
 */
window.generateAttendanceOrder = function() {
    const classId = document.getElementById('selectClassForPlanning')?.value;
    if (!classId) {
        showAlert('Selecione uma turma primeiro!', 'warning');
        return;
    }
    
    const orderContainer = document.getElementById('attendanceOrder');
    const pairsContainer = document.getElementById('peerWorkPairs');
    
    if (!orderContainer || !pairsContainer) return;
    
    const students = appData.students.filter(s => s.classId == classId);
    if (students.length === 0) {
        orderContainer.innerHTML = '<p class="text-muted">Nenhum aluno nesta turma</p>';
        pairsContainer.innerHTML = '<p class="text-muted">Nenhum par sugerido</p>';
        return;
    }
    
    // Gerar ordem
    const orderedStudents = generateAttendanceOrder(students);
    
    // Exibir ordem
    let orderHtml = '<div class="list-group">';
    orderedStudents.forEach((student, index) => {
        const lessonValue = getLessonValue(student.nextLesson);
        const isReview = lessonValue >= 1000;
        const isEven = !isReview && (lessonValue % 2 === 0);
        const badgeClass = isReview ? 'bg-purple' : (isEven ? 'bg-success' : 'bg-pink');
        
        orderHtml += `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <span class="badge ${badgeClass} me-2">${index + 1}</span>
                    ${student.name}
                </div>
                <div>
                    <span class="badge bg-light text-dark">Lição ${getLessonDisplay(student.nextLesson)}</span>
                </div>
            </div>
        `;
    });
    orderHtml += '</div>';
    orderContainer.innerHTML = orderHtml;
    
    // Gerar sugestões de pares
    const pairs = generatePeerWorkSuggestions(students);
    
    // Exibir pares
    let pairsHtml = '<div class="list-group">';
    pairs.forEach(pair => {
        pairsHtml += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div>${pair.student1.name}</div>
                        <div>${pair.student2.name}</div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-success" onclick="confirmPeerWork(${pair.student1.id}, ${pair.student2.id})">
                            <i class="bi bi-check"></i> Confirmar
                        </button>
                    </div>
                </div>
                <div class="small text-muted mt-1">
                    Diferença: ${pair.difference} lições
                </div>
            </div>
        `;
    });
    pairsHtml += '</div>';
    pairsContainer.innerHTML = pairsHtml;
};

/**
 * Modal para adicionar/editar turma
 */
window.showAddClassModal = function(classId = null) {
    const modal = new bootstrap.Modal(document.getElementById('addClassModal'));
    const modalTitle = document.getElementById('classModalTitle');
    const editClassId = document.getElementById('editClassId');
    const className = document.getElementById('className');
    const classTime = document.getElementById('classTime');
    const classColor = document.getElementById('classColor');
    
    // Resetar checkboxes
    ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'].forEach(day => {
        const checkbox = document.getElementById(`day${day.charAt(0).toUpperCase() + day.slice(1)}`);
        if (checkbox) checkbox.checked = false;
    });
    
    if (classId) {
        // Editar turma existente
        const cls = appData.classes.find(c => c.id == classId);
        if (cls) {
            modalTitle.textContent = 'Editar Turma';
            editClassId.value = cls.id;
            className.value = cls.name;
            classTime.value = cls.time;
            classColor.value = cls.color;
            
            cls.days.forEach(day => {
                const checkbox = document.getElementById(`day${day.charAt(0).toUpperCase() + day.slice(1)}`);
                if (checkbox) checkbox.checked = true;
            });
        }
    } else {
        // Nova turma
        modalTitle.textContent = 'Nova Turma';
        editClassId.value = '';
        className.value = '';
        classTime.value = '16:00';
        classColor.value = '#3498db';
    }
    
    modal.show();
};

/**
 * Salvar turma
 */
window.saveClass = function() {
    const editClassId = document.getElementById('editClassId').value;
    const className = document.getElementById('className').value;
    const classTime = document.getElementById('classTime').value;
    const classColor = document.getElementById('classColor').value;
    
    // Coletar dias selecionados
    const days = [];
    ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'].forEach(day => {
        const checkbox = document.getElementById(`day${day.charAt(0).toUpperCase() + day.slice(1)}`);
        if (checkbox && checkbox.checked) {
            days.push(day);
        }
    });
    
    if (!className || days.length === 0 || !classTime) {
        showAlert('Preencha todos os campos obrigatórios!', 'warning');
        return;
    }
    
    const classData = {
        name: className,
        days: days,
        time: classTime,
        color: classColor
    };
    
    if (editClassId) {
        // Atualizar turma existente
        updateClass(parseInt(editClassId), classData);
        showAlert('Turma atualizada com sucesso!', 'success');
    } else {
        // Criar nova turma
        addClass(classData);
        showAlert('Turma criada com sucesso!', 'success');
    }
    
    updateUI();
    bootstrap.Modal.getInstance(document.getElementById('addClassModal')).hide();
};

/**
 * Excluir turma
 */
window.deleteClass = function(classId) {
    if (confirm('Tem certeza que deseja excluir esta turma? Todos os alunos desta turma também serão excluídos.')) {
        if (confirm('CONFIRMAÇÃO FINAL: Esta ação não pode ser desfeita. Continuar?')) {
            deleteClass(classId);
            showAlert('Turma excluída com sucesso!', 'success');
            updateUI();
        }
    }
};

/**
 * Modal para adicionar/editar aluno
 */
window.showAddStudentModal = function(studentId = null) {
    const modal = new bootstrap.Modal(document.getElementById('addStudentModal'));
    const modalTitle = document.getElementById('studentModalTitle');
    const editStudentId = document.getElementById('editStudentId');
    const studentName = document.getElementById('studentName');
    const studentClass = document.getElementById('studentClass');
    const lastLesson = document.getElementById('lastLesson');
    const nextLesson = document.getElementById('nextLesson');
    const scoreF = document.getElementById('scoreF');
    const scoreA = document.getElementById('scoreA');
    const scoreL = document.getElementById('scoreL');
    const scoreE = document.getElementById('scoreE');
    
    // Atualizar select de turmas
    updateClassSelects();
    
    if (studentId) {
        // Editar aluno existente
        const student = appData.students.find(s => s.id == studentId);
        if (student) {
            modalTitle.textContent = 'Editar Aluno';
            editStudentId.value = student.id;
            studentName.value = student.name;
            studentClass.value = student.classId;
            lastLesson.value = student.lastLesson;
            nextLesson.value = student.nextLesson;
            scoreF.value = student.fale.F;
            scoreA.value = student.fale.A;
            scoreL.value = student.fale.L;
            scoreE.value = student.fale.E;
            updateAverageDisplay();
        }
    } else {
        // Novo aluno
        modalTitle.textContent = 'Novo Aluno';
        editStudentId.value = '';
        studentName.value = '';
        studentClass.value = '';
        lastLesson.value = '';
        nextLesson.value = '';
        scoreF.value = 'B';
        scoreA.value = 'B';
        scoreL.value = 'B';
        scoreE.value = 'B';
        updateAverageDisplay();
    }
    
    modal.show();
};

/**
 * Atualiza exibição da média
 */
function updateAverageDisplay() {
    const fScore = document.getElementById('scoreF').value;
    const aScore = document.getElementById('scoreA').value;
    const lScore = document.getElementById('scoreL').value;
    const eScore = document.getElementById('scoreE').value;
    
    const average = calculateAverage(fScore, aScore, lScore, eScore);
    const averageElement = document.getElementById('calculatedAverage');
    
    let description = '';
    if (average >= 3.5) description = 'Ótimo';
    else if (average >= 2.5) description = 'Muito Bom';
    else if (average >= 1.5) description = 'Bom';
    else description = 'Regular';
    
    averageElement.textContent = `${description} (${average.toFixed(1)})`;
}

// Adicionar listeners para atualizar a média
document.addEventListener('DOMContentLoaded', function() {
    ['scoreF', 'scoreA', 'scoreL', 'scoreE'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updateAverageDisplay);
        }
    });
});

/**
 * Salvar aluno
 */
window.saveStudent = function() {
    const editStudentId = document.getElementById('editStudentId').value;
    const studentName = document.getElementById('studentName').value;
    const studentClass = document.getElementById('studentClass').value;
    const lastLesson = document.getElementById('lastLesson').value;
    const nextLesson = document.getElementById('nextLesson').value;
    const scoreF = document.getElementById('scoreF').value;
    const scoreA = document.getElementById('scoreA').value;
    const scoreL = document.getElementById('scoreL').value;
    const scoreE = document.getElementById('scoreE').value;
    
    if (!studentName || !studentClass || !nextLesson) {
        showAlert('Preencha todos os campos obrigatórios!', 'warning');
        return;
    }
    
    const studentData = {
        name: studentName,
        classId: parseInt(studentClass),
        lastLesson: lastLesson || nextLesson,
        nextLesson: nextLesson,
        fale: {
            F: scoreF,
            A: scoreA,
            L: scoreL,
            E: scoreE
        },
        average: calculateAverage(scoreF, scoreA, scoreL, scoreE),
        attendance: [],
        peerHistory: []
    };
    
    if (editStudentId) {
        // Atualizar aluno existente
        updateStudent(parseInt(editStudentId), studentData);
        showAlert('Aluno atualizado com sucesso!', 'success');
    } else {
        // Criar novo aluno
        addStudent(studentData);
        showAlert('Aluno criado com sucesso!', 'success');
    }
    
    updateUI();
    bootstrap.Modal.getInstance(document.getElementById('addStudentModal')).hide();
};

/**
 * Excluir aluno
 */
window.deleteStudent = function(studentId) {
    const student = appData.students.find(s => s.id == studentId);
    if (!student) return;
    
    if (confirm(`Tem certeza que deseja excluir o aluno "${student.name}"?`)) {
        if (confirm('CONFIRMAÇÃO FINAL: Esta ação não pode ser desfeita. Continuar?')) {
            deleteStudent(studentId);
            showAlert('Aluno excluído com sucesso!', 'success');
            updateUI();
        }
    }
};

/**
 * Mostrar detalhes da turma
 */
window.showClassDetails = function(classId) {
    const modal = new bootstrap.Modal(document.getElementById('classDetailsModal'));
    const classObj = appData.classes.find(c => c.id == classId);
    const students = appData.students.filter(s => s.classId == classId);
    
    if (!classObj) return;
    
    document.getElementById('classDetailsTitle').textContent = classObj.name;
    document.getElementById('classDetailsName').textContent = classObj.name;
    
    const classActions = document.getElementById('classActions');
    classActions.innerHTML = '';
    
    // Botão de presenças
    const attendanceBtn = document.createElement('button');
    attendanceBtn.className = 'btn btn-info btn-sm';
    attendanceBtn.innerHTML = '<i class="bi bi-calendar-check"></i> Presenças';
    attendanceBtn.onclick = () => openAttendanceModal(classId);
    classActions.appendChild(attendanceBtn);
    
    // Botão de planejamento
    const planningBtn = document.createElement('button');
    planningBtn.className = 'btn btn-primary btn-sm ms-2';
    planningBtn.innerHTML = '<i class="bi bi-journal-check"></i> Planejar';
    planningBtn.onclick = () => {
        showSection('lessons');
        document.getElementById('selectClassForPlanning').value = classId;
        generateAttendanceOrder();
        modal.hide();
    };
    classActions.appendChild(planningBtn);
    
    // Listar alunos
    const studentsList = document.getElementById('classStudentsList');
    if (students.length === 0) {
        studentsList.innerHTML = '<p class="text-muted">Nenhum aluno nesta turma</p>';
    } else {
        let html = '<div class="list-group">';
        students.forEach(student => {
            const lessonValue = getLessonValue(student.nextLesson);
            const isReview = lessonValue >= 1000;
            const isEven = !isReview && (lessonValue % 2 === 0);
            const lessonType = isReview ? 'RW' : (isEven ? 'PAR' : 'ÍMPAR');
            
            html += `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${student.name}</h6>
                            <p class="mb-1 small text-muted">
                                Lição ${getLessonDisplay(student.nextLesson)} (${lessonType})
                            </p>
                            <div>
                                <span class="fale-badge fale-${student.fale.F}" title="Fluência">F</span>
                                <span class="fale-badge fale-${student.fale.A}" title="Pronúncia">A</span>
                                <span class="fale-badge fale-${student.fale.L}" title="Compreensão">L</span>
                                <span class="fale-badge fale-${student.fale.E}" title="Expressão">E</span>
                            </div>
                        </div>
                        <div>
                            <span class="badge bg-light text-dark">Média: ${student.average.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        studentsList.innerHTML = html;
    }
    
    modal.show();
};

/**
 * Funções de Presença
 */
export function setupAttendanceModal() {
    // Criar modal de presença dinamicamente
    const modalHTML = `
        <div class="modal fade" id="attendanceModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Registrar Presenças</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="attendanceDate" class="form-label">Data</label>
                            <input type="date" id="attendanceDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="table-responsive">
                            <table class="table table-hover" id="attendanceTable">
                                <thead>
                                    <tr>
                                        <th>Aluno</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="attendanceList">
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="saveAllAttendance">Salvar Todas</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.openAttendanceModal = function(classId) {
    const modal = document.getElementById('attendanceModal');
    const bsModal = new bootstrap.Modal(modal);
    
    const students = appData.students.filter(s => s.classId === classId);
    const classObj = appData.classes.find(c => c.id === classId);
    
    if (!classObj || students.length === 0) {
        showAlert('Turma não encontrada ou sem alunos!', 'danger');
        return;
    }
    
    document.querySelector('#attendanceModal .modal-title').textContent = `Presenças - ${classObj.name}`;
    
    const dateInput = document.getElementById('attendanceDate');
    const attendanceList = document.getElementById('attendanceList');
    const selectedDate = dateInput.value;
    
    // Preencher lista de alunos
    attendanceList.innerHTML = '';
    students.forEach(student => {
        const existingAttendance = student.attendance?.find(a => a.date === selectedDate);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>
                <select class="form-select form-select-sm attendance-status" data-student-id="${student.id}">
                    <option value="present" ${existingAttendance?.status === 'present' ? 'selected' : ''}>Presente</option>
                    <option value="absent" ${existingAttendance?.status === 'absent' ? 'selected' : ''}>Ausente</option>
                    <option value="excused" ${existingAttendance?.status === 'excused' ? 'selected' : ''}>Justificado</option>
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-success save-single-attendance" data-student-id="${student.id}">
                    <i class="bi bi-check"></i> Salvar
                </button>
            </td>
        `;
        attendanceList.appendChild(row);
    });
    
    // Atualizar quando a data mudar
    dateInput.addEventListener('change', () => {
        openAttendanceModal(classId);
    });
    
    // Salvar individual
    document.querySelectorAll('.save-single-attendance').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = parseInt(this.dataset.studentId);
            const status = document.querySelector(`select[data-student-id="${studentId}"]`).value;
            
            if (markAttendance(studentId, selectedDate, status)) {
                showAlert('Presença salva com sucesso!', 'success');
                this.innerHTML = '<i class="bi bi-check-all"></i> Salvo';
                this.classList.remove('btn-success');
                this.classList.add('btn-secondary');
                this.disabled = true;
            }
        });
    });
    
    // Salvar todas
    document.getElementById('saveAllAttendance').onclick = () => {
        let saved = 0;
        students.forEach(student => {
            const status = document.querySelector(`select[data-student-id="${student.id}"]`).value;
            if (markAttendance(student.id, selectedDate, status)) {
                saved++;
            }
        });
        
        showAlert(`${saved} presenças salvas com sucesso!`, 'success');
        bsModal.hide();
    };
    
    bsModal.show();
};

/**
 * Relatório de Frequência
 */
export function renderAttendanceReport() {
    const container = document.getElementById('attendanceReportContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="card-title mb-0">Relatório de Frequência</h5>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-4">
                        <label for="attendanceClass" class="form-label">Turma</label>
                        <select id="attendanceClass" class="form-select">
                            <option value="">Todas as Turmas</option>
                            ${appData.classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label for="startDate" class="form-label">Data Inicial</label>
                        <input type="date" id="startDate" class="form-control" value="${new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]}">
                    </div>
                    <div class="col-md-4">
                        <label for="endDate" class="form-label">Data Final</label>
                        <input type="date" id="endDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
                <button id="generateAttendanceReport" class="btn btn-primary">
                    <i class="bi bi-graph-up"></i> Gerar Relatório
                </button>
                <div id="reportResults" class="mt-4"></div>
            </div>
        </div>
    `;
    
    document.getElementById('generateAttendanceReport').addEventListener('click', generateAttendanceReport);
}

function generateAttendanceReport() {
    const classId = document.getElementById('attendanceClass').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        showAlert('Selecione as datas!', 'warning');
        return;
    }
    
    const report = getAttendanceReport(classId ? parseInt(classId) : null, startDate, endDate);
    const resultsDiv = document.getElementById('reportResults');
    
    let html = `
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h6 class="mb-0">Resumo Geral</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3">
                        <div class="card bg-success text-white mb-3">
                            <div class="card-body text-center">
                                <h4 class="card-title">${report.summary.totalPresent}</h4>
                                <p class="card-text">Presentes</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-danger text-white mb-3">
                            <div class="card-body text-center">
                                <h4 class="card-title">${report.summary.totalAbsent}</h4>
                                <p class="card-text">Ausentes</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-warning text-dark mb-3">
                            <div class="card-body text-center">
                                <h4 class="card-title">${report.summary.totalExcused}</h4>
                                <p class="card-text">Justificados</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-info text-white mb-3">
                            <div class="card-body text-center">
                                <h4 class="card-title">${report.summary.attendanceRate.toFixed(1)}%</h4>
                                <p class="card-text">Taxa de Presença</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card mt-4">
            <div class="card-header">
                <h6 class="mb-0">Detalhes por Aluno</h6>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Aluno</th>
                                <th>Presente</th>
                                <th>Ausente</th>
                                <th>Justificado</th>
                                <th>Taxa</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    report.students.forEach(student => {
        const totalClasses = student.totals.present + student.totals.absent + student.totals.excused;
        const attendanceRate = totalClasses > 0 ? (student.totals.present / totalClasses) * 100 : 0;
        let statusClass = 'success';
        
        if (attendanceRate < 75) statusClass = 'danger';
        else if (attendanceRate < 85) statusClass = 'warning';
        
        html += `
            <tr>
                <td>${student.name}</td>
                <td><span class="badge bg-success">${student.totals.present}</span></td>
                <td><span class="badge bg-danger">${student.totals.absent}</span></td>
                <td><span class="badge bg-warning">${student.totals.excused}</span></td>
                <td>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar bg-${statusClass}" 
                             style="width: ${attendanceRate}%">
                            ${attendanceRate.toFixed(1)}%
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge bg-${statusClass}">
                        ${attendanceRate >= 85 ? 'Ótimo' : attendanceRate >= 75 ? 'Atenção' : 'Crítico'}
                    </span>
                </td>
            </tr>
        `;
    });
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
}

/**
 * Confirmar peer work
 */
window.confirmPeerWork = function(student1Id, student2Id) {
    if (confirm('Confirmar este peer work? Isso será salvo no histórico dos alunos.')) {
        if (confirmPeerWork(student1Id, student2Id)) {
            showAlert('Peer work confirmado e salvo no histórico!', 'success');
            // Atualizar a interface
            generateAttendanceOrder();
        }
    }
};

/**
 * Configurar confirmações de exclusão
 */
export function setupDeleteConfirmations() {
    // As funções deleteClass e deleteStudent já estão configuradas
    // com confirmações duplas em suas implementações acima
}

/**
 * Configurar GitHub
 */
function setupGitHubConfig() {
    const config = getGitHubConfig();
    if (config) {
        const usernameInput = document.getElementById('githubUsername');
        const repoInput = document.getElementById('githubRepo');
        const tokenInput = document.getElementById('githubToken');
        
        if (usernameInput) usernameInput.value = config.username || '';
        if (repoInput) repoInput.value = config.repo || '';
        if (tokenInput) tokenInput.value = config.token || '';
    }
}

/**
 * Salvar configuração do GitHub
 */
window.saveGitHubConfig = function() {
    const username = document.getElementById('githubUsername').value;
    const repo = document.getElementById('githubRepo').value;
    const token = document.getElementById('githubToken').value;
    
    if (!username || !repo || !token) {
        showAlert('Preencha todos os campos do GitHub!', 'warning');
        return;
    }
    
    saveGitHubConfig({ username, repo, token });
    showAlert('Configuração do GitHub salva com sucesso!', 'success');
};

/**
 * Exportar dados
 */
window.exportData = exportData;

/**
 * Importar dados
 */
window.importData = importData;

/**
 * Salvar no GitHub
 */
window.saveToGitHub = async function() {
    showLoading(true);
    const result = await saveToGitHub(appData, 'Backup automático - ' + new Date().toLocaleString());
    showLoading(false);
    
    if (result.success) {
        showAlert('Backup salvo com sucesso no GitHub!', 'success');
    } else {
        showAlert(`Erro ao salvar no GitHub: ${result.error}`, 'danger');
    }
};

/**
 * Carregar do GitHub
 */
window.loadFromGitHub = async function() {
    if (!confirm('Isso substituirá todos os dados locais. Continuar?')) {
        return;
    }
    
    showLoading(true);
    const result = await loadFromGitHub();
    showLoading(false);
    
    if (result.success) {
        showAlert('Dados carregados com sucesso do GitHub!', 'success');
        appData = getAppData();
        updateUI();
    } else {
        showAlert(`Erro ao carregar do GitHub: ${result.error}`, 'danger');
    }
};

/**
 * Selecionar cor
 */
window.selectColor = function(color) {
    document.getElementById('classColor').value = color;
    document.querySelectorAll('.color-picker').forEach(picker => {
        picker.classList.remove('selected');
        if (picker.style.backgroundColor === color || 
            picker.getAttribute('data-color') === color) {
            picker.classList.add('selected');
        }
    });
};

// Inicializar seletores de cor quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    const colorPickers = document.querySelectorAll('.color-picker');
    colorPickers.forEach(picker => {
        const color = picker.style.backgroundColor;
        picker.setAttribute('data-color', color);
        picker.addEventListener('click', function() {
            selectColor(color);
        });
    });
});
