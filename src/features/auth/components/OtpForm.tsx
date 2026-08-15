'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { verifyEmailSchema, VerifyEmailFormData } from '@/schemas/auth.schemas';
import { useVerifyEmail } from '@/features/auth/hooks/useVerifyEmail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface OtpFormProps {
  defaultEmail?: string;
}

export function OtpForm({ defaultEmail }: OtpFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: defaultEmail || '',
    },
  });

  const verifyMutation = useVerifyEmail();

  const onSubmit = (data: VerifyEmailFormData) => {
    verifyMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          className={errors.email ? 'border-red-400 focus:ring-red-400' : ''}
          readOnly={!!defaultEmail}
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="otp">Verification Code</Label>
        <Input
          id="otp"
          type="text"
          placeholder="123456"
          maxLength={6}
          {...register('otp')}
          className={errors.otp ? 'border-red-400 focus:ring-red-400' : ''}
        />
        {errors.otp && (
          <p className="text-xs text-red-600">{errors.otp.message}</p>
        )}
        <p className="text-xs text-gray-400">
          Enter the 6-digit code sent to your email
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={verifyMutation.isPending}
      >
        {verifyMutation.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Verify email
      </Button>
    </form>
  );
}
