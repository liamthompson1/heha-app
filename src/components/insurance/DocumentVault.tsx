"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { InsuranceDocument } from "@/types/insurance";
import { formatDate } from "@/lib/format-date";
import DocumentViewer from "./DocumentViewer";

const CATEGORY_LABELS: Record<InsuranceDocument["category"], { emoji: string; label: string }> = {
  policy: { emoji: "\u{1F4CB}", label: "Policy Documents" },
  claim: { emoji: "\u{1F4DD}", label: "Claims" },
  receipt: { emoji: "\u{1F9FE}", label: "Receipts" },
};

const STATUS_COLORS: Record<InsuranceDocument["status"], string> = {
  verified: "var(--teal)",
  pending: "var(--gold)",
  rejected: "var(--coral)",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentVaultProps {
  documents: InsuranceDocument[];
}

export default function DocumentVault({ documents }: DocumentVaultProps) {
  const [docs, setDocs] = useState(documents);
  const [dragOver, setDragOver] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<InsuranceDocument | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
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

  const handleDelete = (id: string) => {
    setDocs((prev) => {
      const doc = prev.find((d) => d.id === id);
      if (doc?.objectUrl) URL.revokeObjectURL(doc.objectUrl);
      return prev.filter((d) => d.id !== id);
    });
  };

  // Group documents by category
  const grouped = docs.reduce(
    (acc, doc) => {
      if (!acc[doc.category]) acc[doc.category] = [];
      acc[doc.category].push(doc);
      return acc;
    },
    {} as Record<string, InsuranceDocument[]>
  );

  return (
    <div>
      {/* Upload zone */}
      <div
        className={`insurance-upload-zone ${dragOver ? "insurance-upload-zone-active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
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
        <div style={{ fontSize: "2rem", marginBottom: 8 }}>{"\u{1F4C4}"}</div>
        <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>
          Drop files here or click to upload
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginTop: 4 }}>
          PDF, JPG, or PNG — up to 10 MB
        </div>
      </div>

      {/* Document groups */}
      {(Object.keys(CATEGORY_LABELS) as InsuranceDocument["category"][]).map((cat) => {
        const group = grouped[cat];
        if (!group || group.length === 0) return null;
        const { emoji, label } = CATEGORY_LABELS[cat];

        return (
          <div key={cat} style={{ marginTop: 20 }}>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{emoji}</span> {label}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {group.map((doc) => (
                <div
                  key={doc.id}
                  className="insurance-doc-row"
                  style={{ cursor: doc.objectUrl ? "pointer" : undefined }}
                  onClick={() => {
                    if (doc.objectUrl) setViewingDoc(doc);
                  }}
                >
                  <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>
                    {doc.type === "pdf" ? "\u{1F4D1}" : "\u{1F5BC}\uFE0F"}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {doc.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: 2 }}>
                      {formatSize(doc.size_bytes)} &middot; {formatDate(doc.uploaded_at)}
                    </div>
                  </div>

                  <span
                    className="insurance-status-badge"
                    style={{
                      background: `${STATUS_COLORS[doc.status]}20`,
                      color: STATUS_COLORS[doc.status],
                      flexShrink: 0,
                    }}
                  >
                    {doc.status}
                  </span>

                  <button
                    className="insurance-doc-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                    aria-label={`Delete ${doc.name}`}
                  >
                    {"\u2715"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {docs.length === 0 && (
        <div
          className="glass-panel"
          style={{
            padding: "32px 24px",
            borderRadius: "var(--glass-radius)",
            textAlign: "center",
            marginTop: 16,
          }}
        >
          <p style={{ color: "var(--text-tertiary)", fontSize: "0.9rem" }}>
            No documents uploaded yet
          </p>
        </div>
      )}

      {viewingDoc && (
        <DocumentViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />
      )}
    </div>
  );
}
