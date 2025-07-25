let currentScreen = 0;
let currentQuestionSet = 0;
let answers = {};
let questions = [];

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
    const pillars = {
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

    if (currentQuestionSet < questions.length - 1) {
        currentQuestionSet++;
        renderQuestions();
    } else {
        document.getElementById('questionnaire').classList.remove('active');
        document.getElementById('email').classList.add('active');
        currentScreen = 3;
    }
}

function updateProgress() {
    const totalSets = questions.length;
    const progress = ((currentQuestionSet + 1) / totalSets) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('currentStep').textContent = currentQuestionSet + 1;
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn.style.display = currentQuestionSet > 0 ? 'block' : 'none';
    nextBtn.textContent = currentQuestionSet === questions.length - 1 ? 'FINALIZAR →' : 'CONTINUAR →';
}

function submitResults() {
    const email = document.getElementById('emailInput').value;
    const emailError = document.getElementById('emailError');

    if (!isValidEmail(email)) {
        emailError.style.display = 'block';
        return;
    }

    emailError.style.display = 'none';
    const metrics = calculateMetrics();

    console.log('Resultados:', answers);
    console.log('Email:', email);
    console.log('Métricas:', metrics);

    document.getElementById('email').classList.remove('active');
    document.getElementById('thanks').classList.add('active');
    currentScreen = 4;
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

function previousQuestionScreen() {
    if (currentQuestionSet > 0) {
        currentQuestionSet--;
        renderQuestions();
    }
}
