"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import DocumentViewer from "./DocumentViewer";
import PdfThumbnail from "./PdfThumbnail";

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

  // Swipe state (pointer events for touch + mouse)
  const dragging = useRef(false);
  const startX = useRef(0);
  const [dragDelta, setDragDelta] = useState(0);
  const didDrag = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/documents`);
        if (res.ok) {
          const data = await res.json();
          setDocs(data.documents ?? []);
        }
      } catch { /* silent */ }
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
    } catch { /* silent */ } finally {
      setUploading(false);
    }
  }, [tripId]);

  const addFiles = useCallback((files: File[]) => {
    files.forEach((f) => uploadFile(f));
  }, [uploadFile]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const handleDelete = useCallback(async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    const wasLast = activeIndex >= docs.length - 1 && activeIndex > 0;
    setDocs((prev) => prev.filter((d) => d.id !== docId));
    if (wasLast) setActiveIndex((i) => i - 1);
    try {
      await fetch(`/api/trips/${tripId}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId }),
      });
    } catch {
      const res = await fetch(`/api/trips/${tripId}/documents`);
      if (res.ok) setDocs((await res.json()).documents ?? []);
    }
  }, [tripId, activeIndex, docs.length]);

  const goTo = useCallback((idx: number) => {
    if (idx >= 0 && idx < docs.length) setActiveIndex(idx);
  }, [docs.length]);

  // Pointer handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    didDrag.current = false;
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 5) didDrag.current = true;
    // Resist at edges
    const atEdge = (delta > 0 && activeIndex === 0) || (delta < 0 && activeIndex === docs.length - 1);
    setDragDelta(atEdge ? delta * 0.2 : delta);
  }, [activeIndex, docs.length]);

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    const threshold = 50;
    if (dragDelta < -threshold && activeIndex < docs.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else if (dragDelta > threshold && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
    setDragDelta(0);
  }, [dragDelta, activeIndex, docs.length]);

  const viewerDoc = viewingDoc ? {
    id: viewingDoc.id,
    name: viewingDoc.name,
    type: viewingDoc.type,
    category: viewingDoc.category as "policy" | "claim" | "receipt",
    uploaded_at: viewingDoc.uploaded_at,
    size_bytes: viewingDoc.size_bytes,
    status: viewingDoc.status,
    objectUrl: viewingDoc.url,
  } : null;

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
        onDrop={handleFileDrop}
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
  const behindCount = Math.min(docs.length - 1, 2); // max 2 behind cards

  return (
    <div>
      {fileInput}

      <div
        className="doc-stack-wrap"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: "pan-y" }}
      >
        {/* Behind cards — just empty styled shells for the peek effect */}
        {behindCount >= 2 && (
          <div
            className="doc-stack-behind glass-panel"
            style={{
              transform: "translateY(-6px) scale(0.92)",
              opacity: 0.3,
            }}
          />
        )}
        {behindCount >= 1 && (
          <div
            className="doc-stack-behind glass-panel"
            style={{
              transform: "translateY(-3px) scale(0.96)",
              opacity: 0.5,
            }}
          />
        )}

        {/* Active card */}
        <div
          className="doc-stack-card glass-panel"
          style={{
            transform: dragDelta
              ? `translateX(${dragDelta}px) rotate(${dragDelta * 0.015}deg)`
              : undefined,
            transition: dragDelta ? "none" : "transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
          onClick={() => {
            if (!didDrag.current) setViewingDoc(current);
          }}
        >
          <div className="doc-stack-preview">
            {current.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.url} alt={current.name} className="doc-stack-img" />
            ) : (
              <PdfThumbnail url={current.url} alt={current.name} />
            )}

            <span className="doc-stack-badge">✓ {current.status}</span>

            <button
              className="doc-vault-delete"
              onClick={(e) => handleDelete(e, current.id)}
              aria-label={`Delete ${current.name}`}
            >
              ✕
            </button>
          </div>

          <div className="doc-stack-info">
            <div className="doc-stack-name">{current.name}</div>
            <div className="doc-stack-meta">{formatSize(current.size_bytes)}</div>
            <button
              className="doc-stack-arrow"
              onClick={(e) => { e.stopPropagation(); setViewingDoc(current); }}
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Dots + add */}
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
          {uploading ? "⏳ Uploading…" : "+ Add document"}
        </button>
      </div>

      {viewerDoc && (
        <DocumentViewer doc={viewerDoc} onClose={() => setViewingDoc(null)} />
      )}
    </div>
  );
}
