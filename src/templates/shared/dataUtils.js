export const safeObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
export const safeArray = (value) => (Array.isArray(value) ? value : []);
export const safeNumber = (value) => (typeof value === 'number' && !Number.isNaN(value) ? value : null);
export const safeString = (value) => (typeof value === 'string' ? value : null);

export const getNestedValue = (object, path) => {
  if (!object || typeof object !== 'object' || typeof path !== 'string') {
    return null;
  }
  return path.split('.').reduce((current, segment) => {
    if (current && typeof current === 'object') {
      return current[segment];
    }
    return null;
  }, object);
};

export const getFirstExisting = (object, keys) => {
  if (!object || typeof object !== 'object') {
    return null;
  }
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      return object[key];
    }
  }
  return null;
};

export const findArray = (root, keys) => {
  if (!root || typeof root !== 'object') {
    return [];
  }

  for (const key of keys) {
    if (Array.isArray(root[key])) {
      return root[key];
    }
  }

  const entry = Object.entries(root).find(([, value]) => Array.isArray(value));
  return entry ? entry[1] : [];
};

export const normalizeKey = (key) => String(key || '').toLowerCase().replace(/[-_\s]+/g, '_');
