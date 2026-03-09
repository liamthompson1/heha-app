"use client";

import { useEffect, useRef, useState } from "react";

interface PdfThumbnailProps {
  url: string;
  alt?: string;
}

export default function PdfThumbnail({ url, alt }: PdfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const pdf = await pdfjsLib.getDocument(url).promise;
        if (cancelled) return;

        const page = await pdf.getPage(1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Render at 2x for sharpness, fitting the container
        const containerWidth = canvas.parentElement?.clientWidth ?? 340;
        const scale = (containerWidth * 2) / page.getViewport({ scale: 1 }).width;
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  if (error) {
    return (
      <div className="doc-stack-placeholder">
        <span style={{ fontSize: "3rem" }}>📑</span>
        <span style={{ fontSize: "0.85rem", marginTop: 8 }}>PDF Preview unavailable</span>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div className="doc-stack-placeholder animate-pulse">
          <div className="glass-panel" style={{ width: 60, height: 80, borderRadius: 8 }} />
        </div>
      )}
      <canvas
        ref={canvasRef}
        aria-label={alt ?? "PDF page 1"}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: loading ? "none" : "block",
        }}
      />
    </>
  );
}
