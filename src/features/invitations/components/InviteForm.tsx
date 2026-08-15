"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  invitationSchema,
  InvitationFormData,
} from "@/schemas/invitation.schemas";
import { useCreateInvitation } from "@/features/invitations/hooks/useCreateInvitation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface InviteFormProps {
  orgId: string;
}

export function InviteForm({ orgId }: InviteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      role: "MEMBER",
    },
  });

  const createInvitation = useCreateInvitation(orgId);

  const onSubmit = (data: InvitationFormData) => {
    createInvitation.mutate(data, {
      onSuccess: () => reset(),
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end"
    >
      <div className="flex-1 space-y-2">
        <Label htmlFor="invite-email">Email address</Label>
        <Input
          id="invite-email"
          type="email"
          placeholder="colleague@example.com"
          {...register("email")}
          className={errors.email ? "border-red-400 focus:ring-red-400" : ""}
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>
      <div className="w-full space-y-2 sm:w-32">
        <Label>Role</Label>
        <Select
          defaultValue="MEMBER"
          onValueChange={(val) => {
            if (val) setValue("role", val as InvitationFormData["role"]);
          }}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OWNER">Owner</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MEMBER">Member</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        type="submit"
        disabled={createInvitation.isPending}
        className="w-full sm:w-auto"
      >
        {createInvitation.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Invite
      </Button>
    </form>
  );
}
