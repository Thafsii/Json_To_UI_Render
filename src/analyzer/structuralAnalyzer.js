const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const normalizeKey = (key) => String(key).toLowerCase().replace(/[-_\s]+/g, '_');

const collectKeys = (value, currentPath = '', accumulator = new Set()) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectKeys(item, currentPath ? `${currentPath}.${index}` : String(index), accumulator);
    });
    return accumulator;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, child]) => {
      const normalized = normalizeKey(key);
      accumulator.add(normalized);
      collectKeys(child, currentPath ? `${currentPath}.${key}` : key, accumulator);
    });
  }

  return accumulator;
};

const sampleValue = (value) => {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 3).map(sampleValue);
  }

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 5)
      .map(([key, child]) => [key, sampleValue(child)])
  );
};

const isSimpleObject = (value) => {
  return isPlainObject(value) && Object.values(value).every((child) => value === null || ['string', 'number', 'boolean'].includes(typeof child));
};

export function analyzeJsonStructure(value) {
  const summary = {
    root_type: null,
    max_depth: 0,
    object_count: 0,
    array_count: 0,
    field_count: 0,
    primitive_types: {
      string: 0,
      number: 0,
      boolean: 0,
      null: 0,
    },
    arrays: [],
    large_arrays: [],
    repeated_object_collections: [],
    common_keys: [],
    key_counts: {},
  };

  const pathStack = [];

  const walk = (node, depth = 1, path = 'root') => {
    summary.max_depth = Math.max(summary.max_depth, depth);

    if (Array.isArray(node)) {
      summary.array_count += 1;
      summary.arrays.push({ path, length: node.length, sample: sampleValue(node.slice(0, 3)) });
      if (node.length >= 20) {
        summary.large_arrays.push(path);
      }

      if (node.length > 1 && node.every((item) => isPlainObject(item))) {
        summary.repeated_object_collections.push(path);
      }

      node.forEach((item, index) => walk(item, depth + 1, `${path}[${index}]`));
      return;
    }

    if (isPlainObject(node)) {
      summary.object_count += 1;
      const keys = Object.keys(node);
      summary.field_count += keys.length;
      keys.forEach((key) => {
        const normalized = normalizeKey(key);
        summary.key_counts[normalized] = (summary.key_counts[normalized] || 0) + 1;
        walk(node[key], depth + 1, `${path}.${key}`);
      });
      return;
    }

    const type = node === null ? 'null' : typeof node;
    if (summary.primitive_types[type] !== undefined) {
      summary.primitive_types[type] += 1;
    }
  };

  if (value === null) {
    summary.root_type = 'null';
  } else if (Array.isArray(value)) {
    summary.root_type = 'array';
  } else if (isPlainObject(value)) {
    summary.root_type = 'object';
  } else {
    summary.root_type = typeof value;
  }

  walk(value, 1, 'root');

  summary.common_keys = Object.entries(summary.key_counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([key]) => key);

  return summary;
}
