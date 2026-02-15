import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { apiCall } from 'nexus-module';
import { updateInput, setQuote, setReplyTo } from 'actions/actionCreators';
import {
  fetchAllVerified,
  getTierForGenesis,
  formatAddress,
  formatTime,
} from '../utils/verification';
import { isArticle, reassembleArticle } from '../utils/articleUtils';
import {
  PageLayout,
  SingleColRow,
  SearchField,
  PostCard,
  PostHeader,
  PostAuthor,
  PostNamespace,
  PostOwner,
  PostText,
  PostFooter,
  PostMeta,
  PostActions,
  QuotedPost,
  QuotedAuthor,
  QuotedText,
  BadgeRow,
  BadgeOfficial,
  BadgeQuote,
  BadgeReply,
  BadgeArticle,
  TierBadgeL1,
  TierBadgeL2,
  TierBadgeL3,
  FilterBar,
  FilterGroup,
  FilterLabel,
  FilterSelect,
  CheckboxLabel,
  SmallButton,
  LoadingContainer,
  Spinner,
  EmptyState,
  ErrorMessage,
  ContentWarning,
  ArticleCard,
  ArticleTitle,
  ArticlePreview,
  ReadMoreLink,
  ArticleFullText,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalClose,
  JsonBlock,
} from '../components/styles';

import ComposePost from './ComposePost';

function TierBadge({ tier }) {
  switch (tier) {
    case 'L1':
      return <TierBadgeL1>Verified L1</TierBadgeL1>;
    case 'L2':
      return <TierBadgeL2>Verified L2</TierBadgeL2>;
    case 'L3':
      return <TierBadgeL3>Verified L3</TierBadgeL3>;
    default:
      return null;
  }
}

function ArticleItem({
  post,
  verifiedMap,
  onViewAsset,
  onQuote,
  onReply,
  onReadArticle,
}) {
  const [cwRevealed, setCwRevealed] = useState(false);

  const namespace = post["Creator's namespace"] || post.name?.split(':')[0] || '';
  const displayName =
    namespace && namespace !== '*' ? `@${namespace}` : formatAddress(post.owner, 16);
  const owner = post.owner || '';
  const text = post.text || '';
  const title = post.title || 'Untitled Article';
  const created = post.created;
  const isOfficial = post['distordia-status'] === 'official';
  const hasCW = !!post.cw;
  const hasMore = !!(post.next && post.next !== '');
  const tier = getTierForGenesis(owner, verifiedMap);
  const previewText = text.length > 200 ? text.slice(0, 200) + '...' : text;

  return (
    <ArticleCard onClick={() => onReadArticle(post)}>
      <PostHeader>
        <PostAuthor>
          <PostNamespace>{displayName}</PostNamespace>
          <PostOwner>{formatAddress(owner, 16)}</PostOwner>
        </PostAuthor>
        <BadgeRow>
          {tier && <TierBadge tier={tier} />}
          <BadgeArticle>Article</BadgeArticle>
          {isOfficial && <BadgeOfficial>Official</BadgeOfficial>}
        </BadgeRow>
      </PostHeader>

      {hasCW && !cwRevealed ? (
        <ContentWarning onClick={(e) => { e.stopPropagation(); setCwRevealed(true); }}>
          CW: {post.cw} (click to reveal)
        </ContentWarning>
      ) : (
        <>
          <ArticleTitle>{title}</ArticleTitle>
          <ArticlePreview>{previewText}</ArticlePreview>
          {hasMore && (
            <ReadMoreLink onClick={(e) => { e.stopPropagation(); onReadArticle(post); }}>
              Read full article...
            </ReadMoreLink>
          )}
        </>
      )}

      <PostFooter>
        <PostMeta>
          <span>{formatTime(created)}</span>
          {post.tags && <span>#{post.tags.split(',')[0]}</span>}
        </PostMeta>
        <PostActions>
          <SmallButton
            onClick={(e) => {
              e.stopPropagation();
              onReply(post);
            }}
          >
            Reply
          </SmallButton>
          <SmallButton
            onClick={(e) => {
              e.stopPropagation();
              onQuote(post);
            }}
          >
            Quote
          </SmallButton>
          <SmallButton
            onClick={(e) => {
              e.stopPropagation();
              onViewAsset(post.address);
            }}
          >
            On-chain
          </SmallButton>
        </PostActions>
      </PostFooter>
    </ArticleCard>
  );
}

function PostItem({
  post,
  verifiedMap,
  quotedPostsCache,
  onViewAsset,
  onQuote,
  onReply,
}) {
  const [cwRevealed, setCwRevealed] = useState(false);

  const namespace = post["Creator's namespace"] || post.name?.split(':')[0] || '';
  const displayName =
    namespace && namespace !== '*' ? `@${namespace}` : formatAddress(post.owner, 16);
  const owner = post.owner || '';
  const text = post.text || post.Text || '';
  const created = post.created;
  const isOfficial = post['distordia-status'] === 'official';
  const replyTo = post['reply-to'] || '';
  const quoteAddr =
    post.quote || post['quoted-address'] || post['Quoted address'] || '';
  const isQuote = !!quoteAddr;
  const isReply = !!replyTo;
  const hasCW = !!post.cw;
  const tier = getTierForGenesis(owner, verifiedMap);

  const quotedPost = quoteAddr ? quotedPostsCache[quoteAddr] : null;

  return (
    <PostCard>
      <PostHeader>
        <PostAuthor>
          <PostNamespace>{displayName}</PostNamespace>
          <PostOwner>{formatAddress(owner, 16)}</PostOwner>
        </PostAuthor>
        <BadgeRow>
          {tier && <TierBadge tier={tier} />}
          {isOfficial && <BadgeOfficial>Official</BadgeOfficial>}
          {isQuote && <BadgeQuote>Quote</BadgeQuote>}
          {isReply && <BadgeReply>Reply</BadgeReply>}
        </BadgeRow>
      </PostHeader>

      {hasCW && !cwRevealed ? (
        <ContentWarning onClick={() => setCwRevealed(true)}>
          CW: {post.cw} (click to reveal)
        </ContentWarning>
      ) : (
        <PostText>{text}</PostText>
      )}

      {isQuote && quotedPost && (
        <QuotedPost>
          <QuotedAuthor>
            @
            {quotedPost["Creator's namespace"] ||
              formatAddress(quotedPost.owner, 12)}
            {getTierForGenesis(quotedPost.owner, verifiedMap) && (
              <>
                {' '}
                <TierBadge
                  tier={getTierForGenesis(quotedPost.owner, verifiedMap)}
                />
              </>
            )}
          </QuotedAuthor>
          <QuotedText>
            {quotedPost.text || quotedPost.Text || 'Post not found'}
          </QuotedText>
        </QuotedPost>
      )}

      {isQuote && !quotedPost && quoteAddr && (
        <QuotedPost>
          <QuotedText style={{ opacity: 0.5, fontStyle: 'italic' }}>
            Quoted post could not be loaded
          </QuotedText>
        </QuotedPost>
      )}

      <PostFooter>
        <PostMeta>
          <span>{formatTime(created)}</span>
          {post.tags && <span>#{post.tags.split(',')[0]}</span>}
        </PostMeta>
        <PostActions>
          <SmallButton
            onClick={(e) => {
              e.stopPropagation();
              onReply(post);
            }}
          >
            Reply
          </SmallButton>
          <SmallButton
            onClick={(e) => {
              e.stopPropagation();
              onQuote(post);
            }}
          >
            Quote
          </SmallButton>
          <SmallButton
            onClick={(e) => {
              e.stopPropagation();
              onViewAsset(post.address);
            }}
          >
            On-chain
          </SmallButton>
        </PostActions>
      </PostFooter>
    </PostCard>
  );
}

export default function NewsFeed() {
  const inputValue = useSelector((state) => state.ui.inputValue);
  const dispatch = useDispatch();

  const [posts, setPosts] = useState([]);
  const [verifiedMap, setVerifiedMap] = useState({});
  const [quotedPostsCache, setQuotedPostsCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [namespaceOnly, setNamespaceOnly] = useState(true);
  const [viewingAsset, setViewingAsset] = useState(null);
  const [assetData, setAssetData] = useState(null);

  // Article reader modal state
  const [readingArticle, setReadingArticle] = useState(null);
  const [articleFullText, setArticleFullText] = useState(null);
  const [articleLoading, setArticleLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch posts, quotes, and articles in parallel
      const [postResults, quoteResults, articleResults] = await Promise.all([
        apiCall('register/list/assets:asset', {
          where:
            "results.distordia-type=distordia-post AND results.distordia-status=official",
        }).catch(() => []),
        apiCall('register/list/assets:asset', {
          where:
            "results.distordia-type=distordia-quote AND results.distordia-status=official",
        }).catch(() => []),
        apiCall('register/list/assets:asset', {
          where:
            "results.distordia-type=distordia-article AND results.distordia-status=official",
        }).catch(() => []),
      ]);

      const allPosts = [
        ...(postResults || []),
        ...(quoteResults || []),
        ...(articleResults || []),
      ];
      allPosts.sort((a, b) => (b.created || 0) - (a.created || 0));
      setPosts(allPosts);

      // Fetch quoted/replied posts
      const quotedAddresses = allPosts
        .map(
          (p) =>
            p.quote ||
            p['quoted-address'] ||
            p['Quoted address'] ||
            p['reply-to'] ||
            ''
        )
        .filter((addr) => addr && addr !== '0' && addr !== '');

      const uniqueAddresses = [...new Set(quotedAddresses)];
      const cache = {};

      await Promise.all(
        uniqueAddresses.map(async (address) => {
          try {
            const result = await apiCall('register/get/assets:asset', {
              address,
            });
            if (result) {
              cache[address] = result;
            }
          } catch {
            // Quoted post not found
          }
        })
      );

      setQuotedPostsCache(cache);

      // Fetch verification data
      const verified = await fetchAllVerified();
      setVerifiedMap(verified);
    } catch (err) {
      setError(err?.message || 'Failed to load posts from blockchain');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleChange = (e) => {
    dispatch(updateInput(e.target.value));
  };

  // Filter posts (exclude article chunks which are internal)
  const filteredPosts = posts.filter((post) => {
    const namespace = post["Creator's namespace"] || '';

    if (namespaceOnly && (!namespace || namespace === '*')) {
      return false;
    }

    if (filter === 'official' && post['distordia-status'] !== 'official') {
      return false;
    }
    if (filter === 'verified') {
      const tier = getTierForGenesis(post.owner, verifiedMap);
      if (!tier) return false;
    }
    if (filter === 'namespace' && inputValue) {
      if (!namespace.toLowerCase().includes(inputValue.toLowerCase())) {
        return false;
      }
    }

    if (inputValue && filter !== 'namespace') {
      const text = (post.text || post.Text || '').toLowerCase();
      const title = (post.title || '').toLowerCase();
      const ns = namespace.toLowerCase();
      const q = inputValue.toLowerCase();
      if (!text.includes(q) && !ns.includes(q) && !title.includes(q)) {
        return false;
      }
    }

    return true;
  });

  // View asset on-chain
  const viewAsset = async (address) => {
    setViewingAsset(address);
    setAssetData(null);
    try {
      const result = await apiCall('register/get/assets:asset', { address });
      setAssetData(result);
    } catch (err) {
      setAssetData({ error: err?.message || 'Failed to load asset' });
    }
  };

  // Read full article by reassembling chunks
  const readArticle = async (post) => {
    setReadingArticle(post);
    setArticleFullText(null);
    setArticleLoading(true);
    try {
      const fullText = await reassembleArticle(post);
      setArticleFullText(fullText);
    } catch {
      setArticleFullText(post.text || '');
    } finally {
      setArticleLoading(false);
    }
  };

  const handleQuote = (post) => {
    dispatch(setQuote(post));
  };

  const handleReply = (post) => {
    dispatch(setReplyTo(post));
  };

  return (
    <PageLayout>
      <ComposePost onPostCreated={fetchPosts} />

      <FilterBar>
        <FilterGroup>
          <FilterLabel>Filter:</FilterLabel>
          <FilterSelect
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Posts</option>
            <option value="official">Official Only</option>
            <option value="verified">Verified Only</option>
            <option value="namespace">By Namespace</option>
          </FilterSelect>
          {filter === 'namespace' && (
            <SearchField
              value={inputValue}
              onChange={handleChange}
              placeholder="Search namespace..."
            />
          )}
        </FilterGroup>
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={namespaceOnly}
            onChange={(e) => setNamespaceOnly(e.target.checked)}
          />
          <span>Named only</span>
        </CheckboxLabel>
        <SmallButton onClick={fetchPosts} disabled={loading}>
          Refresh
        </SmallButton>
      </FilterBar>

      {filter !== 'namespace' && (
        <SingleColRow>
          <SearchField
            value={inputValue}
            onChange={handleChange}
            placeholder="Search posts..."
          />
        </SingleColRow>
      )}

      {loading && (
        <LoadingContainer>
          <Spinner />
          <p>Loading posts from blockchain...</p>
        </LoadingContainer>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {!loading && !error && filteredPosts.length === 0 && (
        <EmptyState>No posts found. Be the first to post!</EmptyState>
      )}

      {!loading &&
        filteredPosts.map((post) =>
          isArticle(post) ? (
            <ArticleItem
              key={post.address}
              post={post}
              verifiedMap={verifiedMap}
              onViewAsset={viewAsset}
              onQuote={handleQuote}
              onReply={handleReply}
              onReadArticle={readArticle}
            />
          ) : (
            <PostItem
              key={post.address}
              post={post}
              verifiedMap={verifiedMap}
              quotedPostsCache={quotedPostsCache}
              onViewAsset={viewAsset}
              onQuote={handleQuote}
              onReply={handleReply}
            />
          )
        )}

      {/* Article Reader Modal */}
      {readingArticle && (
        <ModalOverlay onClick={() => setReadingArticle(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>{readingArticle.title || 'Article'}</h3>
              <ModalClose onClick={() => setReadingArticle(null)}>
                &times;
              </ModalClose>
            </ModalHeader>
            <ModalBody>
              <div style={{ marginBottom: 12, fontSize: 12, opacity: 0.6 }}>
                By{' '}
                <span style={{ color: '#00d4ff' }}>
                  @{readingArticle["Creator's namespace"] ||
                    formatAddress(readingArticle.owner, 12)}
                </span>
                {' '}· {formatTime(readingArticle.created)}
              </div>
              {articleLoading ? (
                <LoadingContainer>
                  <Spinner />
                  <p>Loading article chunks...</p>
                </LoadingContainer>
              ) : (
                <ArticleFullText>{articleFullText}</ArticleFullText>
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* On-chain Asset Modal */}
      {viewingAsset && (
        <ModalOverlay onClick={() => setViewingAsset(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>On-Chain Asset Data</h3>
              <ModalClose onClick={() => setViewingAsset(null)}>
                &times;
              </ModalClose>
            </ModalHeader>
            <ModalBody>
              {assetData ? (
                <JsonBlock>{JSON.stringify(assetData, null, 2)}</JsonBlock>
              ) : (
                <LoadingContainer>
                  <Spinner />
                  <p>Loading asset data...</p>
                </LoadingContainer>
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageLayout>
  );
}
