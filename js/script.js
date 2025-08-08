// =====================
// GLOBAL VARIABLES
// =====================
let currentScreen = 0;
let currentQuestionSet = 0;
let answers = {};
let questions = [];
let pillars = {};

// =====================
// FETCH & ORGANIZE QUESTIONS
// =====================
async function fetchQuestions() {
    const response = await fetch('data/questions.json');
    const questionsData = await response.json();

    pillars = {
        AUTOCONSCIÊNCIA: [],
        AUTOGESTÃO: [],
        CONSCIÊNCIA_SOCIAL: [],
        GESTÃO_DE_RELACIONAMENTO: []
    };

    questionsData.forEach(q => {
        if (!q.fundamento) return;
        const pilar = q.fundamento.trim().toUpperCase().replace(/ /g, '_');
        if (pillars[pilar]) {
            pillars[pilar].push(q);
        }
    });

    questions = [
        ...pillars.AUTOCONSCIÊNCIA,
        ...pillars.AUTOGESTÃO,
        ...pillars.CONSCIÊNCIA_SOCIAL,
        ...pillars.GESTÃO_DE_RELACIONAMENTO
    ];
}

// =====================
// NAVIGATION & RENDERING
// =====================
const screens = ['welcome1', 'welcome2', 'instructions', 'questionnaire', 'email', 'thanks'];

async function nextScreen() {
    if (currentScreen < screens.length - 1) {
        document.getElementById(screens[currentScreen]).classList.remove('active');
        currentScreen++;
        document.getElementById(screens[currentScreen]).classList.add('active');
        if (screens[currentScreen] === 'questionnaire') {
            await fetchQuestions();
            renderQuestions();
        }
    }
}

function previousScreen() {
    if (currentScreen > 0) {
        document.getElementById(screens[currentScreen]).classList.remove('active');
        currentScreen--;
        document.getElementById(screens[currentScreen]).classList.add('active');
    }
}

function showWelcome2() {
    document.getElementById('welcome1').classList.remove('active');
    document.getElementById('welcome2').classList.add('active');
    currentScreen = 1;
}

function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    const startIndex = currentQuestionSet * 8;
    const endIndex = startIndex + 8;
    const currentQuestions = questions.slice(startIndex, endIndex);

    container.innerHTML = '';

    currentQuestions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-container';
        questionDiv.innerHTML = `
            <div class="question">${startIndex + index + 1}. ${question.Pergunta}
                <div class="likert-scale" data-question="${currentQuestionSet * 8 + index}">
                    ${[1, 2, 3, 4, 5].map(value => `
                        <div class="scale-option" onclick="selectAnswer(${currentQuestionSet * 8 + index}, ${value})">
                            <div class="scale-radio" data-value="${value}"></div>
                            <div class="scale-label">${getLabelForValue(value)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.appendChild(questionDiv);
    });

    // Restore selected answers
    Object.keys(answers).forEach(questionIndex => {
        const value = answers[questionIndex];
        const scale = document.querySelector(`[data-question="${questionIndex}"]`);
        if (scale) {
            const radio = scale.querySelector(`[data-value="${value}"]`);
            if (radio) {
                radio.classList.add('selected');
            }
        }
    });

    updateProgress();
    updateNavigationButtons();
}

function nextQuestionScreen() {
    const startIndex = currentQuestionSet * 8;
    const endIndex = startIndex + 8;
    const currentQuestions = questions.slice(startIndex, endIndex);

    for (let i = startIndex; i < endIndex; i++) {
        if (!answers[i]) {
            alert('Por favor, responda todas as perguntas antes de continuar.');
            return;
        }
    }

    const totalPages = Math.ceil(questions.length / 8);
    if (currentQuestionSet < totalPages - 1) {
        currentQuestionSet++;
        renderQuestions();
        window.scrollTo(0, 0);
    } else {
        document.getElementById('questionnaire').classList.remove('active');
        document.getElementById('email').classList.add('active');
        currentScreen = 3;
        window.scrollTo(0, 0);
    }
}

function previousQuestionScreen() {
    if (currentQuestionSet > 0) {
        currentQuestionSet--;
        renderQuestions();
    }
}

function updateProgress() {
    const totalPages = Math.ceil(questions.length / 8);
    const progress = (currentQuestionSet / (totalPages - 1)) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('currentStep').textContent = currentQuestionSet;
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const totalPages = Math.ceil(questions.length / 8);

    prevBtn.style.display = currentQuestionSet > 0 ? 'block' : 'none';
    nextBtn.textContent = currentQuestionSet === totalPages - 1 ? 'FINALIZAR' : 'CONTINUAR';
}

// =====================
// ANSWER SELECTION
// =====================
function getLabelForValue(value) {
    const labels = {
        1: 'discordo<br>totalmente',
        2: 'discordo<br>parcialmente',
        3: 'neutro',
        4: 'concordo<br>parcialmente',
        5: 'concordo<br>totalmente'
    };
    return labels[value];
}

function selectAnswer(questionIndex, value) {
    // Validate session before allowing answer selection
    if (!validateSession()) {
        alert('Sessão expirada. Por favor, recarregue a página.');
        return;
    }
    if (questionIndex < 0 || questionIndex >= questions.length || value < 1 || value > 5) {
        return;
    }
    const scale = document.querySelector(`[data-question="${questionIndex}"]`);
    if (!scale) return;
    scale.querySelectorAll('.scale-radio').forEach(radio => {
        radio.classList.remove('selected');
    });
    const radio = scale.querySelector(`[data-value="${value}"]`);
    if (radio) {
        radio.classList.add('selected');
        answers[questionIndex] = value;
    }
}

// =====================
// METRICS & ANALYSIS
// =====================
function calculateMetrics(answers, pillars) {
    const metrics = {
        autoconsciencia: 0,
        autogestao: 0,
        conscienciaSocial: 0,
        gestaoRelacionamento: 0,
        total: 0
    };

    metrics.autoconsciencia = pillars.AUTOCONSCIÊNCIA.reduce((sum, q) => sum + (answers[q.Item - 1] || 0), 0);
    metrics.autogestao = pillars.AUTOGESTÃO.reduce((sum, q) => sum + (answers[q.Item - 1] || 0), 0);
    metrics.conscienciaSocial = pillars.CONSCIÊNCIA_SOCIAL.reduce((sum, q) => sum + (answers[q.Item - 1] || 0), 0);
    metrics.gestaoRelacionamento = pillars.GESTÃO_DE_RELACIONAMENTO.reduce((sum, q) => sum + (answers[q.Item - 1] || 0), 0);

    metrics.total = metrics.autoconsciencia + metrics.autogestao + metrics.conscienciaSocial + metrics.gestaoRelacionamento;
    return metrics;
}

function calculateSubPillarScores() {
    const subPillarScores = {};
    questions.forEach(q => {
        if (!q.competência) return;
        if (!subPillarScores[q.competência]) subPillarScores[q.competência] = 0;
        subPillarScores[q.competência] += answers[q.Item - 1] ? Number(answers[q.Item - 1]) : 0;
    });
    return subPillarScores;
}

function getSubPillarAnalysis() {
    const pillarGroups = {
        AUTOCONSCIÊNCIA: [],
        AUTOGESTÃO: [],
        CONSCIÊNCIA_SOCIAL: [],
        GESTÃO_DE_RELACIONAMENTO: []
    };

    questions.forEach(q => {
        if (!q.fundamento) return;
        const pilar = q.fundamento.trim().toUpperCase().replace(/ /g, '_');
        if (pillars[pilar]) {
            pillarGroups[pilar].push(q);
        }
    });

    const analysis = {};
    Object.entries(pillarGroups).forEach(([pillar, qs]) => {
        const subScores = {};
        qs.forEach(q => {
            let subKey = q.competência;
            if (pillar === 'CONSCIÊNCIA_SOCIAL' && q.subfundamento) {
                subKey = `${q.subfundamento} - ${q.competência}`;
            }
            if (!subScores[subKey]) subScores[subKey] = 0;
            subScores[subKey] += answers[q.Item - 1] ? Number(answers[q.Item - 1]) : 0;
        });
        analysis[pillar] = subScores;
    });
    return analysis;
}

// =====================
// CHARTS & SUMMARY
// =====================
function getPieChartImage(metrics) {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 225;
    const ctx = canvas.getContext('2d');

    const maxPoints = [
        pillars.AUTOCONSCIÊNCIA.length * 5,
        pillars.AUTOGESTÃO.length * 5,
        pillars.CONSCIÊNCIA_SOCIAL.length * 5,
        pillars.GESTÃO_DE_RELACIONAMENTO.length * 5
    ];
    const scores = [
        metrics.autoconsciencia,
        metrics.autogestao,
        metrics.conscienciaSocial,
        metrics.gestaoRelacionamento
    ];
    const percentages = scores.map((score, i) =>
        maxPoints[i] ? Math.round((score / maxPoints[i]) * 100) : 0
    );

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [
                'Autoconsciência',
                'Autogestão',
                'Consciência Social',
                'Gestão de Relacionamento'
            ],
            datasets: [{
                label: 'Percentual',
                data: percentages,
                backgroundColor: [
                    '#FD7C50', '#FDC350', '#50BFFD', '#A950FD'
                ]
            }]
        },
        options: {
            animation: false,
            plugins: {
                legend: { display: true, position: 'bottom' }
            }
        }
    });

    return canvas.toDataURL('image/jpeg', 0.7);
}

function renderPillarChart(metrics) {
    const ctx = document.getElementById('resultsChart').getContext('2d');
    if (window.pillarChartInstance) window.pillarChartInstance.destroy();

    const maxPoints = [
        pillars.AUTOCONSCIÊNCIA.length * 5,
        pillars.AUTOGESTÃO.length * 5,
        pillars.CONSCIÊNCIA_SOCIAL.length * 5,
        pillars.GESTÃO_DE_RELACIONAMENTO.length * 5
    ];
    const scores = [
        metrics.autoconsciencia,
        metrics.autogestao,
        metrics.conscienciaSocial,
        metrics.gestaoRelacionamento
    ];
    const percentages = scores.map((score, i) =>
        maxPoints[i] ? Math.round((score / maxPoints[i]) * 100) : 0
    );

    window.pillarChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [
                'Autoconsciência',
                'Autogestão',
                'Consciência Social',
                'Gestão de Relacionamento'
            ],
            datasets: [{
                label: 'Percentual',
                data: percentages,
                backgroundColor: [
                    '#fd7c50', '#f0bca5', '#fae8ac', '#d9d9d9'
                ],
                borderWidth: 4, // Make border visible
                borderColor: '#fff',
                borderAlign: 'inner', // Ensures borders are inside and segments are clickable
                hoverBorderWidth: 6,
                hoverBorderColor: '#333'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const percentage = context.parsed || 0;
                            const actualScore = scores[context.dataIndex];
                            const maxScore = maxPoints[context.dataIndex];
                            return `${label}: ${percentage}% (${actualScore}/${maxScore} pontos)`;
                        }
                    },
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#333',
                    borderWidth: 1
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function renderGroupedSubPillarCharts() {
    const container = document.getElementById('subPillarChartsContainer');
    container.innerHTML = '';

    const pillarGroups = {
        AUTOCONSCIÊNCIA: [],
        AUTOGESTÃO: [],
        CONSCIÊNCIA_SOCIAL: [],
        GESTÃO_DE_RELACIONAMENTO: []
    };

    questions.forEach(q => {
        if (!q.fundamento) return;
        const pilar = q.fundamento.trim().toUpperCase().replace(/ /g, '_');
        if (pillarGroups[pilar]) {
            pillarGroups[pilar].push(q);
        }
    });

    Object.entries(pillarGroups).forEach(([pillar, qs], idx) => {
        const subScores = {};
        qs.forEach(q => {
            let subKey = q.competência;
            if (pillar === 'CONSCIÊNCIA_SOCIAL' && q.subfundamento) {
                subKey = `${q.subfundamento} - ${q.competência}`;
            }
            if (!subScores[subKey]) subScores[subKey] = 0;
            subScores[subKey] += answers[q.Item - 1] ? Number(answers[q.Item - 1]) : 0;
        });

        const title = document.createElement('div');
        title.style.textAlign = 'center';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '8px';
        title.textContent = pillar.replace(/_/g, ' ');
        container.appendChild(title);

        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 220;
        canvas.style.width = '100%';
        canvas.style.maxWidth = '400px';
        canvas.style.height = '220px';
        container.appendChild(canvas);

        new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: Object.keys(subScores),
                datasets: [{
                    label: 'Pontuação',
                    data: Object.values(subScores),
                    backgroundColor: '#50BFFD'
                }]
            },
            options: {
                plugins: {
                    legend: { display: false }
                },
                indexAxis: 'y',
                scales: {
                    x: { beginAtZero: true }
                }
            }
        });
    });
}

function getSummaryTable(metrics) {
    return `
        <div style="font-family: Arial, sans-serif; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 15px;">Resultados por Pilar</h3>
            <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Pilar</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Média</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px;">Autoconsciência</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">
                            ${(metrics.autoconsciencia && pillars.AUTOCONSCIÊNCIA.length) 
                                ? (metrics.autoconsciencia / pillars.AUTOCONSCIÊNCIA.length).toFixed(2) 
                                : '0.00'}
                        </td>
                    </tr>
                    <tr style="background-color: #f8f9fa;">
                        <td style="border: 1px solid #ddd; padding: 12px;">Autogestão</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">
                            ${(metrics.autogestao && pillars.AUTOGESTÃO.length) 
                                ? (metrics.autogestao / pillars.AUTOGESTÃO.length).toFixed(2) 
                                : '0.00'}
                        </td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px;">Consciência Social</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">
                            ${(metrics.conscienciaSocial && pillars.CONSCIÊNCIA_SOCIAL.length) 
                                ? (metrics.conscienciaSocial / pillars.CONSCIÊNCIA_SOCIAL.length).toFixed(2) 
                                : '0.00'}
                        </td>
                    </tr>
                    <tr style="background-color: #f8f9fa;">
                        <td style="border: 1px solid #ddd; padding: 12px;">Gestão de Relacionamento</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">
                            ${(metrics.gestaoRelacionamento && pillars.GESTÃO_DE_RELACIONAMENTO.length) 
                                ? (metrics.gestaoRelacionamento / pillars.GESTÃO_DE_RELACIONAMENTO.length).toFixed(2) 
                                : '0.00'}
                        </td>
                    </tr>
                    <tr style="background-color: #e9ecef; font-weight: bold;">
                        <td style="border: 1px solid #ddd; padding: 12px;">TOTAL</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">
                            ${(metrics.total && questions.length) 
                                ? (metrics.total / questions.length).toFixed(2) 
                                : '0.00'}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

function getSubPillarHtml(subPillarAnalysis) {
    let html = '<div style="font-family: Arial, sans-serif; margin: 20px 0;">';
    html += '<h3 style="color: #333; margin-bottom: 15px;">Análise Detalhada por Competência</h3>';
    for (const [pillar, subs] of Object.entries(subPillarAnalysis)) {
        html += `<div style="margin-bottom: 20px;">`;
        html += `<h4 style="color: #555; margin-bottom: 10px; border-bottom: 2px solid #FD7C50; padding-bottom: 5px;">${pillar.replace(/_/g, ' ')}</h4>`;
        html += `<ul style="list-style-type: none; padding: 0; margin: 0;">`;
        for (const [sub, score] of Object.entries(subs)) {
            html += `<li style="padding: 5px 0; border-bottom: 1px solid #eee;">
                        <strong style="color: #333;">${sub}:</strong> 
                        <span style="color: #666;">${score}</span>
                     </li>`;
        }
        html += '</ul></div>';
    }
    html += '</div>';
    return html;
}

// =====================
// SECURITY & VALIDATION
// =====================
function sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return email && 
           email.length <= 254 && 
           emailRegex.test(email) && 
           !email.includes('<') && 
           !email.includes('>') && 
           !email.includes('"');
}

// Rate Limiting
class RateLimit {
    constructor(maxAttempts = 3, windowMs = 300000) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
        this.attempts = new Map();
    }
    isAllowed(identifier) {
        const now = Date.now();
        const key = identifier || 'default';
        if (!this.attempts.has(key)) {
            this.attempts.set(key, []);
        }
        const userAttempts = this.attempts.get(key);
        const validAttempts = userAttempts.filter(time => now - time < this.windowMs);
        this.attempts.set(key, validAttempts);
        if (validAttempts.length >= this.maxAttempts) {
            return false;
        }
        validAttempts.push(now);
        return true;
    }
    getRemainingTime(identifier) {
        const key = identifier || 'default';
        if (!this.attempts.has(key)) return 0;
        const userAttempts = this.attempts.get(key);
        if (userAttempts.length === 0) return 0;
        const oldestAttempt = Math.min(...userAttempts);
        const remaining = this.windowMs - (Date.now() - oldestAttempt);
        return Math.max(0, remaining);
    }
}
const rateLimiter = new RateLimit(2, 300000);

// Secure Token Generation
function generateSecureToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Session Validation
let sessionToken = null;
let sessionStartTime = null;
const SESSION_TIMEOUT = 3600000;

function initializeSession() {
    sessionToken = generateSecureToken();
    sessionStartTime = Date.now();
    localStorage.setItem('quiz_session', sessionToken);
    localStorage.setItem('quiz_start', sessionStartTime.toString());
}

function validateSession() {
    const storedToken = localStorage.getItem('quiz_session');
    const storedStart = localStorage.getItem('quiz_start');
    if (!storedToken || !storedStart || storedToken !== sessionToken) {
        return false;
    }
    const elapsed = Date.now() - parseInt(storedStart);
    if (elapsed > SESSION_TIMEOUT) {
        clearSession();
        return false;
    }
    return true;
}

function clearSession() {
    localStorage.removeItem('quiz_session');
    localStorage.removeItem('quiz_start');
    sessionToken = null;
    sessionStartTime = null;
}

// Quiz Completion Validation
function validateQuizCompletion() {
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(answers).length;
    if (answeredQuestions !== totalQuestions) {
        return false;
    }
    for (const [questionIndex, answer] of Object.entries(answers)) {
        if (!answer || answer < 1 || answer > 5) {
            return false;
        }
    }
    return true;
}

// Get Client IP
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown_' + Math.random().toString(36).substring(7);
    }
}

// Initialize Security on Page Load
document.addEventListener('DOMContentLoaded', function() {
    initializeSession();
    if (typeof window !== 'undefined') {
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
        /*
        document.addEventListener('keydown', function(e) {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.key === 'u')) {
                e.preventDefault();
            }
        });
        */
    }
});

// =====================
// SUBMIT & EMAIL LOGIC
// =====================
async function submitResults() {
    const name = document.getElementById('nameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const emailError = document.getElementById('emailError');
    const submitBtn = document.getElementById('submitBtn'); // Make sure your button has id="submitBtn"
    emailError.style.display = 'none';
    emailError.textContent = '';

    // Disable the submit button to prevent multiple clicks
    if (submitBtn) submitBtn.disabled = true;

    if (!validateSession()) {
        emailError.textContent = 'Sessão expirada. Por favor, recarregue a página.';
        emailError.style.display = 'block';
        if (submitBtn) submitBtn.disabled = false;
        return;
    }
    if (!name || name.length < 2) {
        emailError.textContent = 'Por favor, insira seu nome.';
        emailError.style.display = 'block';
        if (submitBtn) submitBtn.disabled = false;
        return;
    }
    if (!isValidEmail(email)) {
        emailError.textContent = 'Por favor, insira um email válido.';
        emailError.style.display = 'block';
        if (submitBtn) submitBtn.disabled = false;
        return;
    }
    const clientIP = await getClientIP();
    if (!rateLimiter.isAllowed(clientIP)) {
        const remainingTime = Math.ceil(rateLimiter.getRemainingTime(clientIP) / 60000);
        emailError.textContent = `Muitas tentativas. Tente novamente em ${remainingTime} minutos.`;
        emailError.style.display = 'block';
        if (submitBtn) submitBtn.disabled = false;
        return;
    }
    if (!validateQuizCompletion()) {
        emailError.textContent = 'Por favor, complete o questionário antes de enviar.';
        emailError.style.display = 'block';
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    try {
        const metrics = calculateMetrics(answers, pillars);
        const summaryTable = getSummaryTable(metrics);
        const textChart = getTextBasedChart(metrics);
        const subPillarAnalysis = getSubPillarAnalysis();
        const subPillarHtml = getSubPillarHtml(subPillarAnalysis);

        const sanitizedEmail = sanitizeHtml(email);
        const timestamp = new Date().toISOString();
        const sessionInfo = `Session: ${sessionToken.substring(0, 8)}... | Time: ${timestamp}`;

        await emailjs.send('service_f61mg7v', 'template_wx406pr', {
            to_email: sanitizedEmail,
            user_name: sanitizeHtml(name),
            summary_table: summaryTable,
            pie_chart: textChart,
            session_info: sessionInfo
        });

        await emailjs.send('service_f61mg7v', 'template_hv83ral', {
            to_email: 'direcionar.me@gmail.com',
            user_name: sanitizeHtml(name),
            summary_table: summaryTable,
            pie_chart: textChart,
            subpillar_html: subPillarHtml,
            user_email: sanitizedEmail,
            session_info: sessionInfo,
            client_ip: clientIP
        });

        clearSession();
        document.getElementById('email').classList.remove('active');
        document.getElementById('thanks').classList.add('active');
        currentScreen = 4;
        renderPillarChart(metrics);

    } catch (error) {
        console.error('Error sending email:', error);
        emailError.textContent = 'Erro ao enviar resultados. Tente novamente.';
        emailError.style.display = 'block';
        if (submitBtn) submitBtn.disabled = false;
    }
}

// =====================
// TEXT CHART FOR EMAIL
// =====================
function getTextBasedChart(metrics) {
    const maxPoints = [
        pillars.AUTOCONSCIÊNCIA.length * 5,
        pillars.AUTOGESTÃO.length * 5,
        pillars.CONSCIÊNCIA_SOCIAL.length * 5,
        pillars.GESTÃO_DE_RELACIONAMENTO.length * 5
    ];
    const scores = [
        metrics.autoconsciencia,
        metrics.autogestao,
        metrics.conscienciaSocial,
        metrics.gestaoRelacionamento
    ];
    const labels = [
        'Autoconsciência',
        'Autogestão', 
        'Consciência Social',
        'Gestão de Relacionamento'
    ];
    const percentages = scores.map((score, i) =>
        maxPoints[i] ? Math.round((score / maxPoints[i]) * 100) : 0
    );

    let chart = `
<div style="font-family: Arial, sans-serif; margin: 20px 0;">
    <h3 style="color: #333; margin-bottom: 15px;">Gráfico de Resultados (%)</h3>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
`;

    percentages.forEach((percentage, i) => {
        const barWidth = Math.max(percentage, 5);
        const color = ['#FD7C50', '#FDC350', '#50BFFD', '#A950FD'][i];
        chart += `
        <div style="margin-bottom: 15px;">
            <div style="font-weight: bold; margin-bottom: 5px; color: #333;">${labels[i]}: ${percentage}%</div>
            <div style="background: #e9ecef; height: 25px; border-radius: 12px; overflow: hidden;">
                <div style="background: ${color}; height: 100%; width: ${barWidth}%; border-radius: 12px; transition: width 0.3s ease;"></div>
            </div>
        </div>
        `;
    });

    chart += `
    </div>
</div>
    `;
    return chart;
}
