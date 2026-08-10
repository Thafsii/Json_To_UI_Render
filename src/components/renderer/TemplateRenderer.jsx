import JsonRenderer from './Renderer.jsx';
import templateRegistry from '../../templates/registry.js';

export default function TemplateRenderer({ data, structure, classification }) {
  if (!data) {
    return null;
  }

  const selectedDomain = classification?.selectedTemplate || classification?.detectedDomain || 'generic';
  const Template = templateRegistry[selectedDomain] || templateRegistry.generic;

  if (Template) {
    return <Template data={data} classification={classification} structure={structure} />;
  }

  return <JsonRenderer value={data} />;
}
