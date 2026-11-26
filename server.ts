import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

interface AnalyzeRequestBody {
  text?: unknown;
  language?: unknown;
}

const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    inScope: {
      type: Type.BOOLEAN,
      description:
        'True ONLY if the input text is related to government ordinances, barangay notices, community policies, laws, administrative advisories, permits, or public service procedures. False for out-of-scope topics like recipes, coding help, entertainment, jokes, or unrelated queries.',
    },
    refusalMessage: {
      type: Type.STRING,
      description:
        'When inScope is false, provide a polite, friendly 2-3 sentence refusal explaining that CivicClear AI only assists with local ordinances, barangay notices, and civic policies, and invite the user to paste a policy or try a sample preset. Empty string when inScope is true.',
    },
    documentTitle: {
      type: Type.STRING,
      description:
        'A concise, plain-language title identifying the ordinance, notice, or procedure from the provided text. Empty or short generic label if out of scope.',
    },
    plainLanguageSummary: {
      type: Type.STRING,
      description:
        'Clear, everyday explanation of what the policy is about, who it applies to, and why it matters. Written strictly in the requested language mode.',
    },
    keyRulesAndObligations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Bullet-point list of the main rules, prohibitions, rights, exemptions, and citizen responsibilities explicitly supported by the text.',
    },
    deadlinesFeesRequirements: {
      type: Type.OBJECT,
      properties: {
        deadlines: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            'Exact dates, periods, or deadlines stated in the text. Return ["None specified"] if none are mentioned.',
        },
        feesAndPenalties: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            'Exact fees, taxes, surcharges, or fines stated in the text. Return ["None specified"] if none are mentioned.',
        },
        documentaryRequirements: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            'Exact forms, IDs, clearances, or documents required by the text. Return ["None specified"] if none are mentioned.',
        },
      },
      required: ['deadlines', 'feesAndPenalties', 'documentaryRequirements'],
    },
    stepByStepActions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Ordered, actionable checklist of steps a citizen should take next based strictly on the provided policy text.',
    },
    officialVerificationReminder: {
      type: Type.STRING,
      description:
        'A helpful reminder advising the resident to verify current effectivity, exact fee schedules, or exemptions directly with their Barangay Hall, City/Municipal Hall, or issuing government office.',
    },
  },
  required: [
    'inScope',
    'refusalMessage',
    'documentTitle',
    'plainLanguageSummary',
    'keyRulesAndObligations',
    'deadlinesFeesRequirements',
    'stepByStepActions',
    'officialVerificationReminder',
  ],
};

function buildSystemInstruction(language: 'english' | 'bisaya_tagalog'): string {
  const languageDirective =
    language === 'bisaya_tagalog'
      ? `OUTPUT LANGUAGE: Conversational Bisaya / Tagalog (natural, warm, everyday Cebuano-Bisaya and Tagalog civic phrasing clearly understood by Filipino community residents). Keep official proper nouns, ordinance numbers, Philippine Peso amounts, and exact dates accurate, while explaining legal jargon in simple Bisaya/Tagalog.`
      : `OUTPUT LANGUAGE: Plain English (clear, warm, everyday Grade 6-8 reading level English). Translate legalistic phrasing into direct, understandable language while keeping ordinance numbers, Peso amounts, and exact dates accurate.`;

  return `You are CivicClear AI, a strictly grounded civic-tech plain-language policy navigator aligned with UN SDG 16 (Peace, Justice & Strong Institutions).

STRICT DOMAIN GUARDRAIL:
- You ONLY process local government ordinances, barangay notices, community rules, public advisories, permits, municipal/city regulations, and public service procedures.
- If the user's input is NOT a civic, policy, legal, regulatory, or public service topic (for example: recipes, cooking, coding/programming questions, homework, movie/music entertainment, personal chat, fiction, or general trivia), you MUST set "inScope" to false, leave arrays empty or minimal, and write a friendly, polite "refusalMessage" explaining that CivicClear AI is dedicated strictly to civic policies, barangay notices, and local ordinances, and encouraging the user to paste an official policy text or select one of the sample presets.

ZERO-HALLUCINATION & ACCURACY RULES:
- Base EVERY claim strictly on the user's input text.
- NEVER invent laws, Republic Acts, ordinance numbers, fines, peso amounts, filing fees, office addresses, or deadlines that are NOT present in the input text.
- Under "deadlinesFeesRequirements": if deadlines, fees/penalties, or documentary requirements are absent from the text, you MUST explicitly return ["None specified"] (or the equivalent clear phrase in the selected language, e.g., ["None specified (Walay gitakda sa teksto)"] for Bisaya/Tagalog, or ["None specified"]—always include the exact words "None specified" so it is unmistakable).
- Keep every item concise, practical, and citizen-focused.
- OUTPUT FORMAT: Return ONLY a single valid JSON object matching the requested schema. Never include introductory text (such as "Here is the..."), explanations, or markdown code fences outside the JSON object.

${languageDirective}`;
}

function extractJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    // Strip markdown code fences if present
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) {
      try {
        return JSON.parse(fenceMatch[1].trim()) as Record<string, unknown>;
      } catch {
        // Fall through to brace extraction
      }
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const candidate = trimmed.slice(firstBrace, lastBrace + 1);
      return JSON.parse(candidate) as Record<string, unknown>;
    }

    throw new SyntaxError(
      `Model response did not contain a valid JSON object: ${trimmed.slice(0, 80)}`
    );
  }
}

function normalizeStringArray(val: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(val)) return fallback;
  const cleaned = val
    .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallback;
}

function normalizeAnalysisResult(parsed: Record<string, unknown>) {
  const inScope = Boolean(parsed.inScope);
  const dfr =
    typeof parsed.deadlinesFeesRequirements === 'object' &&
    parsed.deadlinesFeesRequirements !== null
      ? (parsed.deadlinesFeesRequirements as Record<string, unknown>)
      : {};

  return {
    inScope,
    refusalMessage:
      typeof parsed.refusalMessage === 'string' ? parsed.refusalMessage.trim() : '',
    documentTitle:
      typeof parsed.documentTitle === 'string' && parsed.documentTitle.trim()
        ? parsed.documentTitle.trim()
        : 'Policy Summary',
    plainLanguageSummary:
      typeof parsed.plainLanguageSummary === 'string'
        ? parsed.plainLanguageSummary.trim()
        : '',
    keyRulesAndObligations: normalizeStringArray(parsed.keyRulesAndObligations),
    deadlinesFeesRequirements: {
      deadlines: normalizeStringArray(dfr.deadlines, ['None specified']),
      feesAndPenalties: normalizeStringArray(dfr.feesAndPenalties, ['None specified']),
      documentaryRequirements: normalizeStringArray(dfr.documentaryRequirements, [
        'None specified',
      ]),
    },
    stepByStepActions: normalizeStringArray(parsed.stepByStepActions),
    officialVerificationReminder:
      typeof parsed.officialVerificationReminder === 'string' &&
      parsed.officialVerificationReminder.trim()
        ? parsed.officialVerificationReminder.trim()
        : 'Please verify current effectivity, exact fees, and exemptions directly with your Barangay Hall or issuing local government office.',
  };
}

const analysisCache = new Map<string, ReturnType<typeof normalizeAnalysisResult>>();
const MAX_CACHE_ENTRIES = 100;

function isDailyQuotaExhausted(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  return (
    msg.includes('PerDay') ||
    msg.includes('free_tier_requests') ||
    msg.includes('GenerateRequestsPerDay')
  );
}

async function callModelWithRetry(
  ai: GoogleGenAI,
  model: 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite',
  text: string,
  language: 'english' | 'bisaya_tagalog',
  maxRetries = 1
) {
  let lastError: unknown;
  const thinkingLevel =
    model === 'gemini-3.1-flash-lite' ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Analyze and translate the following text according to your instructions:\n\n"""\n${text}\n"""`,
        config: {
          systemInstruction: buildSystemInstruction(language),
          thinkingConfig: { thinkingLevel },
          seed: 42,
          responseMimeType: 'application/json',
          responseSchema: analysisResponseSchema,
        },
      });
      return response;
    } catch (error: unknown) {
      lastError = error;
      if (isDailyQuotaExhausted(error)) {
        // Do not retry daily quota exhaustion on the same model
        throw error;
      }
      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? Number((error as { status?: number }).status)
          : undefined;
      const isRetryable = status === 429 || (status !== undefined && status >= 500);
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

async function generateWithFallback(
  ai: GoogleGenAI,
  text: string,
  language: 'english' | 'bisaya_tagalog'
) {
  try {
    return await callModelWithRetry(ai, 'gemini-4-hydrogen', text, language, 1);
  } catch (primaryError: unknown) {
    const status =
      typeof primaryError === 'object' && primaryError !== null && 'status' in primaryError
        ? Number((primaryError as { status?: number }).status)
        : undefined;
    const msg =
      primaryError instanceof Error ? primaryError.message : String(primaryError ?? '');

    const shouldFallback =
      status === 429 ||
      status === 503 ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('UNAVAILABLE');

    if (!shouldFallback) {
      throw primaryError;
    }

    return await callModelWithRetry(ai, 'gemini-3.1-flash-lite', text, language, 1);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  app.post('/api/analyze', async (req, res) => {
    const body = (req.body ?? {}) as AnalyzeRequestBody;
    const rawText = typeof body.text === 'string' ? body.text.trim() : '';
    const language =
      body.language === 'bisaya_tagalog' ? 'bisaya_tagalog' : 'english';

    if (!rawText) {
      return res.status(400).json({
        error:
          'Please paste an ordinance, barangay notice, or policy text—or select one of the sample presets—before translating.',
      });
    }

    if (rawText.length < 10) {
      return res.status(400).json({
        error:
          'The provided text is too short to analyze. Please paste a complete policy clause, notice, or civic question.',
      });
    }

    if (rawText.length > 15000) {
      return res.status(400).json({
        error:
          'The provided text exceeds the 15,000-character limit. Please shorten the excerpt and try again.',
      });
    }

    const cacheKey = `${language}::${rawText}`;
    const cached = analysisCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error:
          'The Gemini API key is not configured on the server. Please verify your GEMINI_API_KEY in Settings > Secrets.',
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      let parsedRaw: Record<string, unknown> | null = null;
      let parseError: unknown = null;

      for (let parseAttempt = 0; parseAttempt < 2; parseAttempt++) {
        const response = await generateWithFallback(ai, rawText, language);
        const rawJson = (response.text ?? '').trim();
        if (!rawJson) {
          parseError = new Error('Empty response returned by analysis service.');
          continue;
        }
        try {
          parsedRaw = extractJsonObject(rawJson);
          break;
        } catch (err) {
          console.error(
            `JSON parse failed on attempt ${parseAttempt + 1}. Raw prefix:`,
            JSON.stringify(rawJson.slice(0, 300))
          );
          parseError = err;
        }
      }

      if (!parsedRaw) {
        throw parseError ?? new Error('Unable to parse structured policy output.');
      }

      const normalized = normalizeAnalysisResult(parsedRaw);
      if (analysisCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = analysisCache.keys().next().value;
        if (oldestKey !== undefined) {
          analysisCache.delete(oldestKey);
        }
      }
      analysisCache.set(cacheKey, normalized);

      return res.json(normalized);
    } catch (err: unknown) {
      console.error('Gemini API error in /api/analyze:', err);
      const message =
        err instanceof Error ? err.message : 'Unexpected server error while analyzing text.';
      if (message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')) {
        return res.status(401).json({
          error:
            'The configured API key was rejected. Please check your GEMINI_API_KEY in Settings > Secrets.',
        });
      }
      if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
        if (isDailyQuotaExhausted(err)) {
          return res.status(429).json({
            error:
              'The free-tier daily Gemini API quota has been reached for this key. To continue translating immediately, select a billing-enabled API key in Settings > Secrets, or try again after the quota resets.',
          });
        }
        return res.status(429).json({
          error:
            'The translation service is temporarily busy due to rate limits. Please wait a few seconds and click Try Again.',
        });
      }
      if (
        message.includes('UNAVAILABLE') ||
        message.includes('503') ||
        message.includes('high demand')
      ) {
        return res.status(503).json({
          error:
            'The AI translation service is experiencing temporary high demand. Please wait a few seconds and click Try Again.',
        });
      }
      return res.status(500).json({
        error: 'Unable to translate this policy right now. Please try again in a few moments.',
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicClear AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
