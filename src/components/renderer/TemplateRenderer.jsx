import JsonRenderer from './Renderer.jsx';
import TemplateErrorBoundary from './TemplateErrorBoundary.jsx';
import templateRegistry from '../../templates/registry.js';

export default function TemplateRenderer({ data, structure, classification, ...rest }) {
  if (!data) {
    return null;
  }

  const selectedDomain = classification?.selectedTemplate || classification?.detectedDomain || 'generic';
  const Template = templateRegistry[selectedDomain] || templateRegistry.generic;

  if (Template) {
    return (
      <TemplateErrorBoundary data={data}>
        <Template data={data} classification={classification} structure={structure} {...rest} />
      </TemplateErrorBoundary>
    );
  }

  return <JsonRenderer value={data} />;
}
