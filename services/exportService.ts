
import { AnalysisResult, FeedbackResponse, User } from "../types";

const relationshipLabels: Record<string, string> = {
  'manager': 'מנהלים',
  'peer': 'קולגות',
  'subordinate': 'כפיפים',
  'friend': 'חברים/משפחה',
  'other': 'אחר'
};

export const exportToPDF = (
  user: User, 
  analysis: AnalysisResult | null, 
  responses: FeedbackResponse[]
) => {
  // Create a hidden iframe or new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <html dir="rtl" lang="he">
      <head>
        <title>דוח 360 - ${user.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;700;900&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Heebo', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #14b8a6; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #0f172a; font-weight: 900; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .section-title { color: #14b8a6; font-size: 1.2rem; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px; }
          .ai-box { background: #f0fdfa; border: 1px solid #ccfbf1; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; }
          .card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; }
          .label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 5px; display: block; }
          .response-item { margin-bottom: 15px; padding: 15px; border-right: 3px solid #14b8a6; background: #f8fafc; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>דוח צמיחה אישי 360</h1>
          <p>עבור: ${user.name} | תאריך: ${new Date().toLocaleDateString('he-IL')}</p>
        </div>

        ${analysis ? `
          <div class="section">
            <div class="section-title">ניתוח תובנות פסיכולוגי (AI)</div>
            <div class="ai-box">
              <p><strong>סיכום:</strong> ${analysis.summary}</p>
            </div>
            
            <div class="grid">
              <div class="card" style="border-right: 4px solid #ef4444;">
                <span class="label">נקודות עיוורות (Blind Spots)</span>
                <p>${analysis.blindSpots}</p>
              </div>
              <div class="card" style="border-right: 4px solid #10b981;">
                <span class="label">עוצמות שקופות</span>
                <p>${analysis.transparentStrengths}</p>
              </div>
            </div>

            <div class="card" style="margin-top: 20px;">
              <span class="label">ניתוח סנטימנט: ${analysis.sentimentAnalysis.label} (${analysis.sentimentAnalysis.score}%)</span>
              <p><em>${analysis.sentimentAnalysis.explanation}</em></p>
            </div>

            <div class="ai-box" style="margin-top: 20px; background: #134e4a; color: white;">
              <span class="label" style="color: #5eead4;">עצת הזהב למימוש</span>
              <p style="font-size: 1.1rem;">"${analysis.actionableAdvice}"</p>
            </div>
          </div>
        ` : ''}

        <div class="section">
          <div class="section-title">פירוט משובים גולמיים (${responses.length})</div>
          ${responses.map((r, i) => `
            <div class="response-item">
              <div style="font-weight: 700; margin-bottom: 10px;">משיב #${i + 1} - ${relationshipLabels[r.relationship] || 'אחר'}</div>
              <p><strong>חוזקות:</strong> ${r.q1_impact}</p>
              <p><strong>שיפור:</strong> ${r.q2_untapped}</p>
              <p><strong>יוזמה:</strong> ${r.q3_pattern}</p>
              <p><strong>עצה:</strong> ${r.q4_future}</p>
            </div>
          `).join('')}
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
