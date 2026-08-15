"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  organizationSchema,
  OrganizationFormData,
} from "@/schemas/organization.schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrganization } from "@/lib/api/organizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api-client";

interface OrgFormProps {
  orgId: string;
  currentName: string;
}

export function OrgForm({ orgId, currentName }: OrgFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { name: currentName },
  });

  const updateMutation = useMutation({
    mutationFn: (data: OrganizationFormData) => updateOrganization(orgId, data),
    onSuccess: () => {
      toast.success("Organization updated");
      queryClient.invalidateQueries({ queryKey: ["organizations", orgId] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to update organization");
    },
  });

  const onSubmit = (data: OrganizationFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
      <div className="space-y-2">
        <Label htmlFor="org-name">Organization name</Label>
        <Input
          id="org-name"
          {...register("name")}
          className={errors.name ? "border-red-400 focus:ring-red-400" : ""}
        />
        {errors.name && (
          <p className="text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>
      <Button
        type="submit"
        className="w-full sm:w-auto"
        disabled={updateMutation.isPending || !isDirty}
      >
        {updateMutation.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Save changes
      </Button>
    </form>
  );
}
