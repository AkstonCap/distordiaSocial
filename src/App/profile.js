import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { apiCall } from 'nexus-module';
import { switchMyNamespace } from 'actions/actionCreators';
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
  TierBadgeL1,
  TierBadgeL2,
  TierBadgeL3,
  SmallButton,
  LoadingContainer,
  Spinner,
  EmptyState,
  ErrorMessage,
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

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get user's own assets (posts they own)
      const [assets, verified] = await Promise.all([
        apiCall('assets/list/asset').catch(() => []),
        fetchAllVerified(),
      ]);

      setVerifiedMap(verified);

      if (assets && Array.isArray(assets)) {
        // Show posts and articles, but filter out article chunks
        const posts = assets.filter(
          (item) =>
            (item['distordia-type'] === 'distordia-post' ||
              item['distordia-type'] === 'distordia-article') &&
            !isArticleChunk(item)
        );
        posts.sort((a, b) => (b.created || 0) - (a.created || 0));
        setMyPosts(posts);

        // Extract profile info from the first post or wallet data
        if (posts.length > 0) {
          const first = posts[0];
          const namespace = first["Creator's namespace"] || first.name?.split(':')[0] || '';
          if (namespace && namespace !== myNamespace) {
            dispatch(switchMyNamespace(namespace));
          }
          setProfileInfo({
            namespace: namespace || myNamespace || '',
            owner: first.owner || '',
            postCount: posts.length,
          });
        } else {
          setProfileInfo({
            namespace: myNamespace || '',
            owner: '',
            postCount: 0,
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
    try {
      const fullText = await reassembleArticle(post);
      setArticleFullText(fullText);
    } catch {
      setArticleFullText(post.text || '');
    } finally {
      setArticleLoading(false);
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
          <p>Loading your profile...</p>
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
              <div className="stat-value">{profileInfo.postCount}</div>
              <div className="stat-label">Posts</div>
            </ProfileStat>
          </ProfileStats>
        </ProfileCard>
      )}

      {!loading && (
        <SingleColRow>
          <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.7 }}>
            Your Posts
          </div>
        </SingleColRow>
      )}

      {!loading && myPosts.length === 0 && (
        <EmptyState>
          You haven't created any posts yet. Switch to the Social Feed tab to
          create your first post!
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
            const hasMore = !!(post.next && post.next !== '');
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
                    {post['distordia-status'] === 'official' && (
                      <BadgeOfficial>Official</BadgeOfficial>
                    )}
                  </BadgeRow>
                </PostHeader>
                <ArticleTitle>{title}</ArticleTitle>
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
