import React, { useState, createContext, useContext } from 'react';

interface MockAuthContextType {
  isAuthenticated: boolean;
  user: { name: string; email: string; imageUrl?: string } | null;
  login: (email: string, password: string) => void;
  logout: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
};

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; imageUrl?: string } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = (email: string, password: string) => {
    // Mock authentication
    setError('');
    if (email && password) {
      // Simulate successful login
      setUser({
        name: email.split('@')[0],
        email,
        imageUrl: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`
      });
      setIsAuthenticated(true);
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
    } else {
      setError('Please enter both email and password');
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <MockAuthContext.Provider value={{ isAuthenticated, user, login, logout, showLoginModal, setShowLoginModal }}>
      {children}
      {/* Clerk-style Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border-border shadow-xl rounded-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-foreground font-bold text-2xl">Sign in to Flame AI</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-muted-foreground mb-6">Welcome back! Please sign in to continue</p>
              
              {/* Google Sign-in Button */}
              <button className="w-full flex items-center justify-center gap-3 bg-background border-border hover:bg-accent text-foreground rounded-md p-3 mb-4 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">or</span>
                </div>
              </div>
              
              {/* Email and Password Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-foreground font-medium block mb-2">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border-border text-foreground focus:border-primary rounded-md p-3 border"
                    placeholder="Enter your email address"
                  />
                </div>
                <div>
                  <label className="text-foreground font-medium block mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border-border text-foreground focus:border-primary rounded-md p-3 border"
                    placeholder="Enter your password"
                  />
                </div>
                {error && (
                  <div className="text-destructive text-sm">{error}</div>
                )}
                <button
                  onClick={() => login(email, password)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg rounded-md p-3 flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Continue</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-border">
              <div className="flex justify-center text-sm text-muted-foreground">
                <span>Don't have an account? </span>
                <button className="text-primary hover:text-primary/80 ml-1">Sign up</button>
              </div>
              <div className="flex items-center justify-center mt-4 text-xs text-muted-foreground">
                <span>Secured by </span>
                <a href="https://go.clerk.com/components" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 ml-1">Clerk</a>
              </div>
              <div className="text-center text-xs text-muted-foreground mt-2">Development mode</div>
            </div>
          </div>
        </div>
      )}
    </MockAuthContext.Provider>
  );
};

export const MockSignedIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useMockAuth();
  return isAuthenticated ? <>{children}</> : null;
};

export const MockSignedOut: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useMockAuth();
  return !isAuthenticated ? <>{children}</> : null;
};

export const MockSignInButton: React.FC<{ children: React.ReactNode; className?: string; mode?: string }> = ({
  children,
  className = '',
  mode = 'redirect'
}) => {
  const { setShowLoginModal } = useMockAuth();
  
  const handleClick = () => {
    if (mode === 'modal') {
      setShowLoginModal(true);
    }
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
};

export const MockUserButton: React.FC<{ children?: React.ReactNode; className?: string; appearance?: any }> = ({
  children,
  className = '',
  appearance = {}
}) => {
  const { user, logout, setShowLoginModal } = useMockAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className={`${className} ${appearance?.elements?.avatarBox || ''}`}
      >
        {children || (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-primary font-semibold">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
            )}
          </div>
        )}
      </button>
      
      {/* User Menu Dropdown */}
      {showUserMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-card border-border shadow-lg rounded-md z-50">
          <div className="p-4 border-b border-border">
            <p className="text-foreground font-medium">{user?.name}</p>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
          <div className="p-2">
            <button
              onClick={() => {
                logout();
                setShowUserMenu(false);
              }}
              className="w-full text-left text-foreground hover:bg-accent rounded-md p-2 text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
      
      {/* Close dropdown when clicking outside */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
};