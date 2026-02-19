import { useSelector, useDispatch } from 'react-redux';
import { Panel, HorizontalTab } from 'nexus-module';

import ResearchFeed from './news';
import AuthorFeed from './namespace';
import Profile from './profile';
import { switchTab } from '../actions/actionCreators';

export default function Main() {
  const activeTab = useSelector((state) => state.ui.activeTab);
  const dispatch = useDispatch();

  const handleSwitchTab = (tab) => {
    dispatch(switchTab(tab));
  };

  return (
    <Panel
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="social-logo.svg" alt="" style={{ width: '28px', height: '28px' }} />
          <span style={{
            background: 'linear-gradient(135deg, #ef4568 0%, #f0aa21 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
            fontSize: '1.1em',
            letterSpacing: '0.5px',
            textShadow: '0 0 20px rgba(240, 170, 33, 0.3)'
          }}>Distordia Research</span>
        </span>
      }>
      <div className="text-center">
        <HorizontalTab.TabBar>
          <HorizontalTab
            active={activeTab === 'NewsFeed'}
            onClick={() => handleSwitchTab('NewsFeed')}
          >
            Research Feed
          </HorizontalTab>
          <HorizontalTab
            active={activeTab === 'NamespaceFeed'}
            onClick={() => handleSwitchTab('NamespaceFeed')}
          >
            Author Feed
          </HorizontalTab>
          <HorizontalTab
            active={activeTab === 'Profile'}
            onClick={() => handleSwitchTab('Profile')}
          >
            My Publications
          </HorizontalTab>
        </HorizontalTab.TabBar>
      </div>

      <div>{activeTab === 'NewsFeed' && <ResearchFeed />}</div>
      <div>{activeTab === 'NamespaceFeed' && <AuthorFeed />}</div>
      <div>{activeTab === 'Profile' && <Profile />}</div>
    </Panel>
  );
}
