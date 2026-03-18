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

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  verified: { bg: "rgba(46, 205, 193, 0.12)", color: "var(--teal)", label: "Verified" },
  pending: { bg: "rgba(240, 180, 41, 0.12)", color: "var(--gold)", label: "Pending" },
  rejected: { bg: "rgba(255, 99, 89, 0.12)", color: "var(--coral)", label: "Rejected" },
};

interface DocumentVaultProps {
  tripId: string;
}

export default function DocumentVault({ tripId }: DocumentVaultProps) {
  const [docs, setDocs] = useState<StoredDocument[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<StoredDocument | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Swipe state
  const dragging = useRef(false);
  const startX = useRef(0);
  const [offsetX, setOffsetX] = useState(0);
  const didDrag = useRef(false);
  const [flyOff, setFlyOff] = useState<number | null>(null); // direction: -1 left, 1 right

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
    const idx = docs.findIndex((d) => d.id === docId);
    setDocs((prev) => prev.filter((d) => d.id !== docId));
    if (currentIdx >= docs.length - 1 && currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
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
  }, [tripId, docs, currentIdx]);

  // Pointer handlers for swipe
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (flyOff !== null) return;
    dragging.current = true;
    didDrag.current = false;
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [flyOff]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 5) didDrag.current = true;
    setOffsetX(dx);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;

    const threshold = 60;
    if (Math.abs(offsetX) > threshold && docs.length > 1) {
      const dir = offsetX > 0 ? 1 : -1;
      setFlyOff(dir);
      setOffsetX(0);

      setTimeout(() => {
        setCurrentIdx((prev) => {
          if (dir < 0) return (prev + 1) % docs.length;
          return (prev - 1 + docs.length) % docs.length;
        });
        setFlyOff(null);
      }, 250);
    } else {
      setOffsetX(0);
    }
  }, [offsetX, docs.length]);

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

  const doc = docs[currentIdx];
  if (!doc) return null;
  const status = STATUS_STYLE[doc.status] ?? STATUS_STYLE.pending;

  // Card transform
  let cardTransform = "translate(0, 0) rotate(0deg)";
  let cardTransition = "transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.1), opacity 0.3s ease";
  let cardOpacity = 1;

  if (flyOff !== null) {
    cardTransform = `translateX(${flyOff * 400}px) rotate(${flyOff * 15}deg)`;
    cardOpacity = 0;
    cardTransition = "transform 0.25s cubic-bezier(0.2, 0, 0, 1), opacity 0.25s ease";
  } else if (offsetX !== 0) {
    cardTransform = `translateX(${offsetX}px) rotate(${offsetX * 0.05}deg)`;
    cardTransition = "none";
  }

  return (
    <div>
      {fileInput}

      <div
        className="doc-swipe-container"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: "pan-y" }}
      >
        {/* Behind card hint */}
        {docs.length > 1 && (
          <div className="doc-swipe-card glass-panel doc-swipe-behind" />
        )}

        {/* Active card */}
        <div
          className="doc-swipe-card glass-panel"
          style={{
            position: "relative",
            zIndex: 2,
            transform: cardTransform,
            transition: cardTransition,
            opacity: cardOpacity,
          }}
          onClick={() => { if (!didDrag.current) setViewingDoc(doc); }}
        >
          <div className="doc-swipe-preview">
            {doc.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={doc.url} alt={doc.name} />
            ) : (
              <PdfThumbnail url={doc.url} alt={doc.name} />
            )}
          </div>
          <div className="doc-swipe-info">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="doc-swipe-name">{doc.name}</div>
              <div className="doc-swipe-meta">
                <span>{formatSize(doc.size_bytes)}</span>
                <span
                  className="doc-swipe-status"
                  style={{ background: status.bg, color: status.color }}
                >
                  {status.label}
                </span>
              </div>
            </div>
            <button
              className="doc-swipe-delete"
              onClick={(e) => handleDelete(e, doc.id)}
              aria-label={`Delete ${doc.name}`}
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Dots + add */}
      <div className="doc-swipe-nav">
        <div className="doc-swipe-dots">
          {docs.map((_, i) => (
            <button
              key={i}
              className={`doc-swipe-dot ${currentIdx === i ? "doc-swipe-dot-active" : ""}`}
              onClick={() => setCurrentIdx(i)}
            />
          ))}
        </div>
        <button
          className="doc-swipe-add"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "⏳" : "+ Add"}
        </button>
      </div>

      {viewerDoc && (
        <DocumentViewer doc={viewerDoc} onClose={() => setViewingDoc(null)} />
      )}
    </div>
  );
}
