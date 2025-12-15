import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FeedbackResponse } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeFeedback = async (responses: FeedbackResponse[], userGoal?: string): Promise<AnalysisResult> => {
  if (responses.length === 0) {
    throw new Error("No responses to analyze");
  }

  const ai = getClient();
  
  // Format data for AI with new fields
  const formattedData = responses.map(r => ({
      relationship: r.relationship,
      strengths: r.q1_strengths,
      improvement_suggestion: r.q2_improvement,
      examples: r.q3_examples
  }));

  const goalContext = userGoal 
    ? `The user defined their growth goal as: "${userGoal}".`
    : `The user did NOT define a specific goal, so the feedback is general.`;

  const prompt = `
    תפקידך הוא להיות פסיכולוג ארגוני ומאמן קריירה בכיר.
    
    הקשר:
    ${goalContext}
    
    המשימה:
    נתח את נתוני המשוב שהתקבלו עבור העובד/המנהל. השאלות שנשאלו היו:
    1. מהן החוזקות המרכזיות?
    2. מה כדאי לעשות אחרת כדי להתקדם?
    3. דוגמאות.

    עליך להפיק דוח תובנות:
    1. זהה את החוזקות הבולטות ביותר שחוזרות על עצמן.
    2. זהה את ה"התנהגות המעכבת" או השינוי המרכזי הנדרש (The One Thing) שעולה מתוך הצעות השיפור והדוגמאות.
    3. בדוק אם יש הבדלים בפרספקטיבה בין מנהלים, קולגות וכפיפים.
    4. תן "המלצת זהב" (Actionable Advice) ברורה ומעשית לביצוע מחר בבוקר.

    הנתונים:
    ${JSON.stringify(formattedData)}
  `;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert organizational psychologist speaking Hebrew. Focus on identifying the gap between strengths and required improvements.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A summary of the user's reputation (strengths) vs. the main area for growth.",
            },
            keyThemes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3-5 recurring themes (specific strengths or specific improvement areas).",
            },
            actionableAdvice: {
              type: Type.STRING,
              description: "A specific, encouraging piece of advice based on the 'What to do differently' feedback.",
            },
            groupAnalysis: {
                type: Type.OBJECT,
                description: "A dictionary where key is the group name (e.g. 'Manager', 'Peer') and value is a short insight about that group's perspective.",
                properties: {
                    "manager": { type: Type.STRING },
                    "peer": { type: Type.STRING },
                    "subordinate": { type: Type.STRING },
                    "friend": { type: Type.STRING },
                    "other": { type: Type.STRING }
                }
            }
          },
          required: ["summary", "keyThemes", "actionableAdvice", "groupAnalysis"],
        },
      },
    });

    const text = result.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze feedback.");
  }
};
