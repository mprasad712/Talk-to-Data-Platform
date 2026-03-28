import React, { useState, useEffect, useCallback } from 'react';
import { getLLMProviders, configureLLMProvider, activateLLMProvider, deleteLLMProvider, testLLMProvider } from '../api/client';
import { useToast } from './Toast';

const PROVIDER_META = {
  groq:   { color: '#f55036', label: 'GQ', name: 'Groq',            placeholder: 'gsk_...' },
  openai: { color: '#10a37f', label: 'AI', name: 'OpenAI',          placeholder: 'sk-...' },
  gemini: { color: '#4285f4', label: 'Gm', name: 'Google Gemini',   placeholder: 'AIza...' },
  claude: { color: '#d97706', label: 'Cl', name: 'Anthropic Claude', placeholder: 'sk-ant-...' },
  azure:  { color: '#0078d4', label: 'Az', name: 'Azure OpenAI',    placeholder: 'your-azure-key' },
};

const EMPTY_FORM = {
  provider: '',
  apiKey: '',
  model: '',
  azureEndpoint: '',
  azureApiVersion: '2024-06-01',
};

export default function LLMSettings() {
  const [configured, setConfigured] = useState([]);   // saved providers from backend
  const [active, setActive] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchProviders = useCallback(async () => {
    try {
      const data = await getLLMProviders();
      setConfigured(data.providers.filter(p => p.configured));
      setActive(data.active);
    } catch (e) {
      console.error('Failed to load providers:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const isAzure = form.provider === 'azure';

  const validate = () => {
    const errs = {};
    if (!form.provider) errs.provider = 'Select a provider';
    if (!form.apiKey.trim()) errs.apiKey = 'API key is required';
    if (!form.model.trim()) errs.model = 'Model ID is required';
    if (isAzure && !form.azureEndpoint.trim()) errs.azureEndpoint = 'Azure endpoint is required';
    if (isAzure && !form.azureApiVersion.trim()) errs.azureApiVersion = 'API version is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const extra = isAzure ? {
        AZURE_OPENAI_ENDPOINT: form.azureEndpoint,
        AZURE_OPENAI_API_VERSION: form.azureApiVersion,
      } : {};
      const data = await configureLLMProvider(form.provider, form.apiKey, form.model, extra);
      setConfigured(data.providers.filter(p => p.configured));
      setActive(data.active);
      addToast(`${data.active.name} — ${data.active.model} saved & activated`);
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      setErrors({});
    } catch (e) {
      addToast('Failed to save. Check backend is running.', 'info');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!form.provider || !form.apiKey) {
      addToast('Fill provider & API key first', 'info');
      return;
    }
    setTesting(form.provider);
    try {
      const extra = isAzure ? {
        AZURE_OPENAI_ENDPOINT: form.azureEndpoint,
        AZURE_OPENAI_API_VERSION: form.azureApiVersion,
      } : {};
      const data = await testLLMProvider(form.provider, form.apiKey, form.model || 'test', extra);
      if (data.status === 'ok') addToast('Connection successful!');
      else addToast(data.message || 'Connection failed', 'info');
    } catch (e) {
      addToast('Test failed — check backend', 'info');
    } finally {
      setTesting(null);
    }
  };

  const handleActivate = async (pid) => {
    try {
      const data = await activateLLMProvider(pid);
      setConfigured(data.providers.filter(p => p.configured));
      setActive(data.active);
      addToast(`Switched to ${data.active.name}`);
    } catch (e) {
      addToast('Failed to switch', 'info');
    }
  };

  const handleDelete = async (pid) => {
    try {
      const data = await deleteLLMProvider(pid);
      setConfigured(data.providers.filter(p => p.configured));
      setActive(data.active);
      addToast('Provider removed');
    } catch (e) {
      addToast('Failed to remove', 'info');
    }
  };

  const handleEditExisting = (p) => {
    setForm({
      provider: p.id,
      apiKey: '',
      model: p.model,
      azureEndpoint: p.extra?.AZURE_OPENAI_ENDPOINT || '',
      azureApiVersion: p.extra?.AZURE_OPENAI_API_VERSION || '2024-06-01',
    });
    setShowForm(true);
    setErrors({});
  };

  const meta = form.provider ? PROVIDER_META[form.provider] : null;

  return (
    <div className="space-y-3">

      {/* ── Currently active ── */}
      {active && (
        <div className="rounded-xl p-3" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full" style={{ background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--green)' }}>Active Model</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-black text-white"
              style={{ background: PROVIDER_META[active.provider]?.color || 'var(--red)' }}
            >
              {PROVIDER_META[active.provider]?.label || '??'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{active.name}</p>
              <p className="font-mono text-[10px] truncate" style={{ color: 'var(--text-faint)' }}>{active.model}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Configured providers list ── */}
      {configured.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
            Configured ({configured.length})
          </p>
          <div className="space-y-1.5">
            {configured.map((p) => {
              const m = PROVIDER_META[p.id] || { color: '#666', label: '??', name: p.name };
              const isActive = active?.provider === p.id;
              return (
                <div
                  key={p.id}
                  className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                  style={{
                    border: `1px solid ${isActive ? m.color + '40' : 'var(--border-color)'}`,
                    background: isActive ? `${m.color}08` : 'var(--bg-raised)',
                  }}
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-black text-white"
                    style={{ background: m.color }}
                  >
                    {m.label}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{p.name}</p>
                      {isActive && <div className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--green)' }} />}
                    </div>
                    <p className="font-mono text-[9px] truncate" style={{ color: 'var(--text-faint)' }}>{p.model}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isActive && (
                      <button
                        onClick={() => handleActivate(p.id)}
                        className="rounded-md px-2 py-1 text-[9px] font-bold transition-all hover:scale-105"
                        style={{ background: `${m.color}20`, color: m.color }}
                      >
                        Use
                      </button>
                    )}
                    <button
                      onClick={() => handleEditExisting(p)}
                      className="rounded-md px-1.5 py-1 transition-all hover:scale-105"
                      style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}
                      title="Edit"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="rounded-md px-1.5 py-1 transition-all hover:scale-105"
                      style={{ color: 'var(--red)' }}
                      title="Remove"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Add New LLM button ── */}
      {!showForm && (
        <button
          onClick={() => { setShowForm(true); setForm({ ...EMPTY_FORM }); setErrors({}); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[11px] font-bold transition-all hover:scale-[1.01]"
          style={{
            background: 'var(--red)',
            color: '#fff',
            boxShadow: '0 0 20px rgba(220,38,38,0.25)',
          }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New LLM
        </button>
      )}

      {/* ── ADD / EDIT FORM ── */}
      {showForm && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-raised)' }}>
          {/* Form header */}
          <div className="flex items-center justify-between px-3.5 py-2.5" style={{ borderBottom: '1px solid var(--border-color)', background: meta ? `${meta.color}10` : 'var(--bg-surface)' }}>
            <div className="flex items-center gap-2">
              {meta && (
                <div className="flex h-6 w-6 items-center justify-center rounded-md text-[8px] font-black text-white" style={{ background: meta.color }}>
                  {meta.label}
                </div>
              )}
              <span className="text-[12px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                {form.provider ? `Configure ${meta?.name || form.provider}` : 'Add New LLM'}
              </span>
            </div>
            <button
              onClick={() => { setShowForm(false); setErrors({}); }}
              className="flex h-5 w-5 items-center justify-center rounded-md transition-all hover:scale-110"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-3.5 space-y-3">
            {/* Provider dropdown */}
            <FormField label="Provider" error={errors.provider} required>
              <select
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="w-full rounded-lg px-3 py-2.5 text-[11px] font-medium focus:outline-none"
                style={{ background: 'var(--bg-base)', color: form.provider ? 'var(--text-primary)' : 'var(--text-faint)', border: `1px solid ${errors.provider ? 'var(--red)' : 'var(--border-color)'}` }}
              >
                <option value="">Select a provider...</option>
                <option value="groq">Groq (Llama, Mixtral)</option>
                <option value="openai">OpenAI (GPT-4o, o1)</option>
                <option value="gemini">Google Gemini</option>
                <option value="claude">Anthropic Claude</option>
                <option value="azure">Azure OpenAI (Foundry)</option>
              </select>
            </FormField>

            {/* API Key */}
            <FormField label="API Key" error={errors.apiKey} required>
              <input
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                placeholder={meta?.placeholder || 'Enter your API key...'}
                className="w-full rounded-lg px-3 py-2.5 font-mono text-[11px] focus:outline-none"
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', border: `1px solid ${errors.apiKey ? 'var(--red)' : 'var(--border-color)'}` }}
              />
            </FormField>

            {/* Model ID */}
            <FormField label="Model ID" error={errors.model} required hint="Type the exact model name from the provider's docs">
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder={
                  form.provider === 'groq' ? 'e.g. llama-3.3-70b-versatile' :
                  form.provider === 'openai' ? 'e.g. gpt-4o' :
                  form.provider === 'gemini' ? 'e.g. gemini-2.0-flash' :
                  form.provider === 'claude' ? 'e.g. claude-sonnet-4-20250514' :
                  form.provider === 'azure' ? 'e.g. gpt-4o (deployment name)' :
                  'e.g. gpt-4o, llama-3.3-70b-versatile'
                }
                className="w-full rounded-lg px-3 py-2.5 font-mono text-[11px] focus:outline-none"
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', border: `1px solid ${errors.model ? 'var(--red)' : 'var(--border-color)'}` }}
              />
            </FormField>

            {/* Azure-specific fields */}
            {isAzure && (
              <>
                <FormField label="Azure Endpoint" error={errors.azureEndpoint} required hint="Your Azure OpenAI resource URL">
                  <input
                    type="text"
                    value={form.azureEndpoint}
                    onChange={(e) => setForm({ ...form, azureEndpoint: e.target.value })}
                    placeholder="https://your-resource.openai.azure.com/"
                    className="w-full rounded-lg px-3 py-2.5 font-mono text-[11px] focus:outline-none"
                    style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', border: `1px solid ${errors.azureEndpoint ? 'var(--red)' : 'var(--border-color)'}` }}
                  />
                </FormField>

                <FormField label="API Version" error={errors.azureApiVersion} required>
                  <input
                    type="text"
                    value={form.azureApiVersion}
                    onChange={(e) => setForm({ ...form, azureApiVersion: e.target.value })}
                    placeholder="2024-06-01"
                    className="w-full rounded-lg px-3 py-2.5 font-mono text-[11px] focus:outline-none"
                    style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', border: `1px solid ${errors.azureApiVersion ? 'var(--red)' : 'var(--border-color)'}` }}
                  />
                </FormField>
              </>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-[11px] font-bold text-white transition-all hover:scale-[1.01] disabled:opacity-60"
                style={{ background: meta?.color || 'var(--red)', boxShadow: `0 0 14px ${meta?.color || 'var(--red)'}40` }}
              >
                {saving ? (
                  <>
                    <svg className="h-3.5 w-3.5" style={{ animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Save & Activate
                  </>
                )}
              </button>
              <button
                onClick={handleTest}
                disabled={!!testing}
                className="rounded-lg px-3.5 py-2.5 text-[11px] font-semibold transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
              >
                {testing ? 'Testing...' : 'Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hint ── */}
      <div className="rounded-lg px-3 py-2.5" style={{ background: 'var(--blue-tint)' }}>
        <div className="flex items-start gap-2">
          <svg className="mt-0.5 h-3 w-3 shrink-0" style={{ color: 'var(--blue)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <div className="text-[10px] leading-relaxed" style={{ color: 'var(--blue)' }}>
            <p>Keys are stored in the backend <code className="font-mono font-bold">.env</code> file. Adding a model from the same provider overwrites the previous one.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


function FormField({ label, error, required, hint, children }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: error ? 'var(--red)' : 'var(--text-faint)' }}>
          {label}
        </label>
        {required && <span className="text-[9px] font-bold" style={{ color: 'var(--red)' }}>*</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-[9px] font-medium" style={{ color: 'var(--red)' }}>{error}</p>}
      {hint && !error && <p className="mt-1 text-[9px]" style={{ color: 'var(--text-ghost)' }}>{hint}</p>}
    </div>
  );
}
