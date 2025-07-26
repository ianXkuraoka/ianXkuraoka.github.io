let currentScreen = 0;
let currentQuestionSet = 0;
let answers = {};
let questions = [];
let pillars = {};

// Mapping from competência to pilar
const competenciaToPilar = {
    "autoconsciência emocional": "AUTOCONSCIÊNCIA",
    "autoavaliação precisa": "AUTOCONSCIÊNCIA",
    "consciência corporal": "AUTOCONSCIÊNCIA",
    "autoconfiança e autoestima": "AUTOCONSCIÊNCIA",
    "autocontrole": "AUTOGESTÃO",
    "gestão do estresse": "AUTOGESTÃO",
    "adaptabilidade": "AUTOGESTÃO",
    "autodisciplina": "AUTOGESTÃO",
    "automotivação": "MOTIVAÇÃO",
    "resiliência": "MOTIVAÇÃO",
    "reflexão": "MOTIVAÇÃO",
    "transparência e coerência com s valores": "MOTIVAÇÃO",
    "compreensão emocional": "CONSCIÊNCIA_SOCIAL",
    "sensibilidade às diferenças culturais": "CONSCIÊNCIA_SOCIAL",
    "observação e leitura social": "CONSCIÊNCIA_SOCIAL",
    "leitura de clima organizacional": "CONSCIÊNCIA_SOCIAL",
    "trabalho em equipe e colaboração": "GESTÃO_DE_RELACIONAMENTOS",
    "comunicação assertiva": "GESTÃO_DE_RELACIONAMENTOS",
    "gestão de conflitos": "GESTÃO_DE_RELACIONAMENTOS",
    "gestão de relacionamentos (networking)": "GESTÃO_DE_RELACIONAMENTOS",
    "negociação": "GESTÃO_DE_RELACIONAMENTOS",
    "liderança inspiradora": "GESTÃO_DE_RELACIONAMENTOS",
    "influência nas relações interpessoais": "GESTÃO_DE_RELACIONAMENTOS",
    "compaixão": "CONSCIÊNCIA_SOCIAL",
    "flexibilidade": "AUTOGESTÃO",
    "sensibilidade aos impactos das decisões": "CONSCIÊNCIA_SOCIAL",
    "percepção da cultura organizacional": "CONSCIÊNCIA_SOCIAL",
    "escuta ativa": "GESTÃO_DE_RELACIONAMENTOS"
    // Add more as needed
};

// Carregar perguntas do arquivo JSON
async function fetchQuestions() {
    const response = await fetch('data/questions.json');
    const questionsData = await response.json();

    // Group questions by pillar
    pillars = {
        AUTOCONSCIÊNCIA: [],
        AUTOGESTÃO: [],
        MOTIVAÇÃO: [],
        CONSCIÊNCIA_SOCIAL: [],
        GESTÃO_DE_RELACIONAMENTOS: []
    };

    questionsData.forEach(q => {
        if (!q.competência) return;
        const competenciaKey = q.competência.trim().toLowerCase();
        const pilar = competenciaToPilar[competenciaKey];
        if (pilar && pillars[pilar]) {
            pillars[pilar].push(q);
        }
    });

    // Convert pillars object to array of arrays for compatibility
    questions = [
    ...pillars.AUTOCONSCIÊNCIA,
    ...pillars.AUTOGESTÃO,
    ...pillars.MOTIVAÇÃO,
    ...pillars.CONSCIÊNCIA_SOCIAL,
    ...pillars.GESTÃO_DE_RELACIONAMENTOS
    ];
}

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

function showWelcome2() {
    document.getElementById('welcome1').classList.remove('active');
    document.getElementById('welcome2').classList.add('active');
    currentScreen = 1; // Sync with screens array
}


function previousScreen() {
    if (currentScreen > 0) {
        document.getElementById(screens[currentScreen]).classList.remove('active');
        currentScreen--;
        document.getElementById(screens[currentScreen]).classList.add('active');
    }
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

    // Restaurar respostas já selecionadas
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
    const scale = document.querySelector(`[data-question="${questionIndex}"]`);
    scale.querySelectorAll('.scale-radio').forEach(radio => {
        radio.classList.remove('selected');
    });

    const radio = scale.querySelector(`[data-value="${value}"]`);
    radio.classList.add('selected');

    answers[questionIndex] = value;
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

function updateProgress() {
    const totalPages = Math.ceil(questions.length / 8);
    const progress = ((currentQuestionSet + 1) / totalPages) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('currentStep').textContent = currentQuestionSet + 1;
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const totalPages = Math.ceil(questions.length / 8);

    prevBtn.style.display = currentQuestionSet > 0 ? 'block' : 'none';
    nextBtn.textContent = currentQuestionSet === totalPages - 1 ? 'FINALIZAR' : 'CONTINUAR';
}

function submitResults() {
    const email = document.getElementById('emailInput').value;
    const emailError = document.getElementById('emailError');

    if (!isValidEmail(email)) {
        emailError.style.display = 'block';
        return;
    }

    emailError.style.display = 'none';
    const metrics = calculateMetrics(answers, pillars);

    document.getElementById('email').classList.remove('active');
    document.getElementById('thanks').classList.add('active');
    currentScreen = 4;

    renderPillarChart(metrics);
    renderGroupedSubPillarCharts();
}

// Draw a pie chart for the 5 pillars
function renderPillarChart(metrics) {
    const ctx = document.getElementById('resultsChart').getContext('2d');
    if (window.pillarChartInstance) window.pillarChartInstance.destroy();

    // Calculate max possible points per pillar (number of questions * 5)
    const maxPoints = [
        pillars.AUTOCONSCIÊNCIA.length * 5,
        pillars.AUTOGESTÃO.length * 5,
        pillars.MOTIVAÇÃO.length * 5,
        pillars.CONSCIÊNCIA_SOCIAL.length * 5,
        pillars.GESTÃO_DE_RELACIONAMENTOS.length * 5
    ];
    const scores = [
        metrics.autoconsciencia,
        metrics.autogestao,
        metrics.motivacao,
        metrics.conscienciaSocial,
        metrics.gestaoRelacionamentos
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
                'Motivação',
                'Consciência Social',
                'Gestão de Relacionamentos'
            ],
            datasets: [{
                label: 'Percentual',
                data: percentages,
                backgroundColor: [
                    '#FD7C50', '#FDC350', '#50BFFD', '#50FDAA', '#A950FD'
                ]
            }]
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed}%`;
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        }
    });
}

function renderGroupedSubPillarCharts() {
    const container = document.getElementById('subPillarChartsContainer');
    container.innerHTML = ''; // Clear previous charts

    // Group questions by pillar and subpillar
    const pillarGroups = {
        AUTOCONSCIÊNCIA: [],
        AUTOGESTÃO: [],
        MOTIVAÇÃO: [],
        CONSCIÊNCIA_SOCIAL: [],
        GESTÃO_DE_RELACIONAMENTOS: []
    };

    questions.forEach(q => {
        const competenciaKey = q.competência ? q.competência.trim().toLowerCase() : '';
        const pilar = competenciaToPilar[competenciaKey];
        if (pilar && pillarGroups[pilar]) {
            pillarGroups[pilar].push(q);
        }
    });

    Object.entries(pillarGroups).forEach(([pillar, qs], idx) => {
        // Calculate subpillar scores for this pillar
        const subScores = {};
        qs.forEach(q => {
            if (!q.competência) return;
            if (!subScores[q.competência]) subScores[q.competência] = 0;
            subScores[q.competência] += answers[q.Item - 1] ? Number(answers[q.Item - 1]) : 0;
        });

        // Title
        const title = document.createElement('div');
        title.style.textAlign = 'center';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '8px';
        title.textContent = pillar.replace(/_/g, ' ');
        container.appendChild(title);

        // Create a canvas for this pillar
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 220;
        canvas.style.width = '100%';
        canvas.style.maxWidth = '400px';
        canvas.style.height = '220px';
        container.appendChild(canvas);

        // Draw chart
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

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function calculateMetrics(answers, pillars) {
    const metrics = {
        autoconsciencia: 0,
        autogestao: 0,
        motivacao: 0,
        conscienciaSocial: 0,
        gestaoRelacionamentos: 0,
        total: 0
    };

    metrics.autoconsciencia = pillars.AUTOCONSCIÊNCIA.reduce((sum, q, idx) => sum + (answers[q.Item - 1] || 0), 0);
    metrics.autogestao = pillars.AUTOGESTÃO.reduce((sum, q, idx) => sum + (answers[q.Item - 1] || 0), 0);
    metrics.motivacao = pillars.MOTIVAÇÃO.reduce((sum, q, idx) => sum + (answers[q.Item - 1] || 0), 0);
    metrics.conscienciaSocial = pillars.CONSCIÊNCIA_SOCIAL.reduce((sum, q, idx) => sum + (answers[q.Item - 1] || 0), 0);
    metrics.gestaoRelacionamentos = pillars.GESTÃO_DE_RELACIONAMENTOS.reduce((sum, q, idx) => sum + (answers[q.Item - 1] || 0), 0);

    metrics.total = metrics.autoconsciencia + metrics.autogestao + metrics.motivacao + metrics.conscienciaSocial + metrics.gestaoRelacionamentos;
    return metrics;
}

function calculateSubPillarScores() {
    // Group and sum answers by competência (sub-pillar)
    const subPillarScores = {};
    questions.forEach(q => {
        if (!q.competência) return;
        if (!subPillarScores[q.competência]) subPillarScores[q.competência] = 0;
        // Use q.Item-1 as index for answers
        subPillarScores[q.competência] += answers[q.Item - 1] ? Number(answers[q.Item - 1]) : 0;
    });
    return subPillarScores;
}

function renderSubPillarChart() {
    const subPillarScores = calculateSubPillarScores();
    const ctx = document.getElementById('subPillarChart').getContext('2d');
    // Destroy previous chart instance if needed (optional, for repeated renders)
    if (window.subPillarChartInstance) window.subPillarChartInstance.destroy();

    window.subPillarChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(subPillarScores),
            datasets: [{
                label: 'Pontuação por Competência',
                data: Object.values(subPillarScores),
                backgroundColor: '#50BFFD'
            }]
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true }
            }
        }
    });
}

function previousQuestionScreen() {
    if (currentQuestionSet > 0) {
        currentQuestionSet--;
        renderQuestions();
    }
}
