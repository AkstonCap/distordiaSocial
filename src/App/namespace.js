import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { apiCall, confirm } from 'nexus-module';
import { switchExtNamespace } from 'actions/actionCreators';
import { sendTip } from 'actions/createAsset';
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
  BadgeRow,
  BadgeOfficial,
  BadgeArticle,
  BadgeComment,
  TierBadgeL1,
  TierBadgeL2,
  TierBadgeL3,
  FilterBar,
  FilterGroup,
  FilterLabel,
  SmallButton,
  PrimaryButton,
  TipButton,
  LoadingContainer,
  Spinner,
  EmptyState,
  ErrorMessage,
  ArticleCard,
  ArticleTitle,
  ArticleAbstract,
  ArticlePreview,
  ReadMoreLink,
  ArticleFullText,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalClose,
  JsonBlock,
  TipSection,
  TipAmountInput,
  TipLabel,
  TipAccountDisplay,
} from '../components/styles';

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

export default function AuthorFeed() {
  const extNamespace = useSelector(
    (state) => state.settings.namespaces.extNamespace
  );
  const dispatch = useDispatch();

  const [nsInput, setNsInput] = useState(extNamespace || 'distordia');
  const [posts, setPosts] = useState([]);
  const [verifiedMap, setVerifiedMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewingAsset, setViewingAsset] = useState(null);
  const [assetData, setAssetData] = useState(null);

  // Article reader modal state
  const [readingArticle, setReadingArticle] = useState(null);
  const [articleFullText, setArticleFullText] = useState(null);
  const [articleLoading, setArticleLoading] = useState(false);

  // Tipping state
  const [tipAmount, setTipAmount] = useState('1');
  const [tipping, setTipping] = useState(false);

  const fetchAuthorContent = useCallback(async (namespace) => {
    if (!namespace) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch both comments and articles in parallel
      const [postResults, articleResults] = await Promise.all([
        apiCall('register/list/assets:asset', {
          where:
            'results.distordia-type=distordia-post AND results.distordia-status=official',
        }).catch(() => []),
        apiCall('register/list/assets:asset', {
          where:
            'results.distordia-type=distordia-article AND results.distordia-status=official',
        }).catch(() => []),
      ]);

      const allResults = [...(postResults || []), ...(articleResults || [])];

      if (allResults.length > 0) {
        const filtered = allResults.filter((item) => {
          const ns = item["Creator's namespace"] || '';
          return ns.toLowerCase() === namespace.toLowerCase();
        });
        filtered.sort((a, b) => (b.created || 0) - (a.created || 0));
        setPosts(filtered);
      } else {
        setPosts([]);
      }

      const verified = await fetchAllVerified();
      setVerifiedMap(verified);
    } catch (err) {
      setError(err?.message || 'Failed to load content');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (extNamespace) {
      fetchAuthorContent(extNamespace);
    }
  }, [extNamespace, fetchAuthorContent]);

  const handleSearch = () => {
    if (nsInput.trim()) {
      dispatch(switchExtNamespace(nsInput.trim()));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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

  const readArticle = async (post) => {
    setReadingArticle(post);
    setArticleFullText(null);
    setArticleLoading(true);
    setTipAmount('1');
    try {
      const fullText = await reassembleArticle(post);
      setArticleFullText(fullText);
    } catch {
      setArticleFullText(post.text || '');
    } finally {
      setArticleLoading(false);
    }
  };

  // Send tip to article author
  const handleSendTip = async () => {
    if (!readingArticle || tipping) return;

    const tipAccountAddr = readingArticle['tip-account'];
    if (!tipAccountAddr) return;

    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) return;

    const confirmed = await confirm({
      question: `Send ${amount} NXS tip to this author?`,
      note: `This will debit ${amount} NXS from your default account to the author's tip account.`,
    });

    if (!confirmed) return;

    setTipping(true);
    try {
      await sendTip({
        from: 'default',
        to: tipAccountAddr,
        amount: amount,
        articleAddress: readingArticle.address,
      });
    } catch {
      // Error already shown by sendTip
    } finally {
      setTipping(false);
    }
  };

  return (
    <PageLayout>
      <FilterBar>
        <FilterGroup>
          <FilterLabel>Author:</FilterLabel>
          <SearchField
            value={nsInput}
            onChange={(e) => setNsInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter author namespace..."
          />
        </FilterGroup>
        <PrimaryButton onClick={handleSearch} disabled={loading}>
          Browse
        </PrimaryButton>
      </FilterBar>

      {extNamespace && (
        <SingleColRow>
          <div style={{ fontSize: 13, opacity: 0.6 }}>
            Showing publications from author:{' '}
            <strong style={{ color: '#00d4ff' }}>{extNamespace}</strong>
          </div>
        </SingleColRow>
      )}

      {loading && (
        <LoadingContainer>
          <Spinner />
          <p>Loading publications from {extNamespace}...</p>
        </LoadingContainer>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {!loading && !error && posts.length === 0 && extNamespace && (
        <EmptyState>No publications found from author "{extNamespace}"</EmptyState>
      )}

      {!loading &&
        posts.map((post) => {
          const namespace = post["Creator's namespace"] || '';
          const owner = post.owner || '';
          const tier = getTierForGenesis(owner, verifiedMap);

          if (isArticle(post)) {
            const text = post.text || '';
            const title = post.title || 'Untitled Article';
            const abstract = post.abstract || '';
            const hasMore = !!(post.next && post.next !== '');
            const hasTipAccount = !!(post['tip-account'] && post['tip-account'] !== '');
            const previewText = text.length > 200 ? text.slice(0, 200) + '...' : text;

            return (
              <ArticleCard key={post.address} onClick={() => readArticle(post)}>
                <PostHeader>
                  <PostAuthor>
                    <PostNamespace>
                      @{namespace || formatAddress(owner, 12)}
                    </PostNamespace>
                    <PostOwner>{formatAddress(owner, 16)}</PostOwner>
                  </PostAuthor>
                  <BadgeRow>
                    {tier && <TierBadge tier={tier} />}
                    <BadgeArticle>Article</BadgeArticle>
                    {hasTipAccount && (
                      <span style={{ fontSize: 10, opacity: 0.6 }}>Tips enabled</span>
                    )}
                    {post['distordia-status'] === 'official' && (
                      <BadgeOfficial>Official</BadgeOfficial>
                    )}
                  </BadgeRow>
                </PostHeader>
                <ArticleTitle>{title}</ArticleTitle>
                {abstract && <ArticleAbstract>{abstract}</ArticleAbstract>}
                <ArticlePreview>{previewText}</ArticlePreview>
                {hasMore && (
                  <ReadMoreLink onClick={(e) => { e.stopPropagation(); readArticle(post); }}>
                    Read full article...
                  </ReadMoreLink>
                )}
                <PostFooter>
                  <PostMeta>
                    <span>{formatTime(post.created)}</span>
                  </PostMeta>
                  <PostActions>
                    <SmallButton
                      onClick={(e) => {
                        e.stopPropagation();
                        viewAsset(post.address);
                      }}
                    >
                      On-chain
                    </SmallButton>
                  </PostActions>
                </PostFooter>
              </ArticleCard>
            );
          }

          const text = post.text || post.Text || '';
          return (
            <PostCard key={post.address} onClick={() => viewAsset(post.address)}>
              <PostHeader>
                <PostAuthor>
                  <PostNamespace>
                    @{namespace || formatAddress(owner, 12)}
                  </PostNamespace>
                  <PostOwner>{formatAddress(owner, 16)}</PostOwner>
                </PostAuthor>
                <BadgeRow>
                  {tier && <TierBadge tier={tier} />}
                  <BadgeComment>Comment</BadgeComment>
                  {post['distordia-status'] === 'official' && (
                    <BadgeOfficial>Official</BadgeOfficial>
                  )}
                </BadgeRow>
              </PostHeader>
              <PostText>{text}</PostText>
              <PostFooter>
                <PostMeta>
                  <span>{formatTime(post.created)}</span>
                </PostMeta>
                <PostActions>
                  <SmallButton
                    onClick={(e) => {
                      e.stopPropagation();
                      viewAsset(post.address);
                    }}
                  >
                    On-chain
                  </SmallButton>
                </PostActions>
              </PostFooter>
            </PostCard>
          );
        })}

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
                {' '}&middot; {formatTime(readingArticle.created)}
              </div>

              {readingArticle.abstract && (
                <div style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  opacity: 0.85,
                  padding: '10px 14px',
                  background: 'rgba(0, 212, 255, 0.04)',
                  borderLeft: '2px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: 4,
                  marginBottom: 16,
                }}>
                  {readingArticle.abstract}
                </div>
              )}

              {articleLoading ? (
                <LoadingContainer>
                  <Spinner />
                  <p>Loading article chunks...</p>
                </LoadingContainer>
              ) : (
                <ArticleFullText>{articleFullText}</ArticleFullText>
              )}

              {/* Tipping Section */}
              {readingArticle['tip-account'] && readingArticle['tip-account'] !== '' && (
                <TipSection>
                  <TipLabel>Tip the author:</TipLabel>
                  <TipAmountInput
                    type="number"
                    min="0.01"
                    step="0.1"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="NXS"
                  />
                  <span style={{ fontSize: 12, opacity: 0.6 }}>NXS</span>
                  <TipButton
                    onClick={handleSendTip}
                    disabled={tipping || !tipAmount || parseFloat(tipAmount) <= 0}
                  >
                    {tipping ? 'Sending...' : 'Send Tip'}
                  </TipButton>
                  <TipAccountDisplay>
                    {formatAddress(readingArticle['tip-account'], 20)}
                  </TipAccountDisplay>
                </TipSection>
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

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
                  <p>Loading...</p>
                </LoadingContainer>
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageLayout>
  );
}
