// js/modules/ui-manager.js

import { getAppData, saveData } from './data-manager.js';
import { getLessonValue, getLessonDisplay, isEvenLessonValue } from '../utils/lesson-utils.js';

/**
 * Gerencia a exibição de seções
 */
export function showSection(sectionId) {
    $('.section-content').addClass('d-none');
    $(`#${sectionId}`).removeClass('d-none');
    
    // Fechar sidebar no mobile
    if (window.innerWidth <= 992) {
        toggleSidebar();
    }
}

/**
 * Alterna sidebar em dispositivos móveis
 */
export function toggleSidebar() {
    const sidebar = $('#sidebar');
    const overlay = $('#mobileSidebarOverlay');
    sidebar.toggleClass('active');
    overlay.toggleClass('active');
    
    if (sidebar.hasClass('active')) {
        $('body').css('overflow', 'hidden');
    } else {
        $('body').css('overflow', 'auto');
    }
}

/**
 * Mostra/oculta tela de carregamento
 */
export function showLoading(show) {
    if (show) {
        $('#loadingOverlay').removeClass('d-none');
    } else {
        $('#loadingOverlay').addClass('d-none');
    }
}

/**
 * Mostra notificação do GitHub
 */
export function showGitHubStatus(message, type = 'success') {
    const status = $('#githubStatus');
    status.removeClass('success error').addClass(type);
    $('#githubStatusText').text(message);
    status.fadeIn();
    
    setTimeout(() => {
        status.fadeOut();
    }, 3000);
}

/**
 * Atualiza a data atual no navbar
 */
export function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    $('#currentDate').text(now.toLocaleDateString('pt-BR', options));
}

/**
 * Atualiza os selects de turmas
 */
export function updateClassSelects() {
    const selects = ['#studentClass', '#selectClassForPlanning', '#reportClassSelect', '#filterClass'];
    const appData = getAppData();
    
    selects.forEach(selector => {
        const select = $(selector);
        const currentValue = select.val();
        select.empty().append('<option value="">Selecione uma turma</option>');
        
        appData.classes.forEach(cls => {
            select.append(`<option value="${cls.id}">${cls.name}</option>`);
        });
        
        if (currentValue) {
            select.val(currentValue);
        }
    });
}

/**
 * Atualiza filtro de lições
 */
export function updateLessonFilter() {
    const filter = $('#filterLesson');
    const currentValue = filter.val();
    const classFilter = $('#filterClass').val();
    const appData = getAppData();
    
    let students = appData.students;
    if (classFilter) {
        students = students.filter(s => s.classId == classFilter);
    }
    
    const lessons = [...new Set(students.map(s => s.nextLesson))].sort((a, b) => {
        const aVal = getLessonValue(a);
        const bVal = getLessonValue(b);
        return aVal - bVal;
    });
    
    filter.empty().append('<option value="">Todas as lições</option>');
    lessons.forEach(lesson => {
        filter.append(`<option value="${lesson}">Lição ${getLessonDisplay(lesson)}</option>`);
    });
    
    if (currentValue && lessons.includes(currentValue)) {
        filter.val(currentValue);
    }
}

/**
 * Atualiza o dashboard
 */
export function updateDashboard() {
    const appData = getAppData();
    
    // Estatísticas
    $('#totalClasses').text(appData.classes.length);
    $('#totalStudents').text(appData.students.length);
    $('#weekClasses').text('3'); // Temporário
    $('#pendingPlanning').text('0'); // Temporário
    
    // Aula de hoje
    updateTodayClass();
    updateUpcomingClasses();
}

/**
 * Atualiza a aula de hoje
 */
function updateTodayClass() {
    const container = $('#todayClass');
    const todayWeekday = new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
    const appData = getAppData();
    const todayClasses = appData.classes.filter(cls => cls.days.includes(todayWeekday));
    
    if (todayClasses.length === 0) {
        container.html(`
            <div class="text-center py-4">
                <i class="bi bi-emoji-smile display-4 text-muted"></i>
                <h5 class="mt-3">Nenhuma aula hoje!</h5>
                <p class="text-muted">Aproveite para planejar as próximas aulas</p>
            </div>
        `);
        return;
    }
    
    let html = '<div class="list-group">';
    todayClasses.forEach(cls => {
        const students = appData.students.filter(s => s.classId == cls.id);
        
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
                <button class="btn btn-sm btn-primary" onclick="planLesson(${cls.id})">
                    <i class="bi bi-pencil-square me-1"></i> Planejar Aula
                </button>
            </div>
        `;
    });
    html += '</div>';
    
    container.html(html);
}

/**
 * Atualiza próximas aulas
 */
function updateUpcomingClasses() {
    const container = $('#upcomingClasses');
    const nextClasses = $('#nextClassesList');
    const appData = getAppData();
    
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
        container.html('<div class="text-center py-4"><p class="text-muted">Nenhuma aula nos próximos dias</p></div>');
        nextClasses.html('<p class="text-muted small">Nenhuma aula agendada</p>');
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
    container.html(html);
    
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
    nextClasses.html(sidebarHtml);
}

/**
 * Atualiza lista de turmas
 */
export function updateClassesList() {
    const container = $('#classesList');
    const appData = getAppData();
    
    if (appData.classes.length === 0) {
        container.html(`
            <div class="text-center py-5">
                <i class="bi bi-people display-1 text-muted"></i>
                <h5 class="mt-3">Nenhuma turma cadastrada</h5>
                <p class="text-muted">Clique em "Nova Turma" para começar</p>
            </div>
        `);
        return;
    }
    
    appData.classes.forEach(cls => {
        const studentCount = appData.students.filter(s => s.classId == cls.id).length;
        
        container.append(`
            <div class="card mb-3">
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
            </div>
        `);
    });
}

/**
 * Atualiza lista de alunos
 */
export function updateStudentsList() {
    const container = $('#studentsList');
    const appData = getAppData();
    
    if (appData.students.length === 0) {
        container.html(`
            <div class="text-center py-5">
                <i class="bi bi-person display-1 text-muted"></i>
                <h5 class="mt-3">Nenhum aluno cadastrado</h5>
                <p class="text-muted">Clique em "Novo Aluno" para começar</p>
            </div>
        `);
        return;
    }
    
    let filteredStudents = [...appData.students];
    const searchTerm = $('#searchStudent').val().toLowerCase();
    const classFilter = $('#filterClass').val();
    const lessonFilter = $('#filterLesson').val();
    
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
        container.html(`
            <div class="text-center py-5">
                <i class="bi bi-search display-1 text-muted"></i>
                <h5 class="mt-3">Nenhum aluno encontrado</h5>
                <p class="text-muted">Tente alterar os filtros de busca</p>
            </div>
        `);
        return;
    }
    
    filteredStudents.forEach(student => {
        const cls = appData.classes.find(c => c.id == student.classId);
        const className = cls ? cls.name : 'Turma não encontrada';
        const classColor = cls ? cls.color : '#cccccc';
        const lessonValue = getLessonValue(student.nextLesson);
        const isReview = lessonValue >= 1000;
        const isEven = !isReview && (lessonValue % 2 === 0);
        const lessonType = isReview ? 'RW' : (isEven ? 'PAR' : 'ÍMPAR');
        const lessonClass = isReview ? 'lesson-review' : (isEven ? 'lesson-even' : 'lesson-odd');
        
        container.append(`
            <div class="student-item ${lessonClass}">
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
            </div>
        `);
    });
}

/**
 * Atualiza toda a interface
 */
export function updateUI() {
    updateDashboard();
    updateClassesList();
    updateStudentsList();
    updateWeekView();
    updateNextClasses();
    updateClassSelects();
    updateLessonFilter();
}
