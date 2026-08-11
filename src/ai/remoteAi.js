const AI_CHAT_URL = import.meta.env.AI_CHAT_URL || import.meta.env.VITE_AI_CHAT_URL || '';
const AI_CHAT_API_KEY = import.meta.env.AI_CHAT_API_KEY || import.meta.env.VITE_AI_CHAT_API_KEY || '';
const AI_CHAT_MODEL = import.meta.env.AI_CHAT_MODEL || import.meta.env.VITE_AI_CHAT_MODEL || '';
const AI_CHAT_AUTH_HEADER = (import.meta.env.AI_CHAT_AUTH_HEADER || import.meta.env.VITE_AI_CHAT_AUTH_HEADER || 'authorization').trim().toLowerCase();

const trimmedUrl = AI_CHAT_URL.trim().replace(/\/+$/, '');

const normalizeAuthMode = (mode) => {
  if (mode === 'x-api-key' || mode === 'authorization' || mode === 'both') {
    return mode;
  }
  return 'authorization';
};

const authHeaderMode = normalizeAuthMode(AI_CHAT_AUTH_HEADER);

export function isRemoteAiConfigured() {
  return Boolean(trimmedUrl && AI_CHAT_API_KEY && AI_CHAT_MODEL);
}

export function getRemoteAiDebugInfo() {
  return {
    configured: isRemoteAiConfigured(),
    url: trimmedUrl || null,
    model: AI_CHAT_MODEL || null,
    apiKeyPresent: Boolean(AI_CHAT_API_KEY),
    authHeaderMode,
  };
}

function buildAuthHeaders() {
  const headers = {};
  if (authHeaderMode === 'x-api-key' || authHeaderMode === 'both') {
    headers['X-API-Key'] = AI_CHAT_API_KEY;
  }
  if (authHeaderMode === 'authorization' || authHeaderMode === 'both') {
    headers.Authorization = `Bearer ${AI_CHAT_API_KEY}`;
  }
  return headers;
}

async function callAiChat(messages) {
  if (!isRemoteAiConfigured()) {
    throw new Error('Remote AI is not configured.');
  }

  const response = await fetch(`${trimmedUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({
      model: AI_CHAT_MODEL,
      messages,
      temperature: 0,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`AI endpoint returned ${response.status}: ${bodyText}`);
  }

  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content || '';
}

function parseAiJsonResponse(rawText) {
  const trimmed = String(rawText || '').trim();
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  const jsonText = firstBrace !== -1 && lastBrace > firstBrace ? trimmed.slice(firstBrace, lastBrace + 1) : trimmed;
  return JSON.parse(jsonText);
}

export async function classifyJsonWithAiRemote(json) {
  if (!isRemoteAiConfigured()) {
    return null;
  }

  const jsonText = JSON.stringify(json, null, 2);
  const prompt = `You are a JSON domain classification assistant. Given the JSON input, choose exactly one domain from the supported list: ecommerce, hrms, security, compliance, monitoring, project_management, generic.\n\nRespond with valid JSON only, and include the keys: domain, confidence, reason. Confidence must be a number between 0 and 1. Do not include any markdown or additional text.\n\nJSON:\n${jsonText}`;

  const messages = [
    { role: 'system', content: 'You are a JSON domain classifier that returns only valid JSON.' },
    { role: 'user', content: prompt },
  ];

  const completionText = await callAiChat(messages);
  const result = parseAiJsonResponse(completionText);

  if (!result || typeof result.domain !== 'string' || typeof result.confidence !== 'number') {
    return null;
  }

  return {
    domain: result.domain,
    confidence: Math.min(1, Math.max(0, result.confidence)),
    reason: result.reason || 'Remote AI classification returned this result.',
    remote: true,
  };
}
