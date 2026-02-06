// =============================================
// CONFIGURAÇÃO INICIAL
// =============================================

// Configuração do GitHub (seus dados)
let GITHUB_CONFIG = {
    username: '',  // Será carregado do localStorage
    repo: '',      // Será carregado do localStorage
    token: '',     // Será carregado do localStorage
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

// =============================================
// FUNÇÕES AUXILIARES PARA LIÇÕES
// =============================================

function getLessonValue(lesson) {
    // Converte lição para valor numérico para ordenação
    // Ex: "RW1" -> 1001, "RW2" -> 1002, "170" -> 170
    if (typeof lesson === 'string') {
        const match = lesson.match(/RW(\d*)/i);
        if (match) {
            // RW vira 1000 + número (RW1 = 1001, RW2 = 1002, RW = 1000)
            const rwNum = match[1] ? parseInt(match[1]) : 0;
            return 1000 + rwNum;
        }
        // Se for apenas número
        const numMatch = lesson.match(/\d+/);
        if (numMatch) {
            return parseInt(numMatch[0]);
        }
    } else if (typeof lesson === 'number') {
        return lesson;
    }
    return 0;
}

function getLessonDisplay(lesson) {
    // Retorna lição formatada para exibição
    if (typeof lesson === 'string') {
        return lesson.toUpperCase();
    }
    return String(lesson);
}

function isReviewLesson(lesson) {
    // Verifica se é uma lição de review (RW)
    if (typeof lesson === 'string') {
        return lesson.toUpperCase().startsWith('RW');
    }
    return false;
}

function isEvenLessonValue(lessonValue) {
    // Determina se é par ou ímpar baseado no valor numérico
    // RW sempre considerado "ímpar" para ordenação (vem depois dos pares)
    if (lessonValue >= 1000) {
        return false; // RW é considerado "ímpar"
    }
    return lessonValue % 2 === 0;
}

// =============================================
// FUNÇÕES DE INICIALIZAÇÃO
// =============================================

$(document).ready(function() {
    // Carregar configuração do GitHub do localStorage
    const savedConfig = localStorage.getItem('githubConfig');
    if (savedConfig) {
        GITHUB_CONFIG = JSON.parse(savedConfig);
        $('#githubUsername').val(GITHUB_CONFIG.username);
        $('#githubRepo').val(GITHUB_CONFIG.repo);
        $('#githubToken').val(GITHUB_CONFIG.token);
    }
    
    // Carregar dados salvos
    loadData();
    
    // Atualizar data atual
    updateCurrentDate();
    
    // Configurar eventos
    setupEventListeners();
    
    // Mostrar dashboard inicial
    showSection('dashboard');
    
    // Configurar data de planejamento para hoje
    const today = new Date().toISOString().split('T')[0];
    $('#planningDate').val(today);
    
    // Carregar dados do GitHub se disponível
    setTimeout(() => {
        loadFromGitHub();
    }, 1000);
});

function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    $('#currentDate').text(now.toLocaleDateString('pt-BR', options));
}

function setupEventListeners() {
    // Atualizar média quando mudar avaliações
    $('#scoreF, #scoreA, #scoreL, #scoreE').on('change', updateCalculatedAverage);
    
    // Buscar alunos
    $('#searchStudent').on('input', filterStudents);
    $('#filterClass, #filterLesson').on('change', filterStudents);
    
    // Auto-save
    if (appData.settings.autoSave) {
        setInterval(() => {
            saveData(); // Salvar apenas localmente
        }, 30000); // Salva a cada 30 segundos
    }
}

// =============================================
// GERENCIAMENTO DE DADOS
// =============================================

function loadData() {
    const saved = localStorage.getItem('englishPlannerData');
    if (saved) {
        appData = JSON.parse(saved);
        updateUI();
    }
}

function saveData() {
    localStorage.setItem('englishPlannerData', JSON.stringify(appData));
    updateUI();
}

function updateUI() {
    updateDashboard();
    updateClassesList();
    updateStudentsList();
    updateWeekView();
    updateNextClasses();
    updateClassSelects();
    updateLessonFilter();
}

// =============================================
// FUNÇÕES DO GITHUB - CORRIGIDAS
// =============================================

async function saveToGitHub() {
    showLoading(true);
    
    try {
        // Verificar se há configuração do GitHub
        if (!GITHUB_CONFIG.username || !GITHUB_CONFIG.repo || !GITHUB_CONFIG.token) {
            throw new Error('Configure o GitHub nas configurações primeiro!');
        }
        
        const data = {
            ...appData,
            lastUpdated: new Date().toISOString()
        };
        
        // Mudar o nome do arquivo para dados.json
        const filename = 'dados.json';
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
        
        // URL para sua estrutura
        const getUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/contents/${filename}`;
        
        const headers = {
            'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
        
        let sha = null;
        
        // Primeiro verificar se o arquivo já existe
        try {
            const response = await fetch(getUrl, { 
                method: 'GET',
                headers: headers
            });
            
            if (response.ok) {
                const fileData = await response.json();
                sha = fileData.sha;
            }
        } catch (e) {
            console.log('Arquivo não encontrado, será criado um novo');
        }
        
        // Corpo da requisição
        const body = {
            message: `Update: ${new Date().toLocaleString('pt-BR')}`,
            content: content,
            ...(sha && { sha: sha }) // Incluir SHA apenas se existir
        };
        
        // Usar PUT para criar/atualizar
        const updateResponse = await fetch(getUrl, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(body)
        });
        
        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(errorData.message || 'Erro ao salvar no GitHub');
        }
        
        showGitHubStatus('Dados salvos no GitHub com sucesso!', 'success');
        saveData(); // Salvar também no localStorage
        
    } catch (error) {
        console.error('Erro detalhado:', error);
        showGitHubStatus(`Erro: ${error.message}`, 'error');
        
        // Oferecer opção de exportar manualmente
        setTimeout(() => {
            if (confirm('Não foi possível salvar no GitHub. Deseja exportar os dados manualmente?')) {
                exportData();
            }
        }, 1000);
    } finally {
        showLoading(false);
    }
}

async function loadFromGitHub() {
    showLoading(true);
    
    try {
        // Verificar se há configuração
        if (!GITHUB_CONFIG.username || !GITHUB_CONFIG.repo) {
            showGitHubStatus('Configure o GitHub primeiro', 'error');
            return;
        }
        
        // URL do GitHub Pages - usar o caminho correto
        const url = `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/main/dados.json`;
        const response = await fetch(url + '?t=' + Date.now());
        
        if (response.ok) {
            const data = await response.json();
            appData = data;
            saveData(); // Salvar localmente também
            showGitHubStatus('Dados carregados do GitHub!', 'success');
        } else {
            throw new Error('Arquivo não encontrado no GitHub');
        }
    } catch (error) {
        console.log('Usando dados locais...', error.message);
        showGitHubStatus('Usando dados locais', 'error');
    } finally {
        showLoading(false);
    }
}

function saveGitHubConfig() {
    GITHUB_CONFIG = {
        username: $('#githubUsername').val(),
        repo: $('#githubRepo').val(),
        token: $('#githubToken').val(),
        branch: 'main'
    };
    
    localStorage.setItem('githubConfig', JSON.stringify(GITHUB_CONFIG));
    showGitHubStatus('Configuração do GitHub salva!', 'success');
}

// =============================================
// FUNÇÕES DE EXPORTAÇÃO/IMPORTAÇÃO
// =============================================

function exportData() {
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
    
    showGitHubStatus('Backup exportado com sucesso!', 'success');
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
                
                // Validar estrutura básica dos dados
                if (data.classes && Array.isArray(data.classes) && 
                    data.students && Array.isArray(data.students)) {
                    
                    if (confirm('Importar dados? Isso substituirá todos os dados atuais.')) {
                        appData = data;
                        saveData();
                        showGitHubStatus('Dados importados com sucesso!', 'success');
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
// FUNÇÕES DA INTERFACE
// =============================================

function showSection(sectionId) {
    $('.section-content').addClass('d-none');
    $(`#${sectionId}`).removeClass('d-none');
    // Fechar sidebar no mobile
    if (window.innerWidth <= 992) {
        toggleSidebar();
    }
}

function toggleSidebar() {
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

function showLoading(show) {
    if (show) {
        $('#loadingOverlay').removeClass('d-none');
    } else {
        $('#loadingOverlay').addClass('d-none');
    }
}

function showGitHubStatus(message, type) {
    const status = $('#githubStatus');
    status.removeClass('success error').addClass(type);
    $('#githubStatusText').text(message);
    status.fadeIn();
    
    setTimeout(() => {
        status.fadeOut();
    }, 3000);
}

// =============================================
// GERENCIAMENTO DE TURMAS
// =============================================

function showAddClassModal(classId = null) {
    // Limpar o modal
    $('#className').val('');
    $('.form-check-input').prop('checked', false);
    $('#classTime').val('16:00');
    selectColor('#3498db');
    $('#editClassId').val('');
    
    if (classId) {
        // Modo edição
        const cls = appData.classes.find(c => c.id == classId);
        if (cls) {
            $('#classModalTitle').text('Editar Turma');
            $('#editClassId').val(classId);
            $('#className').val(cls.name);
            $('#classTime').val(cls.time);
            selectColor(cls.color);
            
            // Marcar os dias da semana
            cls.days.forEach(day => {
                $(`#day${capitalizeFirstLetter(day)}`).prop('checked', true);
            });
        }
    } else {
        $('#classModalTitle').text('Nova Turma');
    }
    
    new bootstrap.Modal('#addClassModal').show();
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function selectColor(color) {
    $('.color-picker').removeClass('selected');
    $(`.color-picker[style*="background:${color}"]`).addClass('selected');
    $('#classColor').val(color);
}

function saveClass() {
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
    
    if (classId) {
        // Atualizar turma existente
        const index = appData.classes.findIndex(c => c.id == classId);
        if (index !== -1) {
            appData.classes[index] = { ...appData.classes[index], ...classData };
        }
    } else {
        // Adicionar nova turma
        const newClass = {
            id: Date.now(),
            ...classData
        };
        appData.classes.push(newClass);
    }
    
    saveData();
    
    bootstrap.Modal.getInstance('#addClassModal').hide();
    showGitHubStatus('Turma salva com sucesso!', 'success');
}

function updateClassesList() {
    const container = $('#classesList');
    container.empty();
    
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
    
    // Atualizar selects
    updateClassSelects();
}

function deleteClass(classId) {
    if (confirm('Tem certeza que deseja excluir esta turma? Todos os alunos dela também serão excluídos!')) {
        // Remover turma
        appData.classes = appData.classes.filter(c => c.id != classId);
        
        // Remover alunos da turma
        appData.students = appData.students.filter(s => s.classId != classId);
        
        saveData();
        showGitHubStatus('Turma excluída com sucesso!', 'success');
    }
}

function updateClassSelects() {
    const selects = ['#studentClass', '#selectClassForPlanning', '#reportClassSelect', '#filterClass'];
    
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

// =============================================
// GERENCIAMENTO DE ALUNOS
// =============================================

function showAddStudentModal(studentId = null) {
    // Limpar o modal
    $('#studentName').val('');
    $('#lastLesson').val('');
    $('#nextLesson').val('');
    $('#scoreF, #scoreA, #scoreL, #scoreE').val('B');
    $('#editStudentId').val('');
    
    if (studentId) {
        // Modo edição
        const student = appData.students.find(s => s.id == studentId);
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
    updateClassSelects();
    
    new bootstrap.Modal('#addStudentModal').show();
}

function updateCalculatedAverage() {
    const scores = {
        'O': 4,
        'MB': 3,
        'B': 2,
        'R': 1
    };
    
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

function saveStudent() {
    const studentId = $('#editStudentId').val();
    const name = $('#studentName').val().trim();
    const classId = parseInt($('#studentClass').val());
    const lastLesson = $('#lastLesson').val().trim();
    const nextLesson = $('#nextLesson').val().trim();
    
    if (!name || !classId || !lastLesson || !nextLesson) {
        alert('Preencha todos os campos obrigatórios');
        return;
    }
    
    // Validar formato da lição (permite números, RW seguido de número, ou RW)
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
    
    // Calcular média
    const scores = { 'O': 4, 'MB': 3, 'B': 2, 'R': 1 };
    const average = (
        scores[studentData.fale.F] +
        scores[studentData.fale.A] +
        scores[studentData.fale.L] +
        scores[studentData.fale.E]
    ) / 4;
    studentData.average = average;
    
    // Calcular valor numérico para ordenação
    studentData.nextLessonValue = getLessonValue(nextLesson);
    studentData.lastLessonValue = getLessonValue(lastLesson);
    
    if (studentId) {
        // Atualizar aluno existente
        const index = appData.students.findIndex(s => s.id == studentId);
        if (index !== -1) {
            // Manter o attendance e peerHistory
            const existing = appData.students[index];
            appData.students[index] = { 
                ...existing,
                ...studentData 
            };
        }
    } else {
        // Adicionar novo aluno
        const newStudent = {
            id: Date.now(),
            ...studentData,
            attendance: [],
            peerHistory: []
        };
        appData.students.push(newStudent);
    }
    
    saveData();
    
    bootstrap.Modal.getInstance('#addStudentModal').hide();
    showGitHubStatus('Aluno salvo com sucesso!', 'success');
}

function updateStudentsList() {
    const container = $('#studentsList');
    container.empty();
    
    if (appData.students.length === 0) {
        container.html(`
            <div class="text-center py-5">
                <i class="bi bi-person display-1 text-muted"></i>
                <h5 class="mt-3">Nenhum aluno cadastrada</h5>
                <p class="text-muted">Clique em "Novo Aluno" para começar</p>
            </div>
        `);
        return;
    }
    
    let filteredStudents = [...appData.students];
    
    // Aplicar filtros
    const searchTerm = $('#searchStudent').val().toLowerCase();
    const classFilter = $('#filterClass').val();
    const lessonFilter = $('#filterLesson').val();
    
    if (searchTerm) {
        filteredStudents = filteredStudents.filter(s => 
            s.name.toLowerCase().includes(searchTerm)
        );
    }
    
    if (classFilter) {
        filteredStudents = filteredStudents.filter(s => 
            s.classId == classFilter
        );
    }
    
    if (lessonFilter) {
        filteredStudents = filteredStudents.filter(s => 
            s.nextLesson == lessonFilter
        );
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
        
        // Determinar tipo da lição
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
    
    // Atualizar filtro de lições
    updateLessonFilter();
}

function deleteStudent(studentId) {
    if (confirm('Tem certeza que deseja excluir este aluno?')) {
        appData.students = appData.students.filter(s => s.id != studentId);
        saveData();
        showGitHubStatus('Aluno excluído com sucesso!', 'success');
    }
}

function filterStudents() {
    updateStudentsList();
}

function updateLessonFilter() {
    const filter = $('#filterLesson');
    const currentValue = filter.val();
    const classFilter = $('#filterClass').val();
    
    // Obter lições únicas dos alunos que pertencem à turma selecionada
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
    
    // Restaurar valor anterior se ainda estiver na lista
    if (currentValue && lessons.includes(currentValue)) {
        filter.val(currentValue);
    }
}

// =============================================
// DASHBOARD E VISÃO SEMANAL
// =============================================

function updateDashboard() {
    // Estatísticas
    $('#totalClasses').text(appData.classes.length);
    $('#totalStudents').text(appData.students.length);
    
    // Aulas esta semana
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + (6 - today.getDay()));
    
    // Contar aulas agendadas para esta semana
    // (implementação simplificada)
    $('#weekClasses').text('3'); // Exemplo
    
    // Aula de hoje
    updateTodayClass();
    updateUpcomingClasses();
}

function updateTodayClass() {
    const container = $('#todayClass');
    const today = new Date().toLocaleDateString('pt-BR');
    
    // Encontrar turmas que têm aula hoje
    const todayWeekday = new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
    const todayClasses = appData.classes.filter(cls => 
        cls.days.includes(todayWeekday)
    );
    
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

function updateUpcomingClasses() {
    const container = $('#upcomingClasses');
    const nextClasses = $('#nextClassesList');
    
    // Próximos 3 dias
    const upcoming = [];
    for (let i = 1; i <= 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
        
        const dayClasses = appData.classes.filter(cls => 
            cls.days.includes(weekday)
        );
        
        if (dayClasses.length > 0) {
            upcoming.push({
                date: date.toLocaleDateString('pt-BR'),
                weekday: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
                classes: dayClasses
            });
        }
    }
    
    if (upcoming.length === 0) {
        container.html(`
            <div class="text-center py-4">
                <p class="text-muted">Nenhuma aula nos próximos dias</p>
            </div>
        `);
        nextClasses.html('<p class="text-muted small">Nenhuma aula agendada</p>');
        return;
    }
    
    // Para dashboard
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
    
    // Para sidebar
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

function updateWeekView() {
    const container = $('#weekDays');
    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    let html = '';
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() - today.getDay() + i);
        const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
        const isToday = i === today.getDay();
        
        const dayClasses = appData.classes.filter(cls => 
            cls.days.includes(weekday)
        );
        
        // Formatar turmas do dia
        let classesHtml = '<p class="small text-muted">Sem aula</p>';
        if (dayClasses.length > 0) {
            classesHtml = dayClasses.map(cls => `
                <div class="mb-2">
                    <span class="badge" style="background:${cls.color}">${cls.name}</span>
                    <div class="small">${cls.time}</div>
                </div>
            `).join('');
        }
        
        html += `
            <div class="col-md-3 col-sm-4 col-6 mb-3">
                <div class="week-view-day ${isToday ? 'active' : ''}" onclick="showDayDetails('${weekday}')">
                    <h6 class="mb-2">${daysOfWeek[i]}</h6>
                    <p class="small text-muted mb-2">${date.toLocaleDateString('pt-BR')}</p>
                    ${classesHtml}
                </div>
            </div>
        `;
    }
    
    container.html(html);
}

function showDayDetails(weekday) {
    const dayNames = {
        'domingo': 'Domingo',
        'segunda': 'Segunda-feira',
        'terça': 'Terça-feira',
        'quarta': 'Quarta-feira',
        'quinta': 'Quinta-feira',
        'sexta': 'Sexta-feira',
        'sábado': 'Sábado'
    };
    
    const dayClasses = appData.classes.filter(cls => 
        cls.days.includes(weekday)
    );
    
    let html = `
        <h5>${dayNames[weekday] || weekday}</h5>
        <hr>
    `;
    
    if (dayClasses.length === 0) {
        html += '<p class="text-muted">Nenhuma aula neste dia</p>';
    } else {
        dayClasses.forEach(cls => {
            const students = appData.students.filter(s => s.classId == cls.id);
            
            html += `
                <div class="mb-4">
                    <h6>
                        <span class="class-badge" style="background:${cls.color};color:white;">
                            ${cls.name} - ${cls.time}
                        </span>
                    </h6>
                    <p class="mb-2">${students.length} alunos</p>
                    <button class="btn btn-sm btn-outline-primary" onclick="planLesson(${cls.id})">
                        Planejar Aula
                    </button>
                </div>
            `;
        });
    }
    
    $('#dayDetails').html(html);
}

// =============================================
// PLANEJAMENTO DE AULAS
// =============================================

function planLesson(classId) {
    showSection('lessons');
    $('#selectClassForPlanning').val(classId);
    generateAttendanceOrder();
}

function generateAttendanceOrder() {
    const classId = $('#selectClassForPlanning').val();
    const date = $('#planningDate').val() || new Date().toISOString().split('T')[0];
    
    if (!classId) {
        alert('Selecione uma turma primeiro');
        return;
    }
    
    const cls = appData.classes.find(c => c.id == classId);
    const students = appData.students.filter(s => s.classId == classId);
    
    if (students.length === 0) {
        $('#attendanceOrder').html(`
            <div class="alert alert-warning">
                Nenhum aluno nesta turma. Adicione alunos primeiro.
            </div>
        `);
        return;
    }
    
    // Adicionar valor numérico da lição para ordenação
    const studentsWithLessonValue = students.map(student => ({
        ...student,
        nextLessonValue: getLessonValue(student.nextLesson),
        nextLessonDisplay: getLessonDisplay(student.nextLesson)
    }));
    
    // Ordenar: pares primeiro (menor lição), depois ímpares (menor lição), depois RW
    const evenStudents = studentsWithLessonValue
        .filter(s => isEvenLessonValue(s.nextLessonValue) && s.nextLessonValue < 1000)
        .sort((a, b) => a.nextLessonValue - b.nextLessonValue);
    
    const oddStudents = studentsWithLessonValue
        .filter(s => !isEvenLessonValue(s.nextLessonValue) && s.nextLessonValue < 1000)
        .sort((a, b) => a.nextLessonValue - b.nextLessonValue);
    
    const reviewStudents = studentsWithLessonValue
        .filter(s => s.nextLessonValue >= 1000)
        .sort((a, b) => a.nextLessonValue - b.nextLessonValue);
    
    const orderedStudents = [...evenStudents, ...oddStudents, ...reviewStudents];
    
    // Gerar HTML
    let html = `
        <h6 class="mb-3">${cls.name} - ${new Date(date).toLocaleDateString('pt-BR')}</h6>
        <div class="order-list-container">
    `;
    
    orderedStudents.forEach((student, index) => {
        const isReview = student.nextLessonValue >= 1000;
        const lessonType = isReview ? 'REVIEW' : (isEvenLessonValue(student.nextLessonValue) ? 'PAR' : 'ÍMPAR');
        const typeClass = isReview ? 'text-info' : (isEvenLessonValue(student.nextLessonValue) ? 'text-success' : 'text-warning');
        
        html += `
            <div class="order-list-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${student.name}</strong>
                        <div class="small">
                            Lição ${student.nextLessonDisplay} 
                            <span class="${typeClass} fw-bold">(${lessonType})</span>
                        </div>
                        <div class="mt-1">
                            <span class="fale-badge fale-${student.fale.F}">F</span>
                            <span class="fale-badge fale-${student.fale.A}">A</span>
                            <span class="fale-badge fale-${student.fale.L}">L</span>
                            <span class="fale-badge fale-${student.fale.E}">E</span>
                            <span class="small ms-2">Média: ${student.average.toFixed(1)}</span>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-success" onclick="markAttendance(${student.id}, true)">
                            <i class="bi bi-check-lg"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger ms-1" onclick="markAttendance(${student.id}, false)">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    $('#attendanceOrder').html(html);
    
    // Gerar sugestões de Peer Work
    generatePeerWorkSuggestions(orderedStudents);
}

function generatePeerWorkSuggestions(students) {
    // Filtrar alunos não-RW para peer work
    const regularStudents = students.filter(s => s.nextLessonValue < 1000);
    
    if (regularStudents.length < 2) {
        $('#peerWorkPairs').html('<p class="text-muted small">Não há alunos suficientes para Peer Work</p>');
        return;
    }
    
    // Resto da função permanece similar, mas usando nextLessonValue
    const evenStudents = regularStudents.filter(s => isEvenLessonValue(s.nextLessonValue));
    const oddStudents = regularStudents.filter(s => !isEvenLessonValue(s.nextLessonValue));
    
    let suggestions = [];
    
    // Tentar parear pares com pares
    for (let i = 0; i < evenStudents.length; i += 2) {
        if (i + 1 < evenStudents.length) {
            const student1 = evenStudents[i];
            const student2 = evenStudents[i + 1];
            const lessonDiff = Math.abs(student1.nextLessonValue - student2.nextLessonValue);
            
            if (lessonDiff <= 2) {
                suggestions.push({
                    student1,
                    student2,
                    baseLesson: Math.min(student1.nextLessonValue, student2.nextLessonValue),
                    type: 'par-par'
                });
            }
        }
    }
    
    // Se não houver pares suficientes, tentar misturar
    if (suggestions.length < Math.floor(regularStudents.length / 2)) {
        const allStudents = [...regularStudents];
        const used = new Set();
        
        for (let i = 0; i < allStudents.length; i++) {
            if (used.has(allStudents[i].id)) continue;
            
            for (let j = i + 1; j < allStudents.length; j++) {
                if (used.has(allStudents[j].id)) continue;
                
                const lessonDiff = Math.abs(allStudents[i].nextLessonValue - allStudents[j].nextLessonValue);
                if (lessonDiff <= 3) {
                    suggestions.push({
                        student1: allStudents[i],
                        student2: allStudents[j],
                        baseLesson: Math.min(allStudents[i].nextLessonValue, allStudents[j].nextLessonValue),
                        type: 'mixed'
                    });
                    used.add(allStudents[i].id);
                    used.add(allStudents[j].id);
                    break;
                }
            }
        }
    }
    
    // Mostrar sugestões
    const container = $('#peerWorkPairs');
    if (suggestions.length === 0) {
        container.html('<p class="text-muted small">Não há pares sugeridos</p>');
        return;
    }
    
    let html = '<h6 class="mb-3">Sugestões de Peer Work</h6>';
    suggestions.forEach((pair, index) => {
        const typeText = pair.type === 'par-par' ? 'Par-Par' : 'Misturado';
        const typeClass = pair.type === 'par-par' ? 'text-success' : 'text-warning';
        
        html += `
            <div class="card peer-match-card mb-2">
                <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="small">
                                <strong>${pair.student1.name}</strong> (Lição ${pair.student1.nextLessonDisplay})
                                <i class="bi bi-arrow-left-right mx-2"></i>
                                <strong>${pair.student2.name}</strong> (Lição ${pair.student2.nextLessonDisplay})
                            </div>
                            <div class="small text-muted">
                                Baseado na lição ${pair.baseLesson} | 
                                <span class="${typeClass}">${typeText}</span>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-outline-primary" onclick="confirmPeerWork(${pair.student1.id}, ${pair.student2.id})">
                            <i class="bi bi-check-lg"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.html(html);
}

function markAttendance(studentId, present) {
    // Implementar marcação de presença
    alert(`Presença marcada: ${present ? 'Presente' : 'Ausente'}`);
}

function confirmPeerWork(student1Id, student2Id) {
    // Implementar confirmação de peer work
    alert('Peer Work confirmado!');
}

// =============================================
// RELATÓRIOS
// =============================================

function generateReport() {
    const classId = $('#reportClassSelect').val();
    const reportType = $('#reportType').val();
    
    if (!classId) {
        alert('Selecione uma turma');
        return;
    }
    
    const cls = appData.classes.find(c => c.id == classId);
    const students = appData.students.filter(s => s.classId == classId);
    
    let html = `<h5>${cls.name} - Relatório</h5><hr>`;
    
    switch(reportType) {
        case 'progress':
            html += generateProgressReport(students);
            break;
        case 'attendance':
            html += generateAttendanceReport(students);
            break;
        case 'fale':
            html += generateFALEReport(students);
            break;
    }
    
    $('#reportContent').html(html);
}

function generateProgressReport(students) {
    if (students.length === 0) {
        return '<p class="text-muted">Nenhum aluno nesta turma</p>';
    }
    
    // Calcular média da turma
    const average = students.reduce((sum, s) => sum + s.average, 0) / students.length;
    
    // Encontrar a maior lição (valor numérico)
    const maxLesson = Math.max(...students.map(s => getLessonValue(s.nextLesson)));
    
    let html = `
        <div class="row">
            <div class="col-md-4">
                <div class="card bg-light">
                    <div class="card-body text-center">
                        <h3>${average.toFixed(1)}</h3>
                        <p class="text-muted">Média da Turma</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-light">
                    <div class="card-body text-center">
                        <h3>${students.length}</h3>
                        <p class="text-muted">Total de Alunos</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-light">
                    <div class="card-body text-center">
                        <h3>${maxLesson >= 1000 ? 'RW' + (maxLesson - 1000) : maxLesson}</h3>
                        <p class="text-muted">Maior Lição</p>
                    </div>
                </div>
            </div>
        </div>
        
        <h6 class="mt-4 mb-3">Progresso Individual</h6>
        <div class="table-responsive">
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Aluno</th>
                        <th>Lição</th>
                        <th>F</th>
                        <th>A</th>
                        <th>L</th>
                        <th>E</th>
                        <th>Média</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    students.forEach(student => {
        html += `
            <tr>
                <td>${student.name}</td>
                <td>${getLessonDisplay(student.nextLesson)}</td>
                <td><span class="fale-badge fale-${student.fale.F}">${student.fale.F}</span></td>
                <td><span class="fale-badge fale-${student.fale.A}">${student.fale.A}</span></td>
                <td><span class="fale-badge fale-${student.fale.L}">${student.fale.L}</span></td>
                <td><span class="fale-badge fale-${student.fale.E}">${student.fale.E}</span></td>
                <td><strong>${student.average.toFixed(1)}</strong></td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    
    return html;
}

function generateAttendanceReport(students) {
    return '<p class="text-muted">Relatório de frequência em desenvolvimento...</p>';
}

function generateFALEReport(students) {
    if (students.length === 0) {
        return '<p class="text-muted">Nenhum aluno nesta turma</p>';
    }
    
    // Contar avaliações por categoria
    const counts = { F: {}, A: {}, L: {}, E: {} };
    const categories = ['O', 'MB', 'B', 'R'];
    
    categories.forEach(cat => {
        counts.F[cat] = students.filter(s => s.fale.F === cat).length;
        counts.A[cat] = students.filter(s => s.fale.A === cat).length;
        counts.L[cat] = students.filter(s => s.fale.L === cat).length;
        counts.E[cat] = students.filter(s => s.fale.E === cat).length;
    });
    
    let html = `
        <h6 class="mb-3">Distribuição das Avaliações F.A.L.E</h6>
        <div class="row">
    `;
    
    ['F', 'A', 'L', 'E'].forEach(skill => {
        const skillName = {
            'F': 'Fluência',
            'A': 'Pronúncia',
            'L': 'Compreensão',
            'E': 'Expressão'
        }[skill];
        
        html += `
            <div class="col-md-3 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6>${skillName} (${skill})</h6>
                        ${categories.map(cat => `
                            <div class="d-flex justify-content-between small mb-1">
                                <span>${cat}:</span>
                                <span>${counts[skill][cat]} alunos</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    return html;
}

// =============================================
// INICIALIZAÇÃO COMPLETA
// =============================================

// Criar dados de exemplo se não houver dados
if (!localStorage.getItem('englishPlannerData')) {
    appData = {
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
            },
            {
                id: 4,
                name: "Carlos",
                classId: 2,
                lastLesson: "172",
                nextLesson: "173",
                nextLessonValue: 173,
                lastLessonValue: 172,
                fale: { F: "B", A: "B", L: "R", E: "MB" },
                average: 2.0,
                attendance: [],
                peerHistory: []
            },
            {
                id: 5,
                name: "Ana",
                classId: 1,
                lastLesson: "RW1",
                nextLesson: "176",
                nextLessonValue: 176,
                lastLessonValue: 1001,
                fale: { F: "MB", A: "MB", L: "B", E: "O" },
                average: 3.0,
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
    
    saveData();
}
