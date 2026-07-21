"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function CameraCapture({ open, onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      return;
    }

    setError("");
    setReady(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Caméra non disponible sur cet appareil");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setReady(true);
          };
        }
      })
      .catch(() => {
        setError("Impossible d'accéder à la caméra. Vérifiez les autorisations.");
      });

    return stopStream;
  }, [open, stopStream]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
        stopStream();
        onClose();
      },
      "image/jpeg",
      0.92
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Photographier le justificatif
          </h3>
          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error ? (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
          ) : (
            <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                  Démarrage de la caméra...
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleCapture}
            disabled={!ready || !!error}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light disabled:opacity-50 transition-colors"
          >
            Prendre la photo
          </button>
        </div>
      </div>
    </div>
  );
}
