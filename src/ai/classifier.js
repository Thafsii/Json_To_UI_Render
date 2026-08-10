import { normalizeDomain, getDefaultDataModel, getDomainHints, SUPPORTED_DOMAINS } from '../config/domainConfig.js';

export const CLASSIFICATION_CONFIDENCE_THRESHOLD = 0.75;

const normalizeKey = (key) => String(key).toLowerCase().replace(/[-_\s]+/g, '_');

const collectKeySet = (value, accumulator = new Set()) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeySet(item, accumulator));
    return accumulator;
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => {
      accumulator.add(normalizeKey(key));
      collectKeySet(child, accumulator);
    });
  }

  return accumulator;
};

const countHintMatches = (keySet, hints) => hints.reduce((count, hint) => {
  const normalizedHint = normalizeKey(hint);
  return count + (Array.from(keySet).some((key) => key.includes(normalizedHint)) ? 1 : 0);
}, 0);

const buildDomains = () => {
  const hints = getDomainHints();
  return Object.keys(hints).map((domain) => ({
    domain,
    data_model: getDefaultDataModel(domain),
    hints: hints[domain],
  })).filter((entry) => SUPPORTED_DOMAINS.includes(entry.domain));
};

export function classifyJsonWithAi(json) {
  try {
    const keySet = collectKeySet(json);
    const domains = buildDomains();

    const scored = domains.map((entry) => {
      const matches = countHintMatches(keySet, entry.hints);
      const score = entry.hints.length > 0 ? matches / entry.hints.length : 0;
      return { ...entry, matches, score };
    });

    const winner = scored.sort((a, b) => b.score - a.score)[0];
    if (!winner || winner.score <= 0) {
      return {
        domain: 'generic',
        data_model: 'generic',
        confidence: 0.25,
        reason: 'No supported domain signals were discovered in the JSON structure.',
      };
    }

    const confidence = Math.min(0.98, Math.max(0.35, 0.3 + winner.score * 0.75));
    const reason = `Detected domain signals for ${winner.domain} using keys such as ${winner.hints.filter((hint) => Array.from(keySet).some((key) => key.includes(normalizeKey(hint)))).slice(0, 5).join(', ')}.`;

    return {
      domain: normalizeDomain(winner.domain) || 'generic',
      data_model: winner.data_model,
      confidence,
      reason,
    };
  } catch (error) {
    return {
      domain: 'generic',
      data_model: 'generic',
      confidence: 0,
      reason: 'AI classifier failed. Using the generic renderer.',
    };
  }
}
