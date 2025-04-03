/**
 * Converts an image file to a Base64 string
 * @param {File} file - The image file
 * @return {Promise<string>} - Promise resolving to the Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      reject(new Error("File is not an image"));
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = () => {
      resolve(reader.result);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

/**
 * Extracts images from an HTML string and converts them to Base64
 * @param {string} htmlContent - HTML content with images
 * @return {Object} - Object with extracted Base64 images and cleaned HTML
 */
export const extractImagesFromHtml = (htmlContent) => {
  if (!htmlContent) return { html: '', images: {} };
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  const images = tempDiv.querySelectorAll('img');
  const extractedImages = {};
  
  images.forEach((img, index) => {
    const src = img.getAttribute('src');
    if (src && src.startsWith('data:image')) {
      const imgId = `img_${Date.now()}_${index}`;
      extractedImages[imgId] = src;
      
      // Replace the actual image with a placeholder
      img.setAttribute('data-img-id', imgId);
      img.removeAttribute('src');
    }
  });
  
  return {
    html: tempDiv.innerHTML,
    images: extractedImages
  };
};

/**
 * Restores Base64 images in HTML content
 * @param {string} htmlContent - HTML content with image placeholders
 * @param {Object} images - Object with image IDs and Base64 values
 * @return {string} - HTML with restored images
 */
export const restoreImagesInHtml = (htmlContent, images) => {
  if (!htmlContent) return '';
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  const imagePlaceholders = tempDiv.querySelectorAll('img[data-img-id]');
  
  imagePlaceholders.forEach(img => {
    const imgId = img.getAttribute('data-img-id');
    if (imgId && images[imgId]) {
      img.setAttribute('src', images[imgId]);
    }
  });
  
  return tempDiv.innerHTML;
};

/**
 * Extract Base64 image from HTML content for a specific field
 * @param {string} htmlContent - HTML content
 * @return {string|null} - Base64 image or null if not found
 */
export const extractFirstImageFromHtml = (htmlContent) => {
  if (!htmlContent) return null;
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  const img = tempDiv.querySelector('img');
  if (img && img.src && img.src.startsWith('data:image')) {
    return img.src;
  }
  
  return null;
};

/**
 * Generates a unique ID for field images
 * @param {string} field - The field name
 * @return {string} - A unique image ID
 */
export const generateFieldImageId = (field) => {
  return `${field}_img_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}; 