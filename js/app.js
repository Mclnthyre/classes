// js/app.js - Arquivo principal de inicialização

// Importar módulos
import * as utils from './utils/lesson-utils.js';
import * as dataManager from './modules/data-manager.js';
import * as githubService from './modules/github-service.js';
import * as uiManager from './modules/ui-manager.js';
import * as planningManager from './modules/planning-manager.js';

// =============================================
// FUNÇÕES GLOBAIS (para onclick no HTML)
// =============================================

// Interface
window.showSection = uiManager.showSection;
window.toggleSidebar = uiManager.toggleSidebar;
window.showLoading = uiManager.showLoading;
window.showGitHubStatus = uiManager.showGitHubStatus;

// GitHub
window.saveToGitHub = async function() {
    uiManager.showLoading(true);
    const result = await githubService.saveToGitHub();
    uiManager.showLoading(false);
    uiManager.showGitHubStatus(result.message, result.success ? 'success' : 'error');
};

window.loadFromGitHub = async function() {
    uiManager.showLoading(true);
    const result = await githubService.loadFromGitHub();
    uiManager.showLoading(false);
    
    if (result.success && result.data) {
        dataManager.setAppData(result.data);
        dataManager.saveData();
        uiManager.updateUI();
    }
    uiManager.showGitHubStatus(result.message, result.success ? 'success' : 'error');
};

window.saveGitHubConfig = function() {
    const config = {
        username: $('#githubUsername').val(),
        repo: $('#githubRepo').val(),
        token: $('#githubToken').val(),
        branch: 'main'
    };
    
    dataManager.saveGitHubConfig(config);
    uiManager.showGitHubStatus('Configuração do GitHub salva!', 'success');
};

// Turmas
window.showAddClassModal = function(classId = null) {
    // Implementação simplificada - manteremos do arquivo original
    $('#className').val('');
    $('.form-check-input').prop('checked', false);
    $('#classTime').val('16:00');
    selectColor('#3498db');
    $('#editClassId').val('');
    
    if (classId) {
        const cls = dataManager.getAppData().classes.find(c => c.id == classId);
        if (cls) {
            $('#classModalTitle').text('Editar Turma');
            $('#editClassId').val(classId);
            $('#className').val(cls.name);
            $('#classTime').val(cls.time);
            selectColor(cls.color);
            
            cls.days.forEach(day => {
                $(`#day${capitalizeFirstLetter(day)}`).prop('checked', true);
            });
        }
    } else {
        $('#classModalTitle').text('Nova Turma');
    }
    
    new bootstrap.Modal('#addClassModal').show();
};

window.saveClass = function() {
    const classId = $('#editClassId').val();
    const className = $('#className').val().trim();
    if (!className) {
        alert('Digite o nome da turma');
        return;
    }
    
    const selectedDays = [];
    $('input[type="checkbox"]:checked').each(function() {
        selectedDays.push($(this).val());
    });
    
    if (selectedDays.length === 0) {
        alert('Selecione pelo menos um dia da semana');
        return;
    }
    
    const classData = {
        name: className,
        days: selectedDays,
        time: $('#classTime').val(),
        color: $('#classColor').val()
    };
    
    const appData = dataManager.getAppData();
    
    if (classId) {
        const index = appData.classes.findIndex(c => c.id == classId);
        if (index !== -1) {
            appData.classes[index] = { ...appData.classes[index], ...classData };
        }
    } else {
        const newClass = {
            id: Date.now(),
            ...classData
        };
        appData.classes.push(newClass);
    }
    
    dataManager.saveData();
    bootstrap.Modal.getInstance('#addClassModal').hide();
    uiManager.showGitHubStatus('Turma salva com sucesso!', 'success');
};

window.deleteClass = function(classId) {
    if (confirm('Tem certeza que deseja excluir esta turma? Todos os alunos dela também serão excluídos!')) {
        const appData = dataManager.getAppData();
        appData.classes = appData.classes.filter(c => c.id != classId);
        appData.students = appData.students.filter(s => s.classId != classId);
        dataManager.saveData();
        uiManager.showGitHubStatus('Turma excluída com sucesso!', 'success');
    }
};

// Alunos
window.showAddStudentModal = function(studentId = null) {
    $('#studentName').val('');
    $('#lastLesson').val('');
    $('#nextLesson').val('');
    $('#scoreF, #scoreA, #scoreL, #scoreE').val('B');
    $('#editStudentId').val('');
    
    if (studentId) {
        const student = dataManager.getAppData().students.find(s => s.id == studentId);
        if (student) {
            $('#studentModalTitle').text('Editar Aluno');
            $('#editStudentId').val(studentId);
            $('#studentName').val(student.name);
            $('#lastLesson').val(student.lastLesson);
            $('#nextLesson').val(student.nextLesson);
            $('#scoreF').val(student.fale.F);
            $('#scoreA').val(student.fale.A);
            $('#scoreL').val(student.fale.L);
            $('#scoreE').val(student.fale.E);
        }
    } else {
        $('#studentModalTitle').text('Novo Aluno');
    }
    
    updateCalculatedAverage();
    uiManager.updateClassSelects();
    new bootstrap.Modal('#addStudentModal').show();
};

window.saveStudent = function() {
    const studentId = $('#editStudentId').val();
    const name = $('#studentName').val().trim();
    const classId = parseInt($('#studentClass').val());
    const lastLesson = $('#lastLesson').val().trim();
    const nextLesson = $('#nextLesson').val().trim();
    
    if (!name || !classId || !lastLesson || !nextLesson) {
        alert('Preencha todos os campos obrigatórios');
        return;
    }
    
    const lessonRegex = /^(RW\d*|\d+)$/i;
    if (!lessonRegex.test(lastLesson) || !lessonRegex.test(nextLesson)) {
        alert('Formato de lição inválido. Use números (ex: 170) ou RW seguido de número (ex: RW1)');
        return;
    }
    
    const studentData = {
        name: name,
        classId: classId,
        lastLesson: lastLesson,
        nextLesson: nextLesson,
        fale: {
            F: $('#scoreF').val(),
            A: $('#scoreA').val(),
            L: $('#scoreL').val(),
            E: $('#scoreE').val()
        }
    };
    
    const scores = { 'O': 4, 'MB': 3, 'B': 2, 'R': 1 };
    const average = (
        scores[studentData.fale.F] +
        scores[studentData.fale.A] +
        scores[studentData.fale.L] +
        scores[studentData.fale.E]
    ) / 4;
    studentData.average = average;
    studentData.nextLessonValue = utils.getLessonValue(nextLesson);
    studentData.lastLessonValue = utils.getLessonValue(lastLesson);
    
    const appData = dataManager.getAppData();
    
    if (studentId) {
        const index = appData.students.findIndex(s => s.id == studentId);
        if (index !== -1) {
            const existing = appData.students[index];
            appData.students[index] = { 
                ...existing,
                ...studentData 
            };
        }
    } else {
        const newStudent = {
            id: Date.now(),
            ...studentData,
            attendance: [],
            peerHistory: []
        };
        appData.students.push(newStudent);
    }
    
    dataManager.saveData();
    bootstrap.Modal.getInstance('#addStudentModal').hide();
    uiManager.showGitHubStatus('Aluno salvo com sucesso!', 'success');
};

window.deleteStudent = function(studentId) {
    if (confirm('Tem certeza que deseja excluir este aluno?')) {
        const appData = dataManager.getAppData();
        appData.students = appData.students.filter(s => s.id != studentId);
        dataManager.saveData();
        uiManager.showGitHubStatus('Aluno excluído com sucesso!', 'success');
    }
};

// Planejamento
window.planLesson = planningManager.planLesson;
window.generateAttendanceOrder = planningManager.generateAttendanceOrder;
window.markAttendance = planningManager.markAttendance;
window.confirmPeerWork = planningManager.confirmPeerWork;
window.generateReport = planningManager.generateReport;

// Exportação/Importação
window.exportData = exportData;
window.importData = importData;

// =============================================
// FUNÇÕES AUXILIARES LOCAIS
// =============================================

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function selectColor(color) {
    $('.color-picker').removeClass('selected');
    $(`.color-picker[style*="background:${color}"]`).addClass('selected');
    $('#classColor').val(color);
}

function updateCalculatedAverage() {
    const scores = { 'O': 4, 'MB': 3, 'B': 2, 'R': 1 };
    const f = scores[$('#scoreF').val()];
    const a = scores[$('#scoreA').val()];
    const l = scores[$('#scoreL').val()];
    const e = scores[$('#scoreE').val()];
    const average = (f + a + l + e) / 4;
    
    let text;
    if (average >= 3.5) text = 'Ótimo';
    else if (average >= 2.5) text = 'Muito Bom';
    else if (average >= 1.5) text = 'Bom';
    else text = 'Regular';
    
    $('#calculatedAverage').text(`${text} (${average.toFixed(1)})`);
}

function exportData() {
    const appData = dataManager.getAppData();
    const data = {
        ...appData,
        exportedAt: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `english-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    
    uiManager.showGitHubStatus('Backup exportado com sucesso!', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                if (data.classes && Array.isArray(data.classes) && 
                    data.students && Array.isArray(data.students)) {
                    
                    if (confirm('Importar dados? Isso substituirá todos os dados atuais.')) {
                        dataManager.setAppData(data);
                        dataManager.saveData();
                        uiManager.updateUI();
                        uiManager.showGitHubStatus('Dados importados com sucesso!', 'success');
                    }
                } else {
                    alert('Arquivo inválido. O arquivo não contém a estrutura correta.');
                }
            } catch (error) {
                alert('Erro ao ler o arquivo. Certifique-se de que é um arquivo JSON válido.');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// =============================================
// INICIALIZAÇÃO
// =============================================

$(document).ready(function() {
    // Carregar configuração do GitHub
    const githubConfig = dataManager.loadGitHubConfig();
    $('#githubUsername').val(githubConfig.username);
    $('#githubRepo').val(githubConfig.repo);
    $('#githubToken').val(githubConfig.token);
    
    // Carregar dados
    const loadedData = dataManager.loadData();
    if (!loadedData) {
        // Criar dados de exemplo se não existirem
        dataManager.setAppData(dataManager.createSampleData());
        dataManager.saveData();
    }
    
    // Configurar data atual
    uiManager.updateCurrentDate();
    
    // Configurar eventos
    $('#scoreF, #scoreA, #scoreL, #scoreE').on('change', updateCalculatedAverage);
    $('#searchStudent').on('input', uiManager.updateStudentsList);
    $('#filterClass, #filterLesson').on('change', uiManager.updateStudentsList);
    
    // Auto-save
    const appData = dataManager.getAppData();
    if (appData.settings.autoSave) {
        setInterval(() => {
            dataManager.saveData();
        }, 30000);
    }
    
    // Configurar data de planejamento para hoje
    const today = new Date().toISOString().split('T')[0];
    $('#planningDate').val(today);
    
    // Mostrar dashboard inicial
    uiManager.showSection('dashboard');
    uiManager.updateUI();
    
    // Carregar dados do GitHub se disponível
    setTimeout(() => {
        loadFromGitHub();
    }, 1000);
});

// Adicione após as outras inicializações:

// Inicializar modal de presenças
setupAttendanceModal();

// Adicionar menu de relatórios
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar item no menu
    const nav = document.querySelector('.navbar-nav');
    if (nav) {
        const reportItem = document.createElement('li');
        reportItem.className = 'nav-item';
        reportItem.innerHTML = `
            <a class="nav-link" href="#" id="attendanceReportLink">
                <i class="bi bi-clipboard-data"></i> Relatório Frequência
            </a>
        `;
        nav.appendChild(reportItem);
        
        document.getElementById('attendanceReportLink').addEventListener('click', function(e) {
            e.preventDefault();
            showSection('attendance-report');
            renderAttendanceReport();
        });
    }
});

// Adicionar seção de relatórios no main content
const mainContent = document.getElementById('mainContent');
if (mainContent) {
    mainContent.innerHTML += `
        <section id="attendance-report" class="content-section" style="display: none;">
            <div class="container-fluid">
                <div id="attendanceReportContainer"></div>
            </div>
        </section>
    `;
}
