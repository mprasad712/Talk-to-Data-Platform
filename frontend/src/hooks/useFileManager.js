import { useState, useCallback } from 'react';
import { uploadFiles as apiUpload, deleteDataset, getDatasets } from '../api/client';

export function useFileManager() {
  const [sessionId, setSessionId] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [cleaningReports, setCleaningReports] = useState({});
  const [relationships, setRelationships] = useState([]);

  const upload = useCallback(async (fileList) => {
    setUploading(true);
    setError(null);
    try {
      const result = await apiUpload(fileList, sessionId);
      setSessionId(result.session_id);
      setFiles((prev) => {
        const existing = new Map(prev.map((f) => [f.filename, f]));
        for (const f of result.files) {
          existing.set(f.filename, f);
        }
        return Array.from(existing.values());
      });
      // Store cleaning reports
      const reports = {};
      for (const f of result.files) {
        if (f.cleaning_report) {
          reports[f.filename] = f.cleaning_report;
        }
      }
      setCleaningReports((prev) => ({ ...prev, ...reports }));
      return result;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setUploading(false);
    }
  }, [sessionId]);

  const addFile = useCallback((fileInfo) => {
    setFiles((prev) => {
      const existing = new Map(prev.map((f) => [f.filename, f]));
      existing.set(fileInfo.filename, fileInfo);
      return Array.from(existing.values());
    });
    if (fileInfo.cleaning_report) {
      setCleaningReports((prev) => ({ ...prev, [fileInfo.filename]: fileInfo.cleaning_report }));
    }
  }, []);

  const restoreSession = useCallback(async (fileSessionId) => {
    if (!fileSessionId) return;
    try {
      const data = await getDatasets(fileSessionId);
      setSessionId(data.session_id);
      setFiles(data.files || []);
      setRelationships(data.relationships || []);
      const reports = {};
      for (const f of data.files || []) {
        if (f.cleaning_report) reports[f.filename] = f.cleaning_report;
      }
      setCleaningReports(reports);
    } catch (e) {
      console.error('Failed to restore file session:', e);
    }
  }, []);

  const clearFiles = useCallback(() => {
    setSessionId(null);
    setFiles([]);
    setCleaningReports({});
    setRelationships([]);
    setError(null);
  }, []);

  const removeFile = useCallback(async (filename) => {
    if (!sessionId) return;
    try {
      await deleteDataset(sessionId, filename);
      setFiles((prev) => prev.filter((f) => f.filename !== filename));
      setCleaningReports((prev) => {
        const next = { ...prev };
        delete next[filename];
        return next;
      });
    } catch (e) {
      setError(e.message);
    }
  }, [sessionId]);

  return {
    sessionId,
    files,
    uploading,
    error,
    upload,
    addFile,
    removeFile,
    clearFiles,
    restoreSession,
    cleaningReports,
    relationships,
    setRelationships,
  };
}
