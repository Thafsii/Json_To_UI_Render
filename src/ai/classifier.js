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

// Combines the match ratio (how much of the domain's hint vocabulary showed up)
// with the absolute match count (how many distinct signals fired), so a domain
// with a long hint list isn't unfairly penalized just for having more hints to
// match against — 6 matches out of 11 hints is stronger evidence than the raw
// 0.55 ratio alone suggests, since ratio-only scoring rewards short hint lists.
const ABSOLUTE_MATCH_CAP = 4;
const buildAdjustedScore = (score, matches) => (score + Math.min(matches / ABSOLUTE_MATCH_CAP, 1)) / 2;

export function classifyJsonWithAi(json) {
  try {
    const keySet = collectKeySet(json);
    const domains = buildDomains();

    const scored = domains.map((entry) => {
      const matches = countHintMatches(keySet, entry.hints);
      const score = entry.hints.length > 0 ? matches / entry.hints.length : 0;
      const adjustedScore = buildAdjustedScore(score, matches);
      return { ...entry, matches, score, adjustedScore };
    });

    const winner = scored.sort((a, b) => b.adjustedScore - a.adjustedScore)[0];
    if (!winner || winner.matches <= 0) {
      return {
        domain: 'generic',
        data_model: 'generic',
        confidence: 0.25,
        reason: 'No supported domain signals were discovered in the JSON structure.',
      };
    }

    const confidence = Math.min(0.98, Math.max(0.3, 0.3 + winner.adjustedScore * 0.75));
    const reason = `Detected domain signals for ${winner.domain} using keys such as ${winner.hints.filter((hint) => Array.from(keySet).some((key) => key.includes(normalizeKey(hint)))).slice(0, 5).join(', ')} (${winner.matches} signal${winner.matches === 1 ? '' : 's'} matched).`;

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
