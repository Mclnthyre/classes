// js/utils/lesson-utils.js

/**
 * Converte lição para valor numérico para ordenação
 * Ex: "RW1" -> 1001, "RW2" -> 1002, "170" -> 170
 */
export function getLessonValue(lesson) {
    if (typeof lesson === 'string') {
        const match = lesson.match(/RW(\d*)/i);
        if (match) {
            const rwNum = match[1] ? parseInt(match[1]) : 0;
            return 1000 + rwNum;
        }
        const numMatch = lesson.match(/\d+/);
        if (numMatch) {
            return parseInt(numMatch[0]);
        }
    } else if (typeof lesson === 'number') {
        return lesson;
    }
    return 0;
}

/**
 * Retorna lição formatada para exibição
 */
export function getLessonDisplay(lesson) {
    if (typeof lesson === 'string') {
        return lesson.toUpperCase();
    }
    return String(lesson);
}

/**
 * Verifica se é uma lição de review (RW)
 */
export function isReviewLesson(lesson) {
    if (typeof lesson === 'string') {
        return lesson.toUpperCase().startsWith('RW');
    }
    return false;
}

/**
 * Determina se é par ou ímpar baseado no valor numérico
 */
export function isEvenLessonValue(lessonValue) {
    if (lessonValue >= 1000) {
        return false; // RW é considerado "ímpar"
    }
    return lessonValue % 2 === 0;
}
