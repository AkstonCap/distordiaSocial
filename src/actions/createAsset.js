import { secureApiCall, showSuccessDialog, showErrorDialog } from 'nexus-module';
import {
  splitArticleText,
  getAssetCount,
  MAX_ARTICLE_CHARS,
  ARTICLE_ROOT_TEXT_MAX,
  ARTICLE_CHUNK_TEXT_MAX,
} from '../utils/articleUtils';

/**
 * Create a social post asset following the Distordia Social Post Standard.
 * Uses JSON format with proper field definitions per social-standard.json.
 *
 * @param {Object} postData - The post data
 * @param {string} postData.text - Post content (max 512 chars)
 * @param {string} [postData.replyTo] - Address of post being replied to
 * @param {string} [postData.quote] - Address of post being quoted
 * @param {string} [postData.cw] - Content warning text
 * @param {Function} [onSuccess] - Success callback
 * @param {Function} [onError] - Error callback
 */
export const createPost = async (postData, onSuccess = () => {}, onError = () => {}) => {
  try {
    if (!postData.text || !postData.text.trim()) {
      showErrorDialog({
        message: 'Post cannot be empty',
        note: 'Please enter some text for your post.',
      });
      return;
    }

    if (postData.text.length > 512) {
      showErrorDialog({
        message: 'Post too long',
        note: 'Maximum 512 characters allowed.',
      });
      return;
    }

    // Build JSON fields per Distordia Social Post Standard
    const json = [
      {
        name: 'distordia-type',
        type: 'string',
        value: 'distordia-post',
        mutable: false,
        maxlength: 16,
      },
      {
        name: 'distordia-status',
        type: 'string',
        value: 'official',
        mutable: true,
        maxlength: 16,
      },
      {
        name: 'text',
        type: 'string',
        value: postData.text,
        mutable: false,
        maxlength: 512,
      },
      {
        name: 'cw',
        type: 'string',
        value: postData.cw || '',
        mutable: false,
        maxlength: 64,
      },
      {
        name: 'reply-to',
        type: 'string',
        value: postData.replyTo || '',
        mutable: false,
        maxlength: 64,
      },
      {
        name: 'quote',
        type: 'string',
        value: postData.quote || '',
        mutable: false,
        maxlength: 64,
      },
      {
        name: 'repost',
        type: 'string',
        value: '',
        mutable: false,
        maxlength: 64,
      },
      {
        name: 'tags',
        type: 'string',
        value: postData.tags || '',
        mutable: false,
        maxlength: 128,
      },
      {
        name: 'lang',
        type: 'string',
        value: 'en',
        mutable: false,
        maxlength: 2,
      },
    ];

    const result = await secureApiCall('assets/create/asset', {
      format: 'JSON',
      json: JSON.stringify(json),
    });

    showSuccessDialog({
      message: 'Post Published',
      note: `Your post is now on-chain. TX: ${result.txid?.slice(0, 16)}...`,
    });

    onSuccess(result);
    return result;
  } catch (error) {
    showErrorDialog({
      message: 'Failed to create post',
      note: error?.message || 'Unknown error',
    });

    onError(error);
    throw error;
  }
};

/**
 * Create a long-form article as a linked chain of on-chain assets.
 *
 * The article is split into chunks that each fit within the Nexus 1KB register
 * limit. A root asset (distordia-article) holds metadata and the first text
 * chunk, while continuation assets (distordia-article-chunk) each hold
 * subsequent text and a `next` pointer to the following chunk, forming a
 * singly-linked list.
 *
 * Chunks are created in reverse order (last chunk first) so each chunk
 * can reference the address of the next one.
 *
 * @param {Object} articleData
 * @param {string} articleData.title - Article title (max 64 chars)
 * @param {string} articleData.text  - Full article text (max MAX_ARTICLE_CHARS)
 * @param {string} [articleData.replyTo] - Address of post being replied to
 * @param {string} [articleData.quote]   - Address of post being quoted
 * @param {string} [articleData.cw]      - Content warning text
 * @param {string} [articleData.tags]    - Tags
 * @param {Function} [onProgress] - Called with (createdCount, totalCount) after each asset
 * @param {Function} [onSuccess]  - Success callback
 * @param {Function} [onError]    - Error callback
 */
export const createArticle = async (
  articleData,
  onProgress = () => {},
  onSuccess = () => {},
  onError = () => {}
) => {
  try {
    if (!articleData.text || !articleData.text.trim()) {
      showErrorDialog({
        message: 'Article cannot be empty',
        note: 'Please enter some text for your article.',
      });
      return;
    }

    if (!articleData.title || !articleData.title.trim()) {
      showErrorDialog({
        message: 'Title required',
        note: 'Please enter a title for your article.',
      });
      return;
    }

    if (articleData.title.length > 64) {
      showErrorDialog({
        message: 'Title too long',
        note: 'Maximum 64 characters allowed for the title.',
      });
      return;
    }

    if (articleData.text.length > MAX_ARTICLE_CHARS) {
      showErrorDialog({
        message: 'Article too long',
        note: `Maximum ${MAX_ARTICLE_CHARS} characters allowed.`,
      });
      return;
    }

    const chunks = splitArticleText(articleData.text.trim());
    const totalAssets = chunks.length;

    // Create chunk assets in reverse order so each can reference the next.
    // The last chunk has next = "" (end of chain).
    let nextAddress = '';
    const chunkResults = [];

    for (let i = chunks.length - 1; i >= 1; i--) {
      const chunkJson = [
        {
          name: 'distordia-type',
          type: 'string',
          value: 'distordia-article-chunk',
          mutable: false,
          maxlength: 32,
        },
        {
          name: 'distordia-status',
          type: 'string',
          value: 'official',
          mutable: true,
          maxlength: 16,
        },
        {
          name: 'text',
          type: 'string',
          value: chunks[i],
          mutable: false,
          maxlength: ARTICLE_CHUNK_TEXT_MAX,
        },
        {
          name: 'next',
          type: 'string',
          value: nextAddress,
          mutable: false,
          maxlength: 64,
        },
      ];

      const chunkResult = await secureApiCall('assets/create/asset', {
        format: 'JSON',
        json: JSON.stringify(chunkJson),
      });

      nextAddress = chunkResult.address;
      chunkResults.push(chunkResult);
      onProgress(chunkResults.length, totalAssets);
    }

    // Create the root article asset pointing to the first chunk (if any).
    const rootJson = [
      {
        name: 'distordia-type',
        type: 'string',
        value: 'distordia-article',
        mutable: false,
        maxlength: 24,
      },
      {
        name: 'distordia-status',
        type: 'string',
        value: 'official',
        mutable: true,
        maxlength: 16,
      },
      {
        name: 'title',
        type: 'string',
        value: articleData.title.trim(),
        mutable: false,
        maxlength: 64,
      },
      {
        name: 'text',
        type: 'string',
        value: chunks[0],
        mutable: false,
        maxlength: ARTICLE_ROOT_TEXT_MAX,
      },
      {
        name: 'cw',
        type: 'string',
        value: articleData.cw || '',
        mutable: false,
        maxlength: 64,
      },
      {
        name: 'reply-to',
        type: 'string',
        value: articleData.replyTo || '',
        mutable: false,
        maxlength: 64,
      },
      {
        name: 'quote',
        type: 'string',
        value: articleData.quote || '',
        mutable: false,
        maxlength: 64,
      },
      {
        name: 'tags',
        type: 'string',
        value: articleData.tags || '',
        mutable: false,
        maxlength: 128,
      },
      {
        name: 'lang',
        type: 'string',
        value: 'en',
        mutable: false,
        maxlength: 2,
      },
      {
        name: 'next',
        type: 'string',
        value: nextAddress,
        mutable: false,
        maxlength: 64,
      },
    ];

    const rootResult = await secureApiCall('assets/create/asset', {
      format: 'JSON',
      json: JSON.stringify(rootJson),
    });

    onProgress(totalAssets, totalAssets);

    const costNXS = totalAssets;
    showSuccessDialog({
      message: 'Article Published',
      note: `Your article is now on-chain (${totalAssets} asset${totalAssets > 1 ? 's' : ''}, ${costNXS} NXS). TX: ${rootResult.txid?.slice(0, 16)}...`,
    });

    onSuccess(rootResult);
    return rootResult;
  } catch (error) {
    showErrorDialog({
      message: 'Failed to create article',
      note: error?.message || 'Unknown error',
    });

    onError(error);
    throw error;
  }
};
