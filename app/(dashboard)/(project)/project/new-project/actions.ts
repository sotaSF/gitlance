"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Groq } from "groq-sdk";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { indexProjectWithModules, backfillAllProjectEmbeddings } from "@/lib/rag/indexing";
import {
  retrieveModuleRAGContext,
  retrieveProjectRAGContext,
} from "@/lib/rag/retrieval";

type AIModuleResponse = {
  name: string;
  description: string;
  estimated_cost: number;
  confidence: number;
  complexity: number;
  is_mandatory: boolean;
  min_cost: number;
  max_cost: number;
  estimated_hours?: number;
};

type AIAnalysisResponse = {
  success: boolean;
  modules?: AIModuleResponse[];
  suggested_total?: number;
  adjustment_limits?: {
    min_total: number;
    max_total: number;
    per_module_adjustment_percent: number;
  };
  budget_analysis?: {
    is_client_budget_realistic: boolean;
    recommended_minimum: number;
    notes: string;
  };
  error?: string;
};

// Types for AI Conversation
export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
  isComplete?: boolean;
};

type InterviewResponse = {
  success: boolean;
  message?: string;
  isComplete?: boolean;
  questionNumber?: number;
  totalQuestions?: number;
  error?: string;
};

/**
 * Validates if the project description is actually a software freelancing request
 */
export async function validateProjectScopeWithAI(data: {
  title: string;
  description: string;
  tags: string[];
}): Promise<{ isValid: boolean; error?: string }> {
  try {
    const apiKey = process.env.GROK_CLOUD_API;
    if (!apiKey) return { isValid: true }; // Skip if no key

    const groq = new Groq({ apiKey });

    // Simple prompt for validation
    const prompt = `You are a project validator for a software freelancing platform.
Check if this request is valid for software development/design/tech work.

INPUT:
Title: ${data.title}
Description: ${data.description}
Tags: ${data.tags.join(", ")}

RULES:
- INVALID if: gibberish, homework help, non-tech (e.g. "walk my dog", "write an essay"), or offensive.
- VALID if: related to software, app dev, web design, IT, data, etc. even if vague.

Respond ONLY with JSON:
{"isValid": boolean, "reason": "short error message if invalid"}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.1,
      max_completion_tokens: 100,
      response_format: { type: "json_object" },
    });

    const text = chatCompletion.choices[0]?.message?.content || "{}";
    const result = JSON.parse(text);

    return {
      isValid: result.isValid,
      error: result.isValid
        ? undefined
        : result.reason ||
          "Project does not appear to be a valid software freelancing request.",
    };
  } catch (error) {
    console.error("Scope Validation Error:", error);
    return { isValid: true }; // Fail open if API issues
  }
}

/**
 * Conduct a project discovery interview with the user using Groq
 * AI asks short, focused questions to understand modules/features needed
 */
export async function conductProjectInterview(context: {
  title: string;
  userStory: string;
  tags: string[];
  requiredSkills: string[];
  estimatedBudget: number | null;
  previousMessages: ConversationMessage[];
}): Promise<InterviewResponse> {
  try {
    const apiKey = process.env.GROK_CLOUD_API;
    if (!apiKey) {
      return {
        success: false,
        error: "Groq API key not configured",
      };
    }

    const groq = new Groq({ apiKey });

    const questionCount = context.previousMessages.filter(
      (m) => m.role === "assistant"
    ).length;

    const conversationHistory = context.previousMessages
      .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
      .join("\n");

    const systemPrompt = `You are a project scoping assistant. Your job is to identify MISSING but CRUCIAL features for the project.

CRITICAL RULES:
1. READ the user's description carefully first
2. DO NOT ask about features already mentioned in the description
3. ONLY ask about crucial features that are MISSING and typical for this type of app
4. If the description covers key features, set isComplete: true immediately
5. You can ask 1 or 2 related questions at once to be efficient
6. Keep questions Medium (under 50 words)
7. Aim to complete gathering info within 3-8 turns maximum
8. When isComplete is true, provide a brief summary (no question)

9. HANDLE UNCERTAINTY / like I DON'T KNOW etc:
   - IF the user says "I don't know", "Not sure", "You decide", or similar:
     - DO NOT ASK THE SAME QUESTION AGAIN.
     - MAKE A REASONABLE PROFESSIONAL ASSUMPTION based on the project type.
     - STATE your assumption briefly ("I will assume standard email/password login").
     - MOVE ON to the next topic or complete the interview.
     - IT IS BETTER TO ASSUME AND FINISH THAN TO STALL.
    - IF user say do what ever you want then Must Finish the interview.

Question count: ${questionCount}
If question count >= 8, you SHOULD set isComplete: true.

Respond ONLY with JSON: {"message": "your question(s) or summary", "isComplete": boolean, "questionNumber": ${
      questionCount + 1
    }}`;

    const userContent = `=== PROJECT DETAILS (READ CAREFULLY - DON'T ASK ABOUT THINGS ALREADY MENTIONED) ===
Project: ${context.title}
Budget: ${context.estimatedBudget || "Not specified"}
Required Skills: ${context.requiredSkills.join(", ") || "Not specified"}
Tags: ${context.tags.join(", ") || "Not specified"}

USER'S DESCRIPTION:
${context.userStory}

${conversationHistory ? `=== CONVERSATION ===\n${conversationHistory}` : ""}

Based on the description above, identify what CRUCIAL features are MISSING (if any). If the description is comprehensive, complete immediately.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.6,
      max_completion_tokens: 300,
      top_p: 1,
      stream: false,
    });

    const text = chatCompletion.choices[0].message.content || "";

    // Extract JSON with fallback
    let jsonText = text;
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      const directJsonMatch = text.match(/\{[\s\S]*\}/);
      if (directJsonMatch) {
        jsonText = directJsonMatch[0];
      }
    }

    // Recommended limit, but letting AI decide mostly
    const hitLimit = questionCount >= 8;

    // Try to parse JSON, fallback if it fails
    let aiResponse;
    try {
      aiResponse = JSON.parse(jsonText.trim());
    } catch (parseError) {
      // Fallback: use raw text as message
      console.warn("JSON parse failed, using fallback:", parseError);
      aiResponse = {
        message:
          text.replace(/```json|```/g, "").trim() ||
          "Could you tell me more about the key features you need?",
        isComplete: hitLimit,
        questionNumber: questionCount + 1,
      };
    }

    const isComplete =
      hitLimit && !aiResponse.isComplete
        ? true
        : aiResponse.isComplete || false;
    const message = isComplete
      ? ""
      : aiResponse.message ||
        "What are the most important features for your project?";

    return {
      success: true,
      message: message,
      isComplete: isComplete,
      questionNumber: aiResponse.questionNumber || questionCount + 1,
      totalQuestions: 8,
    };
  } catch (error) {
    console.error("Project Interview Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to conduct interview",
    };
  }
}

// Types for Multiple Choice Questions
export type MCQOption = {
  id: string; // e.g. "a", "b", "c", "d"
  label: string;
};

export type MCQQuestion = {
  id: number;
  question: string;
  options: MCQOption[];
  allowMultiple?: boolean; // future-proof
};

export type MCQGenerateResponse = {
  success: boolean;
  questions?: MCQQuestion[];
  error?: string;
};

/**
 * Generate 5-7 multiple choice questions for project discovery using Groq.
 * Questions are tailored to the project type and avoid asking about things
 * already mentioned in the project description.
 */
export async function generateMultipleChoiceQuestions(context: {
  title: string;
  userStory: string;
  tags: string[];
  requiredSkills: string[];
  estimatedBudget: number | null;
}): Promise<MCQGenerateResponse> {
  try {
    const apiKey = process.env.GROK_CLOUD_API;
    if (!apiKey) {
      return { success: false, error: "Groq API key not configured" };
    }

    const groq = new Groq({ apiKey });

    const prompt = `You are a project scoping assistant for a software freelancing platform. Generate exactly 6 multiple-choice questions to better understand a software project.

PROJECT DETAILS:
Title: ${context.title}
Description: ${context.userStory}
Tags: ${context.tags.join(", ") || "Not specified"}
Required Skills: ${context.requiredSkills.join(", ") || "Not specified"}
Budget: ${
      context.estimatedBudget ? `$${context.estimatedBudget}` : "Not specified"
    }

RULES:
1. DO NOT ask about things ALREADY MENTIONED in the description.
2. Ask about CRUCIAL technical decisions: auth type, platforms, integrations, scale, etc.
3. Each question has exactly 4 options (a, b, c, d). The last option should always be "Not sure / Let AI decide".
4. Questions must be concise (under 15 words each).
5. Options must be short labels (under 8 words each).
6. Cover varied aspects: platform, users, integrations, payments, notifications, etc.

Return ONLY a JSON array (no markdown, no extra text):
[
  {
    "id": 1,
    "question": "Which platform(s) should the app support?",
    "options": [
      {"id": "a", "label": "Web only"},
      {"id": "b", "label": "Mobile only (iOS/Android)"},
      {"id": "c", "label": "Both web and mobile"},
      {"id": "d", "label": "Not sure / Let AI decide"}
    ]
  }
]`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.7,
      max_completion_tokens: 1500,
      top_p: 1,
      stream: false,
    });

    const text = completion.choices[0]?.message?.content || "";

    // Extract JSON array
    let jsonText = text;
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonText = arrayMatch[0];
    }

    const questions: MCQQuestion[] = JSON.parse(jsonText.trim());

    return { success: true, questions };
  } catch (error) {
    console.error("MCQ Generation Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate questions",
    };
  }
}

export async function analyzeProjectWithAI(
  title: string,
  userStory: string,
  tools: string[],
  requiredSkills: string[],
  estimatedBudget: number | null,
  attachments?: any[],
  conversationContext?: ConversationMessage[]
): Promise<AIAnalysisResponse> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error:
          "Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables.",
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prepare attachment context
    let attachmentContext = "";
    if (attachments && attachments.length > 0) {
      const textsWithContent = attachments
        .filter((att) => att.extractedText && att.extractedText.trim())
        .map(
          (att, idx) =>
            `\n--- Attachment ${idx + 1}: ${att.name} ---\n${
              att.extractedText
            }\n--- End of ${att.name} ---\n`
        );

      if (textsWithContent.length > 0) {
        attachmentContext = `\n\nAdditional Context from Attachments:\n${textsWithContent.join(
          "\n"
        )}`;
      }
    }

    // Prepare conversation context
    let conversationSummary = "";
    if (conversationContext && conversationContext.length > 0) {
      const qaPairs = [];
      for (let i = 0; i < conversationContext.length; i += 2) {
        if (conversationContext[i] && conversationContext[i + 1]) {
          qaPairs.push(
            `Q: ${conversationContext[i].content}\nA: ${
              conversationContext[i + 1].content
            }`
          );
        }
      }
      if (qaPairs.length > 0) {
        conversationSummary = `\n\n=== DISCOVERY INTERVIEW ===\nThe following Q&A was conducted to gather detailed requirements:\n${qaPairs.join(
          "\n\n"
        )}`;
      }
    }

    const ragContext = await retrieveProjectRAGContext({
      title,
      userStory,
      tags: tools,
      requiredSkills,
      estimatedBudget,
    });

    const prompt = `You are an expert software project cost estimator. Focus on technical scope and complexity for realistic freelancer rates.

=== PROJECT ===
Title: ${title}
Description: ${userStory}${attachmentContext}${conversationSummary}
Technology Stack: ${tools.join(", ") || "Not specified"}
Required Skills: ${requiredSkills.join(", ") || "General development"}
Client Budget: ${estimatedBudget ? `$${estimatedBudget}` : "Not specified"}
${ragContext ? `\n${ragContext}\n` : ""}
=== PRICING PHILOSOPHY ===
Minimize cost while remaining realistic. Assume JUNIOR developer at $10-15/hr from low-cost regions. Use MAXIMUM code reuse (libraries, templates, boilerplates). Estimate HAPPY PATH only—no over-engineering. Pick LOWER bound of every price range.

=== CRITICAL RULES ===
1. Ignore subjective language ("amazing", "premium", "revolutionary" do NOT increase cost).
2. Base costs on: minimum hours × $10-15/hr rate + technical complexity.
3. STRICT BUDGET ENFORCEMENT: Total must be ≤ client budget. Reverse-engineer module costs to fit.
4. Create ONLY modules explicitly required—no extra features.
5. Each module ≤ 2 weeks solo work.
6. Cost fields: min_cost = 90% estimated; max_cost = 120% estimated.
7. When historical benchmarks are provided above, they are the PRIMARY pricing signal. If the same or a very similar module appears in the benchmarks, use that historical cost directly or very close to it.
8. Do NOT let the generic benchmark table override a closer historical module benchmark.
9. If multiple historical examples exist for the same or nearly same module, prefer the consensus / lowest observed cost unless the description clearly requires more scope.

=== BENCHMARK TABLE (USE LOWER END) ===
Simple page: $30-80 | CRUD: $60-150 | Auth (email/pwd): $60-120 | OAuth: $60-120 | Forms: $25-60 | REST API: $30-80 | Complex API: $60-150 | DB basic: $40-100 | DB complex: $100-250 | Admin dashboard: $120-300 | Payment (Stripe): $80-180 | File upload: $25-70 | Search basic: $25-80 | Search advanced: $50-150 | Email notifications: $20-50 | Real-time (WebSocket): $50-150 | Responsive design: $30-100 | Testing: $60-150
Use this table only when no matching historical benchmark exists.

=== OUTPUT FORMAT ===
Return ONLY valid JSON:
{
  "modules": [
    {
      "name": "module name (2-4 words)",
      "description": "technical deliverable",
      "estimated_cost": number,
      "confidence": 0-1,
      "complexity": 1-5,
      "is_mandatory": boolean,
      "min_cost": number,
      "max_cost": number,
      "estimated_hours": number
    }
  ],
  "suggested_total": number,
  "adjustment_limits": {
    "min_total": number,
    "max_total": number,
    "per_module_adjustment_percent": 25
  },
  "budget_analysis": {
    "is_client_budget_realistic": boolean,
    "recommended_minimum": number,
    "notes": "brief analysis"
  }
}`;

    let text = "";

    /* Gemini commented out due to rate limits
    try {
      const result = await model.generateContent(prompt);
      text = result.response.text();
    } catch (geminiError) {
      console.warn("Gemini Analysis Failed. Switching to Groq fallback...", geminiError);
    }
    */

    // Use Groq as primary provider
    try {
      const groqApiKey = process.env.GROK_CLOUD_API;
      if (!groqApiKey) throw new Error("Groq API key is not configured.");

      const groq = new Groq({ apiKey: groqApiKey });

      // Step 1: Get Analysis with Search (No JSON mode)
      const analysisCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
        max_completion_tokens: 4096,
        top_p: 0.9,
        stream: false,
      } as any);

      const rawAnalysis = analysisCompletion.choices[0]?.message?.content || "";

      // Step 2: Convert to JSON
      const jsonCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a JSON formatter. detailed extract the project analysis modules and budget from the text and format it as valid JSON.",
          },
          {
            role: "user",
            content: `Extract the data from this text and format as JSON matching this schema:
            {
              "modules": [{ "name": string, "description": string, "estimated_cost": number, "confidence": number, "complexity": number, "is_mandatory": boolean, "min_cost": number, "max_cost": number, "estimated_hours": number }],
              "suggested_total": number,
              "adjustment_limits": { "min_total": number, "max_total": number, "per_module_adjustment_percent": number },
              "budget_analysis": { "is_client_budget_realistic": boolean, "recommended_minimum": number, "notes": string }
            }
            
            TEXT TO PROCESS:
            ${rawAnalysis}`,
          },
        ],
        model: "qwen/qwen3-32b",
        temperature: 0.6,
        max_completion_tokens: 4096,
        top_p: 0.95,
        stream: false,
        reasoning_effort: "none" as any,
        response_format: {
          type: "json_object",
        },
      });

      text = jsonCompletion.choices[0]?.message?.content || "";
    } catch (groqError) {
      console.error("Groq Analysis Failed:", groqError);
      throw groqError; // Re-throw to be caught by the outer loop or returned as error
    }

    // Extract JSON from markdown code blocks if present
    let jsonText = text;
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // Try to find JSON object directly
      const directJsonMatch = text.match(/\{[\s\S]*\}/);
      if (directJsonMatch) {
        jsonText = directJsonMatch[0];
      }
    }

    const aiResponse = JSON.parse(jsonText.trim());

    // Recalculate total to ensure it matches sum of modules
    const calculatedTotal = Array.isArray(aiResponse.modules)
      ? aiResponse.modules.reduce(
          (sum: number, m: any) => sum + (Number(m.estimated_cost) || 0),
          0
        )
      : aiResponse.suggested_total;

    return {
      success: true,
      modules: aiResponse.modules,
      suggested_total: calculatedTotal,

      adjustment_limits: aiResponse.adjustment_limits,
      budget_analysis: aiResponse.budget_analysis,
    };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to analyze project with AI",
    };
  }
}

export async function createProjectDraft(data: {
  title: string;
  user_story: string;
  owner_estimated_budget: number | null;
  ai_estimated_total: number;
  owner_final_total: number;
  ai_estimation_meta: Record<string, unknown>;
  owner_adjustment_limits: Record<string, unknown>;
  modules: Array<{
    name: string;
    description: string;
    ai_estimated_cost: number;
    owner_final_cost: number;
    ai_confidence: number;
    complexity: number;
    is_mandatory: boolean;
  }>;
  status?: "draft" | "open" | "in_progress" | "completed";
  is_published?: boolean;
  short_description?: string;
  tags?: string[];
  deadline?: Date | null;
  required_skills?: string[];
  attachments?: any[];
  github_repo_url?: string;
}) {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        owner_id: user.id,
        title: data.title,
        user_story: data.user_story,
        owner_estimated_budget: data.owner_estimated_budget,
        ai_estimated_total: data.ai_estimated_total,
        owner_final_total: data.owner_final_total,
        ai_estimation_meta: data.ai_estimation_meta,
        owner_adjustment_limits: data.owner_adjustment_limits,
        status: data.status || "draft",
        is_published: data.is_published || false,
        published_at: data.is_published ? new Date().toISOString() : null,
        visibility: data.is_published ? "public" : "private",
        short_description: data.short_description,
        tags: data.tags || [],
        deadline: data.deadline,
        required_skills: data.required_skills || [],
        attachments: data.github_repo_url
          ? [
              ...(data.attachments || []),
              { type: "github_repo", url: data.github_repo_url },
            ]
          : data.attachments || [],
      })
      .select()
      .single();

    if (projectError) {
      console.error("Project creation error:", projectError);
      return { success: false, error: projectError.message };
    }

    // Create project modules
    const modulesData = data.modules.map((module) => ({
      project_id: project.id,
      name: module.name,
      description: module.description,
      ai_estimated_cost: module.ai_estimated_cost,
      owner_final_cost: module.owner_final_cost,
      ai_confidence: module.ai_confidence,
      complexity: module.complexity,
      is_mandatory: module.is_mandatory,
      suggested_by_ai: true,
      currency: "USD",
    }));

    const { error: modulesError } = await supabase
      .from("project_modules")
      .insert(modulesData);

    if (modulesError) {
      console.error("Modules creation error:", modulesError);
      // Optionally rollback project creation
      return { success: false, error: modulesError.message };
    }

    // Store AI suggestion
    const { error: suggestionError } = await supabase
      .from("ai_project_suggestions")
      .insert({
        project_id: project.id,
        suggested_by: "gemini-1.5-flash",
        suggestion: data.ai_estimation_meta,
        suggested_total: data.ai_estimated_total,
        accepted: true,
      });

    if (suggestionError) {
      console.error("AI suggestion error:", suggestionError);
      // Non-critical, continue
    }

    // If GitHub repo URL is provided, link it to the project in project_repos table
    if (data.github_repo_url && project?.id) {
      try {
        console.log(
          "Linking GitHub repository to project:",
          data.github_repo_url
        );

        // Extract repo full name from URL (e.g., "username/repo-name")
        const urlParts = data.github_repo_url.split("/");
        const repoFullName = `${urlParts[urlParts.length - 2]}/${
          urlParts[urlParts.length - 1]
        }`;

        const { error: linkError } = await supabase
          .from("project_repos")
          .insert({
            project_id: project.id,
            provider: "github",
            repo_full_name: repoFullName,
            repo_url: data.github_repo_url,
            is_private: true, // Assume private by default from wizard
            creation_status: "created",
            created_by: user.id,
          });

        if (linkError) {
          console.error("Error linking repository to project:", linkError);
          // Don't fail the entire project creation, just log the error
        } else {
          console.log("Successfully linked repository to project");
        }
      } catch (linkError) {
        console.error("Error in repository linking:", linkError);
        // Don't fail the entire project creation
      }
    }

    revalidatePath("/explore");
    revalidatePath("/project/listing");

    indexProjectWithModules(project.id).catch((err) =>
      console.error("RAG indexing failed after project creation:", err)
    );

    return { success: true, project_id: project.id };
  } catch (error) {
    console.error("Project creation error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create project",
    };
  }
}

export async function updateProject(
  projectId: string,
  data: {
    title: string;
    user_story: string;
    owner_estimated_budget: number | null;
    short_description?: string;
    tags?: string[];
    deadline?: Date | null;
    required_skills?: string[];
    attachments?: any[];
    modules?: any[];
  }
) {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Verify ownership
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      return { success: false, error: "Project not found" };
    }

    if (project.owner_id !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Calculate new total if modules are provided
    let ownerFinalTotal = 0;
    if (data.modules && data.modules.length > 0) {
      ownerFinalTotal = data.modules.reduce((sum, m) => {
        if (m.is_mandatory) {
          return sum + (m.owner_final_cost || m.ai_estimated_cost || 0);
        }
        return sum;
      }, 0);
    }

    // Update project
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        title: data.title,
        user_story: data.user_story,
        owner_estimated_budget: data.owner_estimated_budget,
        short_description: data.short_description,
        tags: data.tags || [],
        deadline: data.deadline,
        required_skills: data.required_skills || [],
        attachments: data.attachments || [],
        owner_final_total: ownerFinalTotal > 0 ? ownerFinalTotal : undefined, // Update total if recalculated
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateError) {
      console.error("Project update error:", updateError);
      return { success: false, error: updateError.message };
    }

    // Update modules if provided
    if (data.modules) {
      console.log("Received modules for update:", data.modules.length);

      // 1. Identify modules to delete
      // Fetch all existing module IDs for this project
      const { data: existingModules, error: fetchModulesError } = await supabase
        .from("project_modules")
        .select("id")
        .eq("project_id", projectId);

      if (fetchModulesError) {
        console.error("Error fetching existing modules:", fetchModulesError);
      } else {
        const existingIds = existingModules.map((m) => m.id);
        const incomingIds = data.modules.filter((m) => m.id).map((m) => m.id);
        const idsToDelete = existingIds.filter(
          (id) => !incomingIds.includes(id)
        );

        console.log("Modules to delete:", idsToDelete);

        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("project_modules")
            .delete()
            .in("id", idsToDelete)
            .eq("project_id", projectId); // Security double-check

          if (deleteError) {
            console.error("Error deleting modules:", deleteError);
          }
        }
      }

      // 2. Identify modules to update and insert
      // Fetch existing IDs again to be sure (or reuse from step 1)
      const existingIds = existingModules
        ? existingModules.map((m) => m.id)
        : [];

      const modulesToUpdate = data.modules.filter(
        (m) => m.id && existingIds.includes(m.id)
      );
      // Treat modules without ID OR with IDs not in database as new inserts
      const modulesToInsert = data.modules.filter(
        (m) => !m.id || (m.id && !existingIds.includes(m.id))
      );

      console.log("Modules to update:", modulesToUpdate.length);
      console.log("Modules to insert:", modulesToInsert.length);

      // Update existing modules
      for (const module of modulesToUpdate) {
        const { error: moduleError } = await supabase
          .from("project_modules")
          .update({
            name: module.name,
            description: module.description,
            owner_final_cost: module.owner_final_cost,
            complexity: module.complexity,
            is_mandatory: module.is_mandatory,
            updated_at: new Date().toISOString(),
          })
          .eq("id", module.id)
          .eq("project_id", projectId); // Security check

        if (moduleError) {
          console.error(`Failed to update module ${module.id}:`, moduleError);
        }
      }

      // Insert new modules
      if (modulesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("project_modules")
          .insert(
            modulesToInsert.map((module) => ({
              project_id: projectId,
              name: module.name,
              description: module.description,
              ai_estimated_cost: module.ai_estimated_cost || 0,
              owner_final_cost:
                module.owner_final_cost || module.ai_estimated_cost || 0,
              ai_confidence: module.ai_confidence || 0.8,
              complexity: module.complexity || 3,
              is_mandatory:
                module.is_mandatory !== undefined ? module.is_mandatory : true,
              suggested_by_ai: true, // Assume added via AI or manual add
              currency: "USD",
            }))
          );

        if (insertError) {
          console.error("Failed to insert new modules:", insertError);
        }
      }
    }

    revalidatePath(`/project/${projectId}`);
    revalidatePath("/explore");

    if (data.modules) {
      indexProjectWithModules(projectId).catch((err) =>
        console.error("RAG re-index failed after project update:", err)
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Project update error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update project",
    };
  }
}

export async function refineModulesWithAI(
  currentModules: any[],
  userPrompt: string,
  projectContext: string
) {
  try {
    console.log("Refining modules with AI...");
    console.log("User Prompt:", userPrompt);
    console.log("Current Modules Count:", currentModules.length);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Gemini API key not configured" };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const moduleRagContext = await retrieveModuleRAGContext(
      userPrompt,
      projectContext
    );

    const prompt = `You are an expert project manager assistant. Your task is to modify a list of project modules based on the user's request.

Project Context: ${projectContext}
${moduleRagContext ? `\n${moduleRagContext}\n` : ""}
Current Modules:
${JSON.stringify(currentModules, null, 2)}

User Request: "${userPrompt}"

Instructions:
1. Analyze the user's request and the current modules.
2. Perform the requested actions (add, remove, edit, split, merge).
3. If adding or changing a module, use the historical module benchmark section as the main source of truth.
4. If the same or a very similar module name appears in the historical benchmarks, prefer that cost over the generic benchmark table.
5. If multiple historical examples exist for the same module, prefer the lowest or consensus observed cost unless the request clearly adds scope.
4. If editing, update the specific fields requested.
6. Ensure the output is a valid JSON array of modules.
7. Maintain the existing structure of the modules.
8. Return ONLY the JSON array of updated modules.

Response Format:
{
  "modules": [
    {
      "id": "string (MUST be null for NEW modules, keep existing UUID for editing)",
      "name": "string",
      "description": "string",
      "ai_estimated_cost": number,
      "owner_final_cost": number,
      "ai_confidence": number,
      "complexity": number,
      "is_mandatory": boolean
    }
  ],
  "message": "Brief explanation of what changes were made"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log("AI Raw Response:", text);

    let jsonText = text;
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      const directJsonMatch = text.match(/\{[\s\S]*\}/);
      if (directJsonMatch) {
        jsonText = directJsonMatch[0];
      }
    }

    const aiResponse = JSON.parse(jsonText.trim());
    console.log("AI Parsed Modules Count:", aiResponse.modules?.length);

    return {
      success: true,
      modules: aiResponse.modules,
      message: aiResponse.message,
    };
  } catch (error) {
    console.error("AI Refinement Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to refine modules",
    };
  }
}

/**
 * One-time backfill: indexes all existing projects into pgvector.
 * Call from a server context after running the migration SQL.
 */
export async function backfillProjectEmbeddings() {
  return backfillAllProjectEmbeddings();
}

/**
 * Check GitHub connection status and scope availability
 */
export async function checkGitHubConnection(): Promise<{
  connected: boolean;
  hasRepoScope: boolean;
  username?: string;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        connected: false,
        hasRepoScope: false,
      };
    }

    // STEP 1: Check oauth_tokens table for stored GitHub token
    const { data: tokenData } = await supabase
      .from("oauth_tokens")
      .select("access_token, scopes")
      .eq("user_id", user.id)
      .eq("provider", "github")
      .maybeSingle();

    if (tokenData?.access_token) {
      // Token exists in database - check for repo scope
      const scopes = tokenData.scopes || [];
      const hasRepoScope = scopes.includes("repo");

      // Get username from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("github_username")
        .eq("id", user.id)
        .single();

      return {
        connected: true,
        hasRepoScope,
        username: profile?.github_username || undefined,
      };
    }

    // STEP 2: Fallback - Check if GitHub identity exists but no token in database
    const hasGithubIdentity = user.identities?.some(
      (id) => id.provider === "github"
    );

    if (hasGithubIdentity) {
      // User has linked GitHub but no token in database yet
      const { data: profile } = await supabase
        .from("profiles")
        .select("github_username")
        .eq("id", user.id)
        .single();

      return {
        connected: true,
        hasRepoScope: false, // No token means we don't know about scopes
        username: profile?.github_username || undefined,
      };
    }

    // No GitHub connection at all
    return {
      connected: false,
      hasRepoScope: false,
    };
  } catch (error) {
    console.error("Error checking GitHub connection:", error);
    return {
      connected: false,
      hasRepoScope: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to check GitHub connection",
    };
  }
}

/**
 * Create a GitHub repository for the project
 */
export async function createGitHubRepo(data: {
  name: string;
  description: string;
  isPrivate?: boolean;
}): Promise<{ success: boolean; repoUrl?: string; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Import and use the GitHub service
    const { createGitHubRepository } = await import("@/lib/services/github");

    const result = await createGitHubRepository({
      name: data.name,
      description: data.description,
      isPrivate: data.isPrivate ?? true,
    });

    return result;
  } catch (error) {
    console.error("Error in createGitHubRepo action:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create GitHub repository",
    };
  }
}

/**
 * Create a GitHub repository and link it to the project
 * This combines repository creation and linking to prevent duplicate work during workspace setup
 */
export async function createAndLinkGitHubRepo(
  projectId: string,
  data: {
    name: string;
    description: string;
    isPrivate?: boolean;
  }
): Promise<{
  success: boolean;
  repoUrl?: string;
  repoFullName?: string;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return { success: false, error: "Project not found" };
    }

    if (project.owner_id !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Create the repository on GitHub
    const { createGitHubRepository } = await import("@/lib/services/github");

    const result = await createGitHubRepository({
      name: data.name,
      description: data.description,
      isPrivate: data.isPrivate ?? true,
    });

    if (!result.success || !result.repoUrl) {
      return {
        success: false,
        error: result.error || "Failed to create GitHub repository",
      };
    }

    // Extract repo full name from URL (e.g., "username/repo-name")
    const urlParts = result.repoUrl.split("/");
    const repoFullName = `${urlParts[urlParts.length - 2]}/${
      urlParts[urlParts.length - 1]
    }`;

    // Link the repository to the project in database
    const { error: linkError } = await supabase.from("project_repos").insert({
      project_id: projectId,
      provider: "github",
      repo_full_name: repoFullName,
      repo_url: result.repoUrl,
      is_private: data.isPrivate ?? true,
      creation_status: "created",
      created_by: user.id,
    });

    if (linkError) {
      console.error("Error linking project repo:", linkError);
      // Repository was created but linking failed - this is a partial success
      return {
        success: true, // Still return success since repo was created
        repoUrl: result.repoUrl,
        repoFullName,
        error: "Repository created but linking failed. Please contact support.",
      };
    }

    revalidatePath(`/project/${projectId}`);
    revalidatePath(`/workspace/create/${projectId}`);

    return {
      success: true,
      repoUrl: result.repoUrl,
      repoFullName,
    };
  } catch (error) {
    console.error("Error in createAndLinkGitHubRepo action:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create and link GitHub repository",
    };
  }
}

/**
 * Server action to extract text from uploaded files
 * This handles PDF, DOCX, and plain text file extraction
 * Maximum file size: 5MB
 */
export async function extractTextFromUploadedFile(
  fileBuffer: ArrayBuffer,
  mimeType: string,
  fileName: string
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    // Validate file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (fileBuffer.byteLength > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File exceeds 5MB size limit. File size: ${(
          fileBuffer.byteLength /
          1024 /
          1024
        ).toFixed(2)}MB`,
      };
    }

    let extractedText = "";

    if (mimeType === "application/pdf") {
      // Extract text from PDF
      try {
        const pdfParse = await import("pdf-parse");
        const buffer = Buffer.from(fileBuffer);
        const data = await pdfParse.default(buffer);
        extractedText = data.text;
      } catch (error) {
        console.error("PDF extraction error:", error);
        throw new Error(
          `Failed to extract text from PDF: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } else if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      // Extract text from DOCX
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({
          arrayBuffer: fileBuffer,
        });
        extractedText = result.value;
      } catch (error) {
        console.error("DOCX extraction error:", error);
        throw new Error(
          `Failed to extract text from DOCX: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } else if (mimeType === "text/plain" || mimeType === "text/markdown") {
      // For text files, decode the buffer
      const decoder = new TextDecoder();
      extractedText = decoder.decode(fileBuffer);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    return {
      success: true,
      text: extractedText.trim(),
    };
  } catch (error) {
    console.error("Text extraction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to extract text from file",
    };
  }
}
