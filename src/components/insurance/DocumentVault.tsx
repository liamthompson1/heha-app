"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { InsuranceDocument } from "@/types/insurance";
import DocumentViewer from "./DocumentViewer";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_COLORS: Record<InsuranceDocument["status"], string> = {
  verified: "var(--teal)",
  pending: "var(--gold)",
  rejected: "var(--coral)",
};

interface DocumentVaultProps {
  documents: InsuranceDocument[];
}

export default function DocumentVault({ documents }: DocumentVaultProps) {
  const [docs, setDocs] = useState(documents);
  const [dragOver, setDragOver] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<InsuranceDocument | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Clean up all object URLs on unmount
  useEffect(() => {
    return () => {
      docs.forEach((d) => {
        if (d.objectUrl) URL.revokeObjectURL(d.objectUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, []);

  const addFiles = (files: File[]) => {
    const newDocs: InsuranceDocument[] = files.map((f, i) => ({
      id: `upload-${Date.now()}-${i}`,
      name: f.name,
      type: f.type.startsWith("image/") ? "image" as const : "pdf" as const,
      category: "receipt" as const,
      uploaded_at: new Date().toISOString().split("T")[0],
      size_bytes: f.size,
      status: "pending" as const,
      file: f,
      objectUrl: URL.createObjectURL(f),
    }));
    setDocs((prev) => [...prev, ...newDocs]);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDocs((prev) => {
      const doc = prev.find((d) => d.id === id);
      if (doc?.objectUrl) URL.revokeObjectURL(doc.objectUrl);
      return prev.filter((d) => d.id !== id);
    });
  };

  // Track scroll position to update active dot
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || docs.length === 0) return;
    const cardWidth = el.firstElementChild?.clientWidth ?? 280;
    const gap = 16;
    const idx = Math.round(el.scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.min(idx, docs.length - 1));
  }, [docs.length]);

  if (docs.length === 0) {
    return (
      <div
        className={`doc-vault-upload ${dragOver ? "doc-vault-upload-active" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
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
        <span className="doc-vault-upload-icon">📄</span>
        <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>
          Drop files here or tap to upload
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginTop: 4 }}>
          PDF, JPG, or PNG — up to 10 MB
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Swipeable card carousel */}
      <div
        className="doc-vault-carousel"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="doc-vault-card glass-panel"
            onClick={() => { if (doc.objectUrl) setViewingDoc(doc); }}
          >
            {/* Preview area */}
            <div className="doc-vault-card-preview">
              {doc.objectUrl && doc.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={doc.objectUrl}
                  alt={doc.name}
                  className="doc-vault-card-img"
                />
              ) : (
                <div className="doc-vault-card-placeholder">
                  <span style={{ fontSize: "2.5rem" }}>
                    {doc.type === "pdf" ? "📑" : "🖼️"}
                  </span>
                </div>
              )}

              {/* Status badge */}
              <span
                className="doc-vault-badge"
                style={{
                  background: `${STATUS_COLORS[doc.status]}20`,
                  color: STATUS_COLORS[doc.status],
                  borderColor: `${STATUS_COLORS[doc.status]}40`,
                }}
              >
                {doc.status}
              </span>

              {/* Delete button */}
              <button
                className="doc-vault-delete"
                onClick={(e) => handleDelete(e, doc.id)}
                aria-label={`Delete ${doc.name}`}
              >
                ✕
              </button>
            </div>

            {/* Info area */}
            <div className="doc-vault-card-info">
              <div className="doc-vault-card-name">{doc.name}</div>
              <div className="doc-vault-card-meta">{formatSize(doc.size_bytes)}</div>
              {doc.objectUrl && (
                <div className="doc-vault-card-arrow">→</div>
              )}
            </div>
          </div>
        ))}

        {/* Add more card */}
        <div
          className="doc-vault-card doc-vault-card-add glass-panel"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
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
          <div className="doc-vault-card-preview doc-vault-card-placeholder">
            <span style={{ fontSize: "2rem" }}>+</span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-tertiary)", marginTop: 4 }}>
              Add document
            </span>
          </div>
        </div>
      </div>

      {/* Pagination dots */}
      {docs.length > 1 && (
        <div className="doc-vault-dots">
          {docs.map((_, i) => (
            <span
              key={i}
              className={`doc-vault-dot ${i === activeIndex ? "doc-vault-dot-active" : ""}`}
            />
          ))}
        </div>
      )}

      {viewingDoc && (
        <DocumentViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />
      )}
    </div>
  );
}
