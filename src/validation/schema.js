export const MAX_JSON_TEXT_BYTES = 8 * 1024 * 1024; // 8 MB of source text
export const MAX_JSON_DEPTH = 60;

/**
 * Validates the raw uploaded/pasted text before attempting to parse it,
 * so oversized input is rejected with a clear message instead of freezing
 * the tab on JSON.parse or a recursive walk.
 */
export function validateRawJsonText(text) {
  if (text === null || text === undefined) {
    return ['No JSON content was provided.'];
  }

  if (!text.trim()) {
    return ['JSON content is empty.'];
  }

  const byteLength = new TextEncoder().encode(text).length;
  if (byteLength > MAX_JSON_TEXT_BYTES) {
    return [`JSON file is too large. Maximum supported size is ${Math.round(MAX_JSON_TEXT_BYTES / (1024 * 1024))} MB.`];
  }

  return [];
}

/**
 * Iteratively checks nesting depth using an explicit stack (not recursion),
 * so a pathologically deep document can't overflow the call stack while we
 * are still trying to decide whether it's safe to render.
 */
export function exceedsMaxDepth(value, maxDepth = MAX_JSON_DEPTH) {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const stack = [{ node: value, depth: 1 }];

  while (stack.length) {
    const { node, depth } = stack.pop();
    if (depth > maxDepth) {
      return true;
    }

    if (Array.isArray(node)) {
      for (const child of node) {
        if (child && typeof child === 'object') {
          stack.push({ node: child, depth: depth + 1 });
        }
      }
    } else if (node && typeof node === 'object') {
      for (const child of Object.values(node)) {
        if (child && typeof child === 'object') {
          stack.push({ node: child, depth: depth + 1 });
        }
      }
    }
  }

  return false;
}

export function validateJsonValue(value) {
  if (value === null) {
    return [];
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [];
    }
    return exceedsMaxDepth(value) ? [`JSON nesting is too deep to safely render (max ${MAX_JSON_DEPTH} levels).`] : [];
  }

  const type = typeof value;
  if (type === 'object') {
    if (Object.keys(value).length === 0) {
      return [];
    }
    return exceedsMaxDepth(value) ? [`JSON nesting is too deep to safely render (max ${MAX_JSON_DEPTH} levels).`] : [];
  }

  if (type === 'string' || type === 'number' || type === 'boolean') {
    return [];
  }

  return ['Parsed value is not a supported JSON type.'];
}
