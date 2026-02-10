import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Scissors, Sparkles, ArrowLeft, Loader2, AlertCircle, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Segmentation() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [textPrompt, setTextPrompt] = useState("");
  const [maskResult, setMaskResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
      setMaskResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleSegment = async () => {
    if (!imageBase64 || !textPrompt.trim()) {
      toast({ title: "Missing input", description: "Please provide both an image and a text prompt.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setError(null);
    setMaskResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("clip-segmentation", {
        body: { image: imageBase64, text: textPrompt.trim() },
      });

      if (fnError) throw new Error(fnError.message);

      if (data?.error) {
        if (data.loading) {
          setError("Model is loading on Hugging Face. Please wait ~30 seconds and try again.");
        } else {
          setError(data.error);
        }
        return;
      }

      if (data?.type === "mask_image" && data.mask) {
        setMaskResult(data.mask);
        compositeOverlay(data.mask);
      } else if (data?.type === "json") {
        // CLIPSeg sometimes returns score arrays; render as heatmap
        setError("Model returned score data instead of mask image. Try a different prompt or image.");
      }
    } catch (err: any) {
      console.error("Segmentation error:", err);
      setError(err.message || "Segmentation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const compositeOverlay = (maskDataUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !imagePreview) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const srcImg = new Image();
    srcImg.crossOrigin = "anonymous";
    srcImg.onload = () => {
      canvas.width = srcImg.width;
      canvas.height = srcImg.height;
      ctx.drawImage(srcImg, 0, 0);

      const maskImg = new Image();
      maskImg.onload = () => {
        // Draw mask as colored overlay
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = srcImg.width;
        tempCanvas.height = srcImg.height;
        const tempCtx = tempCanvas.getContext("2d")!;
        tempCtx.drawImage(maskImg, 0, 0, srcImg.width, srcImg.height);

        const maskData = tempCtx.getImageData(0, 0, srcImg.width, srcImg.height);
        const overlay = ctx.createImageData(srcImg.width, srcImg.height);

        for (let i = 0; i < maskData.data.length; i += 4) {
          const brightness = maskData.data[i]; // grayscale mask
          overlay.data[i] = 0;       // R
          overlay.data[i + 1] = 210;  // G (teal accent)
          overlay.data[i + 2] = 180;  // B
          overlay.data[i + 3] = Math.min(brightness, 180); // A based on mask
        }

        ctx.putImageData(overlay, 0, 0);
        // Re-draw original with reduced opacity underneath
        ctx.globalAlpha = 0.6;
        ctx.globalCompositeOperation = "destination-over";
        ctx.drawImage(srcImg, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      };
      maskImg.src = maskDataUrl;
    };
    srcImg.src = imagePreview;
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh grain">
      {/* Header */}
      <header className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NavLink to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </NavLink>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
              <Scissors className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground text-sm">CLIPSeg Text-Guided Segmentation</h1>
              <p className="text-xs text-muted-foreground">Semantic segmentation via CLIP encoders • Not Meta SAM</p>
            </div>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-4"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-foreground/80">
              <strong className="text-foreground">Text-Guided Semantic Segmentation</strong> — Powered by{" "}
              <span className="text-primary font-medium">CLIPSeg (CIDAS/clipseg-rd64-refined)</span>. 
              Uses a CLIP text encoder + CLIP visual encoder with a transformer-based decoder to generate 
              segmentation masks from natural language prompts. This is <em>not</em> Meta SAM.
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Input
              </CardTitle>
              <CardDescription>Upload an image and describe what to segment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image upload area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-colors flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Uploaded"
                    className="max-w-full max-h-[250px] object-contain rounded-lg"
                  />
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload an image</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WebP</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Text prompt */}
              <div className="space-y-2">
                <Label htmlFor="text-prompt" className="text-sm">Text Prompt</Label>
                <Input
                  id="text-prompt"
                  placeholder='e.g. "a cat", "the red car", "trees in the background"'
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSegment()}
                />
              </div>

              <Button
                onClick={handleSegment}
                disabled={isLoading || !imageBase64 || !textPrompt.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Segmenting…
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4 mr-2" />
                    Generate Segmentation Mask
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Segmentation Result
              </CardTitle>
              <CardDescription>Mask overlay from CLIPSeg decoder</CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </motion.div>
                )}

                {!maskResult && !error && !isLoading && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground"
                  >
                    <Scissors className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">Segmentation result will appear here</p>
                  </motion.div>
                )}

                {isLoading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center min-h-[200px]"
                  >
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                    <p className="text-sm text-muted-foreground">Running CLIP encoders & CLIPSeg decoder…</p>
                  </motion.div>
                )}

                {maskResult && !isLoading && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-3"
                  >
                    <div className="rounded-xl overflow-hidden border border-border">
                      <canvas ref={canvasRef} className="w-full h-auto" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        <strong>Raw mask:</strong>
                      </p>
                      <div className="rounded-lg overflow-hidden border border-border bg-muted/50 p-2">
                        <img src={maskResult} alt="Segmentation mask" className="w-full h-auto opacity-80" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Architecture diagram */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm">Pipeline Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">Image Input</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">CLIP Visual Encoder</span>
              <span>↘</span>
              <span className="px-2 py-1 rounded bg-primary/15 text-primary border border-primary/25 font-medium">CLIPSeg Decoder</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-muted text-foreground border border-border">Segmentation Mask</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-2">
              <span className="px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">Text Prompt</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">CLIP Text Encoder</span>
              <span>↗</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
