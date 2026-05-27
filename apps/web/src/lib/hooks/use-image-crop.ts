'use client';
import { useState, useCallback } from 'react';

export function useImageCrop() {
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [onCropCallback, setOnCropCallback] = useState<((blob: Blob, url: string) => void) | null>(null);

  const openCrop = useCallback((src: string, callback: (blob: Blob, url: string) => void) => {
    setCropSrc(src);
    setOnCropCallback(() => callback);
  }, []);

  const closeCrop = useCallback(() => {
    setCropSrc(null);
    setOnCropCallback(null);
  }, []);

  return { cropSrc, onCropCallback, openCrop, closeCrop, isOpen: !!cropSrc };
}
