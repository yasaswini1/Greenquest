import { useState } from 'react';
import { Shield, LogOut } from 'lucide-react';
import { AdminLoginView } from './AdminLoginView';
import { AdminDashboard } from './AdminDashboard';
import { useAuth } from '../context/AuthContext';

export function AdminApp() {
  const { user, logout, adminLogin, loading, error } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleAdminLogin = async (email: string, password: string) => {
    setLocalError(null);
    try {
      await adminLogin(email, password);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  if (!user || !user.is_admin) {
    return (
      <AdminLoginView
        onLogin={handleAdminLogin}
        loading={loading}
        error={localError || error}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-purple-600 text-white border-b border-purple-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" />
              <div>
                <h1 className="text-lg font-semibold">Admin Portal</h1>
                <p className="text-xs text-purple-200">GreenQuest Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-purple-200">{user.email}</span>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <AdminDashboard />
      </main>
    </div>
  );
}

