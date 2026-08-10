const bulletize = (items) => items.length ? items.map((item) => `- ${item}`).join('\n') : '- No items detected.';

export function generateReadme({ json, classification, analysis, structure }) {
  const lines = [];
  lines.push('# Overview');
  lines.push(analysis?.summary || 'This JSON dataset is described through automatically generated analysis.');
  lines.push('# Domain');
  lines.push(classification ? classification.domain : 'generic');
  lines.push('# Data Structure');

  if (structure) {
    lines.push(`- Root type: ${structure.root_type}`);
    lines.push(`- Max depth: ${structure.max_depth}`);
    lines.push(`- Top-level repeated collections: ${structure.repeated_object_collections.length}`);
    lines.push(`- Large arrays: ${structure.large_arrays.join(', ') || 'none'}`);
  } else {
    lines.push('- Structure analysis is not available.');
  }

  lines.push('# Entities');
  lines.push(bulletize((analysis?.entities || []).map((entity) => `${entity.name} (${entity.count})`)));
  lines.push('# Fields');
  lines.push(bulletize(analysis?.important_fields || []));
  lines.push('# Relationships');
  lines.push(bulletize((analysis?.relationships || []).map((relation) => `${relation.entity}: ${relation.id_fields.join(', ')}`)));
  lines.push('# Statistics');

  if (structure) {
    lines.push(`- Object count: ${structure.object_count}`);
    lines.push(`- Array count: ${structure.array_count}`);
    lines.push(`- Primitive types: ${Object.entries(structure.primitive_types).map(([type, count]) => `${type}: ${count}`).join(', ')}`);
  } else {
    lines.push('- No statistics available.');
  }

  lines.push('# Example Use Cases');
  lines.push(analysis?.observations.length ? bulletize(analysis.observations) : '- Use this dataset for analysis or inspection.');
  lines.push('# JSON Structure');

  if (structure) {
    lines.push(`- Common keys: ${structure.common_keys.slice(0, 12).join(', ') || 'none'}`);
    if (structure.arrays.length) {
      lines.push(`- Detected arrays: ${structure.arrays.map((item) => `${item.path} (${item.length} items)`).join('; ')}`);
    }
  }

  return lines.join('\n\n');
}
