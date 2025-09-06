// src/modules/composer/composer-utilities/composer-attachments.ts
// Attachment handling for the composer

import { revokeUrl } from "./composer-dom-utils";

export function createAttachmentHandlers(
  preview: HTMLElement,
  attachments: any[],
  objectUrls: string[],
  emit: (event: any) => void,
  editor: HTMLElement
) {
  const addImageAttachment = (file: File) => {
    if (attachments.length >= 5) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.warn('Unsupported image type:', file.type);
      return;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      console.warn('File too large:', file.size);
      return;
    }
    
    const url = URL.createObjectURL(file);
    objectUrls.push(url);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      attachments.push({ kind: 'image', name: file.name || 'image', type: file.type || 'image/*', size: file.size || 0, dataUrl });
      const img = document.createElement('img');
      img.src = url;
      img.alt = file.name || 'pasted image';
      img.className = 'composer-preview-img';
      const onLoadOrError = () => revokeUrl(url, objectUrls);
      img.addEventListener('load', onLoadOrError, { once: true });
      img.addEventListener('error', onLoadOrError, { once: true });
      preview.appendChild(img);
      emit({ type: 'change', value: editor.innerHTML, attachments: attachments.slice() });
    };
    reader.readAsDataURL(file);
  };

  const clearAttachments = () => {
    while (preview.firstChild) preview.removeChild(preview.firstChild);
    attachments.splice(0, attachments.length);
    // Revoke any remaining object URLs
    for (const u of objectUrls.splice(0, objectUrls.length)) revokeUrl(u, objectUrls);
    emit({ type: 'change', value: editor.innerHTML, attachments: attachments.slice() });
  };

  return { addImageAttachment, clearAttachments };
}