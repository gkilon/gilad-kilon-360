import { GoogleGenAI, Type } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") {
    throw new Error("Missing Gemini API Key. Please set GEMINI_API_KEY in Netlify environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

const sanitizeData = (responses: any[], userName: string) => {
  const nameRegex = new RegExp(userName, 'gi');
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  return responses.map(r => ({
    relationship: r.relationship,
    q1_response: (r.q1_impact || "").replace(nameRegex, "[NAME]").replace(emailRegex, "[EMAIL]"),
    q2_response: (r.q2_untapped || "").replace(nameRegex, "[NAME]").replace(emailRegex, "[EMAIL]"),
    q3_response: (r.q3_pattern || "").replace(nameRegex, "[NAME]").replace(emailRegex, "[EMAIL]"),
    q4_response: (r.q4_future || "").replace(nameRegex, "[NAME]").replace(emailRegex, "[EMAIL]")
  }));
};

export const handler = async (event: any, context: any) => {
  // CORS configuration
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const { responses, questions, userName = "User", userGoal } = JSON.parse(event.body || "{}");

    if (!responses || responses.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "אין מספיק נתונים לניתוח" }) };
    }

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

    // Using gemini-2.5-pro for high-quality organizational psychology analysis (updated for 2026)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
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

    const text = response.text;
    if (!text) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: "No response from AI" }) };
    }
    
    return {
      statusCode: 200,
      headers,
      body: text,
    };
  } catch (error: any) {
    console.error("Gemini Function Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "נכשל ניתוח הנתונים." }),
    };
  }
};
