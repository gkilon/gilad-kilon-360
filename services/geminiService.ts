
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FeedbackResponse, QuestionsConfig } from "../types";

// Initialize with the correct named parameter and access the environment variable directly.
const getClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const sanitizeData = (responses: FeedbackResponse[], userName: string) => {
  const nameRegex = new RegExp(userName, 'gi');
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  return responses.map(r => ({
    relationship: r.relationship,
    q1_response: r.q1_impact.replace(nameRegex, "[NAME]").replace(emailRegex, "[EMAIL]"),
    q2_response: r.q2_untapped.replace(nameRegex, "[NAME]").replace(emailRegex, "[EMAIL]"),
    q3_response: r.q3_pattern.replace(nameRegex, "[NAME]").replace(emailRegex, "[EMAIL]"),
    q4_response: r.q4_future.replace(nameRegex, "[NAME]").replace(emailRegex, "[EMAIL]")
  }));
};

export const analyzeFeedback = async (
    responses: FeedbackResponse[], 
    questions: QuestionsConfig,
    userName: string = "User",
    userGoal?: string
): Promise<AnalysisResult> => {
  
  if (responses.length === 0) throw new Error("אין מספיק נתונים לניתוח");

  try {
    const ai = getClient();
    const formattedData = sanitizeData(responses, userName);
    const goalContext = userGoal ? `מטרת המשתמש: "${userGoal}"` : `לא הוגדרה מטרה ספציפית.`;

    const prompt = `
      אתה פסיכולוג ארגוני בכיר. נתח את המשובים עבור ${userName}.
      הקשר המטרה: ${goalContext}
      
      חובה להתייחס בנתונים ל:
      1. "נקודות עיוורות" (Blind Spots): איפה המשתמש חושב שהוא מעולה אבל הסביבה רומזת אחרת?
      2. "עוצמות שקופות": דברים שהמשתמש עושה "על הדרך" אבל נתפסים כערך ענק לאחרים.
      3. ניתוח סנטימנט: מהו הטון הכללי של המשיבים?
      
      נתונים: ${JSON.stringify(formattedData)}
    `;

    // Using gemini-3-pro-preview for complex reasoning tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a world-class organizational psychologist. Be insightful, direct, and supportive in Hebrew. Return ONLY valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionableAdvice: { type: Type.STRING },
            blindSpots: { type: Type.STRING },
            transparentStrengths: { type: Type.STRING },
            sentimentAnalysis: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    label: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ["score", "label", "explanation"]
            },
            groupAnalysis: {
                type: Type.OBJECT,
                properties: {
                    "manager": { type: Type.STRING },
                    "peer": { type: Type.STRING },
                    "subordinate": { type: Type.STRING },
                    "friend": { type: Type.STRING },
                    "other": { type: Type.STRING }
                }
            }
          },
          required: ["summary", "keyThemes", "actionableAdvice", "blindSpots", "transparentStrengths", "sentimentAnalysis", "groupAnalysis"],
        },
      },
    });

    // Directly access the .text property from GenerateContentResponse.
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const result = JSON.parse(text) as AnalysisResult;
    return result;

  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(error.message || "נכשל ניתוח הנתונים.");
  }
};
