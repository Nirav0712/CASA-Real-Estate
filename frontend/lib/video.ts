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
    error: 'Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)',
  };
}

export function validateVideoFile(file: File, maxMb = 50): { isValid: boolean; error?: string } {
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
