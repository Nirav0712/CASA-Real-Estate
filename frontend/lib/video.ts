/**
 * myproperty — Video Processing & Validation Utility
 */

export interface ParsedYouTubeResult {
  isValid: boolean;
  videoId?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

export interface ParsedInstagramResult {
  isValid: boolean;
  shortcode?: string;
  type?: 'reel' | 'post' | 'tv';
  embedUrl?: string;
  directUrl?: string;
  error?: string;
}

export type VideoSourceType = 'YOUTUBE' | 'INSTAGRAM' | 'LOCAL' | 'UNKNOWN';

export function parseYouTubeUrl(rawUrl: string): ParsedYouTubeResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'Empty video URL provided' };
  }

  const url = rawUrl.trim();

  // Pattern matching standard watch, shortened, embed, and shorts URLs
  const patterns = [
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const regex of patterns) {
    const match = url.match(regex);
    if (match && match[1]) {
      const videoId = match[1];
      return {
        isValid: true,
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&playsinline=1&rel=0&modestbranding=1`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
  }

  // Handle raw 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return {
      isValid: true,
      videoId: url,
      embedUrl: `https://www.youtube.com/embed/${url}?autoplay=1&mute=0&playsinline=1&rel=0&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${url}/hqdefault.jpg`,
    };
  }

  // Fallback for any URL containing youtu and an 11-char sequence
  if (url.includes('youtu.be') || url.includes('youtube.com')) {
    const fallbackMatch = url.match(/([a-zA-Z0-9_-]{11})/);
    if (fallbackMatch && fallbackMatch[1]) {
      const videoId = fallbackMatch[1];
      return {
        isValid: true,
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&playsinline=1&rel=0&modestbranding=1`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
  }

  return {
    isValid: false,
    error: 'Please enter a valid YouTube URL (e.g., https://www.youtube.com/shorts/... or https://youtu.be/...)',
  };
}

export function parseInstagramUrl(rawUrl: string): ParsedInstagramResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'Empty Instagram URL provided' };
  }

  const url = rawUrl.trim();

  // Pattern matching Instagram Reel, Post, or TV URLs:
  // e.g. https://www.instagram.com/reel/C-xyz123/
  // e.g. https://instagram.com/p/C-xyz123/?igsh=...
  // e.g. https://instagr.am/reel/C-xyz123/
  const regex = /(?:https?:\/\/)?(?:www\.|m\.)?(?:instagram\.com|instagr\.am)\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);

  if (match && match[1]) {
    const shortcode = match[1];
    let type: 'reel' | 'post' | 'tv' = 'reel';
    if (url.includes('/tv/')) type = 'tv';
    else if (url.includes('/p/')) type = 'post';

    return {
      isValid: true,
      shortcode,
      type,
      embedUrl: `https://www.instagram.com/reel/${shortcode}/embed/`,
      directUrl: `https://www.instagram.com/reel/${shortcode}/`,
    };
  }

  return {
    isValid: false,
    error: 'Please enter a valid Instagram Reel or video URL (e.g., https://www.instagram.com/reel/C-xyz123/ or https://www.instagram.com/p/...)',
  };
}

export function detectVideoSource(url: string): VideoSourceType {
  if (!url || typeof url !== 'string') return 'UNKNOWN';
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.includes('youtube.com') ||
    trimmed.includes('youtu.be') ||
    trimmed.includes('youtube-nocookie.com')
  ) {
    return 'YOUTUBE';
  }
  if (trimmed.includes('instagram.com') || trimmed.includes('instagr.am')) {
    return 'INSTAGRAM';
  }
  if (
    trimmed.match(/\.(mp4|webm|mov|ogg|m4v)(\?|$)/i) ||
    trimmed.includes('imagekit.io') ||
    trimmed.includes('cloudinary.com') ||
    trimmed.includes('amazonaws.com')
  ) {
    return 'LOCAL';
  }
  return 'UNKNOWN';
}

export function validateVideoFile(file: File, maxMb = 100): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No video file selected' };
  }

  const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/x-m4v'];
  if (!allowedMimeTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(mp4|webm|mov|ogg|m4v)$/i)) {
    return {
      isValid: false,
      error: 'Unsupported video format. Please upload MP4, WebM, or MOV.',
    };
  }

  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      isValid: false,
      error: `Video size exceeds ${maxMb}MB limit. (Selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
    };
  }

  return { isValid: true };
}
