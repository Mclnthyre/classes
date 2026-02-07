// js/modules/planning-manager.js

import { getAppData } from './data-manager.js';
import { getLessonValue, getLessonDisplay, isEvenLessonValue } from '../utils/lesson-utils.js';

/**
 * Redireciona para planejamento de aula
 */
export function planLesson(classId) {
    showSection('lessons');
    $('#selectClassForPlanning').val(classId);
    generateAttendanceOrder();
}

/**
 * Gera ordem de atendimento
 */
export function generateAttendanceOrder() {
    const classId = $('#selectClassForPlanning').val();
    const date = $('#planningDate').val() || new Date().toISOString().split('T')[0];
    
    if (!classId) {
        alert('Selecione uma turma primeiro');
        return;
    }
    
    const appData = getAppData();
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
    
    // Ordenar: pares, ímpares, RW
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

/**
 * Gera sugestões de Peer Work
 */
function generatePeerWorkSuggestions(students) {
    const regularStudents = students.filter(s => s.nextLessonValue < 1000);
    
    if (regularStudents.length < 2) {
        $('#peerWorkPairs').html('<p class="text-muted small">Não há alunos suficientes para Peer Work</p>');
        return;
    }
    
    const evenStudents = regularStudents.filter(s => isEvenLessonValue(s.nextLessonValue));
    const oddStudents = regularStudents.filter(s => !isEvenLessonValue(s.nextLessonValue));
    
    let suggestions = [];
    
    // Parear pares com pares
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
    
    // Se não houver pares suficientes, misturar
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

/**
 * Marca presença (placeholder)
 */
export function markAttendance(studentId, present) {
    alert(`Presença marcada: ${present ? 'Presente' : 'Ausente'}`);
}

/**
 * Confirma Peer Work (placeholder)
 */
export function confirmPeerWork(student1Id, student2Id) {
    alert('Peer Work confirmado!');
}

/**
 * Gera relatórios
 */
export function generateReport() {
    const classId = $('#reportClassSelect').val();
    const reportType = $('#reportType').val();
    
    if (!classId) {
        alert('Selecione uma turma');
        return;
    }
    
    const appData = getAppData();
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

/**
 * Gera relatório de progresso
 */
function generateProgressReport(students) {
    if (students.length === 0) {
        return '<p class="text-muted">Nenhum aluno nesta turma</p>';
    }
    
    const average = students.reduce((sum, s) => sum + s.average, 0) / students.length;
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

/**
 * Gera relatório de frequência (placeholder)
 */
function generateAttendanceReport(students) {
    return '<p class="text-muted">Relatório de frequência em desenvolvimento...</p>';
}

/**
 * Gera relatório F.A.L.E
 */
function generateFALEReport(students) {
    if (students.length === 0) {
        return '<p class="text-muted">Nenhum aluno nesta turma</p>';
    }
    
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
