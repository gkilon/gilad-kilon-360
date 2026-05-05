import { AnalysisResult, FeedbackResponse, QuestionsConfig } from "../types";

export const analyzeFeedback = async (
    responses: FeedbackResponse[], 
    questions: QuestionsConfig,
    userName: string = "User"
): Promise<AnalysisResult> => {
  
  if (responses.length === 0) throw new Error("אין מספיק נתונים לניתוח");

  try {
    const response = await fetch('/.netlify/functions/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ responses, questions, userName })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as AnalysisResult;
    return result;

  } catch (error: any) {
    console.error("Gemini Fetch Error:", error);
    throw new Error(error.message || "נכשל ניתוח הנתונים.");
  }
};
