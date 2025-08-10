
export interface Task {
  id: string;
  title: string;
  timeSpent: number; // in seconds
  isActive: boolean;
  isCompleted: boolean;
  createdAt: number; // timestamp
  jiraIssue?: {
    key: string;
    summary: string;
  };
}

export interface Gamification {
  points: number;
  level: number;
  badge: string;
  nextLevelPoints: number;
}

export interface AiInsight {
  id: string;
  text: string;
}

export interface JiraIssue {
  key: string;
  summary: string;
}
