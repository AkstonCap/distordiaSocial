import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { confirm } from 'nexus-module';
import { clearComposeContext } from 'actions/actionCreators';
import { createPost, createArticle } from 'actions/createAsset';
import { formatAddress } from '../utils/verification';
import {
  getAssetCount,
  MAX_ARTICLE_CHARS,
  MAX_POST_CHARS,
} from '../utils/articleUtils';
import {
  ComposeCard,
  ComposeTextarea,
  ComposeFooter,
  CharCount,
  ComposeActions,
  PrimaryButton,
  SmallButton,
  QuotedPost,
  QuotedAuthor,
  QuotedText,
  ModeToggle,
  ModeButton,
  TitleInput,
  CostIndicator,
  ProgressText,
  TipAccountInput,
  TipAccountLabel,
  AbstractInput,
} from '../components/styles';

export default function ComposePost({ onPostCreated }) {
  const dispatch = useDispatch();
  const replyTo = useSelector((state) => state.ui.replyTo);
  const quote = useSelector((state) => state.ui.quote);

  const [mode, setMode] = useState('article'); // default to article mode
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [articleAbstract, setArticleAbstract] = useState('');
  const [cw, setCw] = useState('');
  const [showCW, setShowCW] = useState(false);
  const [tipAccount, setTipAccount] = useState('');
  const [posting, setPosting] = useState(false);
  const [progress, setProgress] = useState(null);

  const isArticleMode = mode === 'article';
  const maxChars = isArticleMode ? MAX_ARTICLE_CHARS : MAX_POST_CHARS;
  const charCount = text.length;
  const warningThreshold = isArticleMode ? MAX_ARTICLE_CHARS - 200 : 450;
  const isWarning = charCount > warningThreshold;
  const isError = charCount > maxChars;
  const hasContext = !!replyTo || !!quote;
  const contextPost = replyTo || quote;
  const assetCount = isArticleMode ? getAssetCount(charCount) : 1;

  const resetForm = () => {
    setText('');
    setTitle('');
    setArticleAbstract('');
    setCw('');
    setShowCW(false);
    setProgress(null);
    dispatch(clearComposeContext());
  };

  const handlePost = async () => {
    if (!text.trim() || isError || posting) return;

    if (isArticleMode) {
      if (!title.trim()) return;

      const confirmed = await confirm({
        question: `Publish this article to the Nexus blockchain?`,
        note: `This will create ${assetCount} on-chain asset${assetCount > 1 ? 's' : ''}. Total cost: ${assetCount} NXS.${tipAccount ? ' Tip account will be embedded for reader support.' : ''}`,
      });

      if (!confirmed) return;

      setPosting(true);
      setProgress({ created: 0, total: assetCount });

      try {
        await createArticle(
          {
            title: title.trim(),
            text: text.trim(),
            abstract: articleAbstract.trim(),
            replyTo: replyTo?.address || '',
            quote: quote?.address || '',
            cw: cw.trim(),
            tipAccount: tipAccount.trim(),
          },
          (created, total) => {
            setProgress({ created, total });
          },
          () => {
            resetForm();
            if (onPostCreated) {
              setTimeout(onPostCreated, 2000);
            }
          },
          () => {}
        );
      } finally {
        setPosting(false);
        setProgress(null);
      }
    } else {
      const confirmed = await confirm({
        question: 'Publish this comment to the Nexus blockchain?',
        note: 'This will create an on-chain asset. This action costs 1 NXS.',
      });

      if (!confirmed) return;

      setPosting(true);

      try {
        await createPost(
          {
            text: text.trim(),
            replyTo: replyTo?.address || '',
            quote: quote?.address || '',
            cw: cw.trim(),
          },
          () => {
            resetForm();
            if (onPostCreated) {
              setTimeout(onPostCreated, 2000);
            }
          },
          () => {}
        );
      } finally {
        setPosting(false);
      }
    }
  };

  const handleClearContext = () => {
    dispatch(clearComposeContext());
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    if (newMode === 'comment' && text.length > MAX_POST_CHARS) {
      setText(text.slice(0, MAX_POST_CHARS));
    }
  };

  return (
    <ComposeCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <ModeToggle>
          <ModeButton
            active={mode === 'article' ? 1 : 0}
            onClick={() => handleModeSwitch('article')}
          >
            Article
          </ModeButton>
          <ModeButton
            active={mode === 'comment' ? 1 : 0}
            onClick={() => handleModeSwitch('comment')}
          >
            Comment
          </ModeButton>
        </ModeToggle>
        {isArticleMode && assetCount > 0 && (
          <CostIndicator>
            {assetCount} asset{assetCount > 1 ? 's' : ''} ({assetCount} NXS)
          </CostIndicator>
        )}
      </div>

      {hasContext && contextPost && (
        <QuotedPost>
          <QuotedAuthor>
            {replyTo ? 'Replying to' : 'Citing'} @
            {contextPost["Creator's namespace"] ||
              formatAddress(contextPost.owner, 12)}
          </QuotedAuthor>
          <QuotedText>
            {(contextPost.text || contextPost.Text || '').slice(0, 120)}
            {(contextPost.text || contextPost.Text || '').length > 120
              ? '...'
              : ''}
          </QuotedText>
          <SmallButton
            onClick={handleClearContext}
            style={{ marginTop: 6, fontSize: 11 }}
          >
            Clear
          </SmallButton>
        </QuotedPost>
      )}

      {showCW && (
        <ComposeTextarea
          value={cw}
          onChange={(e) => setCw(e.target.value)}
          placeholder="Content warning (optional)..."
          style={{ minHeight: 40, marginBottom: 8 }}
          maxLength={64}
        />
      )}

      {isArticleMode && (
        <>
          <TitleInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title..."
            maxLength={64}
          />
          <AbstractInput
            value={articleAbstract}
            onChange={(e) => setArticleAbstract(e.target.value)}
            placeholder="Abstract / summary (optional, max 200 chars)..."
            maxLength={200}
          />
        </>
      )}

      <ComposeTextarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          isArticleMode
            ? 'Write your research article...'
            : 'Write a comment or short note...'
        }
        maxLength={maxChars + 50}
        style={isArticleMode ? { minHeight: 200 } : undefined}
      />

      {isArticleMode && (
        <div style={{ marginTop: 8 }}>
          <TipAccountLabel>
            Tip Account (receive NXS tips from readers):
          </TipAccountLabel>
          <TipAccountInput
            value={tipAccount}
            onChange={(e) => setTipAccount(e.target.value)}
            placeholder="Your NXS account address or name (e.g. myname:default)..."
            maxLength={128}
          />
        </div>
      )}

      {progress && (
        <ProgressText>
          Creating asset {progress.created} of {progress.total}...
        </ProgressText>
      )}

      <ComposeFooter>
        <ComposeActions>
          <SmallButton
            onClick={() => setShowCW(!showCW)}
            style={{ fontSize: 11 }}
          >
            {showCW ? 'Hide CW' : 'CW'}
          </SmallButton>
          <CharCount warning={isWarning ? 1 : 0} error={isError ? 1 : 0}>
            {charCount}/{maxChars}
          </CharCount>
        </ComposeActions>
        <PrimaryButton
          onClick={handlePost}
          disabled={
            !text.trim() ||
            isError ||
            posting ||
            (isArticleMode && !title.trim())
          }
        >
          {posting
            ? 'Publishing...'
            : isArticleMode
              ? 'Publish Article'
              : 'Post Comment'}
        </PrimaryButton>
      </ComposeFooter>
    </ComposeCard>
  );
}
