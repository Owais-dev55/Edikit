/**
 * Video Download Utility
 * Handles downloading videos with progress tracking
 */

interface DownloadOptions {
  onProgress?: (progress: number) => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  filename?: string;
  useCredentials?: boolean; // Default: false for public URLs like Cloudinary
}

export const downloadVideo = async (
  videoUrl: string,
  options: DownloadOptions = {}
): Promise<void> => {
  const {
    onProgress,
    onSuccess,
    onError,
    filename = `video-${new Date().toISOString().slice(0, 10)}.mp4`,
    useCredentials = false, // Don't include credentials by default (CORS friendly)
  } = options;

  try {
    const xhr = new XMLHttpRequest();

    // Track download progress
    xhr.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        onProgress?.(percentComplete);
      }
    });

    // Handle successful download
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const blob = new Blob([xhr.response], { type: 'video/mp4' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
        onSuccess?.();
      } else {
        onError?.('Failed to download video');
      }
    });

    // Handle download error
    xhr.addEventListener('error', () => {
      console.error('Download error:', xhr.status);
      onError?.('Download failed. Please try again.');
    });

    // Handle abort
    xhr.addEventListener('abort', () => {
      onError?.('Download cancelled');
    });

    // Initiate download
    xhr.open('GET', videoUrl);
    xhr.responseType = 'arraybuffer';
    if (useCredentials) {
      xhr.withCredentials = true;
    }
    xhr.send();
  } catch (error) {
    console.error('Download error:', error);
    onError?.('Failed to download video');
  }
};

/**
 * Alternative download method using fetch API (for simple downloads without progress)
 */
export const quickDownloadVideo = async (
  videoUrl: string,
  filename?: string
): Promise<void> => {
  try {
    const response = await fetch(videoUrl, { credentials: 'include' });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `video-${new Date().toISOString().slice(0, 10)}.mp4`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Quick download error:', error);
    throw error;
  }
};
