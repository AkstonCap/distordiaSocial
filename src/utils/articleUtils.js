import { apiCall } from 'nexus-module';

// Size limits (in characters) aligned to Nexus 1KB register limit.
// Root asset has more metadata fields so gets less text space.
// Chunk assets are lean and carry more text.
export const ARTICLE_ROOT_TEXT_MAX = 384;
export const ARTICLE_CHUNK_TEXT_MAX = 768;
export const MAX_ARTICLE_CHARS = 5000;
export const MAX_POST_CHARS = 512;

/**
 * Split article text into chunks for the linked-list asset structure.
 * The first chunk goes into the root article asset, subsequent chunks
 * go into continuation (chunk) assets.
 *
 * @param {string} text - The full article text
 * @returns {string[]} Array of text chunks (first = root, rest = chunks)
 */
export function splitArticleText(text) {
  if (text.length <= ARTICLE_ROOT_TEXT_MAX) {
    return [text];
  }

  const chunks = [];
  chunks.push(text.slice(0, ARTICLE_ROOT_TEXT_MAX));
  let remaining = text.slice(ARTICLE_ROOT_TEXT_MAX);

  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, ARTICLE_CHUNK_TEXT_MAX));
    remaining = remaining.slice(ARTICLE_CHUNK_TEXT_MAX);
  }

  return chunks;
}

/**
 * Calculate the number of on-chain assets needed for an article.
 *
 * @param {number} textLength - Character count of the full article text
 * @returns {number} Number of assets (each costs 1 NXS)
 */
export function getAssetCount(textLength) {
  if (textLength <= ARTICLE_ROOT_TEXT_MAX) return 1;
  return 1 + Math.ceil((textLength - ARTICLE_ROOT_TEXT_MAX) / ARTICLE_CHUNK_TEXT_MAX);
}

/**
 * Check if a fetched post object is an article root.
 */
export function isArticle(post) {
  return post['distordia-type'] === 'distordia-article';
}

/**
 * Check if a fetched post object is an article chunk (continuation).
 */
export function isArticleChunk(post) {
  return post['distordia-type'] === 'distordia-article-chunk';
}

/**
 * Reassemble the full article text by following the linked-list of chunks
 * starting from the root article asset.
 *
 * @param {Object} rootPost - The root article asset object
 * @returns {Promise<string>} The complete concatenated text
 */
export async function reassembleArticle(rootPost) {
  let fullText = rootPost.text || '';
  let nextAddress = rootPost.next || '';

  while (nextAddress && nextAddress !== '') {
    try {
      const chunk = await apiCall('register/get/assets:asset', {
        address: nextAddress,
      });
      if (chunk) {
        fullText += chunk.text || '';
        nextAddress = chunk.next || '';
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  return fullText;
}
