import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FeedbackResponse, QuestionsConfig } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Sanitizes feedback data by replacing potential PII (emails/names) 
 * to ensure privacy before sending to AI.
 */
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
  
  if (responses.length === 0) {
    throw new Error("No responses to analyze");
  }

  const ai = getClient();
  
  // Clean data before sending to External API
  const formattedData = sanitizeData(responses, userName);

  const goalContext = userGoal 
    ? `The user defined their growth goal as: "${userGoal}".`
    : `The user did NOT define a specific goal.`;

  const prompt = `
    תפקידך הוא להיות פסיכולוג ארגוני ומאמן קריירה בכיר.
    
    הקשר:
    ${goalContext}
    
    השאלות שנשאלו בשאלון (דינמיות, שים לב לניסוח המדויק):
    1. ${questions.q1}
    2. ${questions.q2}
    3. ${questions.q3}
    4. ${questions.q4}

    המשימה:
    נתח את נתוני המשוב שהתקבלו (שאלון 360) על סמך השאלות הנ"ל.

    עליך להפיק דוח תובנות מעמיק בעברית:
    1. זהה את ה-Superpower (חוזקה בולטת שחוזרת על עצמה בשאלה 1).
    2. זהה את "התקרה" - המעצור ההתנהגותי המרכזי (שאלה 3).
    3. נתח את הפער בין היכולות הקיימות לבין הפוטנציאל הלא מנוצל (שאלה 2).
    4. תן כיוון קריירה מומלץ (שאלה 4).
    5. תן "המלצת זהב" (Actionable Advice) לביצוע מיידי.

    הנתונים הגולמיים (מנוקים מפרטים מזהים):
    ${JSON.stringify(formattedData)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert organizational psychologist speaking Hebrew. Focus on identifying the gap between strengths, untapped potential, and behavioral barriers based on the specific questions asked. Ensure the response is in valid JSON format.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A summary of the user's reputation, untapped potential, and career direction in Hebrew.",
            },
            keyThemes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3-5 recurring themes in Hebrew.",
            },
            actionableAdvice: {
              type: Type.STRING,
              description: "A specific, encouraging piece of advice based on the behavioral pattern to change in Hebrew.",
            },
            groupAnalysis: {
                type: Type.OBJECT,
                description: "A dictionary where key is the group name (e.g. 'manager', 'peer') and value is a short insight about that group's perspective in Hebrew.",
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

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze feedback.");
  }
};