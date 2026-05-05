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
      const { responses, questions, userName = "User", fileData, fileName } = JSON.parse(event.body || "{}");
  
      if (!responses || responses.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "אין מספיק נתונים לניתוח" }) };
      }
  
      const ai = getClient();
      const formattedData = sanitizeData(responses, questions || [], userName);
  
      const promptText = `
        אתה פסיכולוג ארגוני בכיר וסוכן AI מומחה. נתח את המשובים האנונימיים עבור ${userName} (תהליך משוב 360 מעלות).
        
        בנוסף, מצורף קובץ אבחון אישי (כגון Lumina Spark). עליך לבצע אינטגרציה מלאה:
        1. "נקודות עיוורות" (Blind Spots): השווה בין ה-PDF לבין מה שהסביבה אומרת.
        2. "עוצמות שקופות": זהה מה ה-PDF מגדיר כחוזקה ואיך זה בא לידי ביטוי בשטח.
        3. **אינטגרציה של Lumina**: אם הקובץ הוא לומינה, התייחס לצבעים והיבטים ספציפיים.
        4. **המלצות**: ספק 4 המלצות לצמיחה המשלבות את האבחון המקצועי עם המשובים.
  
        נתוני ה-360:
        ${JSON.stringify(formattedData, null, 2)}
      `;

      const contents = [{
        role: 'user',
        parts: [
          { text: promptText }
        ]
      }];

      // Add PDF if provided
      if (fileData) {
          contents[0].parts.push({
            inlineData: {
              mimeType: "application/pdf",
              data: fileData
            }
          });
      }
  
      // Using gemini-2.0-flash for high-speed multimodal analysis
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: {
          systemInstruction: "You are a world-class organizational psychologist. Be insightful, direct, and supportive in Hebrew. Return ONLY valid JSON.",
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
