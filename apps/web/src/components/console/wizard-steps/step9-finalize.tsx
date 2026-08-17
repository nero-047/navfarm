import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface Step9FinalizeProps {
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

export default function Step9Finalize({ onSubmit, isSubmitting }: Step9FinalizeProps) {
  return (
    <div className="flex flex-col gap-4 text-center items-center justify-center py-8">
      <div className="w-16 h-16 rounded-full bg-(--accent-muted) flex items-center justify-center text-(--accent) mb-2 border border-(--accent)/20">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-semibold text-(--text-primary)">All Configuration Steps Complete!</h2>
      <p className="text-(--text-secondary) text-sm max-w-md mt-1">
        Your database is fully seeded and custom parameters are registered. Click below to launch your NAVFarm ERP space.
      </p>
      <Button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="mt-6 px-8 py-3 font-semibold"
      >
        {isSubmitting ? "Finalizing Workspace..." : "Launch Operational Console"}
      </Button>
    </div>
  );
}
