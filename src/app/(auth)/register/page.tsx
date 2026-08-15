import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account — TeamAccess",
  description: "Create a new TeamAccess account to start managing your teams.",
};

export default function RegisterPage() {
  return (
    <div>
      <div className="mb-6 text-center sm:mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-[1.75rem]">
          Create an account
        </h1>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Get started with TeamAccess
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
