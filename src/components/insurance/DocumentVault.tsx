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
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<StoredDocument | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div>
      {fileInput}

      {docs.length > 0 && (
        <div className="doc-vault-list">
          {docs.map((doc) => {
            const status = STATUS_STYLE[doc.status] ?? STATUS_STYLE.pending;
            return (
              <div
                key={doc.id}
                className="doc-vault-row glass-panel"
                onClick={() => setViewingDoc(doc)}
              >
                <div className="doc-vault-thumb">
                  {doc.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={doc.url} alt={doc.name} />
                  ) : (
                    <PdfThumbnail url={doc.url} alt={doc.name} />
                  )}
                </div>
                <div className="doc-vault-row-info">
                  <div className="doc-vault-row-name">{doc.name}</div>
                  <div className="doc-vault-row-meta">
                    <span>{formatSize(doc.size_bytes)}</span>
                    <span
                      className="doc-vault-row-status"
                      style={{ background: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
                <button
                  className="doc-vault-row-delete"
                  onClick={(e) => handleDelete(e, doc.id)}
                  aria-label={`Delete ${doc.name}`}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload area */}
      <div
        className={`doc-vault-upload ${dragOver ? "doc-vault-upload-active" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleFileDrop}
        onClick={() => inputRef.current?.click()}
        style={docs.length > 0 ? { marginTop: 12, padding: "16px 20px" } : undefined}
      >
        <span className="doc-vault-upload-icon" style={docs.length > 0 ? { fontSize: "1.2rem" } : undefined}>
          {uploading ? "⏳" : "📄"}
        </span>
        <div style={{ fontSize: docs.length > 0 ? "0.85rem" : "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>
          {uploading ? "Uploading…" : docs.length > 0 ? "+ Add document" : "Drop files here or tap to upload"}
        </div>
        {docs.length === 0 && (
          <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginTop: 4 }}>
            PDF, JPG, or PNG — up to 10 MB
          </div>
        )}
      </div>

      {viewerDoc && (
        <DocumentViewer doc={viewerDoc} onClose={() => setViewingDoc(null)} />
      )}
    </div>
  );
}
