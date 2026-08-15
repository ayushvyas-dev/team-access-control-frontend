import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In — TeamAccess',
  description: 'Sign in to your TeamAccess account to manage your organizations and teams.',
};

export default function LoginPage() {
  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Sign in to your account
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
