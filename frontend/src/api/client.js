const API_BASE = '/api';

// ── LLM Provider API ──

export async function getLLMProviders() {
  const res = await fetch(`${API_BASE}/llm/providers`);
  if (!res.ok) throw new Error('Failed to fetch LLM providers');
  return res.json();
}

export async function configureLLMProvider(provider, apiKey, model, extra = {}) {
  const res = await fetch(`${API_BASE}/llm/configure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, api_key: apiKey, model, extra }),
  });
  if (!res.ok) throw new Error('Failed to configure provider');
  return res.json();
}

export async function activateLLMProvider(provider) {
  const res = await fetch(`${API_BASE}/llm/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider }),
  });
  if (!res.ok) throw new Error('Failed to activate provider');
  return res.json();
}

export async function deleteLLMProvider(providerId) {
  const res = await fetch(`${API_BASE}/llm/providers/${providerId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete provider');
  return res.json();
}

export async function testLLMProvider(provider, apiKey, model, extra = {}) {
  const res = await fetch(`${API_BASE}/llm/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, api_key: apiKey, model, extra }),
  });
  if (!res.ok) throw new Error('Failed to test provider');
  return res.json();
}

// ── Data Operations API ──

export async function getSessionColumns(sessionId) {
  const res = await fetch(`${API_BASE}/data/columns/${sessionId}`);
  if (!res.ok) throw new Error('Failed to fetch columns');
  return res.json();
}

export async function previewOperation(sessionId, operation, params) {
  const res = await fetch(`${API_BASE}/data/operations/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, operation, params }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Operation failed');
  }
  return res.json();
}

export async function saveOperationResult(sessionId, operation, params, name) {
  const res = await fetch(`${API_BASE}/data/operations/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, operation, params, name }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Save failed');
  }
  return res.json();
}

export async function uploadFiles(files, sessionId = null) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  if (sessionId) {
    formData.append('session_id', sessionId);
  }

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function getDatasets(sessionId) {
  const res = await fetch(`${API_BASE}/datasets/${sessionId}`);
  if (!res.ok) throw new Error('Failed to fetch datasets');
  return res.json();
}

export async function deleteDataset(sessionId, filename) {
  const res = await fetch(`${API_BASE}/datasets/${sessionId}/${filename}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete dataset');
  return res.json();
}

function parseSSEEvents(text) {
  const events = [];
  // Split by double newline to get individual events
  const blocks = text.split(/\r?\n\r?\n/);
  for (const block of blocks) {
    if (!block.trim()) continue;
    const lines = block.split(/\r?\n/);
    let eventType = 'message';
    let dataLines = [];

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      } else if (line.startsWith(':')) {
        // SSE comment, ignore
      }
    }

    if (dataLines.length > 0) {
      events.push({ event: eventType, data: dataLines.join('\n') });
    }
  }
  return events;
}

export function streamChat(sessionId, query, onThought, onCode, onAnswer, onError, onDone, onRelationships) {
  const controller = new AbortController();
  let doneEmitted = false;

  fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, query }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text();
        onError({ message: 'Server error: ' + (text || response.statusText) });
        onDone();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Try to extract complete events (separated by double newline)
        const lastDoubleNewline = buffer.lastIndexOf('\n\n');
        if (lastDoubleNewline === -1) continue;

        const complete = buffer.substring(0, lastDoubleNewline + 2);
        buffer = buffer.substring(lastDoubleNewline + 2);

        const events = parseSSEEvents(complete);
        for (const evt of events) {
          try {
            const data = JSON.parse(evt.data);
            switch (evt.event) {
              case 'thought':
                onThought(data);
                break;
              case 'code':
                onCode(data);
                break;
              case 'answer':
                onAnswer(data);
                break;
              case 'relationships':
                if (onRelationships) onRelationships(data);
                break;
              case 'error':
                onError(data);
                break;
              case 'done':
                doneEmitted = true;
                onDone();
                break;
            }
          } catch (e) {
            console.warn('Failed to parse SSE data:', evt.data, e);
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        const events = parseSSEEvents(buffer);
        for (const evt of events) {
          try {
            const data = JSON.parse(evt.data);
            switch (evt.event) {
              case 'thought': onThought(data); break;
              case 'code': onCode(data); break;
              case 'answer': onAnswer(data); break;
              case 'relationships': if (onRelationships) onRelationships(data); break;
              case 'error': onError(data); break;
              case 'done': doneEmitted = true; onDone(); break;
            }
          } catch (e) {
            console.warn('Failed to parse remaining SSE data:', evt.data);
          }
        }
      }

      if (!doneEmitted) {
        onDone();
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError({ message: err.message });
        if (!doneEmitted) onDone();
      }
    });

  return controller;
}
