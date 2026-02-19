import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { TextField } from 'nexus-module';

// ============================================================================
// Layout
// ============================================================================

export const PageLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 720px;
  margin: 0 auto;
  padding: 0 8px;
`;

export const SingleColRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

export const SearchField = styled(TextField)({
  maxWidth: 280,
});

// ============================================================================
// Post Card (used for comments / short posts)
// ============================================================================

export const PostCard = styled.div({
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: '16px 20px',
  transition: 'box-shadow 0.2s ease, transform 0.15s ease',
  cursor: 'pointer',
  '&:hover': {
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    transform: 'translateY(-1px)',
  },
});

export const PostHeader = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 10,
});

export const PostAuthor = styled.div({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const PostNamespace = styled.span({
  fontSize: 15,
  fontWeight: 600,
  color: '#00d4ff',
});

export const PostOwner = styled.span({
  fontSize: 11,
  opacity: 0.5,
  fontFamily: "'Courier New', monospace",
  wordBreak: 'break-all',
});

export const PostText = styled.div({
  fontSize: 14,
  lineHeight: 1.65,
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  marginBottom: 10,
});

export const PostFooter = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: 10,
  borderTop: '1px solid rgba(255,255,255,0.06)',
  fontSize: 12,
  opacity: 0.6,
});

export const PostMeta = styled.div({
  display: 'flex',
  gap: 12,
  alignItems: 'center',
});

export const PostActions = styled.div({
  display: 'flex',
  gap: 6,
});

// ============================================================================
// Quoted / Reply / Citation
// ============================================================================

export const QuotedPost = styled.div({
  margin: '10px 0',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.03)',
  borderLeft: '3px solid #00d4ff',
  borderRadius: 6,
  fontSize: 13,
});

export const QuotedAuthor = styled.div({
  fontWeight: 600,
  color: '#00d4ff',
  marginBottom: 4,
  fontSize: 12,
});

export const QuotedText = styled.div({
  opacity: 0.8,
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
});

// ============================================================================
// Badges
// ============================================================================

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

export const BadgeRow = styled.div({
  display: 'flex',
  gap: 6,
  alignItems: 'center',
  flexWrap: 'wrap',
});

const baseBadgeStyles = {
  padding: '2px 10px',
  borderRadius: 10,
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  whiteSpace: 'nowrap',
  display: 'inline-block',
};

export const BadgeOfficial = styled.span({
  ...baseBadgeStyles,
  background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
  color: '#000',
});

export const BadgeQuote = styled.span({
  ...baseBadgeStyles,
  background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
  color: '#fff',
});

export const BadgeReply = styled.span({
  ...baseBadgeStyles,
  background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
  color: '#fff',
});

export const BadgeCitation = styled.span({
  ...baseBadgeStyles,
  background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
  color: '#fff',
});

export const BadgeComment = styled.span({
  ...baseBadgeStyles,
  background: 'rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.7)',
  border: '1px solid rgba(255,255,255,0.15)',
});

// ============================================================================
// Verification Tier Badges
// ============================================================================

export const TierBadgeL1 = styled.span({
  ...baseBadgeStyles,
  background: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)',
  color: '#fff',
});

export const TierBadgeL2 = styled.span({
  ...baseBadgeStyles,
  background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
  color: '#fff',
  boxShadow: '0 0 8px rgba(30, 136, 229, 0.3)',
});

export const TierBadgeL3 = styled.span({
  ...baseBadgeStyles,
  background:
    'linear-gradient(90deg, #ffd700, #ff8c00, #ff6b35, #ffd700, #ff8c00)',
  backgroundSize: '200% auto',
  animation: `${shimmer} 3s linear infinite`,
  color: '#000',
  boxShadow: '0 0 12px rgba(255, 215, 0, 0.4)',
  fontWeight: 800,
});

export const getTierBadgeComponent = (tier) => {
  switch (tier) {
    case 'L1':
      return TierBadgeL1;
    case 'L2':
      return TierBadgeL2;
    case 'L3':
      return TierBadgeL3;
    default:
      return null;
  }
};

// ============================================================================
// Filter / Controls Bar
// ============================================================================

export const FilterBar = styled.div({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 10,
  flexWrap: 'wrap',
});

export const FilterGroup = styled.div({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flex: 1,
  minWidth: 0,
});

export const FilterLabel = styled.label({
  fontSize: 12,
  fontWeight: 600,
  opacity: 0.7,
  whiteSpace: 'nowrap',
});

export const FilterSelect = styled.select({
  padding: '6px 10px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: 'inherit',
  fontSize: 13,
  minWidth: 130,
  cursor: 'pointer',
});

export const CheckboxLabel = styled.label({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  userSelect: 'none',
  whiteSpace: 'nowrap',
});

// ============================================================================
// Compose Area
// ============================================================================

export const ComposeCard = styled.div({
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: '16px 20px',
});

export const ComposeTextarea = styled.textarea({
  width: '100%',
  minHeight: 100,
  padding: 12,
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: 'inherit',
  fontSize: 14,
  fontFamily: 'inherit',
  resize: 'vertical',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  boxSizing: 'border-box',
  '&:focus': {
    borderColor: '#00d4ff',
  },
  '&::placeholder': {
    opacity: 0.4,
  },
});

export const ComposeFooter = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 10,
});

export const CharCount = styled.span(({ warning, error }) => ({
  fontSize: 12,
  opacity: 0.5,
  color: error ? '#f44336' : warning ? '#ff9800' : 'inherit',
}));

export const ComposeActions = styled.div({
  display: 'flex',
  gap: 8,
  alignItems: 'center',
});

// ============================================================================
// Action Buttons
// ============================================================================

export const SmallButton = styled.button({
  padding: '4px 12px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: 'inherit',
  fontSize: 12,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  whiteSpace: 'nowrap',
  '&:hover': {
    background: '#00d4ff',
    borderColor: '#00d4ff',
    color: '#fff',
  },
  '&:disabled': {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
});

export const PrimaryButton = styled.button({
  padding: '8px 20px',
  background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0, 212, 255, 0.3)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none',
  },
});

export const TipButton = styled.button({
  padding: '6px 16px',
  background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
  border: 'none',
  borderRadius: 8,
  color: '#000',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.4)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none',
  },
});

// ============================================================================
// Loading / Empty States
// ============================================================================

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const Spinner = styled.div({
  width: 32,
  height: 32,
  border: '3px solid rgba(255,255,255,0.1)',
  borderTopColor: '#00d4ff',
  borderRadius: '50%',
  animation: `${spin} 0.8s linear infinite`,
  margin: '0 auto',
});

export const LoadingContainer = styled.div({
  textAlign: 'center',
  padding: '40px 20px',
  opacity: 0.6,
});

export const EmptyState = styled.div({
  textAlign: 'center',
  padding: '40px 20px',
  opacity: 0.5,
  fontSize: 14,
});

export const ErrorMessage = styled.div({
  padding: '12px 16px',
  background: 'rgba(244, 67, 54, 0.1)',
  border: '1px solid rgba(244, 67, 54, 0.3)',
  borderRadius: 8,
  color: '#f44336',
  fontSize: 13,
  textAlign: 'center',
});

export const SuccessMessage = styled.div({
  padding: '12px 16px',
  background: 'rgba(76, 175, 80, 0.1)',
  border: '1px solid rgba(76, 175, 80, 0.3)',
  borderRadius: 8,
  color: '#4caf50',
  fontSize: 13,
  textAlign: 'center',
});

// ============================================================================
// Content Warning
// ============================================================================

export const ContentWarning = styled.div({
  padding: '10px 14px',
  background: 'rgba(255, 152, 0, 0.1)',
  border: '1px solid rgba(255, 152, 0, 0.3)',
  borderRadius: 8,
  marginBottom: 8,
  fontSize: 13,
  cursor: 'pointer',
  transition: 'background 0.2s ease',
  textAlign: 'center',
  fontWeight: 500,
  color: '#ff9800',
  '&:hover': {
    background: 'rgba(255, 152, 0, 0.15)',
  },
});

// ============================================================================
// Modal
// ============================================================================

export const ModalOverlay = styled.div({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
});

export const ModalContent = styled.div({
  background: '#1a1a2e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  width: '90%',
  maxWidth: 640,
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
});

export const ModalHeader = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  '& h3': {
    margin: 0,
    fontSize: 16,
    color: '#00d4ff',
  },
});

export const ModalBody = styled.div({
  padding: 20,
  overflowY: 'auto',
  flex: 1,
});

export const ModalClose = styled.span({
  fontSize: 22,
  cursor: 'pointer',
  opacity: 0.6,
  transition: 'opacity 0.2s ease',
  lineHeight: 1,
  '&:hover': {
    opacity: 1,
  },
});

export const JsonBlock = styled.pre({
  margin: 0,
  fontFamily: "'Courier New', monospace",
  fontSize: 12,
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  padding: 12,
  background: 'rgba(0,0,0,0.3)',
  borderRadius: 8,
});

// ============================================================================
// Profile Section
// ============================================================================

export const ProfileCard = styled.div({
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: 20,
  textAlign: 'center',
});

export const ProfileNamespace = styled.div({
  fontSize: 20,
  fontWeight: 700,
  color: '#00d4ff',
  marginBottom: 4,
});

export const ProfileGenesis = styled.div({
  fontSize: 11,
  opacity: 0.4,
  fontFamily: "'Courier New', monospace",
  wordBreak: 'break-all',
  marginBottom: 12,
});

export const ProfileStats = styled.div({
  display: 'flex',
  justifyContent: 'center',
  gap: 24,
  marginTop: 12,
});

export const ProfileStat = styled.div({
  textAlign: 'center',
  '& .stat-value': {
    fontSize: 20,
    fontWeight: 700,
  },
  '& .stat-label': {
    fontSize: 11,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

// ============================================================================
// Article Components
// ============================================================================

export const ArticleCard = styled.div({
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(0, 212, 255, 0.15)',
  borderRadius: 12,
  padding: '20px 24px',
  transition: 'box-shadow 0.2s ease, transform 0.15s ease',
  cursor: 'pointer',
  '&:hover': {
    boxShadow: '0 4px 16px rgba(0, 212, 255, 0.15)',
    transform: 'translateY(-1px)',
  },
});

export const ArticleTitle = styled.h3({
  margin: '0 0 8px 0',
  fontSize: 18,
  fontWeight: 700,
  lineHeight: 1.3,
  color: '#fff',
});

export const ArticleAbstract = styled.div({
  fontSize: 13,
  lineHeight: 1.6,
  opacity: 0.85,
  fontStyle: 'italic',
  padding: '8px 12px',
  background: 'rgba(0, 212, 255, 0.04)',
  borderLeft: '2px solid rgba(0, 212, 255, 0.3)',
  borderRadius: 4,
  marginBottom: 10,
});

export const ArticlePreview = styled.div({
  fontSize: 13,
  lineHeight: 1.6,
  opacity: 0.75,
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  marginBottom: 10,
});

export const ReadMoreLink = styled.span({
  color: '#00d4ff',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  '&:hover': {
    textDecoration: 'underline',
  },
});

export const BadgeArticle = styled.span({
  ...baseBadgeStyles,
  background: 'linear-gradient(135deg, #ef4568 0%, #f0aa21 100%)',
  color: '#fff',
});

export const BadgeResearch = styled.span({
  ...baseBadgeStyles,
  background: 'linear-gradient(135deg, #1e88e5 0%, #00897b 100%)',
  color: '#fff',
});

export const ArticleFullText = styled.div({
  fontSize: 14,
  lineHeight: 1.75,
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
});

export const ModeToggle = styled.div({
  display: 'flex',
  gap: 0,
  borderRadius: 6,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.1)',
});

export const ModeButton = styled.button(({ active }) => ({
  padding: '4px 14px',
  background: active ? '#00d4ff' : 'rgba(255,255,255,0.04)',
  border: 'none',
  color: active ? '#fff' : 'inherit',
  fontSize: 12,
  fontWeight: active ? 600 : 400,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  opacity: active ? 1 : 0.6,
  '&:hover': {
    opacity: 1,
  },
}));

export const TitleInput = styled.input({
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: 'inherit',
  fontSize: 15,
  fontWeight: 600,
  fontFamily: 'inherit',
  outline: 'none',
  marginBottom: 8,
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
  '&:focus': {
    borderColor: '#00d4ff',
  },
  '&::placeholder': {
    opacity: 0.4,
    fontWeight: 400,
  },
});

export const AbstractInput = styled.textarea({
  width: '100%',
  minHeight: 60,
  padding: '10px 12px',
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  color: 'inherit',
  fontSize: 13,
  fontFamily: 'inherit',
  fontStyle: 'italic',
  resize: 'vertical',
  outline: 'none',
  marginBottom: 8,
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
  '&:focus': {
    borderColor: '#00d4ff',
  },
  '&::placeholder': {
    opacity: 0.4,
    fontStyle: 'italic',
  },
});

export const CostIndicator = styled.span({
  fontSize: 11,
  opacity: 0.5,
  fontStyle: 'italic',
});

export const ProgressText = styled.div({
  fontSize: 13,
  textAlign: 'center',
  padding: '8px 0',
  color: '#00d4ff',
});

// ============================================================================
// Tip Account / Tipping
// ============================================================================

export const TipAccountLabel = styled.div({
  fontSize: 11,
  fontWeight: 600,
  opacity: 0.6,
  marginBottom: 4,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
});

export const TipAccountInput = styled.input({
  width: '100%',
  padding: '8px 12px',
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255, 215, 0, 0.2)',
  borderRadius: 8,
  color: 'inherit',
  fontSize: 12,
  fontFamily: "'Courier New', monospace",
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
  '&:focus': {
    borderColor: '#ffd700',
  },
  '&::placeholder': {
    opacity: 0.4,
    fontFamily: 'inherit',
  },
});

export const TipSection = styled.div({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 16px',
  background: 'rgba(255, 215, 0, 0.05)',
  border: '1px solid rgba(255, 215, 0, 0.15)',
  borderRadius: 8,
  marginTop: 16,
});

export const TipAmountInput = styled.input({
  width: 80,
  padding: '6px 10px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255, 215, 0, 0.3)',
  borderRadius: 6,
  color: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  outline: 'none',
  textAlign: 'center',
  boxSizing: 'border-box',
  '&:focus': {
    borderColor: '#ffd700',
  },
  '&::placeholder': {
    opacity: 0.4,
  },
});

export const TipLabel = styled.span({
  fontSize: 12,
  fontWeight: 600,
  color: '#ffd700',
  whiteSpace: 'nowrap',
});

export const TipAccountDisplay = styled.div({
  fontSize: 11,
  opacity: 0.5,
  fontFamily: "'Courier New', monospace",
  marginTop: 4,
  wordBreak: 'break-all',
});

// ============================================================================
// Legacy export
// ============================================================================

export const CatalogueTable = styled.table({
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: 8,
  '& td': {
    padding: 2,
    textAlign: 'right',
    paddingRight: 8,
  },
});
