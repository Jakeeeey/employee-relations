"use client";

import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { X, ZoomIn, ZoomOut, RotateCw, RotateCcw, Maximize2 } from "lucide-react";

interface ImagePreviewModalProps {
  src: string | null;
  onClose: () => void;
}

const ZOOM_STEP = 0.2;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;

export function ImagePreviewModal({ src, onClose }: ImagePreviewModalProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const posSnapshot = useRef({ x: 0, y: 0 });

  const [prevSrc, setPrevSrc] = useState<string | null>(null);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setScale(1);
    setRotation(0);
    setPos({ x: 0, y: 0 });
  }

  const reset = () => {
    setScale(1);
    setRotation(0);
    setPos({ x: 0, y: 0 });
  };

  const zoomIn = () => setScale((s) => Math.min(s + ZOOM_STEP, MAX_ZOOM));
  const zoomOut = () => setScale((s) => Math.max(s - ZOOM_STEP, MIN_ZOOM));
  const rotateCw = () => setRotation((r) => r + 90);
  const rotateCcw = () => setRotation((r) => r - 90);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setScale((s) => Math.min(Math.max(s + delta, MIN_ZOOM), MAX_ZOOM));
  }, []);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    posSnapshot.current = pos;
  }, [pos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPos({ x: posSnapshot.current.x + dx, y: posSnapshot.current.y + dy });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  // Touch drag
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    posSnapshot.current = pos;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;
    setPos({ x: posSnapshot.current.x + dx, y: posSnapshot.current.y + dy });
  };

  return (
    <Dialog open={!!src} onOpenChange={() => onClose()}>
      <DialogContent
        // Force-override Shadcn's max-w constraint via inline style
        style={{ maxWidth: "65vw", width: "65vw", padding: 0 }}
        className="bg-slate-950 border border-slate-800 overflow-hidden rounded-2xl shadow-2xl
          [&>button.absolute]:hidden" // hide Shadcn's built-in close button
      >
        <VisuallyHidden.Root>
          <DialogTitle>Receipt Image Preview</DialogTitle>
        </VisuallyHidden.Root>

        {/* ── Toolbar ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            {/* Zoom Out */}
            <ToolBtn onClick={zoomOut} title="Zoom out" disabled={scale <= MIN_ZOOM}>
              <ZoomOut className="h-4 w-4" />
            </ToolBtn>

            {/* Zoom indicator */}
            <span className="text-xs font-mono text-slate-400 w-12 text-center select-none">
              {Math.round(scale * 100)}%
            </span>

            {/* Zoom In */}
            <ToolBtn onClick={zoomIn} title="Zoom in" disabled={scale >= MAX_ZOOM}>
              <ZoomIn className="h-4 w-4" />
            </ToolBtn>

            <Divider />

            {/* Rotate CCW */}
            <ToolBtn onClick={rotateCcw} title="Rotate left">
              <RotateCcw className="h-4 w-4" />
            </ToolBtn>

            {/* Rotate CW */}
            <ToolBtn onClick={rotateCw} title="Rotate right">
              <RotateCw className="h-4 w-4" />
            </ToolBtn>

            <Divider />

            {/* Reset */}
            <ToolBtn onClick={reset} title="Reset view">
              <Maximize2 className="h-4 w-4" />
            </ToolBtn>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            title="Close"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Canvas ───────────────────────────────────────── */}
        <div
          className="relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_#1e293b_0%,_#0f172a_100%)]"
          style={{ height: "68vh" }}
          onWheel={handleWheel}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {src && (
            <div
              className="absolute inset-0 flex items-center justify-center select-none"
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => { touchStart.current = null; }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="Receipt preview"
                draggable={false}
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale}) rotate(${rotation}deg)`,
                  transition: isDragging ? "none" : "transform 0.15s ease",
                  maxWidth: "90%",
                  maxHeight: "78vh",
                  objectFit: "contain",
                  borderRadius: "8px",
                  boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            </div>
          )}

          {/* Hint */}
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 select-none pointer-events-none whitespace-nowrap">
            Scroll to zoom · Drag to pan · Buttons to rotate
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-components ────────────────────────────────────
function ToolBtn({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-slate-700 mx-1" />;
}
