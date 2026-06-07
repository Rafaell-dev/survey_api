import { MediaType } from '@prisma/client';

export const MEDIA_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10 MB
  AUDIO: 50 * 1024 * 1024, // 50 MB
  VIDEO: 200 * 1024 * 1024 // 200 MB
};

export const ALLOWED_MIME_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime'] // quicktime = .mov
};

export function getMediaTypeFromMimeType(mimeType: string): MediaType | null {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  return null;
}

export function validateMediaFile(mimeType: string, fileSize: number): { valid: boolean; error?: string; mediaType?: MediaType } {
  const mediaType = getMediaTypeFromMimeType(mimeType);

  if (!mediaType) {
    return { valid: false, error: 'Formato não suportado. Envie imagens, áudios ou vídeos válidos.' };
  }

  if (!ALLOWED_MIME_TYPES[mediaType].includes(mimeType)) {
    return { valid: false, error: `MimeType '${mimeType}' não é permitido para ${mediaType}.` };
  }

  const limit = MEDIA_LIMITS[mediaType];
  if (fileSize > limit) {
    return { valid: false, error: `O arquivo excedeu o limite de tamanho para ${mediaType} (${limit / 1024 / 1024}MB).` };
  }

  return { valid: true, mediaType };
}
