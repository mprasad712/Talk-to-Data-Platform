const API_BASE = '/api';

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

export function streamChat(sessionId, query, onThought, onCode, onAnswer, onError, onDone) {
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
