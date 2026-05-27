'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImageCropModalProps {
  src: string;
  aspect?: number; // e.g. 1 for square, 16/9 for banner, undefined for free
  onCrop: (croppedBlob: Blob, dataUrl: string) => void;
  onClose: () => void;
  title?: string;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight), mediaWidth, mediaHeight);
}

async function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): Promise<{ blob: Blob; dataUrl: string }> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve({ blob: blob!, dataUrl: canvas.toDataURL('image/jpeg', 0.9) });
    }, 'image/jpeg', 0.9);
  });
}

export function ImageCropModal({ src, aspect, onCrop, onClose, title = 'Crop Image' }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }, [aspect]);

  const handleApply = async () => {
    if (!completedCrop || !imgRef.current) return;
    const { blob, dataUrl } = await getCroppedImg(imgRef.current, completedCrop);
    onCrop(blob, dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
        </div>

        {/* Crop Area */}
        <div className="p-5 flex justify-center bg-gray-900 max-h-[60vh] overflow-auto">
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            onComplete={c => setCompletedCrop(c)}
            aspect={aspect}
            minWidth={50}
            minHeight={50}
          >
            <img ref={imgRef} src={src} onLoad={onImageLoad} alt="Crop" style={{ maxHeight: '50vh', maxWidth: '100%' }} />
          </ReactCrop>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500">
            {aspect ? `Aspect ratio: ${aspect === 1 ? '1:1 (square)' : aspect.toFixed(2)}` : 'Free crop'}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            <button onClick={handleApply} disabled={!completedCrop} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-50">
              <Check className="h-4 w-4" /> Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageCropModal;
