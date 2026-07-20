import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hexToHSL(hex: string) {
  // Remove the hash if present
  hex = hex.replace(/^#/, '');

  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }

  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function generateThemeVariables(hex: string) {
  const { h, s, l } = hexToHSL(hex);
  
  // Format helper
  const hslStr = (h: number, s: number, l: number) => `${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%`;

  return {
    "--primary": hslStr(h, s, l),
    // Background: Very light, slightly tinted with primary color (e.g. 98% lightness)
    "--background": hslStr(h, Math.min(s, 20), 98),
    // Card: Slightly darker than background or pure white (e.g. 100% lightness)
    "--card": hslStr(h, Math.min(s, 10), 100),
    // Muted: For secondary backgrounds, stronger tint (e.g. 95% lightness)
    "--muted": hslStr(h, Math.min(s, 30), 95),
    // Border: Muted border color
    "--border": hslStr(h, Math.min(s, 20), 90),
    // Text: Dark, slightly tinted text for better integration
    "--foreground": hslStr(h, Math.min(s, 15), 10),
    "--muted-foreground": hslStr(h, Math.min(s, 15), 45),
  };
}