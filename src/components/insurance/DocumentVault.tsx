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

  // Unified pointer (touch + mouse) swipe state
  const dragging = useRef(false);
  const startX = useRef(0);
  const [dragDelta, setDragDelta] = useState(0);
  const didDrag = useRef(false);

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
      const res = await fetch(`/api/trips/${tripId}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents ?? []);
      }
    }
  }, [tripId]);

  const goTo = useCallback((idx: number) => {
    if (idx >= 0 && idx < docs.length) setActiveIndex(idx);
  }, [docs.length]);

  // Pointer down (touch + mouse)
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    didDrag.current = false;
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 5) didDrag.current = true;
    setDragDelta(delta);
  }, []);

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

  // Compute card style for iMessage-like stack
  const getCardStyle = (index: number): React.CSSProperties => {
    const offset = index - activeIndex;
    const absDelta = Math.abs(dragDelta);
    const dragProgress = Math.min(absDelta / 200, 1);
    const dragDir = dragDelta < 0 ? 1 : -1; // 1 = going forward, -1 = going back

    if (offset === 0) {
      // Active card: follows the drag
      return {
        zIndex: 10,
        transform: dragDelta
          ? `translateX(${dragDelta}px) rotate(${dragDelta * 0.02}deg)`
          : "translateX(0) rotate(0deg)",
        transition: dragDelta ? "none" : "all 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
        opacity: 1,
      };
    }

    // Cards behind: stacked with decreasing scale and increasing offset
    const stackOffset = Math.abs(offset);
    if (stackOffset > 3) return { display: "none" };

    const baseScale = 1 - stackOffset * 0.05;
    const baseY = stackOffset * 8;
    const baseRotate = offset > 0 ? stackOffset * 2 : -stackOffset * 2;

    // If dragging toward this card, it should emerge from the stack
    const isNext = offset === dragDir;
    let scale = baseScale;
    let y = baseY;
    let rotate = baseRotate;
    let opacity = 1 - stackOffset * 0.15;

    if (isNext && dragDelta) {
      scale = baseScale + (1 - baseScale) * dragProgress;
      y = baseY * (1 - dragProgress);
      rotate = baseRotate * (1 - dragProgress);
      opacity = opacity + (1 - opacity) * dragProgress;
    }

    return {
      zIndex: 10 - stackOffset,
      transform: `translateY(${y}px) scale(${scale}) rotate(${rotate}deg)`,
      transition: dragDelta ? "none" : "all 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
      opacity,
      pointerEvents: "none" as const,
    };
  };

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

  return (
    <div>
      {fileInput}

      {/* iMessage-style card stack */}
      <div
        className="doc-stack-container"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: "pan-y" }}
      >
        {docs.map((doc, i) => {
          const style = getCardStyle(i);
          if (style.display === "none") return null;

          return (
            <div
              key={doc.id}
              className="doc-stack-card glass-panel"
              style={{
                ...style,
                position: i === activeIndex ? "relative" : "absolute",
                top: i === activeIndex ? undefined : 0,
                left: i === activeIndex ? undefined : 0,
                right: i === activeIndex ? undefined : 0,
              }}
              onClick={() => {
                if (!didDrag.current && i === activeIndex) setViewingDoc(doc);
              }}
            >
              <div className="doc-stack-preview">
                {doc.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={doc.url} alt={doc.name} className="doc-stack-img" />
                ) : (
                  <PdfThumbnail url={doc.url} alt={doc.name} />
                )}

                <span className="doc-stack-badge">✓ {doc.status}</span>

                {i === activeIndex && (
                  <button
                    className="doc-vault-delete"
                    onClick={(e) => {
                      handleDelete(e, doc.id);
                      if (activeIndex >= docs.length - 1 && activeIndex > 0) {
                        setActiveIndex(activeIndex - 1);
                      }
                    }}
                    aria-label={`Delete ${doc.name}`}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="doc-stack-info">
                <div className="doc-stack-name">{doc.name}</div>
                <div className="doc-stack-meta">{formatSize(doc.size_bytes)}</div>
                <button
                  className="doc-stack-arrow"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (i === activeIndex) setViewingDoc(doc);
                  }}
                >
                  →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation: dots + add */}
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

      {viewerDoc && (
        <DocumentViewer doc={viewerDoc} onClose={() => setViewingDoc(null)} />
      )}
    </div>
  );
}
