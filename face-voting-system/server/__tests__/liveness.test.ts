import { describe, it, expect } from 'vitest';

const distance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

const eyeAspectRatio = (eye: Array<{ x: number; y: number }>): number => {
  const vertical1 = distance(eye[1], eye[5]);
  const vertical2 = distance(eye[2], eye[4]);
  const horizontal = distance(eye[0], eye[3]);
  return (vertical1 + vertical2) / (2 * horizontal);
};

const calculateEAR = (landmarks: Record<number, { x: number; y: number }>): number => {
  const leftEye = [36, 37, 38, 39, 40, 41].map(i => landmarks[i]);
  const rightEye = [42, 43, 44, 45, 46, 47].map(i => landmarks[i]);
  
  const leftEAR = eyeAspectRatio(leftEye);
  const rightEAR = eyeAspectRatio(rightEye);
  return (leftEAR + rightEAR) / 2;
};

const calculateYaw = (landmarks: Record<number, { x: number; y: number }>): number => {
  const nose = landmarks[30];
  const leftEye = landmarks[39];
  const rightEye = landmarks[42];
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  return (nose.x - eyeCenterX) / Math.abs(rightEye.x - leftEye.x);
};

const calculatePitch = (landmarks: Record<number, { x: number; y: number }>): number => {
  const nose = landmarks[30];
  const chin = landmarks[8];
  const leftEye = landmarks[39];
  const rightEye = landmarks[42];
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  return (nose.y - eyeCenterY) / Math.abs(chin.y - eyeCenterY);
};

const calculateMouthRatio = (landmarks: Record<number, { x: number; y: number }>): number => {
  const width = distance(landmarks[48], landmarks[54]);
  const height = distance(landmarks[51], landmarks[57]);
  return width / height;
};

const createMockLandmarks = (overrides: Record<number, { x: number; y: number }> = {}) => {
  const basePoints: Record<number, { x: number; y: number }> = {
    36: { x: 100, y: 100 }, 37: { x: 110, y: 95 }, 38: { x: 120, y: 95 },
    39: { x: 130, y: 100 }, 40: { x: 120, y: 105 }, 41: { x: 110, y: 105 },
    42: { x: 200, y: 100 }, 43: { x: 210, y: 95 }, 44: { x: 220, y: 95 },
    45: { x: 230, y: 100 }, 46: { x: 220, y: 105 }, 47: { x: 210, y: 105 },
    27: { x: 165, y: 90 }, 28: { x: 165, y: 110 }, 29: { x: 165, y: 130 },
    30: { x: 165, y: 150 }, 31: { x: 160, y: 155 }, 32: { x: 165, y: 155 },
    33: { x: 170, y: 155 }, 34: { x: 165, y: 150 }, 35: { x: 165, y: 140 },
    48: { x: 130, y: 180 }, 49: { x: 140, y: 175 }, 50: { x: 155, y: 175 },
    51: { x: 165, y: 178 }, 52: { x: 175, y: 175 }, 53: { x: 185, y: 175 },
    54: { x: 200, y: 180 }, 55: { x: 185, y: 185 }, 56: { x: 175, y: 190 },
    57: { x: 165, y: 192 }, 58: { x: 155, y: 190 }, 59: { x: 140, y: 185 },
    0: { x: 80, y: 160 }, 1: { x: 90, y: 180 }, 2: { x: 105, y: 195 },
    3: { x: 125, y: 205 }, 4: { x: 150, y: 210 }, 5: { x: 175, y: 205 },
    6: { x: 195, y: 195 }, 7: { x: 210, y: 180 }, 8: { x: 220, y: 160 },
    9: { x: 210, y: 140 }, 10: { x: 195, y: 125 }, 11: { x: 175, y: 115 },
    12: { x: 150, y: 110 }, 13: { x: 125, y: 110 }, 14: { x: 105, y: 115 },
    15: { x: 90, y: 125 }, 16: { x: 80, y: 140 },
  };
  
  return { ...basePoints, ...overrides };
};

describe('Liveness challenge calculations', () => {
  it('should calculate EAR for open eyes', () => {
    const landmarks = createMockLandmarks();
    const ear = calculateEAR(landmarks);
    
    expect(ear).toBeGreaterThan(0.2);
    expect(ear).toBeLessThan(0.4);
  });

  it('should calculate lower EAR for closed eyes (blink)', () => {
    const landmarks = createMockLandmarks({
      37: { x: 110, y: 99 }, 38: { x: 120, y: 99 },
      41: { x: 110, y: 101 }, 40: { x: 120, y: 101 },
      43: { x: 210, y: 99 }, 44: { x: 220, y: 99 },
      47: { x: 210, y: 101 }, 46: { x: 220, y: 101 },
    });
    
    const ear = calculateEAR(landmarks);
    expect(ear).toBeLessThan(0.15);
  });

  it('should calculate yaw for left turn', () => {
    const landmarks = createMockLandmarks({
      30: { x: 150, y: 130 },
    });
    
    const yaw = calculateYaw(landmarks);
    expect(yaw).toBeLessThan(0);
  });

  it('should calculate yaw for right turn', () => {
    const landmarks = createMockLandmarks({
      30: { x: 180, y: 130 },
    });
    
    const yaw = calculateYaw(landmarks);
    expect(yaw).toBeGreaterThan(0);
  });

  it('should calculate pitch for nod', () => {
    const landmarks = createMockLandmarks({
      30: { x: 165, y: 160 },
    });
    
    const pitch = calculatePitch(landmarks);
    expect(Math.abs(pitch)).toBeGreaterThan(0);
  });

  it('should calculate mouth ratio for smile', () => {
    const landmarks = createMockLandmarks({
      48: { x: 120, y: 180 },
      54: { x: 210, y: 180 },
      51: { x: 165, y: 175 },
      57: { x: 165, y: 188 },
    });
    
    const ratio = calculateMouthRatio(landmarks);
    expect(ratio).toBeGreaterThan(1.5);
  });
});