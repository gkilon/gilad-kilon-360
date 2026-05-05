import { GoogleGenAI, Type } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") {
    throw new Error("Missing Gemini API Key. Please set GEMINI_API_KEY in Netlify environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

const sanitizeData = (responses: any[], questions: string[], userName: string) => {
  const nameRegex = new RegExp(userName, 'gi');
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  return responses.map(r => {
    const sanitizedAnswers = (r.answers || []).map((ans: string, idx: number) => ({
      question: questions[idx] || `Question ${idx + 1}`,
      answer: (ans || "").replace(nameRegex, "[NAME]").replace(emailRegex, "[EMAIL]")
    }));

    // Support legacy responses
    if (sanitizedAnswers.length === 0) {
      if (r.q1_impact) sanitizedAnswers.push({ question: "Impact", answer: r.q1_impact.replace(nameRegex, "[NAME]") });
      if (r.q2_untapped) sanitizedAnswers.push({ question: "Untapped", answer: r.q2_untapped.replace(nameRegex, "[NAME]") });
      if (r.q3_pattern) sanitizedAnswers.push({ question: "Pattern", answer: r.q3_pattern.replace(nameRegex, "[NAME]") });
      if (r.q4_future) sanitizedAnswers.push({ question: "Future", answer: r.q4_future.replace(nameRegex, "[NAME]") });
    }

    return {
      relationship: r.relationship,
      answers: sanitizedAnswers
    };
  });
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
      const { responses, questions, userName = "User", selfAssessmentText = "" } = JSON.parse(event.body || "{}");
  
      if (!responses || responses.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "אין מספיק נתונים לניתוח" }) };
      }
  
      const ai = getClient();
      const formattedData = sanitizeData(responses, questions || [], userName);
  
      const prompt = `
        אתה פסיכולוג ארגוני בכיר. נתח את המשובים האנונימיים עבור ${userName} (תהליך משוב 360 מעלות).
        
        חובה להתייחס בנתונים ל:
        1. "נקודות עיוורות" (Blind Spots): איפה המשתמש חושב שהוא מעולה אבל הסביבה רומזת אחרת?
        2. "עוצמות שקופות": דברים שהמשתמש עושה "על הדרך" אבל נתפסים כערך ענק לאחרים.
        3. ניתוח סנטימנט: מהו הטון הכללי של המשיבים?
        4. **ניתוח קבוצות (חשוב)**: האם קיימים הבדלים מהותיים באופן שבו קבוצות שונות (מנהלים, קולגות, כפיפים) תופסות את המשתמש? ציין פערים משמעותיים אם קיימים.
        5. **המלצות לפעולה**: ספק 3-4 המלצות קונקרטיות לשיפור וצמיחה המבוססות על המשוב.
        6. **השוואה לשאלון עצמי (אם קיים)**: אם צורף טקסט אבחון עצמי, השווה בינו לבין תפיסת האחרים וציין פערים של "תפיסת עצמי מול סביבה".
  
        טקסט אבחון עצמי (אם ריק, התעלם מסעיף 6):
        ${selfAssessmentText}
        
        השאלות שנשאלו והתשובות שנתנו:
        ${JSON.stringify(formattedData, null, 2)}
      `;
  
      // Using gemini-2.0-flash for high-speed analysis to prevent Netlify 504 timeouts.
      // 2.0 Flash provides Pro-level intelligence with sub-5-second response times.
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are a professional organizational psychologist. Be concise, insightful, and supportive in Hebrew. Return ONLY valid JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              keyThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
              actionableAdvice: { type: Type.STRING },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              blindSpots: { type: Type.STRING },
              transparentStrengths: { type: Type.STRING },
              selfVsOthersAnalysis: { type: Type.STRING },
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
            required: ["summary", "keyThemes", "actionableAdvice", "recommendations", "blindSpots", "transparentStrengths", "sentimentAnalysis", "groupAnalysis"],
          },
        },
      });

    // Handle extraction safely for @google/genai SDK (it might be in .text or .response.text())
    const text = response.text || (response as any).response?.text?.();
    
    if (!text) {
        console.error("Full AI Response Error:", JSON.stringify(response));
        return { 
          statusCode: 500, 
          headers, 
          body: JSON.stringify({ error: "ה-AI לא החזיר תשובה. נסה שוב בעוד כמה רגעים." }) 
        };
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
