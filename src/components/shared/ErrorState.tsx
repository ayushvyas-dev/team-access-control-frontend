import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  retry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-14 text-center sm:px-6 sm:py-16",
        className,
      )}
    >
      <AlertCircle className="h-8 w-8 text-red-400 mb-4" />
      <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
      <p className="max-w-sm text-sm leading-6 text-gray-500">{message}</p>
      {retry && (
        <Button variant="outline" onClick={retry} className="mt-4">
          Try again
        </Button>
      )}
    </div>
  );
}
