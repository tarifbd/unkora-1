'use client';

import { useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Shirt, Upload, Sparkles, Loader2, ImageOff, Info } from 'lucide-react';
import api from '@/lib/api';

function TryOnContent() {
  const params = useSearchParams();
  const productId = params.get('productId') ?? '';
  const productName = params.get('productName') ?? 'Product';
  const productImage = params.get('productImage') ?? '';

  const [userImage, setUserImage] = useState<{ file: File; preview: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<{ resultImageUrl?: string; status: string } | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const preview = URL.createObjectURL(file);
    setUserImage({ file, preview });
    setSession(null);
    setError('');
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleTryOn = async () => {
    if (!userImage || !productId) return;
    setLoading(true);
    setError('');
    setSession(null);

    try {
      const res = await api.post('/virtual-tryon/sessions', {
        productId,
        userImageUrl: userImage.preview,
      });
      const createdSession = (res.data?.data ?? res.data) as { id: string; status: string };

      // Attempt AI processing
      try {
        const processRes = await api.post(`/virtual-tryon/sessions/${createdSession.id}/process`);
        setSession((processRes.data?.data ?? processRes.data) as { resultImageUrl?: string; status: string });
      } catch {
        setSession(createdSession as { resultImageUrl?: string; status: string });
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/60 via-background to-background">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          {productId && (
            <Link
              href={`/products/${productId}`}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to product
            </Link>
          )}
        </div>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-sm font-semibold text-orange-700">
            <Shirt className="h-4 w-4" />
            Virtual Trial Room
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Try on <span className="text-orange-500">{productName}</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Upload a photo of yourself to see how it looks on you
          </p>
        </div>

        {/* Two-panel upload area */}
        <div className="grid sm:grid-cols-2 gap-6">

          {/* Left: Upload user photo */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-center">Your Photo</p>
            <div
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors cursor-pointer min-h-[280px] overflow-hidden ${
                dragging
                  ? 'border-orange-400 bg-orange-50'
                  : userImage
                  ? 'border-green-300 bg-green-50/30'
                  : 'border-muted-foreground/30 bg-muted/20 hover:border-orange-300 hover:bg-orange-50/30'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              {userImage ? (
                <Image
                  src={userImage.preview}
                  alt="Your photo"
                  fill
                  className="object-contain p-2"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 p-6 text-center pointer-events-none">
                  <div className="rounded-full bg-muted p-4">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Drag & drop your photo here</p>
                    <p className="text-xs text-muted-foreground mt-0.5">or click to browse</p>
                    <p className="text-xs text-muted-foreground/70 mt-2">PNG, JPG, WEBP — max 10MB</p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onInputChange}
              />
            </div>
            {userImage && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
              >
                Change photo
              </button>
            )}
          </div>

          {/* Right: Product image */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-center">Product</p>
            <div className="relative flex items-center justify-center rounded-2xl border-2 border-muted-foreground/20 bg-muted/10 min-h-[280px] overflow-hidden">
              {productImage ? (
                <Image
                  src={productImage}
                  alt={productName}
                  fill
                  className="object-contain p-2"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <ImageOff className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">No product image available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Try On button */}
        <div className="flex justify-center">
          <button
            onClick={handleTryOn}
            disabled={!userImage || loading}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-b from-orange-400 to-orange-600 px-10 py-4 text-base font-black text-white shadow-lg shadow-orange-500/40 hover:from-orange-300 hover:to-orange-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all ring-1 ring-white/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Try On
              </>
            )}
          </button>
        </div>

        {!userImage && (
          <p className="text-center text-xs text-muted-foreground">
            Upload your photo first to enable the Try On button
          </p>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Result panel */}
        {session && (
          <div className="rounded-2xl border bg-card p-6 space-y-5">
            <h2 className="text-lg font-bold text-center">Your Virtual Try-On</h2>

            {session.resultImageUrl ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-1 space-y-2 text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">You</p>
                  <div className="relative h-64 w-full rounded-xl overflow-hidden border">
                    <Image src={userImage!.preview} alt="Your photo" fill className="object-contain" />
                  </div>
                </div>
                <div className="text-muted-foreground hidden sm:block">+</div>
                <div className="flex-1 space-y-2 text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Result</p>
                  <div className="relative h-64 w-full rounded-xl overflow-hidden border">
                    <Image src={session.resultImageUrl} alt="Try-on result" fill className="object-contain" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex-1 space-y-2 text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Photo</p>
                    <div className="relative h-56 w-full rounded-xl overflow-hidden border">
                      <Image src={userImage!.preview} alt="Your photo" fill className="object-contain" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Product</p>
                    <div className="relative h-56 w-full rounded-xl overflow-hidden border">
                      {productImage ? (
                        <Image src={productImage} alt={productName} fill className="object-contain" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageOff className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    AI processing is not yet configured — contact your store admin to enable AI-powered
                    try-on results. Showing reference images instead.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-3 pt-2">
              {productId && (
                <Link
                  href={`/products/${productId}`}
                  className="rounded-xl border px-5 py-2.5 text-sm hover:bg-accent transition-colors"
                >
                  Back to product
                </Link>
              )}
              <button
                onClick={() => { setSession(null); setUserImage(null); }}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Try another photo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TryOnPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <TryOnContent />
    </Suspense>
  );
}
