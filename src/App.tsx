import { useState } from 'react';
import { LayoutDashboard, Activity, Trophy, User, Gift, Plus, Shield, Menu, X, Leaf, LogOut, Image as ImageIcon } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ActivitiesView } from './components/ActivitiesView';
import { LeaderboardView } from './components/LeaderboardView';
import { ProfileView } from './components/ProfileView';
import { RewardsView } from './components/RewardsView';
import { SubmitActivityView } from './components/SubmitActivityView';
import { AdminView } from './components/AdminView';
import { FeedView } from './components/FeedView';
import { StreakNotification } from './components/StreakNotification';
import AuthView from './components/AuthView';
import { useAuth } from './context/AuthContext';

type View = 'dashboard' | 'activities' | 'submit' | 'leaderboard' | 'profile' | 'rewards' | 'admin' | 'feed';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = true; // Simulated admin access
  const { user, profile, loading, logout, streakNotification, dismissStreakNotification } = useAuth();

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Loading your experience…
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <>
      {streakNotification?.show && (
        <StreakNotification 
          streak={streakNotification.streak} 
          onDismiss={dismissStreakNotification}
        />
      )}
      <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-gray-900">EcoScore AI</span>
                <p className="text-xs text-gray-500">v1.0.0</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            <SidebarButton
              icon={<LayoutDashboard className="w-5 h-5" />}
              label="Dashboard"
              active={currentView === 'dashboard'}
              onClick={() => {
                setCurrentView('dashboard');
                setSidebarOpen(false);
              }}
            />
            <SidebarButton
              icon={<Activity className="w-5 h-5" />}
              label="My Activities"
              active={currentView === 'activities'}
              onClick={() => {
                setCurrentView('activities');
                setSidebarOpen(false);
              }}
            />
            <SidebarButton
              icon={<Plus className="w-5 h-5" />}
              label="Submit Activity"
              active={currentView === 'submit'}
              onClick={() => {
                setCurrentView('submit');
                setSidebarOpen(false);
              }}
              highlight
            />
            <SidebarButton
              icon={<Trophy className="w-5 h-5" />}
              label="Leaderboard"
              active={currentView === 'leaderboard'}
              onClick={() => {
                setCurrentView('leaderboard');
                setSidebarOpen(false);
              }}
            />
            <SidebarButton
              icon={<ImageIcon className="w-5 h-5" />}
              label="Feed"
              active={currentView === 'feed'}
              onClick={() => {
                setCurrentView('feed');
                setSidebarOpen(false);
              }}
            />
            <SidebarButton
              icon={<Gift className="w-5 h-5" />}
              label="Rewards"
              active={currentView === 'rewards'}
              onClick={() => {
                setCurrentView('rewards');
                setSidebarOpen(false);
              }}
            />
            <SidebarButton
              icon={<User className="w-5 h-5" />}
              label="Profile"
              active={currentView === 'profile'}
              onClick={() => {
                setCurrentView('profile');
                setSidebarOpen(false);
              }}
            />
            {isAdmin && (
              <>
                <div className="my-2 border-t border-gray-200" />
                <SidebarButton
                  icon={<Shield className="w-5 h-5" />}
                  label="Admin Panel"
                  active={currentView === 'admin'}
                  onClick={() => {
                    setCurrentView('admin');
                    setSidebarOpen(false);
                  }}
                />
              </>
            )}
          </nav>

          {/* User Info */}
          <div className="px-3 py-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 truncate">{user.name}</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-xs text-gray-600">{profile?.stats.totalPoints ?? 0} pts</span>
                  </div>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-600">{user.email}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-gray-900 hidden sm:block">
                  {currentView === 'dashboard' && 'Dashboard'}
                  {currentView === 'activities' && 'My Activities'}
                  {currentView === 'submit' && 'Submit Activity'}
                  {currentView === 'leaderboard' && 'Leaderboard'}
                  {currentView === 'feed' && 'Activity Feed'}
                  {currentView === 'profile' && 'Profile'}
                  {currentView === 'rewards' && 'Rewards'}
                  {currentView === 'admin' && 'Admin Panel'}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                {currentView !== 'submit' && (
                  <button 
                    onClick={() => setCurrentView('submit')}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Submit Activity</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'activities' && <ActivitiesView />}
            {currentView === 'submit' && <SubmitActivityView />}
            {currentView === 'leaderboard' && <LeaderboardView />}
            {currentView === 'feed' && <FeedView />}
            {currentView === 'profile' && <ProfileView />}
            {currentView === 'rewards' && <RewardsView />}
            {currentView === 'admin' && <AdminView />}
          </div>
        </main>
      </div>
    </div>
    </>
  );
}

function SidebarButton({ 
  icon, 
  label, 
  active, 
  onClick,
  highlight = false
}: { 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : highlight
          ? 'text-emerald-600 hover:bg-emerald-50'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
