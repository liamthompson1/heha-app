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
        // Always proxy through our API to avoid CORS issues on desktop
        const proxyUrl = `/api/proxy-file?url=${encodeURIComponent(url)}`;
        let response = await fetch(proxyUrl);

        // If proxy fails, try direct as fallback (works on mobile)
        if (!response.ok) {
          response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (cancelled) return;

        // Validate it's actually a PDF (starts with %PDF)
        const header = new Uint8Array(arrayBuffer.slice(0, 5));
        const headerStr = String.fromCharCode(...header);
        if (!headerStr.startsWith("%PDF")) {
          throw new Error("Not a valid PDF");
        }

        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        if (cancelled) return;

        const page = await pdf.getPage(1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Render at 2x for sharpness, capped for small thumbnails
        const containerWidth = canvas.parentElement?.clientWidth ?? 200;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = (containerWidth * dpr) / page.getViewport({ scale: 1 }).width;
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({
          canvasContext: ctx,
          viewport,
        } as Parameters<typeof page.render>[0]).promise;

        if (!cancelled) setLoading(false);
      } catch (err) {
        console.error("[PdfThumbnail]", err);
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
        <span style={{ fontSize: "1.5rem" }}>📄</span>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div className="doc-stack-placeholder animate-pulse">
          <div style={{ width: 20, height: 26, borderRadius: 4, background: "rgba(255,255,255,0.06)" }} />
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
