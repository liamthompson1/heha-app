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
  // order[0] is top of pile, order[1] is next, etc.
  const [order, setOrder] = useState<number[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<StoredDocument | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const dragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const [delta, setDelta] = useState({ x: 0, y: 0 });
  const didDrag = useRef(false);

  // Dismiss animation
  const [dismissing, setDismissing] = useState<{ x: number; rotate: number } | null>(null);

  // Sync order when docs change
  useEffect(() => {
    setOrder((prev) => {
      if (prev.length === 0) return docs.map((_, i) => i);
      // Keep existing order, append new indices
      const existing = prev.filter((i) => i < docs.length);
      const newIndices = docs.map((_, i) => i).filter((i) => !existing.includes(i));
      return [...existing, ...newIndices];
    });
  }, [docs.length]);

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
    setDocs((prev) => prev.filter((d) => d.id !== docId));
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
  }, [tripId]);

  // Send top card to back of pile
  const sendToBack = useCallback(() => {
    setOrder((prev) => {
      if (prev.length <= 1) return prev;
      return [...prev.slice(1), prev[0]];
    });
  }, []);

  // Bring last card to top
  const bringToFront = useCallback(() => {
    setOrder((prev) => {
      if (prev.length <= 1) return prev;
      return [prev[prev.length - 1], ...prev.slice(0, -1)];
    });
  }, []);

  // Pointer handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (dismissing) return;
    dragging.current = true;
    didDrag.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [dismissing]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) didDrag.current = true;
    setDelta({ x: dx, y: dy * 0.3 }); // dampen vertical
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;

    const threshold = 80;
    if (Math.abs(delta.x) > threshold && docs.length > 1) {
      // Dismiss: fly off in the swipe direction
      const flyX = delta.x > 0 ? 500 : -500;
      const flyRotate = delta.x > 0 ? 20 : -20;
      setDismissing({ x: flyX, rotate: flyRotate });
      setDelta({ x: 0, y: 0 });

      setTimeout(() => {
        if (delta.x < 0) {
          sendToBack();
        } else {
          bringToFront();
        }
        setDismissing(null);
      }, 300);
    } else {
      // Snap back
      setDelta({ x: 0, y: 0 });
    }
  }, [delta, docs.length, sendToBack, bringToFront]);

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

  // Render cards in reverse order (bottom of pile first, top last so it's on top in DOM)
  const visibleOrder = order.slice(0, Math.min(order.length, 3));
  const topIndex = order[0];
  const topDoc = docs[topIndex];

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
        {/* Render from bottom to top */}
        {[...visibleOrder].reverse().map((docIdx, renderIdx) => {
          const doc = docs[docIdx];
          if (!doc) return null;
          const pilePos = visibleOrder.indexOf(docIdx); // 0 = top, 1 = second, 2 = third
          const isTop = pilePos === 0;

          // Stack transforms for behind cards
          let transform: string;
          let opacity: number;
          let transition: string;
          const spring = "0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)";

          if (isTop) {
            if (dismissing) {
              transform = `translateX(${dismissing.x}px) rotate(${dismissing.rotate}deg)`;
              opacity = 0;
              transition = `transform 0.3s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s ease`;
            } else if (delta.x !== 0 || delta.y !== 0) {
              transform = `translateX(${delta.x}px) translateY(${delta.y}px) rotate(${delta.x * 0.04}deg)`;
              opacity = 1;
              transition = "none";
            } else {
              transform = "translateX(0) translateY(0) rotate(0deg)";
              opacity = 1;
              transition = `all ${spring}`;
            }
          } else {
            // Behind cards: offset down and scale smaller
            const scaleVal = 1 - pilePos * 0.04;
            const yOffset = pilePos * 10;

            // When dragging, the next card should start emerging
            let emergeFactor = 0;
            if (pilePos === 1 && (delta.x !== 0 || dismissing)) {
              emergeFactor = Math.min(Math.abs(delta.x) / 150, 1);
            }
            const currentScale = scaleVal + (1 - scaleVal) * emergeFactor;
            const currentY = yOffset * (1 - emergeFactor);

            transform = `translateY(${currentY}px) scale(${currentScale})`;
            opacity = 1 - pilePos * 0.2 + emergeFactor * 0.2;
            transition = delta.x !== 0 ? "none" : `all ${spring}`;
          }

          return (
            <div
              key={doc.id}
              className="doc-stack-card glass-panel"
              style={{
                position: isTop ? "relative" : "absolute",
                inset: isTop ? undefined : "0",
                zIndex: visibleOrder.length - pilePos,
                transform,
                opacity,
                transition,
                transformOrigin: "center center",
              }}
              onClick={() => {
                if (!didDrag.current && isTop) setViewingDoc(doc);
              }}
            >
              <div className="doc-stack-preview">
                {doc.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={doc.url} alt={doc.name} className="doc-stack-img" />
                ) : (
                  <PdfThumbnail url={doc.url} alt={doc.name} />
                )}

                {isTop && (
                  <>
                    <span className="doc-stack-badge">✓ {doc.status}</span>
                    <button
                      className="doc-vault-delete"
                      onClick={(e) => handleDelete(e, doc.id)}
                      aria-label={`Delete ${doc.name}`}
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>

              <div className="doc-stack-info">
                <div className="doc-stack-name">{doc.name}</div>
                <div className="doc-stack-meta">{formatSize(doc.size_bytes)}</div>
                {isTop && (
                  <button
                    className="doc-stack-arrow"
                    onClick={(e) => { e.stopPropagation(); setViewingDoc(doc); }}
                  >
                    →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots + add */}
      <div className="doc-stack-nav">
        <div className="doc-vault-dots">
          {docs.map((_, i) => (
            <button
              key={i}
              className={`doc-vault-dot ${order[0] === i ? "doc-vault-dot-active" : ""}`}
              onClick={() => {
                // Rotate order so this index is on top
                const pos = order.indexOf(i);
                if (pos > 0) setOrder([...order.slice(pos), ...order.slice(0, pos)]);
              }}
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
