import { secureApiCall, showSuccessDialog, showErrorDialog } from 'nexus-module';
import {
  splitArticleText,
  getAssetCount,
  MAX_ARTICLE_CHARS,
  ARTICLE_ROOT_TEXT_MAX,
  ARTICLE_CHUNK_TEXT_MAX,
} from '../utils/articleUtils';

/**
 * Create a short comment asset (formerly "post").
 * Uses JSON format with proper field definitions.
 *
 * @param {Object} postData - The comment data
 * @param {string} postData.text - Comment content (max 512 chars)
 * @param {string} [postData.replyTo] - Address of post being replied to
 * @param {string} [postData.quote] - Address of post being quoted/cited
 * @param {string} [postData.cw] - Content warning text
 * @param {Function} [onSuccess] - Success callback
 * @param {Function} [onError] - Error callback
 */
export const createPost = async (postData, onSuccess = () => {}, onError = () => {}) => {
  try {
    if (!postData.text || !postData.text.trim()) {
      showErrorDialog({
        message: 'Comment cannot be empty',
        note: 'Please enter some text for your comment.',
      });
      return;
    }

    if (postData.text.length > 512) {
      showErrorDialog({
        message: 'Comment too long',
        note: 'Maximum 512 characters allowed.',
      });
      return;
    }

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
      message: 'Comment Published',
      note: `Your comment is now on-chain. TX: ${result.txid?.slice(0, 16)}...`,
    });

    onSuccess(result);
    return result;
  } catch (error) {
    showErrorDialog({
      message: 'Failed to create comment',
      note: error?.message || 'Unknown error',
    });

    onError(error);
    throw error;
  }
};

/**
 * Create a long-form research article as a linked chain of on-chain assets.
 *
 * The article is split into chunks that each fit within the Nexus 1KB register
 * limit. A root asset (distordia-article) holds metadata and the first text
 * chunk, while continuation assets (distordia-article-chunk) each hold
 * subsequent text and a `next` pointer to the following chunk.
 *
 * The root article includes a `tip-account` field so readers can send NXS
 * tips to the author's receiving account.
 *
 * @param {Object} articleData
 * @param {string} articleData.title    - Article title (max 64 chars)
 * @param {string} articleData.text     - Full article text (max MAX_ARTICLE_CHARS)
 * @param {string} [articleData.abstract] - Article abstract/summary (max 200 chars)
 * @param {string} [articleData.replyTo]  - Address of article being replied to
 * @param {string} [articleData.quote]    - Address of article being cited
 * @param {string} [articleData.cw]       - Content warning text
 * @param {string} [articleData.tags]     - Tags
 * @param {string} [articleData.tipAccount] - NXS account address for receiving tips
 * @param {Function} [onProgress] - Called with (createdCount, totalCount)
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
        name: 'abstract',
        type: 'string',
        value: articleData.abstract || '',
        mutable: false,
        maxlength: 200,
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
      {
        name: 'tip-account',
        type: 'string',
        value: articleData.tipAccount || '',
        mutable: true,
        maxlength: 128,
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

/**
 * Send a NXS tip to an article author.
 *
 * Uses finance/debit/account to send NXS from the tipper's account
 * to the article creator's tip-account address.
 *
 * @param {Object} tipData
 * @param {string} tipData.from    - Sender's NXS account address or name
 * @param {string} tipData.to      - Recipient's tip account address (from article asset)
 * @param {number} tipData.amount  - Amount of NXS to tip
 * @param {string} [tipData.articleAddress] - Article asset address for reference
 * @param {Function} [onSuccess] - Success callback
 * @param {Function} [onError]   - Error callback
 */
export const sendTip = async (tipData, onSuccess = () => {}, onError = () => {}) => {
  try {
    if (!tipData.to) {
      showErrorDialog({
        message: 'No tip account',
        note: 'This article does not have a tip account configured.',
      });
      return;
    }

    if (!tipData.amount || tipData.amount <= 0) {
      showErrorDialog({
        message: 'Invalid amount',
        note: 'Please enter a valid tip amount.',
      });
      return;
    }

    const params = {
      from: tipData.from,
      to: tipData.to,
      amount: tipData.amount,
    };

    // Use the article address as a reference so the author can trace it
    if (tipData.articleAddress) {
      params.reference = tipData.articleAddress;
    }

    const result = await secureApiCall('finance/debit/account', params);

    showSuccessDialog({
      message: 'Tip Sent!',
      note: `You sent ${tipData.amount} NXS to the author. TX: ${result.txid?.slice(0, 16)}...`,
    });

    onSuccess(result);
    return result;
  } catch (error) {
    showErrorDialog({
      message: 'Failed to send tip',
      note: error?.message || 'Unknown error. Make sure you have sufficient NXS balance.',
    });

    onError(error);
    throw error;
  }
};
