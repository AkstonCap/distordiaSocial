import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { apiCall, confirm } from 'nexus-module';
import { switchMyNamespace } from 'actions/actionCreators';
import { sendTip } from 'actions/createAsset';
import {
  fetchAllVerified,
  getTierForGenesis,
  formatAddress,
  formatTime,
} from '../utils/verification';
import { isArticle, isArticleChunk, reassembleArticle } from '../utils/articleUtils';
import {
  PageLayout,
  SingleColRow,
  ProfileCard,
  ProfileNamespace,
  ProfileGenesis,
  ProfileStats,
  ProfileStat,
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
  SmallButton,
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

export default function Profile() {
  const myNamespace = useSelector(
    (state) => state.settings.namespaces.myNamespace
  );
  const dispatch = useDispatch();

  const [myPosts, setMyPosts] = useState([]);
  const [profileInfo, setProfileInfo] = useState(null);
  const [verifiedMap, setVerifiedMap] = useState({});
  const [loading, setLoading] = useState(true);
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

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get user's own assets (publications they own)
      const [assets, verified] = await Promise.all([
        apiCall('assets/list/asset').catch(() => []),
        fetchAllVerified(),
      ]);

      setVerifiedMap(verified);

      if (assets && Array.isArray(assets)) {
        // Show articles and comments, but filter out article chunks
        const posts = assets.filter(
          (item) =>
            (item['distordia-type'] === 'distordia-post' ||
              item['distordia-type'] === 'distordia-article') &&
            !isArticleChunk(item)
        );
        posts.sort((a, b) => (b.created || 0) - (a.created || 0));
        setMyPosts(posts);

        // Extract profile info from the first item or wallet data
        if (posts.length > 0) {
          const first = posts[0];
          const namespace = first["Creator's namespace"] || first.name?.split(':')[0] || '';
          if (namespace && namespace !== myNamespace) {
            dispatch(switchMyNamespace(namespace));
          }
          const articleCount = posts.filter((p) => isArticle(p)).length;
          const commentCount = posts.length - articleCount;
          setProfileInfo({
            namespace: namespace || myNamespace || '',
            owner: first.owner || '',
            totalCount: posts.length,
            articleCount,
            commentCount,
          });
        } else {
          setProfileInfo({
            namespace: myNamespace || '',
            owner: '',
            totalCount: 0,
            articleCount: 0,
            commentCount: 0,
          });
        }
      }
    } catch (err) {
      setError(err?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [myNamespace, dispatch]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  const tier = profileInfo
    ? getTierForGenesis(profileInfo.owner, verifiedMap)
    : null;

  return (
    <PageLayout>
      {loading && (
        <LoadingContainer>
          <Spinner />
          <p>Loading your publications...</p>
        </LoadingContainer>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {!loading && profileInfo && (
        <ProfileCard>
          <BadgeRow style={{ justifyContent: 'center', marginBottom: 12 }}>
            {tier && <TierBadge tier={tier} />}
          </BadgeRow>
          <ProfileNamespace>
            {profileInfo.namespace
              ? `@${profileInfo.namespace}`
              : 'No Namespace'}
          </ProfileNamespace>
          {profileInfo.owner && (
            <ProfileGenesis>{profileInfo.owner}</ProfileGenesis>
          )}
          <ProfileStats>
            <ProfileStat>
              <div className="stat-value">{profileInfo.articleCount}</div>
              <div className="stat-label">Articles</div>
            </ProfileStat>
            <ProfileStat>
              <div className="stat-value">{profileInfo.commentCount}</div>
              <div className="stat-label">Comments</div>
            </ProfileStat>
          </ProfileStats>
        </ProfileCard>
      )}

      {!loading && (
        <SingleColRow>
          <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.7 }}>
            Your Publications
          </div>
        </SingleColRow>
      )}

      {!loading && myPosts.length === 0 && (
        <EmptyState>
          You haven't published any content yet. Switch to the Research Feed tab to
          publish your first article!
        </EmptyState>
      )}

      {!loading &&
        myPosts.map((post) => {
          const namespace = post["Creator's namespace"] || '';
          const owner = post.owner || '';
          const postTier = getTierForGenesis(owner, verifiedMap);

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
                    {postTier && <TierBadge tier={postTier} />}
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
                    <span>{formatAddress(post.address, 12)}</span>
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
                  {postTier && <TierBadge tier={postTier} />}
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
                  <span>{formatAddress(post.address, 12)}</span>
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
