import { GoogleGenAI } from '@google/genai';

// This file acts as a serverless function (e.g., Vercel Edge Function, Cloudflare Worker).
// In this prototype environment, it's mocked, but the logic is what you'd deploy.

// Note: In a real serverless environment, you would use a library like 'ai' for streaming.
// For this environment, we'll simulate the streaming response structure.
// This is a placeholder and will not actually execute in the frontend-only sandbox.
async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { observations, context } = await req.json();
    const { selectedPhaseName, selectedTeacherName, teacherMap, templateMap, subjectMap, classGroupMap } = context;

    // --- Data Reconstruction (since Maps can't be JSON serialized directly) ---
    const simplifiedData = observations.map((obs: any) => ({
        template: templateMap[obs.observationType] || 'Unknown Type',
        teacher: teacherMap[obs.teacherId] || 'Unknown Teacher',
        date: obs.observationDate,
        status: obs.status,
        priority: obs.priority,
        subject: obs.subjectId ? subjectMap[obs.subjectId] : 'N/A',
        classGroup: obs.classGroupId ? classGroupMap[obs.classGroupId] : 'N/A',
        score: obs.calculatedScore ? `${(obs.calculatedScore * 100).toFixed(1)}%` : 'N/A',
        details: obs.formData,
    }));
    
    const dataString = JSON.stringify(simplifiedData, null, 2);

    const prompt = `
You are an expert educational analyst reviewing monitoring data for a school. Your task is to provide a comprehensive, insightful, and actionable report based on the provided JSON data.

**Context:**
- The data represents various observation and monitoring entries for teachers.
- The 'details' object contains qualitative feedback. A 'score' field indicates a calculated rubric score.
- The report is for: ${selectedPhaseName} and ${selectedTeacherName}.

**Data to Analyze:**
\`\`\`json
${dataString.substring(0, 50000)}
\`\`\`

**Instructions:**
1.  **Start with a High-Level Summary:** Provide a concise paragraph summarizing the overall state of affairs. Mention overall performance, key themes, and any standout trends.
2.  **Identify Key Strengths:** In a bulleted list, identify 2-4 key strengths. Use specific examples from the data, referencing teachers, observation types, or high scores.
3.  **Identify Areas for Development:** In a bulleted list, identify 2-4 areas needing attention. Be constructive and specific, referencing low scores, recurring issues, or unresolved entries.
4.  **Actionable Recommendations:** Provide a short, bulleted list of 2-3 concrete, actionable recommendations for leadership.
5.  **Format your response clearly using Markdown.** Use headings for each section.`;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    // In a real environment (e.g., Next.js with the 'ai' package), you would return a StreamingTextResponse.
    // Here, we simulate that behavior.
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.text;
          controller.enqueue(new TextEncoder().encode(text));
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    console.error('Error in AI report generation:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate report.' }), { status: 500 });
  }
}

// In a real environment, you would export the handler to be deployed.
// export default handler;
// For this prototype, this file exists to show the logic. It will not be directly executed.
