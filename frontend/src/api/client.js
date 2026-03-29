const API_BASE = '/api';

// ── Auth helpers ──

function getAuthHeaders() {
  const token = localStorage.getItem('bcn_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function registerUser(email, name, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Registration failed');
  }
  return res.json();
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Login failed');
  }
  return res.json();
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

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

// ── Chat Sessions API ──

export async function listChatSessions() {
  const res = await fetch(`${API_BASE}/sessions`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function createChatSession(name = 'New Session', fileSessionId = null) {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, file_session_id: fileSessionId }),
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
}

export async function getChatSession(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
  if (!res.ok) throw new Error('Failed to fetch session');
  return res.json();
}

export async function renameChatSession(sessionId, name) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to rename session');
  return res.json();
}

export async function deleteChatSession(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete session');
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

export function streamChat(sessionId, query, onThought, onCode, onAnswer, onError, onDone, onRelationships, chatSessionId = null) {
  const controller = new AbortController();
  let doneEmitted = false;

  const payload = { session_id: sessionId, query };
  if (chatSessionId) payload.chat_session_id = chatSessionId;

  fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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
