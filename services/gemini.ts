
import { GoogleGenAI, Type } from "@google/genai";
import type { Task } from '../types';

if (!process.env.API_KEY) {
  // In a real app, you'd want to handle this more gracefully.
  // For this example, we'll use a placeholder and show an alert in the UI.
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "API_KEY_NOT_SET" });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    insights: {
      type: Type.ARRAY,
      description: "A list of 3 actionable and concise productivity insights based on the user's tasks.",
      items: { type: Type.STRING }
    }
  },
  required: ["insights"]
};

export const analyzeProductivity = async (tasks: Task[], lang: 'pt' | 'en'): Promise<string[]> => {
  if (process.env.API_KEY === "API_KEY_NOT_SET") {
    return Promise.reject(new Error("API Key not configured."));
  }
  
  const completedTasks = tasks.filter(t => t.isCompleted);
  if (completedTasks.length < 2) {
    return Promise.reject(new Error("Need at least 2 completed tasks to analyze."));
  }

  const taskData = completedTasks.map(t => ({ title: t.title, time: `${Math.round(t.timeSpent / 60)} min` }));
  const prompt = `Based on the following list of completed tasks, provide exactly 3 actionable, concise insights to help improve productivity. Respond in ${lang === 'pt' ? 'Portuguese' : 'English'}. Tasks: ${JSON.stringify(taskData)}`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result.insights || [];
  } catch (error) {
    console.error("Error analyzing productivity:", error);
    throw new Error("Failed to get insights from AI. Please try again.");
  }
};

export const getMotivationalQuote = async (lang: 'pt' | 'en'): Promise<string> => {
   if (process.env.API_KEY === "API_KEY_NOT_SET") {
    return lang === 'pt' ? "Continue focado, você está indo muito bem!" : "Stay focused, you're doing great!";
  }

  const prompt = `Generate a short, powerful motivational quote (1-2 sentences) for someone who is working hard. Do not include quotation marks. Respond in ${lang === 'pt' ? 'Portuguese' : 'English'}.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Low latency for a quick quote
      }
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error getting motivational quote:", error);
    return lang === 'pt' ? "O sucesso é a soma de pequenos esforços repetidos dia após dia." : "Success is the sum of small efforts, repeated day in and day out.";
  }
};
