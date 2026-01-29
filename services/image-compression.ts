/**
 * Utility functions for image processing and compression
 */

/**
 * Compress an image by resizing it if it exceeds certain dimensions or file size
 * @param imageDataUrl The original image as a data URL
 * @param maxWidth Maximum width of the image
 * @param maxHeight Maximum height of the image
 * @param maxSizeKB Maximum file size in kilobytes
 * @returns A promise that resolves to the compressed image data URL
 */
export const compressImage = (
  imageDataUrl: string, 
  maxWidth: number = 480,
  maxHeight: number = 270,
  maxSizeKB: number = 50
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageDataUrl;
    
    img.onload = () => {
      // Check if image exceeds dimensions
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions if needed
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageDataUrl); // Return original if context fails
        return;
      }
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Start with high quality and progressively reduce if needed
      let quality = 0.85;
      let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      
      // Check if the file size is still too large
      const sizeKB = getDataUrlSizeKB(compressedDataUrl);
      
      if (sizeKB > maxSizeKB) {
        // Binary search for optimal quality
        let low = 0.1;
        let high = quality;
        
        while (high - low > 0.01) {
          quality = (low + high) / 2;
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          
          const currentSizeKB = getDataUrlSizeKB(compressedDataUrl);
          
          if (currentSizeKB > maxSizeKB) {
            high = quality;
          } else {
            low = quality;
          }
        }
        
        // Final check with the found quality
        compressedDataUrl = canvas.toDataURL('image/jpeg', low);
      }
      
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      resolve(imageDataUrl); // Return original on error
    };
  });
};

/**
 * Calculate the approximate size of a data URL in KB
 * @param dataUrl The data URL to measure
 * @returns Size in kilobytes
 */
const getDataUrlSizeKB = (dataUrl: string): number => {
  // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
  const base64String = dataUrl.split(',')[1];
  
  // Calculate approximate size
  const padding = (base64String.match(/=/g) || []).length;
  const sizeInBytes = (base64String.length * 3) / 4 - padding;
  
  return sizeInBytes / 1024;
};