"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { InsuranceDocument } from "@/types/insurance";

interface DocumentViewerProps {
  doc: InsuranceDocument;
  onClose: () => void;
}

export default function DocumentViewer({ doc, onClose }: DocumentViewerProps) {
  // Lock body scroll and handle escape key
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const content = doc.objectUrl ? (
    doc.type === "image" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={doc.objectUrl}
        alt={doc.name}
        className="document-viewer-image"
      />
    ) : (
      <iframe
        src={doc.objectUrl}
        title={doc.name}
        className="document-viewer-pdf"
      />
    )
  ) : (
    <div className="document-viewer-placeholder">
      <span style={{ fontSize: "3rem", marginBottom: 12 }}>{"\u{1F4C4}"}</span>
      <p style={{ color: "var(--text-tertiary)", fontSize: "0.95rem" }}>
        No preview available
      </p>
    </div>
  );

  return createPortal(
    <div className="document-viewer-backdrop" onClick={onClose}>
      <div
        className="document-viewer-panel glass-panel-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="document-viewer-header">
          <span
            style={{
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {doc.name}
          </span>
          <button
            className="document-viewer-close"
            onClick={onClose}
            aria-label="Close viewer"
          >
            {"\u00D7"}
          </button>
        </div>
        <div className="document-viewer-content">{content}</div>
      </div>
    </div>,
    document.body
  );
}
