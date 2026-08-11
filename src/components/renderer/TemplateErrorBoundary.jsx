import { Component } from 'react';
import JsonRenderer from './Renderer.jsx';

export default class TemplateErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Template rendering error:', error, info);
  }

  render() {
    const { hasError } = this.state;
    const { data } = this.props;

    if (hasError) {
      return (
        <div className="rounded-3xl border border-rose-500 bg-rose-950/80 p-6 text-sm text-rose-100">
          <p className="font-semibold text-white">This domain template couldn't render this data — showing the raw structure instead.</p>
          <div className="mt-4">
            <JsonRenderer value={data} />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
