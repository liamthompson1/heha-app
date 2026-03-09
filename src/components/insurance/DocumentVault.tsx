"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import DocumentViewer from "./DocumentViewer";

interface StoredDocument {
  id: string;
  name: string;
  type: "pdf" | "image";
  category: string;
  uploaded_at: string;
  size_bytes: number;
  status: "verified" | "pending" | "rejected";
  url: string;
  storage_path: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentVaultProps {
  tripId: string;
}

export default function DocumentVault({ tripId }: DocumentVaultProps) {
  const [docs, setDocs] = useState<StoredDocument[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<StoredDocument | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load documents from API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/documents`);
        if (res.ok) {
          const data = await res.json();
          setDocs(data.documents ?? []);
        }
      } catch {
        // Silent fail
      }
    })();
  }, [tripId]);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/trips/${tripId}/documents`, {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        const { document } = await res.json();
        setDocs((prev) => [...prev, document]);
      }
    } catch {
      // Silent fail
    } finally {
      setUploading(false);
    }
  }, [tripId]);

  const addFiles = useCallback((files: File[]) => {
    files.forEach((f) => uploadFile(f));
  }, [uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const handleDelete = useCallback(async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    setDocs((prev) => prev.filter((d) => d.id !== docId));
    try {
      await fetch(`/api/trips/${tripId}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId }),
      });
    } catch {
      // Reload on failure
      const res = await fetch(`/api/trips/${tripId}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents ?? []);
      }
    }
  }, [tripId]);

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < docs.length) setActiveIndex(idx);
  };

  // Map StoredDocument to DocumentViewer-compatible shape
  const viewerDoc = viewingDoc
    ? {
        id: viewingDoc.id,
        name: viewingDoc.name,
        type: viewingDoc.type,
        category: viewingDoc.category as "policy" | "claim" | "receipt",
        uploaded_at: viewingDoc.uploaded_at,
        size_bytes: viewingDoc.size_bytes,
        status: viewingDoc.status,
        objectUrl: viewingDoc.url,
      }
    : null;

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept=".pdf,.jpg,.jpeg,.png"
      multiple
      style={{ display: "none" }}
      onChange={(e) => {
        if (e.target.files) addFiles(Array.from(e.target.files));
        e.target.value = "";
      }}
    />
  );

  if (docs.length === 0) {
    return (
      <div
        className={`doc-vault-upload ${dragOver ? "doc-vault-upload-active" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {fileInput}
        <span className="doc-vault-upload-icon">{uploading ? "⏳" : "📄"}</span>
        <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>
          {uploading ? "Uploading…" : "Drop files here or tap to upload"}
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginTop: 4 }}>
          PDF, JPG, or PNG — up to 10 MB
        </div>
      </div>
    );
  }

  const current = docs[activeIndex];

  return (
    <div>
      {fileInput}

      {/* Stacked card */}
      <div className="doc-stack-container">
        {/* Background cards for stack effect */}
        {docs.length > 2 && (
          <div className="doc-stack-bg doc-stack-bg-2 glass-panel" />
        )}
        {docs.length > 1 && (
          <div className="doc-stack-bg doc-stack-bg-1 glass-panel" />
        )}

        {/* Active card */}
        <div
          className="doc-stack-card glass-panel"
          onClick={() => setViewingDoc(current)}
        >
          {/* Preview */}
          <div className="doc-stack-preview">
            {current.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.url}
                alt={current.name}
                className="doc-stack-img"
              />
            ) : (
              <div className="doc-stack-placeholder">
                <span style={{ fontSize: "3rem" }}>📑</span>
                <span style={{ fontSize: "0.85rem", marginTop: 8 }}>PDF Document</span>
              </div>
            )}

            {/* Status badge top-left */}
            <span className="doc-stack-badge">
              ✓ {current.status}
            </span>

            {/* Delete top-right */}
            <button
              className="doc-vault-delete"
              onClick={(e) => {
                handleDelete(e, current.id);
                if (activeIndex >= docs.length - 1 && activeIndex > 0) {
                  setActiveIndex(activeIndex - 1);
                }
              }}
              aria-label={`Delete ${current.name}`}
            >
              ✕
            </button>
          </div>

          {/* Info */}
          <div className="doc-stack-info">
            <div className="doc-stack-name">{current.name}</div>
            <div className="doc-stack-meta">{formatSize(current.size_bytes)}</div>
            <button
              className="doc-stack-arrow"
              onClick={(e) => {
                e.stopPropagation();
                setViewingDoc(current);
              }}
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Navigation: dots + add button */}
      <div className="doc-stack-nav">
        <div className="doc-vault-dots">
          {docs.map((_, i) => (
            <button
              key={i}
              className={`doc-vault-dot ${i === activeIndex ? "doc-vault-dot-active" : ""}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
        <button
          className="doc-stack-add-btn"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "⏳" : "+"} {uploading ? "Uploading…" : "Add document"}
        </button>
      </div>

      {/* Swipe hint */}
      {docs.length > 1 && (
        <div className="doc-stack-swipe">
          <button
            className="doc-stack-swipe-btn"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
          >
            ‹
          </button>
          <span style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
            {activeIndex + 1} of {docs.length}
          </span>
          <button
            className="doc-stack-swipe-btn"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex === docs.length - 1}
          >
            ›
          </button>
        </div>
      )}

      {viewerDoc && (
        <DocumentViewer doc={viewerDoc} onClose={() => setViewingDoc(null)} />
      )}
    </div>
  );
}
