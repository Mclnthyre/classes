// js/app.js - Arquivo principal de inicialização

// Importar módulos
import * as utils from './utils/lesson-utils.js';
import * as dataManager from './modules/data-manager.js';
import * as githubService from './modules/github-service.js';
import * as uiManager from './modules/ui-manager.js';
import * as planningManager from './modules/planning-manager.js';

// Variáveis globais
let appData;

// =============================================
// FUNÇÕES GLOBAIS (para acesso no HTML)
// =============================================

// Interface
window.showSection = uiManager.showSection;
window.toggleSidebar = toggleSidebar;
window.showAlert = uiManager.showAlert;

// Turmas
window.showAddClassModal = showAddClassModal;
window.saveClass = saveClass;
window.deleteClass = deleteClassData;
window.showClassDetails = showClassDetails;

// Alunos
window.showAddStudentModal = showAddStudentModal;
window.saveStudent = saveStudent;
window.deleteStudent = deleteStudentData;

// Planejamento e presenças
window.generateAttendanceOrder = generateAttendanceOrder;
window.confirmPeerWork = confirmPeerWork;
window.openAttendanceModal = openAttendanceModal;
window.selectColor = selectColor;

// GitHub e backup
window.saveToGitHub = saveToGitHub;
window.loadFromGitHub = loadFromGitHub;
window.saveGitHubConfig = saveGitHubConfig;
window.exportData = exportData;
window.importData = importData;

// =============================================
// FUNÇÕES AUXILIARES LOCAIS
// =============================================

/**
 * Alterna a sidebar
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileSidebarOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        
        if (sidebar.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }
}

/**
 * Capitaliza a primeira letra
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Seleciona uma cor
 */
function selectColor(color) {
    const colorPickers = document.querySelectorAll('.color-picker');
    colorPickers.forEach(picker => {
        picker.classList.remove('selected');
        if (picker.getAttribute('data-color') === color || 
            picker.style.backgroundColor === color) {
            picker.classList.add('selected');
        }
    });
    document.getElementById('classColor').value = color;
}

/**
 * Atualiza a média calculada
 */
function updateCalculatedAverage() {
    const scores = { 'O': 4, 'MB': 3, 'B': 2, 'R': 1 };
    const f = scores[document.getElementById('scoreF').value];
    const a = scores[document.getElementById('scoreA').value];
    const l = scores[document.getElementById('scoreL').value];
    const e = scores[document.getElementById('scoreE').value];
    const average = (f + a + l + e) / 4;
    
    let text;
    if (average >= 3.5) text = 'Ótimo';
    else if (average >= 2.5) text = 'Muito Bom';
    else if (average >= 1.5) text = 'Bom';
    else text = 'Regular';
    
    document.getElementById('calculatedAverage').textContent = `${text} (${average.toFixed(1)})`;
}

/**
 * Exporta dados
 */
function exportData() {
    const data = dataManager.exportData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `english-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    
    uiManager.showAlert('Backup exportado com sucesso!', 'success');
}

/**
 * Importa dados
 */
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
                        dataManager.importData(data);
                        appData = dataManager.getAppData();
                        uiManager.showAlert('Dados importados com sucesso!', 'success');
                        location.reload(); // Recarregar para atualizar tudo
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

/**
 * Atualiza a data atual
 */
function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('pt-BR', options);
    }
}

// =============================================
// FUNÇÕES DE TURMAS
// =============================================

/**
 * Mostra modal de adicionar/editar turma
 */
function showAddClassModal(classId = null) {
    const modal = new bootstrap.Modal(document.getElementById('addClassModal'));
    const modalTitle = document.getElementById('classModalTitle');
    const editClassId = document.getElementById('editClassId');
    const className = document.getElementById('className');
    const classTime = document.getElementById('classTime');
    const classColor = document.getElementById('classColor');
    
    // Resetar checkboxes
    ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'].forEach(day => {
        const checkbox = document.getElementById(`day${capitalizeFirstLetter(day)}`);
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
            selectColor(cls.color);
            
            cls.days.forEach(day => {
                const checkbox = document.getElementById(`day${capitalizeFirstLetter(day)}`);
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
        selectColor('#3498db');
    }
    
    modal.show();
}

/**
 * Salva turma
 */
function saveClass() {
    const editClassId = document.getElementById('editClassId').value;
    const className = document.getElementById('className').value.trim();
    const classTime = document.getElementById('classTime').value;
    const classColor = document.getElementById('classColor').value;
    
    // Coletar dias selecionados
    const days = [];
    ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'].forEach(day => {
        const checkbox = document.getElementById(`day${capitalizeFirstLetter(day)}`);
        if (checkbox && checkbox.checked) {
            days.push(day);
        }
    });
    
    if (!className) {
        uiManager.showAlert('Digite o nome da turma', 'warning');
        return;
    }
    
    if (days.length === 0) {
        uiManager.showAlert('Selecione pelo menos um dia da semana', 'warning');
        return;
    }
    
    if (!classTime) {
        uiManager.showAlert('Selecione um horário', 'warning');
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
        dataManager.updateClass(parseInt(editClassId), classData);
        uiManager.showAlert('Turma atualizada com sucesso!', 'success');
    } else {
        // Criar nova turma
        dataManager.addClass(classData);
        uiManager.showAlert('Turma criada com sucesso!', 'success');
    }
    
    appData = dataManager.getAppData();
    uiManager.updateUI();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addClassModal'));
    modal.hide();
}

/**
 * Exclui turma
 */
function deleteClassData(classId) {
    const className = appData.classes.find(c => c.id == classId)?.name;
    const studentsInClass = appData.students.filter(s => s.classId == classId).length;
    
    let message = `Tem certeza que deseja excluir a turma "${className}"?`;
    if (studentsInClass > 0) {
        message += `\n\nATENÇÃO: Esta turma tem ${studentsInClass} aluno(s) que também serão excluídos!`;
    }
    
    if (confirm(message)) {
        // Confirmar novamente se houver alunos
        if (studentsInClass > 0) {
            if (!confirm('CONFIRMAÇÃO FINAL: Todos os alunos desta turma serão perdidos. Continuar?')) {
                return;
            }
        }
        
        dataManager.deleteClass(classId);
        uiManager.showAlert('Turma excluída com sucesso!', 'success');
        appData = dataManager.getAppData();
        uiManager.updateUI();
    }
}

/**
 * Mostra detalhes da turma
 */
function showClassDetails(classId) {
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
        uiManager.showSection('lessons');
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
            const lessonValue = utils.getLessonValue(student.nextLesson);
            const isReview = lessonValue >= 1000;
            const isEven = !isReview && (lessonValue % 2 === 0);
            const lessonType = isReview ? 'RW' : (isEven ? 'PAR' : 'ÍMPAR');
            
            html += `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${student.name}</h6>
                            <p class="mb-1 small text-muted">
                                Lição ${utils.getLessonDisplay(student.nextLesson)} (${lessonType})
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
}

// =============================================
// FUNÇÕES DE ALUNOS
// =============================================

/**
 * Mostra modal de adicionar/editar aluno
 */
function showAddStudentModal(studentId = null) {
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
    uiManager.updateClassSelects();
    
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
            updateCalculatedAverage();
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
        updateCalculatedAverage();
    }
    
    modal.show();
}

/**
 * Salva aluno
 */
function saveStudent() {
    const editStudentId = document.getElementById('editStudentId').value;
    const studentName = document.getElementById('studentName').value.trim();
    const studentClass = document.getElementById('studentClass').value;
    const lastLesson = document.getElementById('lastLesson').value.trim();
    const nextLesson = document.getElementById('nextLesson').value.trim();
    const scoreF = document.getElementById('scoreF').value;
    const scoreA = document.getElementById('scoreA').value;
    const scoreL = document.getElementById('scoreL').value;
    const scoreE = document.getElementById('scoreE').value;
    
    if (!studentName || !studentClass || !nextLesson) {
        uiManager.showAlert('Preencha todos os campos obrigatórios!', 'warning');
        return;
    }
    
    // Validar formato da lição
    const lessonRegex = /^(RW\d*|\d+)$/i;
    if (lastLesson && !lessonRegex.test(lastLesson)) {
        uiManager.showAlert('Formato da última lição inválido. Use números (ex: 170) ou RW seguido de número (ex: RW1)', 'warning');
        return;
    }
    if (!lessonRegex.test(nextLesson)) {
        uiManager.showAlert('Formato da próxima lição inválido. Use números (ex: 170) ou RW seguido de número (ex: RW1)', 'warning');
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
        average: utils.calculateAverage(scoreF, scoreA, scoreL, scoreE),
        nextLessonValue: utils.getLessonValue(nextLesson),
        lastLessonValue: utils.getLessonValue(lastLesson || nextLesson),
        attendance: [],
        peerHistory: []
    };
    
    if (editStudentId) {
        // Atualizar aluno existente
        dataManager.updateStudent(parseInt(editStudentId), studentData);
        uiManager.showAlert('Aluno atualizado com sucesso!', 'success');
    } else {
        // Criar novo aluno
        dataManager.addStudent(studentData);
        uiManager.showAlert('Aluno criado com sucesso!', 'success');
    }
    
    appData = dataManager.getAppData();
    uiManager.updateUI();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addStudentModal'));
    modal.hide();
}

/**
 * Exclui aluno
 */
function deleteStudentData(studentId) {
    const student = appData.students.find(s => s.id == studentId);
    if (!student) return;
    
    if (confirm(`Tem certeza que deseja excluir o aluno "${student.name}"?`)) {
        if (confirm('CONFIRMAÇÃO FINAL: Esta ação não pode ser desfeita. Continuar?')) {
            dataManager.deleteStudent(studentId);
            uiManager.showAlert('Aluno excluído com sucesso!', 'success');
            appData = dataManager.getAppData();
            uiManager.updateUI();
        }
    }
}

// =============================================
// FUNÇÕES DE PLANEJAMENTO E PRESENÇAS
// =============================================

/**
 * Gera ordem de atendimento
 */
function generateAttendanceOrder() {
    const classId = document.getElementById('selectClassForPlanning')?.value;
    if (!classId) {
        uiManager.showAlert('Selecione uma turma primeiro!', 'warning');
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
    const orderedStudents = planningManager.generateAttendanceOrder(students);
    
    // Exibir ordem
    let orderHtml = '<div class="list-group">';
    orderedStudents.forEach((student, index) => {
        const lessonValue = utils.getLessonValue(student.nextLesson);
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
                    <span class="badge bg-light text-dark">Lição ${utils.getLessonDisplay(student.nextLesson)}</span>
                </div>
            </div>
        `;
    });
    orderHtml += '</div>';
    orderContainer.innerHTML = orderHtml;
    
    // Gerar sugestões de pares
    const pairs = planningManager.generatePeerWorkSuggestions(students);
    
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
}

/**
 * Abre modal de presenças
 */
function openAttendanceModal(classId) {
    uiManager.openAttendanceModal(classId);
}

/**
 * Confirma peer work
 */
function confirmPeerWork(student1Id, student2Id) {
    if (confirm('Confirmar este peer work? Isso será salvo no histórico dos alunos.')) {
        if (dataManager.confirmPeerWork(student1Id, student2Id)) {
            uiManager.showAlert('Peer work confirmado e salvo no histórico!', 'success');
            // Atualizar a interface
            generateAttendanceOrder();
        }
    }
}

// =============================================
// FUNÇÕES DO GITHUB
// =============================================

/**
 * Salva no GitHub
 */
async function saveToGitHub() {
    uiManager.showLoading(true);
    const result = await githubService.saveToGitHub(appData, 'Backup automático - ' + new Date().toLocaleString());
    uiManager.showLoading(false);
    
    if (result.success) {
        uiManager.showAlert('Backup salvo com sucesso no GitHub!', 'success');
    } else {
        uiManager.showAlert(`Erro ao salvar no GitHub: ${result.error}`, 'danger');
    }
}

/**
 * Carrega do GitHub
 */
async function loadFromGitHub() {
    if (!confirm('Isso substituirá todos os dados locais. Continuar?')) {
        return;
    }
    
    uiManager.showLoading(true);
    const result = await githubService.loadFromGitHub();
    uiManager.showLoading(false);
    
    if (result.success) {
        uiManager.showAlert('Dados carregados com sucesso do GitHub!', 'success');
        dataManager.importData(result.data);
        appData = dataManager.getAppData();
        uiManager.updateUI();
        location.reload(); // Recarregar para atualizar tudo
    } else {
        uiManager.showAlert(`Erro ao carregar do GitHub: ${result.error}`, 'danger');
    }
}

/**
 * Salva configuração do GitHub
 */
function saveGitHubConfig() {
    const username = document.getElementById('githubUsername').value;
    const repo = document.getElementById('githubRepo').value;
    const token = document.getElementById('githubToken').value;
    
    if (!username || !repo || !token) {
        uiManager.showAlert('Preencha todos os campos do GitHub!', 'warning');
        return;
    }
    
    githubService.saveGitHubConfig({ username, repo, token });
    uiManager.showAlert('Configuração do GitHub salva com sucesso!', 'success');
}

// =============================================
// INICIALIZAÇÃO
// =============================================

/**
 * Configura todos os event listeners
 */
function setupEventListeners() {
    // Sidebar toggle
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', toggleSidebar);
    }
    
    // Overlay do sidebar
    const overlay = document.getElementById('mobileSidebarOverlay');
    if (overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }
    
    // Links do menu
    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            uiManager.showSection(sectionId);
        });
    });
    
    // Botão adicionar turma
    const addClassBtn = document.getElementById('addClassBtn');
    if (addClassBtn) {
        addClassBtn.addEventListener('click', () => showAddClassModal());
    }
    
    // Botão salvar turma
    const saveClassBtn = document.getElementById('saveClassBtn');
    if (saveClassBtn) {
        saveClassBtn.addEventListener('click', saveClass);
    }
    
    // Botão adicionar aluno
    const addStudentBtn = document.getElementById('addStudentBtn');
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => showAddStudentModal());
    }
    
    // Botão salvar aluno
    const saveStudentBtn = document.getElementById('saveStudentBtn');
    if (saveStudentBtn) {
        saveStudentBtn.addEventListener('click', saveStudent);
    }
    
    // Atualizar média quando notas mudam
    ['scoreF', 'scoreA', 'scoreL', 'scoreE'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updateCalculatedAverage);
        }
    });
    
    // Botão gerar ordem
    const generateOrderBtn = document.getElementById('generateOrderBtn');
    if (generateOrderBtn) {
        generateOrderBtn.addEventListener('click', generateAttendanceOrder);
    }
    
    // Botão salvar no GitHub
    const saveToGitHubBtn = document.getElementById('saveToGitHubBtn');
    if (saveToGitHubBtn) {
        saveToGitHubBtn.addEventListener('click', saveToGitHub);
    }
    
    // Botão exportar dados
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
    }
    
    const exportDataBtn2 = document.getElementById('exportDataBtn2');
    if (exportDataBtn2) {
        exportDataBtn2.addEventListener('click', exportData);
    }
    
    // Botão importar dados
    const importDataBtn = document.getElementById('importDataBtn');
    if (importDataBtn) {
        importDataBtn.addEventListener('click', importData);
    }
    
    // Botão salvar configuração GitHub
    const saveGitHubConfigBtn = document.getElementById('saveGitHubConfigBtn');
    if (saveGitHubConfigBtn) {
        saveGitHubConfigBtn.addEventListener('click', saveGitHubConfig);
    }
    
    // Botão carregar do GitHub
    const loadFromGitHubBtn = document.getElementById('loadFromGitHubBtn');
    if (loadFromGitHubBtn) {
        loadFromGitHubBtn.addEventListener('click', loadFromGitHub);
    }
    
    // Busca de alunos
    const searchStudent = document.getElementById('searchStudent');
    if (searchStudent) {
        searchStudent.addEventListener('input', () => uiManager.updateStudentsList());
    }
    
    // Filtro de turma
    const filterClass = document.getElementById('filterClass');
    if (filterClass) {
        filterClass.addEventListener('change', () => {
            uiManager.updateStudentsList();
            uiManager.updateLessonFilter();
        });
    }
    
    // Filtro de lições
    const filterLesson = document.getElementById('filterLesson');
    if (filterLesson) {
        filterLesson.addEventListener('change', () => uiManager.updateStudentsList());
    }
    
    // Seletores de cor
    document.querySelectorAll('.color-picker').forEach(picker => {
        picker.addEventListener('click', function() {
            const color = this.getAttribute('data-color') || this.style.backgroundColor;
            selectColor(color);
        });
    });
    
    // Configurar data de planejamento para hoje
    const planningDate = document.getElementById('planningDate');
    if (planningDate && !planningDate.value) {
        planningDate.value = new Date().toISOString().split('T')[0];
    }
    
    // Auto-save
    const autoSave = document.getElementById('autoSave');
    if (autoSave) {
        autoSave.addEventListener('change', function() {
            appData.settings = appData.settings || {};
            appData.settings.autoSave = this.checked;
            dataManager.saveData();
        });
    }
    
    // Tema
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            document.body.setAttribute('data-theme', this.value);
            appData.settings = appData.settings || {};
            appData.settings.theme = this.value;
            dataManager.saveData();
        });
        
        // Aplicar tema salvo
        if (appData.settings?.theme) {
            themeSelect.value = appData.settings.theme;
            document.body.setAttribute('data-theme', appData.settings.theme);
        }
    }
}

/**
 * Inicializa a aplicação
 */
function initApp() {
    console.log('Inicializando Interactive English Planner...');
    
    // Carregar dados
    appData = dataManager.getAppData();
    
    // Inicializar UI
    uiManager.initApp();
    
    // Configurar data atual
    updateCurrentDate();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Atualizar UI
    uiManager.updateUI();
    
    // Mostrar dashboard por padrão
    uiManager.showSection('dashboard');
    
    console.log('Aplicação inicializada com sucesso!');
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initApp);

// Atualizar data a cada minuto
setInterval(updateCurrentDate, 60000);

// Auto-save a cada 30 segundos
setInterval(() => {
    const autoSave = document.getElementById('autoSave');
    if (autoSave?.checked) {
        dataManager.saveData();
    }
}, 30000);
