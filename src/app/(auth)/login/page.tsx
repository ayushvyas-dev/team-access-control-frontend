import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — TeamAccess",
  description:
    "Sign in to your TeamAccess account to manage your organizations and teams.",
};

export default function LoginPage() {
  return (
    <div>
      <div className="mb-6 text-center sm:mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-[1.75rem]">
          Welcome back
        </h1>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Sign in to your account
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
