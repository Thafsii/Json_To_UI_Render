export function validateJsonValue(value) {
  if (value === null) {
    return [];
  }

  if (Array.isArray(value)) {
    return [];
  }

  const type = typeof value;
  if (type === 'object' || type === 'string' || type === 'number' || type === 'boolean') {
    return [];
  }

  return ['Parsed value is not a supported JSON type'];
}
