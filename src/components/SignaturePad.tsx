import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Eraser, PenLine, Check, Loader2, AlertCircle } from "lucide-react";

export interface SignatureContextLine {
  label: string;
  value: string;
}

interface SignaturePadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName: string;
  onSign: (signatureDataUrl: string) => Promise<void>;
  contextLines?: SignatureContextLine[];
}

export function SignaturePad({ open, onOpenChange, documentName, onSign, contextLines }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [saving, setSaving] = useState(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    return { canvas, ctx };
  }, []);

  // Init canvas
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const result = getCtx();
      if (!result) return;
      const { canvas, ctx } = result;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rect.width, rect.height);
      // Draw baseline
      ctx.strokeStyle = "hsl(var(--muted-foreground) / 0.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(20, rect.height * 0.7);
      ctx.lineTo(rect.width - 20, rect.height * 0.7);
      ctx.stroke();
      ctx.setLineDash([]);
      setHasSignature(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [open, getCtx]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const result = getCtx();
    if (!result) return;
    const { ctx } = result;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const result = getCtx();
    if (!result) return;
    const { ctx } = result;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const result = getCtx();
    if (!result) return;
    const { canvas, ctx } = result;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "hsl(var(--muted-foreground) / 0.2)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, rect.height * 0.7);
    ctx.lineTo(rect.width - 20, rect.height * 0.7);
    ctx.stroke();
    ctx.setLineDash([]);
    setHasSignature(false);
  };

  const handleSign = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    setSaving(true);
    try {
      const dataUrl = canvas.toDataURL("image/png");
      await onSign(dataUrl);
      onOpenChange(false);
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <PenLine className="h-5 w-5 text-primary" />
            Signer le document
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            « {documentName} »
          </p>
        </DialogHeader>

        <div className="space-y-3">
          {/* Pre-sign summary */}
          {contextLines && contextLines.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Vous êtes sur le point de signer
              </p>
              <div className="divide-y divide-amber-100">
                {contextLines.map((line) => (
                  <div key={line.label} className="flex items-center justify-between py-1 text-xs">
                    <span className="text-amber-700/80">{line.label}</span>
                    <span className="font-semibold text-amber-900">{line.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Dessinez votre signature dans la zone ci-dessous. En signant, vous acceptez les termes du document.
          </p>
          <div className="border rounded-xl overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair touch-none"
              style={{ height: 180 }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={clearCanvas} className="text-xs">
              <Eraser className="h-3.5 w-3.5 mr-1" /> Effacer
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Signature juridiquement non-contraignante (accord de principe)
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button
            className="gradient-primary border-0"
            onClick={handleSign}
            disabled={!hasSignature || saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Confirmer la signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
