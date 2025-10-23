import React from 'react';
import {
  SignedIn as ClerkSignedIn,
  SignedOut as ClerkSignedOut,
  SignInButton as ClerkSignInButton,
  SignUpButton as ClerkSignUpButton,
  UserButton as ClerkUserButton
} from '@clerk/clerk-react';

// Check if Clerk is properly configured
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured = !!publishableKey &&
                         publishableKey !== 'pk_live_your_actual_publishable_key_here' &&
                         publishableKey !== 'pk_test_YOUR_ACTUAL_CLERK_KEY_HERE';

// Fallback components when Clerk is not configured
const FallbackSignedIn: React.FC<{ children: React.ReactNode }> = ({ children }) => null;

const FallbackSignedOut: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

const FallbackSignInButton: React.FC<{ children: React.ReactNode; mode?: string }> = ({
  children,
  mode
}) => {
  if (mode === 'modal') {
    return (
      <button
        onClick={() => alert('Please add your actual Clerk publishable key to the .env file to enable authentication.')}
        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      >
        {children}
      </button>
    );
  }
  return <>{children}</>;
};

const FallbackUserButton: React.FC<any> = () => (
  <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
    Account
  </button>
);

// Wrapper components that use Clerk components when available, fallbacks otherwise
export const SignedIn = isClerkConfigured ? ClerkSignedIn : FallbackSignedIn;
export const SignedOut = isClerkConfigured ? ClerkSignedOut : FallbackSignedOut;
export const SignInButton = isClerkConfigured ? ClerkSignInButton : FallbackSignInButton;
export const SignUpButton = isClerkConfigured ? ClerkSignUpButton : FallbackSignInButton;
export const UserButton = isClerkConfigured ? ClerkUserButton : FallbackUserButton;