const normalizeKey = (key) => String(key).toLowerCase().replace(/[-_\s]+/g, '_');

const getObjectKeys = (object) => (object && typeof object === 'object' && !Array.isArray(object) ? Object.keys(object) : []);

const firstArrayObjects = (json) => {
  if (!json || typeof json !== 'object') {
    return [];
  }

  return Object.entries(json)
    .filter(([_, value]) => Array.isArray(value) && value.length > 0 && value.every((item) => item && typeof item === 'object' && !Array.isArray(item)))
    .map(([key, value]) => ({ key, length: value.length, sample: value[0], fields: getObjectKeys(value[0]) }));
};

const findIdRelationships = (arrayInfo) => {
  const relationships = [];

  arrayInfo.forEach((entry) => {
    const idKeys = entry.fields.filter((field) => /(id|uuid|code)$/i.test(field));
    if (idKeys.length) {
      relationships.push({ entity: entry.key, id_fields: idKeys });
    }
  });

  return relationships;
};

const buildEntities = (arrayInfo) => arrayInfo.map((entry) => ({
  name: entry.key,
  count: entry.length,
  sample_fields: entry.fields.slice(0, 5),
}));

const buildImportantFields = (arrayInfo) => {
  const fields = new Set();
  arrayInfo.forEach((entry) => {
    entry.fields.slice(0, 6).forEach((field) => fields.add(normalizeKey(field)));
  });
  return Array.from(fields).slice(0, 12);
};

export function analyzeJsonWithAi(json, classification) {
  const arrayInfo = firstArrayObjects(json);
  const entities = buildEntities(arrayInfo);
  const relationships = findIdRelationships(arrayInfo);
  const important_fields = buildImportantFields(arrayInfo);
  const observations = [];

  if (classification && classification.domain !== 'generic') {
    observations.push(`This dataset looks like ${classification.domain.replace('_', ' ')} content.`);
  }

  if (entities.length) {
    observations.push(`There are ${entities.length} repeated object collections, including ${entities.map((item) => item.name).join(', ')}.`);
  }

  if (relationships.length) {
    observations.push(`Some entities include identifier fields such as ${relationships.map((item) => `${item.id_fields.join(', ')} in ${item.entity}`).join('; ')}.`);
  }

  if (!entities.length && !important_fields.length) {
    observations.push('The JSON contains nested data without clearly repeated object collections.');
  }

  const summaryParts = [];
  if (classification) {
    summaryParts.push(`This JSON was classified as ${classification.domain.replace('_', ' ')} with ${Math.round(classification.confidence * 100)}% confidence.`);
  }
  summaryParts.push(`Top-level keys include ${Object.keys(json).slice(0, 8).join(', ')}${Object.keys(json).length > 8 ? ', ...' : ''}.`);
  if (entities.length) {
    summaryParts.push(`It contains ${entities.length} main collections such as ${entities.map((item) => item.name).join(', ')}.`);
  }

  return {
    summary: summaryParts.join(' '),
    domain: classification?.domain || 'generic',
    entities,
    relationships,
    important_fields,
    observations,
  };
}
