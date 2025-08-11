import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Task, Gamification, AiInsight, JiraIssue } from './types';
import { GAMIFICATION_LEVELS, POINTS_PER_MINUTE, POMODORO_DURATION, LOCALES } from './constants';
import { analyzeProductivity, getMotivationalQuote } from './services/gemini';

// ICONS (Helper Component)
const PlayIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>;
const PauseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>;
const CheckIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>;
const DeleteIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>;
const SettingsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"></path></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>;

// --- HELPER & UI COMPONENTS ---

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-6 shadow-2xl ${className}`}
       style={{ animation: 'fadeInUp 0.5s ease-out forwards', opacity: 0 }}>
    {children}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl font-display font-bold text-light-text mb-4">{children}</h2>
);

const GradientText = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-gradient-to-r from-primary-light to-purple-400 text-transparent bg-clip-text">
    {children}
  </span>
);

const CircularProgress = ({ progress, size = 100 }: { progress: number, size?: number }) => {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-700/50" fill="transparent" />
            <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} className="text-primary" fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.35s' }}
            />
        </svg>
    );
};

interface TaskItemProps {
  task: Task;
  onToggleTimer: (id: string) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onLogJira: (issueKey: string, timeSpent: number) => void;
  t: (key: string) => string;
}

const TaskItem = React.memo(({ task, onToggleTimer, onDelete, onComplete, onLogJira, t }: TaskItemProps) => {
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${paddedMinutes}:${paddedSeconds}`;
  };

  const progress = (task.timeSpent % POMODORO_DURATION) / POMODORO_DURATION * 100;
  
  return (
    <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg transition-all duration-300 hover:bg-white/10 mb-3">
        <div className="flex items-center gap-4">
            <button onClick={() => onToggleTimer(task.id)} className="text-primary-light hover:text-white transition-colors p-2 rounded-full bg-white/10 hover:bg-primary">
                {task.isActive ? <PauseIcon /> : <PlayIcon />}
            </button>
            <div>
              <p className="font-semibold text-light-text">{task.title}</p>
              {task.jiraIssue && <p className="text-xs text-medium-text">Jira: {task.jiraIssue.key}</p>}
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center">
              <CircularProgress progress={progress} size={50} />
              <span className="absolute text-xs font-mono text-medium-text">{formatTime(task.timeSpent)}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onComplete(task.id)} title={t('complete')} className="p-2 text-green-400 hover:text-white rounded-full bg-white/10 hover:bg-green-500 transition-colors"><CheckIcon /></button>
              {task.jiraIssue && <button onClick={() => onLogJira(task.jiraIssue!.key, task.timeSpent)} title={t('logToJira')} className="p-2 text-blue-400 hover:text-white rounded-full bg-white/10 hover:bg-blue-500 transition-colors">J</button>}
              <button onClick={() => onDelete(task.id)} title={t('delete')} className="p-2 text-red-400 hover:text-white rounded-full bg-white/10 hover:bg-red-500 transition-colors"><DeleteIcon /></button>
            </div>
        </div>
    </div>
  );
});

const Confetti = () => (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-50">
      {Array.from({ length: 100 }).map((_, i) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          width: `${Math.random() * 8 + 4}px`,
          height: `${Math.random() * 8 + 4}px`,
          backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
          top: '-10%',
          left: `${Math.random() * 100}%`,
          animation: `fall ${Math.random() * 3 + 2}s linear ${Math.random() * 2}s infinite`,
          opacity: Math.random(),
          transform: `rotate(${Math.random() * 360}deg)`
        };
        return <div key={i} style={style}></div>;
      })}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(${Math.random() * 720}deg);
          }
        }
      `}</style>
    </div>
);


// --- MAIN APP ---
export default function App() {
  // --- STATE & HOOKS ---
  const [lang, setLang] = useState<'pt' | 'en'>('en');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [gamification, setGamification] = useState<Gamification>({ points: 0, level: 1, badge: '🥉', nextLevelPoints: 500 });
  const [aiInsights, setAiInsights] = useState<AiInsight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [motivation, setMotivation] = useState('');
  const [isLoadingMotivation, setIsLoadingMotivation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [jiraQuery, setJiraQuery] = useState('');
  const [jiraResults, setJiraResults] = useState<JiraIssue[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const t = useCallback((key: string) => LOCALES[lang][key] || key, [lang]);

  // Mock Jira Search
  const searchJiraIssues = useCallback(async (query: string): Promise<JiraIssue[]> => {
    if (!query) return [];
    // This is a mock. In a real app, this would be a debounced API call.
    console.log(`Searching Jira for: ${query}`);
    await new Promise(res => setTimeout(res, 300));
    return [
      { key: "PROJ-123", summary: "Implementar feature de login com SSO" },
      { key: "PROJ-456", summary: "Corrigir bug na renderização do dashboard" },
      { key: "PROJ-789", summary: "Otimizar performance da query de usuários" },
    ].filter(issue => issue.summary.toLowerCase().includes(query.toLowerCase()));
  }, []);

  useEffect(() => {
    if (jiraQuery.length > 2) {
      searchJiraIssues(jiraQuery).then(setJiraResults);
    } else {
      setJiraResults([]);
    }
  }, [jiraQuery, searchJiraIssues]);
  
  // Data persistence (Robust)
  useEffect(() => {
    try {
        const savedTasks = localStorage.getItem('momentum_tasks');
        if (savedTasks) {
            const parsedTasks: Task[] = JSON.parse(savedTasks);
            if (Array.isArray(parsedTasks)) {
                setTasks(parsedTasks.map(t => ({...t, isActive: false})));
            }
        }
    } catch (error) {
        console.error("Failed to load tasks from localStorage:", error);
        localStorage.removeItem('momentum_tasks');
    }

    try {
        const savedGamification = localStorage.getItem('momentum_gamification');
        if (savedGamification) {
            const parsedGamification: Gamification = JSON.parse(savedGamification);
            if (parsedGamification && typeof parsedGamification.points === 'number') {
                setGamification(parsedGamification);
            }
        }
    } catch (error) {
        console.error("Failed to load gamification from localStorage:", error);
        localStorage.removeItem('momentum_gamification');
    }
    
    const savedLang = localStorage.getItem('momentum_lang');
    if (savedLang === 'pt' || savedLang === 'en') {
        setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('momentum_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('momentum_gamification', JSON.stringify(gamification));
  }, [gamification]);
  
  useEffect(() => {
    localStorage.setItem('momentum_lang', lang);
  }, [lang]);

  // Centralized timer logic
  useEffect(() => {
    const activeTask = tasks.find(t => t.isActive);
    if (!activeTask) return;

    const interval = setInterval(() => {
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === activeTask.id ? { ...t, timeSpent: t.timeSpent + 1 } : t
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };
  
  const handleLevelUp = (newGamificationState: Gamification, oldLevel: number) => {
    if (newGamificationState.level > oldLevel) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        showNotification(`🎉 Level Up! You've reached Level ${newGamificationState.level}!`);
    }
  };

  const updateGamification = useCallback((timeSpentInSeconds: number) => {
    setGamification(prev => {
      const newPoints = prev.points + (timeSpentInSeconds / 60) * POINTS_PER_MINUTE;
      let newLevel = prev.level;
      let newBadge = prev.badge;
      let nextLevelPoints = prev.nextLevelPoints;

      const currentLevelInfo = GAMIFICATION_LEVELS.find(l => l.level === newLevel);
      if (currentLevelInfo && newPoints >= currentLevelInfo.next) {
        const nextLevelInfo = GAMIFICATION_LEVELS.find(l => l.level === newLevel + 1);
        if (nextLevelInfo) {
          newLevel = nextLevelInfo.level;
          newBadge = nextLevelInfo.badge;
          nextLevelPoints = nextLevelInfo.next;
        }
      }
      
      const newGamificationState = { points: Math.floor(newPoints), level: newLevel, badge: newBadge, nextLevelPoints };
      handleLevelUp(newGamificationState, prev.level);
      return newGamificationState;
    });
  }, []);


  // --- HANDLERS ---
  const handleAddTask = (title: string, jiraIssue?: JiraIssue) => {
    if (!title.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      timeSpent: 0,
      isActive: false,
      isCompleted: false,
      createdAt: Date.now(),
      jiraIssue,
    };
    setTasks(prev => [newTask, ...prev]);
    if (jiraIssue) {
        setJiraQuery('');
        setJiraResults([]);
    }
  };

  const handleToggleTimer = useCallback((id: string) => {
    setTasks(prevTasks =>
        prevTasks.map(t => {
            if (t.id === id) {
              return { ...t, isActive: !t.isActive };
            }
            // Pause other tasks
            return { ...t, isActive: false };
        })
    );
  }, []);

  const handleCompleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const taskToComplete = prev.find(t => t.id === id);
      if (taskToComplete) {
        updateGamification(taskToComplete.timeSpent);
      }
      return prev.map(t => t.id === id ? { ...t, isCompleted: true, isActive: false } : t);
    });
  }, [updateGamification]);

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };
  
  const handleLogJira = (issueKey: string, timeSpent: number) => {
      console.log(`Logging ${timeSpent}s to Jira issue ${issueKey}`);
      showNotification(`${t('jiraLogged')}: ${issueKey}`);
  };

  const handleAnalyze = async () => {
    setIsLoadingInsights(true);
    setAiInsights([]);
    try {
        if(!process.env.API_KEY || process.env.API_KEY === "API_KEY_NOT_SET") {
            alert("Gemini API Key is not configured. Please set the API_KEY environment variable.");
            setIsLoadingInsights(false);
            return;
        }
      const insights = await analyzeProductivity(tasks, lang);
      setAiInsights(insights.map(text => ({ id: crypto.randomUUID(), text })));
    } catch (error: any) {
      showNotification(error.message);
    } finally {
      setIsLoadingInsights(false);
    }
  };
  
  const handleGetMotivation = async () => {
      setIsLoadingMotivation(true);
      setMotivation('');
      try {
          const quote = await getMotivationalQuote(lang);
          setMotivation(quote);
      } catch (error: any) {
          showNotification(error.message);
      } finally {
          setIsLoadingMotivation(false);
      }
  };

  const handleExport = (format: 'json' | 'csv') => {
      const dataStr = format === 'json' 
        ? JSON.stringify({ tasks, gamification }, null, 2)
        : ['id,title,timeSpent,isCompleted,createdAt', ...tasks.map(t => `${t.id},"${t.title}",${t.timeSpent},${t.isCompleted},${t.createdAt}`)].join('\n');
      
      const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `momentum_backup.${format}`;
      a.click();
      URL.revokeObjectURL(url);
  };
  
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const result = JSON.parse(e.target?.result as string);
              if (result.tasks && result.gamification) {
                  setTasks(result.tasks);
                  setGamification(result.gamification);
                  showNotification("Data imported successfully!");
              } else {
                  throw new Error("Invalid file format.");
              }
          } catch (error) {
              showNotification("Failed to import data.");
          }
      };
      reader.readAsText(file);
      setShowSettings(false);
  };

  const weeklyChartData = useMemo(() => {
      const weekData: { [key: string]: number } = {};
      for(let i=6; i>=0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toLocaleDateString(lang, { weekday: 'short' });
          weekData[key] = 0;
      }
      
      tasks.filter(t => t.isCompleted).forEach(task => {
          const taskDate = new Date(task.createdAt);
          const today = new Date();
          const diffDays = Math.floor((today.getTime() - taskDate.getTime()) / (1000 * 3600 * 24));

          if(diffDays <= 6) {
             const key = taskDate.toLocaleDateString(lang, { weekday: 'short' });
             if(weekData[key] !== undefined) {
                weekData[key] += task.timeSpent / 60; // minutes
             }
          }
      });

      return Object.entries(weekData).map(([name, time]) => ({ name, time: Math.round(time) }));
  }, [tasks, lang]);

  const ongoingTasks = tasks.filter(t => !t.isCompleted);
  const completedTasks = tasks.filter(t => t.isCompleted);

  return (
    <div className="bg-dark-bg min-h-screen font-sans text-light-text selection:bg-primary/40">
        {showConfetti && <Confetti />}
        
        {/* BG Gradient */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-dark-bg bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
          <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#0000_100%)]"></div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900/30 via-transparent to-blue-900/30 animate-gradientShift -z-10" />

        <header className="fixed top-0 left-0 right-0 z-40 bg-glass/80 backdrop-blur-lg border-b border-glass-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
              <h1 className="text-2xl font-display font-black tracking-tighter italic">
                  <GradientText>Momentum</GradientText>
              </h1>
              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setLang('en')} className={`px-2 py-1 text-sm rounded ${lang === 'en' ? 'bg-primary text-white' : 'text-medium-text hover:bg-white/10'}`}>EN</button>
                    <button onClick={() => setLang('pt')} className={`px-2 py-1 text-sm rounded ${lang === 'pt' ? 'bg-primary text-white' : 'text-medium-text hover:bg-white/10'}`}>PT</button>
                  </div>
                  <button onClick={() => setShowSettings(true)} className="text-medium-text hover:text-primary transition-colors">
                      <SettingsIcon />
                  </button>
              </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Tasks */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                      <div className="relative">
                        <input
                            type="text"
                            value={jiraQuery}
                            onChange={(e) => setJiraQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask(jiraQuery)}
                            placeholder={t('addTask')}
                            className="w-full bg-white/5 border border-transparent focus:border-primary rounded-lg px-4 py-3 text-light-text placeholder-medium-text transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                         {jiraResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-glass border border-glass-border rounded-lg z-10 max-h-48 overflow-y-auto">
                                {jiraResults.map(issue => (
                                    <div key={issue.key} onClick={() => handleAddTask(issue.summary, issue)} className="px-4 py-2 hover:bg-primary/20 cursor-pointer">
                                        <p className="font-bold">{issue.key}</p>
                                        <p className="text-sm text-medium-text">{issue.summary}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                      </div>
                    </Card>
                    <Card>
                        <SectionTitle>{t('tasks')}</SectionTitle>
                        {ongoingTasks.length > 0 ? (
                            ongoingTasks.map((task) => (
                                <TaskItem key={task.id} task={task} onToggleTimer={handleToggleTimer} onDelete={handleDeleteTask} onComplete={handleCompleteTask} onLogJira={handleLogJira} t={t} />
                            ))
                        ) : (
                            <p className="text-center text-medium-text py-8">{t('allTasksCompleted')}</p>
                        )}
                    </Card>
                     <Card>
                        <SectionTitle>{t('seoTitle')}</SectionTitle>
                        <p className="text-medium-text mb-4 text-justify">{t('seoContent')}</p>
                        <div className="ad-container my-4 mx-auto min-h-[250px] w-full max-w-[728px] bg-white/5 rounded-lg flex items-center justify-center border border-dashed border-glass-border">
                            <span className="text-medium-text">{t('adPlaceholder')} (728x90 or 300x250)</span>
                        </div>
                    </Card>
                </div>

                {/* Sidebar: Dashboard & AI */}
                <div className="space-y-8">
                    <Card>
                        <SectionTitle>{t('gamification')}</SectionTitle>
                        <div className="flex items-center justify-between">
                            <div className="text-5xl">{gamification.badge}</div>
                            <div>
                                <p className="text-lg font-bold"><GradientText>{t('level')} {gamification.level}</GradientText></p>
                                <p className="text-medium-text">{Math.floor(gamification.points)} {t('points')}</p>
                            </div>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2.5 mt-4">
                            <div className="bg-gradient-to-r from-primary to-purple-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (gamification.points / gamification.nextLevelPoints) * 100)}%` }}></div>
                        </div>
                    </Card>

                    <Card>
                        <SectionTitle>{t('weeklyGoals')}</SectionTitle>
                        <div className="h-60">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={weeklyChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                  <XAxis dataKey="name" stroke="#A0A0B0" fontSize={12} tickLine={false} axisLine={false} />
                                  <YAxis stroke="#A0A0B0" fontSize={12} tickLine={false} axisLine={false} />
                                  <Tooltip contentStyle={{ backgroundColor: '#1E1B3A', border: '1px solid #4A4A6A', borderRadius: '8px' }} labelStyle={{ color: '#E0E0E0' }} itemStyle={{ color: '#8884d8' }}/>
                                  <defs>
                                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
                                      </linearGradient>
                                  </defs>
                                  <Bar dataKey="time" name="Minutes" unit=" min" radius={[4, 4, 0, 0]} fill="url(#colorUv)" />
                              </BarChart>
                          </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card>
                        <SectionTitle>{t('aiInsights')}</SectionTitle>
                        {isLoadingInsights ? <p className="text-center text-medium-text">{t('analyzing')}</p> :
                         aiInsights.length > 0 ? (
                            <ul className="space-y-3">
                                {aiInsights.map(insight => (
                                    <li key={insight.id} className="flex items-start gap-3 text-medium-text">
                                        <span className="text-primary mt-1">✦</span>
                                        {insight.text}
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-center text-medium-text text-sm">{t('noInsights')}</p>}
                        <button onClick={handleAnalyze} disabled={isLoadingInsights || completedTasks.length < 2} className="w-full mt-4 bg-primary hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            {t('analyze')}
                        </button>
                    </Card>
                    
                    <Card>
                        <SectionTitle>{t('pomodoroMotivation')}</SectionTitle>
                        {isLoadingMotivation ? <p className="text-center text-medium-text">{t('generating')}</p> : 
                        motivation && <p className="text-center text-lg italic text-light-text">"{motivation}"</p>}
                        <button onClick={handleGetMotivation} disabled={isLoadingMotivation} className="w-full mt-4 bg-white/10 hover:bg-white/20 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            {t('getMotivation')}
                        </button>
                    </Card>
                </div>
            </div>
        </main>
        
        {/* Settings Modal */}
        {showSettings && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
                <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <Card className="relative">
                       <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-medium-text hover:text-white">
                         <CloseIcon />
                       </button>
                       <SectionTitle>{t('settings')}</SectionTitle>
                       <div className="space-y-4">
                           <button onClick={() => handleExport('json')} className="w-full bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg">{t('exportJSON')}</button>
                           <button onClick={() => handleExport('csv')} className="w-full bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg">{t('exportCSV')}</button>
                           <div>
                                <label htmlFor="import-file" className="w-full block text-center cursor-pointer bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg">{t('importData')}</label>
                                <input type="file" id="import-file" accept=".json" className="hidden" onChange={handleImport}/>
                           </div>
                       </div>
                    </Card>
                </div>
            </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div className="fixed bottom-5 right-5 bg-glass border border-glass-border text-light-text px-4 py-2 rounded-lg shadow-lg z-50 animate-fadeInUp">
            {notification}
          </div>
        )}
    </div>
  );
}