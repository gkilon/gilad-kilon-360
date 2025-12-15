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
      q1_high_impact_actions: r.q1_impact,
      q2_untapped_potential: r.q2_untapped,
      q3_behavioral_pattern_to_change: r.q3_pattern,
      q4_future_career_fit: r.q4_future
  }));

  const goalContext = userGoal 
    ? `The user defined their growth goal as: "${userGoal}".`
    : `The user did NOT define a specific goal.`;

  const prompt = `
    תפקידך הוא להיות פסיכולוג ארגוני ומאמן קריירה בכיר.
    
    הקשר:
    ${goalContext}
    
    המשימה:
    נתח את נתוני המשוב שהתקבלו (שאלון 360).
    
    השאלות שנשאלו היו:
    1. מהם הדברים שהעובד עושה הכי טוב (השפעה ותוצאות)?
    2. איזו מיומנות/תכונה אינה מנוצלת מספיק (Untapped Potential)?
    3. מהו הדפוס ההתנהגותי שמעכב וצריך לשנות?
    4. איזה תפקיד עתידי מתאים למימוש הפוטנציאל?

    עליך להפיק דוח תובנות מעמיק:
    1. זהה את ה-Superpower (חוזקה בולטת שחוזרת על עצמה).
    2. זהה את "התקרה" - המעצור ההתנהגותי המרכזי.
    3. נתח את הפער בין היכולות הקיימות לבין הפוטנציאל הלא מנוצל.
    4. תן כיוון קריירה מומלץ על בסיס תשובות החברים לגבי התפקיד העתידי.
    5. תן "המלצת זהב" (Actionable Advice) לביצוע מיידי.

    הנתונים:
    ${JSON.stringify(formattedData)}
  `;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert organizational psychologist speaking Hebrew. Focus on identifying the gap between strengths, untapped potential, and behavioral barriers.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A summary of the user's reputation, untapped potential, and career direction.",
            },
            keyThemes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3-5 recurring themes (strengths, barriers, future roles).",
            },
            actionableAdvice: {
              type: Type.STRING,
              description: "A specific, encouraging piece of advice based on the behavioral pattern to change.",
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
