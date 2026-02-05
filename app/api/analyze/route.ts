import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

console.log("ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY);

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: Request) {
  console.log("Inside POST, ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY);
  try {
    const { resume, job } = await req.json();

    const prompt = `
You are an ATS Resume Optimization AI.

Resume:
${resume}

Job Description:
${job}

Analyze alignment. Explain mismatches if any. Provide suggestions.
Return only JSON structured as:
{
  "ats_score": number,
  "matching_keywords": [string],
  "missing_keywords": [string],
  "resume_strengths": [string],
  "improvement_suggestions": [
    {
      "original_bullet": string,
      "improved_bullet": string,
      "keywords_added": [string]
    }
  ],
  "overall_feedback": string
}
`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    });

    console.log("Anthropic response:", message.content);
    return NextResponse.json({ result: message.content });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
