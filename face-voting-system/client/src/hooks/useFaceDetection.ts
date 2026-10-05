import { useState, useEffect, useCallback, useRef } from 'react';
import * as faceapi from 'face-api.js';

export interface FaceDetectionResult {
  detection: faceapi.FaceDetection | null;
  landmarks: faceapi.FaceLandmarks68 | null;
  descriptor: Float32Array | null;
}

export function useFaceDetection() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadModels = useCallback(async () => {
    if (modelsLoaded || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      setModelsLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load face detection models');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [modelsLoaded]);

  const detectFace = useCallback(async (imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<FaceDetectionResult> => {
    if (!modelsLoaded) {
      await loadModels();
    }

    try {
      const detection = await faceapi.detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions());
      if (!detection) {
        return { detection: null, landmarks: null, descriptor: null };
      }

      const fullDetection = await faceapi.detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
      
      if (!fullDetection) {
        return { detection, landmarks: null, descriptor: null };
      }

      return { 
        detection: fullDetection.detection, 
        landmarks: fullDetection.landmarks, 
        descriptor: fullDetection.descriptor 
      };
    } catch (err) {
      console.error('Face detection error:', err);
      return { detection: null, landmarks: null, descriptor: null };
    }
  }, [modelsLoaded, loadModels]);

  const detectFaceFromCanvas = useCallback(async (canvas: HTMLCanvasElement): Promise<FaceDetectionResult> => {
    return detectFace(canvas);
  }, [detectFace]);

  const getFaceCount = useCallback(async (imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<number> => {
    if (!modelsLoaded) {
      await loadModels();
    }

    try {
      const detections = await faceapi.detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions());
      return detections.length;
    } catch {
      return 0;
    }
  }, [modelsLoaded, loadModels]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return {
    modelsLoaded,
    loading,
    error,
    loadModels,
    detectFace,
    detectFaceFromCanvas,
    getFaceCount,
  };
}

export function float32ArrayToBase64(arr: Float32Array): string {
  const bytes = new Uint8Array(arr.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToFloat32Array(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Float32Array(bytes.buffer);
}