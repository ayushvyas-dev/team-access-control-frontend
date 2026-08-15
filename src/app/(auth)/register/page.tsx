import type { Metadata } from 'next';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = {
  title: 'Create Account — TeamAccess',
  description: 'Create a new TeamAccess account to start managing your teams.',
};

export default function RegisterPage() {
  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Create an account
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Get started with TeamAccess
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
