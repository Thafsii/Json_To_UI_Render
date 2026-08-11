import { useEffect, useState } from 'react';
import TemplateRenderer from './components/renderer/TemplateRenderer.jsx';
import { validateJsonValue } from './validation/schema.js';
import { analyzeJsonStructure } from './analyzer/structuralAnalyzer.js';
import { resolveDomainRouting } from './utils/domainResolver.js';
import { analyzeJsonWithAi } from './ai/analyzer.js';
import { classifyJsonWithAiRemote, getRemoteAiDebugInfo, isRemoteAiConfigured } from './ai/remoteAi.js';
import { generateReadme } from './ai/readmeGenerator.js';
import { SUPPORTED_DOMAINS, normalizeDomain, getDefaultDataModel, isSupportedDomain } from './config/domainConfig.js';

const initialExample = `{
  "organization": {
    "id": "org-001",
    "name": "Acme Technologies",
    "active": true,
    "address": {
      "city": "Chennai",
      "country": "India"
    }
  },
  "users": [
    {
      "id": "user-001",
      "name": "John",
      "skills": [
        "Python",
        "FastAPI"
      ]
    },
    {
      "id": "user-002",
      "name": "Jane",
      "skills": [
        "React",
        "TypeScript"
      ]
    }
  ],
  "metadata": {
    "version": "1.0",
    "tags": [
      "security",
      "compliance"
    ]
  }
}`;

function App() {
  const [jsonText, setJsonText] = useState(initialExample);
  const [parsedJson, setParsedJson] = useState(null);
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState('');
  const [structure, setStructure] = useState(null);
  const [classification, setClassification] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [readme, setReadme] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [remoteAiError, setRemoteAiError] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const remoteAiDebugInfo = getRemoteAiDebugInfo();

  useEffect(() => {
    handleRender();
  }, []);

  const parseAndAnalyzeJson = (text) => {
    setNotice('');
    setAiAnalysis(null);
    setReadme('');

    try {
      const parsed = JSON.parse(text);
      const validationErrors = validateJsonValue(parsed);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setParsedJson(null);
        setStructure(null);
        setClassification(null);
        return;
      }

      const structureResult = analyzeJsonStructure(parsed);
      const classificationResult = resolveDomainRouting(parsed);

      setErrors([]);
      setParsedJson(parsed);
      setStructure(structureResult);
      setClassification(classificationResult);

      if (!classificationResult) {
        setNotice('Could not determine routing information. Using the generic renderer.');
      } else if (!classificationResult.aiDetection) {
        setNotice(`Domain detected explicitly: ${classificationResult.detectedDomain.replace('_', ' ')}. Template selected: ${classificationResult.selectedTemplate.replace('_', ' ')}. AI detection: Not required.`);
      } else if (classificationResult.fallbackUsed) {
        setNotice('Could not confidently identify a supported domain. Using the generic renderer.');
      } else {
        setNotice(`Detected domain: ${classificationResult.detectedDomain.replace('_', ' ')} • Confidence: ${Math.round(classificationResult.confidence * 100)}%`);
      }

      if (classificationResult?.aiDetection && isRemoteAiConfigured()) {
        fetchRemoteAiClassification(parsed, classificationResult);
      }
    } catch (error) {
      setErrors(['Invalid JSON file. Please upload a valid JSON document.']);
      setParsedJson(null);
      setStructure(null);
      setClassification(null);
      setNotice('Invalid JSON file. Please upload a valid JSON document.');
    }
  };

  const fetchRemoteAiClassification = async (json, localClassification) => {
    setNotice('Fetching remote AI classification...');

    try {
      const remoteResult = await classifyJsonWithAiRemote(json);
      if (!remoteResult) {
        setNotice('Remote AI classification did not return a valid result. Using local classification.');
        return;
      }

      const normalizedRemoteDomain = normalizeDomain(remoteResult.domain);
      const isValidRemoteDomain = normalizedRemoteDomain && isSupportedDomain(normalizedRemoteDomain);

      if (!isValidRemoteDomain) {
        setNotice(`Remote AI returned unsupported domain "${remoteResult.domain}". Using local classification.`);
        return;
      }

      const shouldOverride = remoteResult.confidence >= localClassification.confidence && remoteResult.confidence >= 0.75;
      if (!shouldOverride) {
        setNotice(`Remote AI classification completed. Keeping local domain "${localClassification.detectedDomain}".`);
        return;
      }

      const updatedClassification = {
        ...localClassification,
        domainSource: 'AI Remote',
        detectedDomain: normalizedRemoteDomain,
        selectedTemplate: normalizedRemoteDomain,
        data_model: getDefaultDataModel(normalizedRemoteDomain),
        confidence: remoteResult.confidence,
        reason: remoteResult.reason || `Remote AI classification returned ${normalizedRemoteDomain}`,
        aiDetection: true,
        fallbackUsed: false,
        remote: true,
      };

      setClassification(updatedClassification);
      setNotice(`Remote AI selected "${normalizedRemoteDomain}" (${Math.round(remoteResult.confidence * 100)}%).`);
    } catch (error) {
      const message = error?.message || String(error);
      setRemoteAiError(message);
      setNotice(`Remote AI classification failed: ${message}`);
    }
  };


  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    setNotice('');
    setAiAnalysis(null);
    setReadme('');

    if (!file) {
      setErrors(['No file selected']);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.json')) {
      setErrors(['Unsupported file type. Please upload a .json file.']);
      return;
    }

    const fileText = await file.text();

    setUploadedFile({ name: file.name, size: file.size });

    if (!fileText.trim()) {
      setErrors(['JSON file is empty']);
      return;
    }

    try {
      const json = JSON.parse(fileText);
      const pretty = JSON.stringify(json, null, 2);
      setJsonText(pretty);
      setErrors([]);
      parseAndAnalyzeJson(pretty);
    } catch (error) {
      setErrors(['Invalid JSON file: ' + error.message]);
      setParsedJson(null);
      setStructure(null);
      setClassification(null);
    }
  };

  const handleRender = () => {
    parseAndAnalyzeJson(jsonText);
  };

  const handleLoadExample = () => {
    const pretty = JSON.stringify(JSON.parse(initialExample), null, 2);
    setJsonText(pretty);
    setErrors([]);
    setUploadedFile(null);
    setAiAnalysis(null);
    setReadme('');
    setActiveTab('editor');
    parseAndAnalyzeJson(pretty);
  };

  const handleAnalyze = () => {
    if (!parsedJson) {
      return;
    }
    const analysisResult = analyzeJsonWithAi(parsedJson, classification);
    setAiAnalysis(analysisResult);
    setNotice('AI analysis complete.');
  };

  const handleGenerateReadme = () => {
    if (!parsedJson) {
      return;
    }
    const readmeText = generateReadme({ json: parsedJson, classification, analysis: aiAnalysis, structure });
    setReadme(readmeText);
    setNotice('README generated.');
  };

  const handleDownloadReadme = () => {
    if (!readme) {
      return;
    }
    const blob = new Blob([readme], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'README.md';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes = 0) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const handleResetEditor = () => {
    setJsonText('');
    setParsedJson(null);
    setErrors([]);
    setNotice('Editor reset. Enter valid JSON or load an example.');
    setStructure(null);
    setClassification(null);
    setAiAnalysis(null);
    setReadme('');
    setUploadedFile(null);
  };

  const errorList = errors.length > 0 ? (
    <div className="rounded-2xl border border-rose-500/80 bg-rose-500/10 p-4 text-sm text-rose-100">
      <p className="font-semibold">JSON errors</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {errors.map((error, idx) => (
          <li key={idx}>{error}</li>
        ))}
      </ul>
    </div>
  ) : null;

  const diagnosticPanel = classification ? (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-100">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-white">Routing diagnostics</p>
        <span className={classification.fallbackUsed ? 'text-rose-300' : 'text-emerald-300'}>
          {classification.fallbackUsed ? 'Fallback used' : 'No fallback'}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Domain Source</p>
          <p className="mt-1 text-white">{classification.domainSource}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Detected Domain</p>
          <p className="mt-1 text-white">{classification.detectedDomain}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Selected Template</p>
          <p className="mt-1 text-white">{classification.selectedTemplate}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">AI Detection</p>
          <p className="mt-1 text-white">{classification.aiDetection ? 'Called' : 'Not Required'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Confidence</p>
          <p className="mt-1 text-white">{classification.confidence != null ? `${Math.round(classification.confidence * 100)}%` : 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Reason</p>
          <p className="mt-1 text-slate-300">{classification.reason}</p>
        </div>
      </div>
    </div>
  ) : null;

  const previewContent = parsedJson ? (
    <div className="space-y-5">
      {diagnosticPanel}
      <TemplateRenderer data={parsedJson} structure={structure} classification={classification} />
    </div>
  ) : (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-slate-400">
      <p className="text-sm">Live preview will appear here when your JSON is valid.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/50 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">JSON UI Renderer</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Visualize any JSON data</h1>
          </div>
          <div className="space-x-2">
            <button
              type="button"
              onClick={handleLoadExample}
              className="rounded-full border border-cyan-500/70 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/20"
            >
              Load Example
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">JSON Editor</h2>
                <p className="text-sm text-slate-400">Upload or edit any valid JSON data.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="cursor-pointer rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-400">
                  Upload JSON
                  <input type="file" accept="application/json" hidden onChange={handleFileUpload} />
                </label>
                <button
                  type="button"
                  onClick={handleRender}
                  className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  Render
                </button>
                <button
                  type="button"
                  onClick={handleResetEditor}
                  className="rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-400"
                >
                  Reset Editor
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex gap-2 rounded-full bg-slate-950/80 p-1">
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm ${activeTab === 'editor' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
                  onClick={() => setActiveTab('editor')}
                >
                  Editor
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm ${activeTab === 'raw' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
                  onClick={() => setActiveTab('raw')}
                >
                  Raw JSON
                </button>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-100">
                <p className="font-semibold text-white">Supported domains</p>
                <p className="mt-2 text-slate-400">Set <code className="rounded bg-slate-900 px-1 py-0.5 text-xs">domain</code> or <code className="rounded bg-slate-900 px-1 py-0.5 text-xs">template</code> in your JSON.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUPPORTED_DOMAINS.map((domain) => (
                    <span key={domain} className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
                      {domain}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-slate-400">
                  Example: <span className="font-mono text-slate-100">{`{ "domain": "hrms", "template": "hrms" }`}</span>
                </p>
              </div>
            </div>

            {uploadedFile ? (
              <p className="text-sm text-slate-400">
                Uploaded file: <span className="font-medium text-white">{uploadedFile.name}</span> ({formatBytes(uploadedFile.size)})
              </p>
            ) : null}

            {activeTab === 'editor' ? (
              <textarea
                value={jsonText}
                onChange={(event) => setJsonText(event.target.value)}
                className="min-h-[420px] w-full rounded-3xl border border-slate-800 bg-slate-950/90 p-4 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />
            ) : (
              <pre className="min-h-[420px] overflow-auto rounded-3xl border border-slate-800 bg-slate-950/90 p-4 text-sm text-slate-100">
                {parsedJson ? JSON.stringify(parsedJson, null, 2) : 'Render valid JSON to view raw output.'}
              </pre>
            )}

            {errorList}
          </section>

          <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Live Preview</h2>
                <p className="text-sm text-slate-400">Visualize the parsed JSON data structure.</p>
              </div>
              <div className="rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-100">
                Rendered template: <span className="font-semibold text-white">{classification?.selectedTemplate || 'generic'}</span>
              </div>
            </div>
            {notice ? (
              <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                {notice}
              </div>
            ) : null}
            <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4 text-sm text-slate-100">
              <p className="font-semibold text-white">Remote AI debug</p>
              <p className="mt-2 text-slate-300">Configured: {remoteAiDebugInfo.configured ? 'yes' : 'no'}</p>
              <p className="mt-1 text-slate-300">URL: {remoteAiDebugInfo.url || 'missing'}</p>
              <p className="mt-1 text-slate-300">Model: {remoteAiDebugInfo.model || 'missing'}</p>
              <p className="mt-1 text-slate-300">API key: {remoteAiDebugInfo.apiKeyPresent ? 'present' : 'missing'}</p>
              <p className="mt-1 text-slate-300">Auth mode: {remoteAiDebugInfo.authHeaderMode}</p>
              {remoteAiError ? (
                <div className="mt-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-100">
                  <p className="font-semibold text-white">Remote AI raw error</p>
                  <pre className="mt-2 whitespace-pre-wrap text-slate-200">{remoteAiError}</pre>
                </div>
              ) : null}
            </div>
            {aiAnalysis ? (
              <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4 text-sm text-slate-100">
                <p className="font-semibold text-white">AI Analysis</p>
                <p className="mt-2 text-slate-300">{aiAnalysis.summary}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Entities</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                      {aiAnalysis.entities.length ? aiAnalysis.entities.map((entity, idx) => (
                        <li key={idx}>{entity.name} ({entity.count})</li>
                      )) : <li>None detected</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Important fields</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                      {aiAnalysis.important_fields.length ? aiAnalysis.important_fields.slice(0, 8).map((field, idx) => (
                        <li key={idx}>{field}</li>
                      )) : <li>None detected</li>}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGenerateReadme}
                disabled={!parsedJson || !aiAnalysis}
                className="rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Generate README
              </button>
              <button
                type="button"
                onClick={handleDownloadReadme}
                disabled={!readme}
                className="rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Download README.md
              </button>
            </div>

            {readme ? (
              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Generated README</p>
                <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap text-sm text-slate-200">{readme}</pre>
              </div>
            ) : null}

            {previewContent}
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
