// Remote AI is optional and client-only. The API key is NEVER baked into the
// build (see vite.config.js) — it is provided by the user at runtime, held only
// in memory for the current session, and is never persisted, logged, or shown
// back in diagnostics. This is still not a production-safe secret-handling
// architecture: a browser can always be inspected, so any key typed here should
// be a low-privilege / rotate-often key. Real production use requires a
// server-side proxy that holds the credential and forwards redacted requests.
const AI_CHAT_URL = import.meta.env.AI_CHAT_URL || import.meta.env.VITE_AI_CHAT_URL || '';
const AI_CHAT_MODEL = import.meta.env.AI_CHAT_MODEL || import.meta.env.VITE_AI_CHAT_MODEL || '';
const AI_CHAT_AUTH_HEADER = (import.meta.env.AI_CHAT_AUTH_HEADER || import.meta.env.VITE_AI_CHAT_AUTH_HEADER || 'authorization').trim().toLowerCase();

const trimmedUrl = AI_CHAT_URL.trim().replace(/\/+$/, '');

const MAX_PAYLOAD_CHARS = 60000; // ~60 KB — keeps requests small and bounds cost/exposure.
const SENSITIVE_KEY_PATTERN = /pass(word)?|secret|token|api[_-]?key|apikey|authorization|credential|private[_-]?key/i;

let runtimeApiKey = '';
let runtimeConsent = false;

export function setRuntimeApiKey(key) {
  runtimeApiKey = String(key || '').trim();
}

export function hasRuntimeApiKey() {
  return Boolean(runtimeApiKey);
}

export function setRemoteAiConsent(value) {
  runtimeConsent = Boolean(value);
}

export function hasRemoteAiConsent() {
  return runtimeConsent;
}

const normalizeAuthMode = (mode) => {
  if (mode === 'x-api-key' || mode === 'authorization' || mode === 'both') {
    return mode;
  }
  return 'authorization';
};

const authHeaderMode = normalizeAuthMode(AI_CHAT_AUTH_HEADER);

export function isRemoteAiEndpointConfigured() {
  return Boolean(trimmedUrl && AI_CHAT_MODEL);
}

export function isRemoteAiConfigured() {
  return isRemoteAiEndpointConfigured() && hasRuntimeApiKey();
}

export function getRemoteAiDebugInfo() {
  return {
    endpointConfigured: isRemoteAiEndpointConfigured(),
    configured: isRemoteAiConfigured(),
    consent: runtimeConsent,
    url: trimmedUrl || null,
    model: AI_CHAT_MODEL || null,
    apiKeyPresent: hasRuntimeApiKey(),
    authHeaderMode,
  };
}

function buildAuthHeaders() {
  const headers = {};
  if (authHeaderMode === 'x-api-key' || authHeaderMode === 'both') {
    headers['X-API-Key'] = runtimeApiKey;
  }
  if (authHeaderMode === 'authorization' || authHeaderMode === 'both') {
    headers.Authorization = `Bearer ${runtimeApiKey}`;
  }
  return headers;
}

/**
 * Deep-redacts values whose key name looks like a secret/credential, so
 * accidental secrets embedded in uploaded JSON are not forwarded externally.
 * This is a best-effort heuristic, not a guarantee — it does not replace
 * user consent or a server-side proxy for real production use.
 */
export function redactSensitiveValues(value) {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveValues);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : redactSensitiveValues(child)])
    );
  }
  return value;
}

function assertWithinPayloadLimit(jsonText) {
  if (jsonText.length > MAX_PAYLOAD_CHARS) {
    throw new Error(`This dataset is too large to send to remote AI (max ${Math.round(MAX_PAYLOAD_CHARS / 1000)} KB after redaction). Try a smaller sample.`);
  }
}

function requireConsentAndConfig() {
  if (!isRemoteAiConfigured()) {
    throw new Error('Remote AI is not configured. Set an endpoint URL/model and enter an API key.');
  }
  if (!runtimeConsent) {
    throw new Error('Remote AI consent has not been granted for this session.');
  }
}

async function callAiChat(messages) {
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
  requireConsentAndConfig();

  const redacted = redactSensitiveValues(json);
  const jsonText = JSON.stringify(redacted, null, 2);
  assertWithinPayloadLimit(jsonText);

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

/**
 * Requests a short narrative explanation from remote AI, built ONLY from the
 * already-computed deterministic analysis (entities, fields, observations) —
 * not the raw uploaded JSON — to minimize what leaves the browser.
 */
export async function explainAnalysisWithAiRemote(analysis, classification) {
  requireConsentAndConfig();

  const context = {
    domain: classification?.detectedDomain || 'generic',
    summary: analysis?.summary,
    entities: analysis?.entities,
    important_fields: analysis?.important_fields,
    relationships: analysis?.relationships,
    observations: analysis?.observations,
  };

  const contextText = JSON.stringify(context, null, 2);
  assertWithinPayloadLimit(contextText);

  const prompt = `You are an assistant that writes a short, plain-language narrative (3-5 sentences) explaining a dataset to a non-technical business stakeholder, based ONLY on this pre-computed structural analysis (no raw records were shared with you):\n\n${contextText}\n\nRespond with plain text only, no markdown.`;

  const messages = [
    { role: 'system', content: 'You explain dataset analysis results in plain language for business stakeholders.' },
    { role: 'user', content: prompt },
  ];

  const text = await callAiChat(messages);
  return text.trim();
}
