import { classifyJsonWithAi, CLASSIFICATION_CONFIDENCE_THRESHOLD } from '../ai/classifier.js';
import { normalizeDomain, getDefaultDataModel, isSupportedDomain } from '../config/domainConfig.js';

export function resolveDomainRouting(json) {
  const explicitDomain = normalizeDomain(json?.domain);
  const explicitTemplate = normalizeDomain(json?.template);

  if (explicitDomain) {
    return {
      domainSource: 'Explicit JSON',
      detectedDomain: explicitDomain,
      selectedTemplate: explicitDomain,
      data_model: getDefaultDataModel(explicitDomain),
      confidence: 1,
      reason: `Explicit domain provided: ${String(json.domain)}`,
      aiDetection: false,
      fallbackUsed: false,
    };
  }

  if (explicitTemplate) {
    return {
      domainSource: 'Explicit JSON',
      detectedDomain: explicitTemplate,
      selectedTemplate: explicitTemplate,
      data_model: getDefaultDataModel(explicitTemplate),
      confidence: 1,
      reason: `Explicit template provided: ${String(json.template)}`,
      aiDetection: false,
      fallbackUsed: false,
    };
  }

  const aiResult = classifyJsonWithAi(json);
  const normalizedAiDomain = normalizeDomain(aiResult.domain);
  const isValidAiDomain = normalizedAiDomain && isSupportedDomain(normalizedAiDomain);
  const useGeneric = !isValidAiDomain || aiResult.confidence < CLASSIFICATION_CONFIDENCE_THRESHOLD;

  return {
    domainSource: 'AI',
    detectedDomain: useGeneric ? 'generic' : normalizedAiDomain,
    selectedTemplate: useGeneric ? 'generic' : normalizedAiDomain,
    data_model: useGeneric ? 'generic' : getDefaultDataModel(normalizedAiDomain),
    confidence: aiResult.confidence,
    reason: aiResult.reason,
    aiDetection: true,
    fallbackUsed: useGeneric,
  };
}
