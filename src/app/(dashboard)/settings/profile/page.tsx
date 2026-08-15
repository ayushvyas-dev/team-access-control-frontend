"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { updateMe } from "@/lib/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api-client";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm({
    defaultValues: {
      name: user?.name || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: () => {
      toast.success("Profile updated");
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const onSubmit = (data: { name: string }) => {
    updateMutation.mutate(data);
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-[1.75rem]">
          Profile
        </h1>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Manage your personal information
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 p-5 sm:p-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 sm:space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ""}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-400">Email cannot be changed</p>
          </div>

          <Button type="submit" disabled={updateMutation.isPending || !isDirty}>
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save changes
          </Button>
        </form>
      </div>
    </div>
  );
}
