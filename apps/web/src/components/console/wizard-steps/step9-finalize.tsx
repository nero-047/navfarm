import React from "react";
import Button from "../../source-ui/button";
import { Sparkles } from "lucide-react";

interface Step9FinalizeProps {
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

export default function Step9Finalize({ onSubmit, isSubmitting }: Step9FinalizeProps) {
  return (
    <div className="flex flex-col gap-4 text-center items-center justify-center py-8">
      <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 mb-2 border border-teal-500/20">
        <Sparkles className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-extrabold text-white">All Configuration Steps Complete!</h2>
      <p className="text-gray-400 text-sm max-w-md mt-1">
        Your database is fully seeded and custom parameters are registered. Click below to launch your NAVFarm ERP space.
      </p>
      <Button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="mt-6 px-8 py-3 bg-gradient-to-r from-teal-500 to-blue-600 font-bold"
      >
        {isSubmitting ? "Finalizing Workspace..." : "Launch Operational Console"}
      </Button>
    </div>
  );
}
