'use client';

import * as React from 'react';
import {
  Video,
  Play,
  Upload,
  Link2,
  Check,
  AlertCircle,
  X,
  ExternalLink,
  Film,
  Sparkles,
  Loader2,
  Info,
} from 'lucide-react';
import {
  parseYouTubeUrl,
  parseInstagramUrl,
  detectVideoSource,
  validateVideoFile,
  VideoSourceType,
} from '@/lib/video';
import { uploadPropertyVideo } from '@/services/property-service';
import { useToast } from '@/contexts/toast-context';

export interface PropertyVideoManagerProps {
  videoUrl: string;
  isReelFormat: boolean;
  videoType?: 'YOUTUBE' | 'INSTAGRAM' | 'LOCAL' | string;
  onChange: (data: {
    videoUrl: string;
    isReelFormat: boolean;
    videoType?: string;
  }) => void;
}

export function PropertyVideoManager({
  videoUrl,
  isReelFormat,
  videoType,
  onChange,
}: PropertyVideoManagerProps) {
  const toast = useToast();

  // Active source mode: 'YOUTUBE' | 'INSTAGRAM' | 'UPLOAD'
  const initialMode = React.useMemo(() => {
    if (!videoUrl) return 'YOUTUBE';
    const detected = detectVideoSource(videoUrl);
    if (detected === 'INSTAGRAM') return 'INSTAGRAM';
    if (detected === 'LOCAL') return 'UPLOAD';
    return 'YOUTUBE';
  }, [videoUrl]);

  const [activeTab, setActiveTab] = React.useState<'YOUTUBE' | 'INSTAGRAM' | 'UPLOAD'>(initialMode);
  const [youtubeInput, setYoutubeInput] = React.useState(
    detectVideoSource(videoUrl) === 'YOUTUBE' ? videoUrl : '',
  );
  const [instagramInput, setInstagramInput] = React.useState(
    detectVideoSource(videoUrl) === 'INSTAGRAM' ? videoUrl : '',
  );

  // File upload state
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploadSuccessUrl, setUploadSuccessUrl] = React.useState<string | null>(
    detectVideoSource(videoUrl) === 'LOCAL' ? videoUrl : null,
  );

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync inputs if parent videoUrl changes externally
  React.useEffect(() => {
    if (!videoUrl) {
      setYoutubeInput('');
      setInstagramInput('');
      setUploadSuccessUrl(null);
      setSelectedFile(null);
      return;
    }
    const detected = detectVideoSource(videoUrl);
    if (detected === 'YOUTUBE') {
      setYoutubeInput(videoUrl);
      setActiveTab('YOUTUBE');
    } else if (detected === 'INSTAGRAM') {
      setInstagramInput(videoUrl);
      setActiveTab('INSTAGRAM');
    } else if (detected === 'LOCAL') {
      setUploadSuccessUrl(videoUrl);
      setActiveTab('UPLOAD');
    }
  }, [videoUrl]);

  // YouTube live parsed result
  const youtubeParsed = React.useMemo(() => {
    if (!youtubeInput.trim()) return null;
    return parseYouTubeUrl(youtubeInput.trim());
  }, [youtubeInput]);

  // Instagram live parsed result
  const instagramParsed = React.useMemo(() => {
    if (!instagramInput.trim()) return null;
    return parseInstagramUrl(instagramInput.trim());
  }, [instagramInput]);

  // Handle YouTube URL submission
  const applyYouTubeUrl = (url: string) => {
    setYoutubeInput(url);
    if (!url.trim()) {
      onChange({ videoUrl: '', isReelFormat, videoType: '' });
      return;
    }
    const parsed = parseYouTubeUrl(url.trim());
    if (parsed.isValid) {
      onChange({
        videoUrl: url.trim(),
        isReelFormat: true, // Default to true for 9:16 Shorts/Reels
        videoType: 'YOUTUBE',
      });
      toast.success('YouTube Video Attached', 'Valid YouTube video/Short attached to listing.');
    }
  };

  // Handle Instagram URL submission
  const applyInstagramUrl = (url: string) => {
    setInstagramInput(url);
    if (!url.trim()) {
      onChange({ videoUrl: '', isReelFormat, videoType: '' });
      return;
    }
    const parsed = parseInstagramUrl(url.trim());
    if (parsed.isValid) {
      onChange({
        videoUrl: parsed.directUrl || url.trim(),
        isReelFormat: true, // Instagram Reels are 9:16
        videoType: 'INSTAGRAM',
      });
      toast.success('Instagram Reel Attached', 'Valid Instagram Reel link attached to listing.');
    }
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = validateVideoFile(file, 100);
    if (!validation.isValid) {
      setUploadError(validation.error || 'Invalid video file');
      toast.error('File Error', validation.error || 'Invalid video file');
      return;
    }

    setSelectedFile(file);
  };

  // Handle video upload to backend persistent storage
  const handleStartUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const res = await uploadPropertyVideo(selectedFile, (percent) => {
        setUploadProgress(percent);
      });

      setUploadSuccessUrl(res.url);
      onChange({
        videoUrl: res.url,
        isReelFormat: true,
        videoType: 'LOCAL',
      });
      toast.success('Video Uploaded', 'Video file successfully uploaded to persistent cloud storage.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Video upload failed.';
      setUploadError(msg);
      toast.error('Upload Error', msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Clear current video
  const handleRemoveVideo = () => {
    setYoutubeInput('');
    setInstagramInput('');
    setSelectedFile(null);
    setUploadSuccessUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange({ videoUrl: '', isReelFormat, videoType: '' });
    toast.info('Video Removed', 'Attached property video has been cleared.');
  };

  const currentSourceType = detectVideoSource(videoUrl);

  return (
    <div className="space-y-4">
      {/* Header and 9:16 toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-casa-text-primary flex items-center gap-1.5">
            <Video className="w-4 h-4 text-casa-brand" />
            <span>Property Video & 9:16 Video Reels (Optional)</span>
          </h3>
          <p className="text-[11px] text-casa-text-secondary mt-0.5">
            Attach a YouTube video/Short, an Instagram Reel, or upload an MP4/WebM file. Valid videos appear in the live Video Reels section on the homepage.
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-casa-text-primary bg-casa-surface border border-casa-border-light px-3 py-1.5 rounded-xl hover:border-casa-brand/40 transition-colors">
          <input
            type="checkbox"
            checked={isReelFormat}
            onChange={(e) => onChange({ videoUrl, isReelFormat: e.target.checked, videoType })}
            className="w-4 h-4 text-casa-brand rounded focus:ring-casa-brand cursor-pointer"
          />
          <span>9:16 Vertical Reel</span>
        </label>
      </div>

      {/* Source Selector Tabs */}
      <div className="flex items-center gap-1 p-1 bg-casa-surface border border-casa-border-light rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('YOUTUBE')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'YOUTUBE'
              ? 'bg-red-600 text-white shadow-2xs'
              : 'text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>YouTube URL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('INSTAGRAM')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'INSTAGRAM'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xs'
              : 'text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Instagram Reel</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('UPLOAD')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'UPLOAD'
              ? 'bg-casa-brand text-white shadow-2xs'
              : 'text-casa-text-secondary hover:text-casa-text-primary hover:bg-casa-subtle'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Video File</span>
        </button>
      </div>

      {/* TAB 1: YouTube */}
      {activeTab === 'YOUTUBE' && (
        <div className="space-y-3 p-4 bg-casa-surface border border-casa-border-light rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-casa-text-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span>YouTube Video or Short</span>
            </span>
            <span className="text-[10px] text-casa-text-muted">Supports watch, shorts, youtu.be, and embed URLs</span>
          </div>

          <div className="relative">
            <input
              type="url"
              placeholder="e.g. https://www.youtube.com/shorts/aqz-KE-bpKQ or https://youtu.be/..."
              value={youtubeInput}
              onChange={(e) => applyYouTubeUrl(e.target.value)}
              className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary placeholder:text-casa-text-muted focus:outline-none focus:border-casa-brand"
            />
            {youtubeParsed?.isValid && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>

          {youtubeInput && !youtubeParsed?.isValid && (
            <p className="text-[11px] text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{youtubeParsed?.error || 'Invalid YouTube URL format.'}</span>
            </p>
          )}

          {youtubeParsed?.isValid && (
            <div className="flex items-center gap-3 p-3 bg-casa-canvas rounded-xl border border-casa-border-light text-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={youtubeParsed.thumbnailUrl}
                alt="YouTube Preview"
                className="w-20 h-14 object-cover rounded-lg border border-casa-border-light flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-casa-text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Valid YouTube Video ID: {youtubeParsed.videoId}</span>
                </p>
                <p className="text-[11px] text-casa-text-secondary truncate mt-0.5">
                  Embed URL: {youtubeParsed.embedUrl}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Instagram Reel */}
      {activeTab === 'INSTAGRAM' && (
        <div className="space-y-3 p-4 bg-casa-surface border border-casa-border-light rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-casa-text-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-600" />
              <span>Instagram Reel or Video</span>
            </span>
            <span className="text-[10px] text-casa-text-muted">Supports public Instagram Reels & Posts</span>
          </div>

          <div className="relative">
            <input
              type="url"
              placeholder="e.g. https://www.instagram.com/reel/C-xyz123/ or https://www.instagram.com/p/..."
              value={instagramInput}
              onChange={(e) => applyInstagramUrl(e.target.value)}
              className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary placeholder:text-casa-text-muted focus:outline-none focus:border-casa-brand"
            />
            {instagramParsed?.isValid && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>

          {instagramInput && !instagramParsed?.isValid && (
            <p className="text-[11px] text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{instagramParsed?.error || 'Invalid Instagram Reel format.'}</span>
            </p>
          )}

          {instagramParsed?.isValid && (
            <div className="p-3 bg-casa-canvas rounded-xl border border-casa-border-light text-xs space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-casa-text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Instagram {instagramParsed.type?.toUpperCase()} Ready: {instagramParsed.shortcode}</span>
                </p>
                {instagramParsed.directUrl && (
                  <a
                    href={instagramParsed.directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-pink-600 hover:underline font-semibold"
                  >
                    <span>View on Instagram</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-[11px] text-casa-text-secondary flex items-start gap-1">
                <Info className="w-3.5 h-3.5 text-casa-brand flex-shrink-0 mt-0.5" />
                <span>
                  Please ensure the Instagram Reel is from a <strong>public account</strong>. Private or restricted accounts cannot be embedded by Instagram.
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Upload Local Video File */}
      {activeTab === 'UPLOAD' && (
        <div className="space-y-3 p-4 bg-casa-surface border border-casa-border-light rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-casa-text-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-casa-brand" />
              <span>Upload Video from Computer</span>
            </span>
            <span className="text-[10px] text-casa-text-muted">Formats: MP4, WebM, MOV (Max: 100MB)</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/ogg,.mp4,.webm,.mov"
            onChange={handleFileChange}
            className="hidden"
            id="property-video-file-input"
          />

          {!selectedFile && !uploadSuccessUrl && (
            <label
              htmlFor="property-video-file-input"
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-casa-border-light hover:border-casa-brand/60 rounded-xl bg-casa-canvas cursor-pointer transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-casa-brand-subtle text-casa-brand flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-casa-text-primary">Click to select a video file</span>
              <span className="text-[11px] text-casa-text-secondary mt-0.5">MP4 or WebM format up to 100MB</span>
            </label>
          )}

          {selectedFile && !uploadSuccessUrl && (
            <div className="p-3 bg-casa-canvas rounded-xl border border-casa-border-light space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Film className="w-4 h-4 text-casa-brand flex-shrink-0" />
                  <span className="font-semibold text-casa-text-primary truncate">{selectedFile.name}</span>
                  <span className="text-[11px] text-casa-text-muted flex-shrink-0">
                    ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-casa-text-muted hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isUploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-casa-text-secondary font-medium">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin text-casa-brand" />
                      <span>Uploading to persistent storage...</span>
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-casa-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full bg-casa-brand transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {!isUploading && (
                <button
                  type="button"
                  onClick={handleStartUpload}
                  className="w-full py-2 px-3 rounded-lg bg-casa-brand hover:bg-casa-brand-hover text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Video to Cloud Storage</span>
                </button>
              )}
            </div>
          )}

          {uploadError && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Storage Notice</p>
                <p className="text-[11px] leading-relaxed">{uploadError}</p>
                <p className="text-[10px] text-casa-text-muted mt-1">
                  Tip: You can always paste a public <strong>YouTube Short</strong> or <strong>Instagram Reel</strong> URL instead!
                </p>
              </div>
            </div>
          )}

          {uploadSuccessUrl && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-2 text-emerald-700 dark:text-emerald-400">
              <div className="flex items-center justify-between">
                <p className="font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Video File Stored & Attached</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setUploadSuccessUrl(null);
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    onChange({ videoUrl: '', isReelFormat, videoType: '' });
                  }}
                  className="text-xs font-semibold hover:underline"
                >
                  Replace
                </button>
              </div>
              <p className="text-[11px] truncate opacity-80">{uploadSuccessUrl}</p>
            </div>
          )}
        </div>
      )}

      {/* ACTIVE VIDEO SUMMARY & PREVIEW BOX */}
      {videoUrl && (
        <div className="p-3.5 bg-casa-surface border border-casa-brand/30 rounded-xl space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="font-bold text-xs text-casa-text-primary">Attached Video:</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-casa-brand-subtle text-casa-brand uppercase tracking-wider text-[10px]">
                {currentSourceType}
              </span>
              {isReelFormat && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  9:16 Reel
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleRemoveVideo}
              className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove Video</span>
            </button>
          </div>

          <p className="text-xs text-casa-text-secondary truncate font-mono bg-casa-canvas p-2 rounded-lg border border-casa-border-light">
            {videoUrl}
          </p>

          {/* Inline Media Player Preview */}
          <div className="pt-2 border-t border-casa-border-light">
            <p className="text-[11px] font-semibold text-casa-text-muted mb-2">Live Player Preview:</p>
            <div className="relative w-full max-w-sm mx-auto aspect-[9/16] bg-black rounded-xl overflow-hidden border border-casa-border-light shadow-md flex items-center justify-center">
              {currentSourceType === 'YOUTUBE' && youtubeParsed?.embedUrl ? (
                <iframe
                  src={youtubeParsed.embedUrl}
                  title="YouTube Preview"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : currentSourceType === 'INSTAGRAM' && instagramParsed?.embedUrl ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
                  <iframe
                    src={instagramParsed.embedUrl}
                    title="Instagram Reel Preview"
                    className="w-full h-full border-0"
                    allow="encrypted-media"
                    allowFullScreen
                  />
                  <div className="absolute bottom-2 left-2 right-2 flex justify-center">
                    <a
                      href={instagramParsed.directUrl || videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-full bg-pink-600 text-white text-[10px] font-bold shadow flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open on Instagram</span>
                    </a>
                  </div>
                </div>
              ) : (
                <video
                  src={videoUrl}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
