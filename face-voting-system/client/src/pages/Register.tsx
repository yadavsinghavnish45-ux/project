import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerSchema, type RegisterRequest } from '@shared/index';
import { useFaceDetection, float32ArrayToBase64 } from '../hooks/useFaceDetection';
import { z } from 'zod';

const fieldValidators = {
  fullName: z.string().min(1, 'Full name is required').max(100),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
};

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { modelsLoaded, loading: modelsLoading, detectFace, getFaceCount } = useFaceDetection();
  
  const [formData, setFormData] = useState<RegisterRequest>({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [faceDetected, setFaceDetected] = useState<boolean | null>(null);
  const [faceCount, setFaceCount] = useState<number | null>(null);
  const [faceEmbedding, setFaceEmbedding] = useState<Float32Array | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [photoMode, setPhotoMode] = useState<'upload' | 'camera'>('upload');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const validateField = useCallback((name: string, value: string) => {
    const fieldSchema = fieldValidators[name as keyof typeof fieldValidators];
    if (fieldSchema) {
      const result = fieldSchema.safeParse(value);
      if (!result.success) {
        setErrors(prev => ({ ...prev, [name]: result.error.errors[0].message }));
      } else {
        setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
      }
    }
    if (name === 'confirmPassword') {
      if (value !== formData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setErrors(prev => { const n = { ...prev }; delete n.confirmPassword; return n; });
      }
    }
  }, [formData.password]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  }, [validateField]);

  const startCamera = useCallback(async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setPhotoMode('camera');
    } catch {
      setPhotoError('Camera access denied. Please allow camera permission or use file upload.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.9));
    const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
    setPhoto(file);
    setPhotoPreview(dataUrl);
    setPhotoError('');

    const count = await getFaceCount(canvas);
    setFaceCount(count);
    setFaceDetected(count === 1);

    if (count === 1) {
      const result = await detectFace(canvas);
      if (result.descriptor) {
        setFaceEmbedding(result.descriptor);
      }
    } else {
      setFaceEmbedding(null);
    }

    stopCamera();
  }, [getFaceCount, detectFace, stopCamera]);

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError('Photo must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setPhotoError('Please select an image file');
        return;
      }
      setPhoto(file);
      setPhotoMode('upload');
      
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
      
      const img = new Image();
      img.src = url;
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        
        const count = await getFaceCount(canvas);
        setFaceCount(count);
        setFaceDetected(count === 1);
        
        if (count === 1) {
          const result = await detectFace(canvas);
          if (result.descriptor) {
            setFaceEmbedding(result.descriptor);
          }
        } else {
          setFaceEmbedding(null);
        }
        URL.revokeObjectURL(url);
      };
    }
  }, [getFaceCount, detectFace]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const path = err.path.join('.');
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!photo) {
      setPhotoError('Profile photo is required');
      return;
    }

    if (faceDetected === false) {
      setPhotoError('Please provide a photo with exactly one clear face');
      return;
    }

    setSubmitting(true);
    try {
      const embeddingBase64 = faceEmbedding ? float32ArrayToBase64(faceEmbedding) : undefined;
      await register(formData, photo, embeddingBase64);
      navigate('/login?registered=true');
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [formData, photo, faceDetected, faceEmbedding, register, navigate]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="page">
      <div className="page-container card">
        <h1 className="page-title">Create Account</h1>
        <p className="page-subtitle">Register to vote in the Face Voting System</p>

        {submitError && <div className="alert alert-error">{submitError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              required
              disabled={submitting}
            />
            {errors.fullName && <div className="form-error">{errors.fullName}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="johndoe"
              required
              disabled={submitting}
              minLength={3}
              maxLength={20}
            />
            {errors.username && <div className="form-error">{errors.username}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              required
              disabled={submitting}
            />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters with letter and number"
              required
              disabled={submitting}
              minLength={8}
            />
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              disabled={submitting}
            />
            {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
          </div>

          <div className="form-group">
            <label>Profile Photo</label>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                className={`btn ${photoMode === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPhotoMode('upload')}
                disabled={cameraActive}
              >
                Upload File
              </button>
              <button
                type="button"
                className={`btn ${photoMode === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={modelsLoaded ? startCamera : undefined}
                disabled={!modelsLoaded || cameraActive}
              >
                {modelsLoaded ? 'Use Camera' : 'Loading models...'}
              </button>
            </div>

            {photoMode === 'upload' && (
              <>
                <div className="camera-container" onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="camera-video" />
                  ) : (
                    <div className="camera-guide">
                      <div style={{ textAlign: 'center', color: 'white' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📷</div>
                        <div>Click to upload photo</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Max 5MB • JPG/PNG</div>
                      </div>
                    </div>
                  )}
                  {faceCount !== null && faceCount > 0 && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                      background: faceCount === 1 ? 'rgba(22, 163, 74, 0.9)' : 'rgba(220, 38, 38, 0.9)',
                      color: 'white'
                    }}>
                      {faceCount === 1 ? '✓ Face detected' : `✗ ${faceCount} faces detected`}
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />
              </>
            )}

            {photoMode === 'camera' && cameraActive && (
              <div style={{ position: 'relative' }}>
                <div className="camera-container">
                  <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div className="camera-guide">
                    <div className="face-oval" style={{ borderColor: faceDetected ? 'rgba(22, 163, 74, 0.8)' : 'rgba(255, 255, 255, 0.5)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
                  <button type="button" className="btn btn-secondary" onClick={stopCamera}>Retake</button>
                  <button type="button" className="btn btn-primary" onClick={capturePhoto} disabled={!faceDetected}>
                    {faceDetected ? 'Capture Photo' : 'Position your face in the oval'}
                  </button>
                </div>
              </div>
            )}

            {capturedImage && !cameraActive && photoMode === 'camera' && (
              <>
                <div className="camera-container">
                  <img src={capturedImage} alt="Captured" className="camera-video" />
                  <div style={{ position: 'absolute', top: '10px', right: '10px', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                    background: faceDetected ? 'rgba(22, 163, 74, 0.9)' : 'rgba(220, 38, 38, 0.9)',
                    color: 'white'
                  }}>
                    {faceDetected ? '✓ Face verified' : '✗ Face not detected'}
                  </div>
                </div>
              </>
            )}

            {photoError && <div className="form-error">{photoError}</div>}
            {faceCount !== null && faceCount > 1 && (
              <div className="form-error">Multiple faces detected. Please use a photo with only your face.</div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting || modelsLoading}>
            {modelsLoading ? 'Loading face detection...' : submitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="link-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}