
import type { Gamification } from './types';

export const GAMIFICATION_LEVELS = [
  { level: 1, points: 0, badge: '🥉', next: 500 },
  { level: 2, points: 500, badge: '🥈', next: 2000 },
  { level: 3, points: 2000, badge: '🥇', next: 5000 },
  { level: 4, points: 5000, badge: '🏆', next: 10000 },
  { level: 5, points: 10000, badge: '💎', next: Infinity },
];

export const POINTS_PER_MINUTE = 1.5;
export const POMODORO_DURATION = 25 * 60; // 25 minutes in seconds

export const LOCALES: { [key: string]: { [key: string]: string } } = {
  en: {
    title: "Momentum",
    tagline: "Elevate Your Productivity",
    addTask: "Add a new task or search Jira...",
    tasks: "Tasks",
    weeklyGoals: "Weekly Focus",
    gamification: "Gamification",
    level: "Level",
    points: "Points",
    aiInsights: "AI Insights",
    analyze: "Analyze Productivity",
    analyzing: "Analyzing...",
    noInsights: "Complete some tasks and run analysis to see insights here.",
    pomodoroMotivation: "AI Pomodoro",
    getMotivation: "Get Motivation",
    generating: "Generating...",
    allTasksCompleted: "All tasks completed! ✨",
    play: "Play",
    pause: "Pause",
    complete: "Complete",
    delete: "Delete",
    logToJira: "Log to Jira",
    jiraLogged: "Work logged to Jira",
    exportJSON: "Export to JSON",
    exportCSV: "Export to CSV",
    importData: "Import Data",
    settings: "Settings",
    language: "Language",
    seoTitle: "How AI Revolutionizes Time Management",
    seoContent: "A recent Harvard study shows a 40% increase in productivity for professionals using AI-driven tools. These systems help by automating scheduling, predicting task durations, and providing actionable insights, allowing users to focus on deep work rather than administrative overhead. By integrating with existing workflows like Jira and Google Calendar, AI becomes a seamless productivity partner. This paradigm shift is not just about working faster, but working smarter, ensuring that every minute is spent with purpose and clarity. The future of work is not just about human effort, but a synergy between human intellect and artificial intelligence, creating a powerful momentum towards achieving ambitious goals.",
    adPlaceholder: "Ad Content Area"
  },
  pt: {
    title: "Momentum",
    tagline: "Eleve Sua Produtividade",
    addTask: "Adicionar nova tarefa ou buscar no Jira...",
    tasks: "Tarefas",
    weeklyGoals: "Foco Semanal",
    gamification: "Gamificação",
    level: "Nível",
    points: "Pontos",
    aiInsights: "Insights de IA",
    analyze: "Analisar Produtividade",
    analyzing: "Analisando...",
    noInsights: "Conclua algumas tarefas e execute a análise para ver os insights aqui.",
    pomodoroMotivation: "Pomodoro com IA",
    getMotivation: "Obter Motivação",
    generating: "Gerando...",
    allTasksCompleted: "Todas as tarefas concluídas! ✨",
    play: "Iniciar",
    pause: "Pausar",
    complete: "Concluir",
    delete: "Excluir",
    logToJira: "Registrar no Jira",
    jiraLogged: "Tempo registrado no Jira",
    exportJSON: "Exportar para JSON",
    exportCSV: "Exportar para CSV",
    importData: "Importar Dados",
    settings: "Configurações",
    language: "Idioma",
    seoTitle: "Como a IA Revoluciona a Gestão do Tempo",
    seoContent: "Um estudo recente de Harvard mostra um aumento de 40% na produtividade para profissionais que usam ferramentas orientadas por IA. Esses sistemas ajudam automatizando o agendamento, prevendo a duração das tarefas e fornecendo insights acionáveis, permitindo que os usuários se concentrem no trabalho profundo em vez de em tarefas administrativas. Ao se integrar a fluxos de trabalho existentes como Jira e Google Calendar, a IA se torna uma parceira de produtividade perfeita. Essa mudança de paradigma não é apenas sobre trabalhar mais rápido, mas de forma mais inteligente, garantindo que cada minuto seja gasto com propósito e clareza. O futuro do trabalho não é apenas sobre o esforço humano, mas uma sinergia entre o intelecto humano e a inteligência artificial, criando um poderoso momentum para alcançar metas ambiciosas.",
    adPlaceholder: "Área de Anúncio"
  }
};
