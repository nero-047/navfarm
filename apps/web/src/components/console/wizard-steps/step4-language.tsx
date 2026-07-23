import React, { useEffect, useState } from "react";
import Button from "../../source-ui/button";
import { Globe } from "lucide-react";

interface Step4LanguageProps {
  onSubmit: (langId: string) => Promise<void>;
  isSubmitting: boolean;
  languages: any[];
  initialValue?: string;
}

export default function Step4Language({ onSubmit, isSubmitting, languages, initialValue }: Step4LanguageProps) {
  const [selectedLang, setSelectedLang] = useState(initialValue || (languages.length > 0 ? languages[0].lang_id : ""));

  useEffect(() => {
    if (initialValue) {
      setSelectedLang(initialValue);
    }
  }, [initialValue]);


  const handleSubmit = () => {
    onSubmit(selectedLang);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-teal-400" />
          Step 4: Default Language Configuration
        </h2>
        <p className="text-xs text-gray-500">Choose the standard workspace interface language.</p>
      </div>

      <div className="flex flex-col gap-2 max-w-md mt-4">
        <label className="text-xs text-gray-400 font-medium">Select Language</label>
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="bg-[#121824] border border-gray-800 rounded-xl px-4 h-12 text-sm text-white focus:outline-none focus:border-teal-500"
        >
          {languages.map((l) => (
            <option key={l.lang_id} value={l.lang_id}>
              {l.lang_name_english} ({l.lang_code.toUpperCase()})
            </option>
          ))}
        </select>
      </div>
      <Button onClick={handleSubmit} disabled={isSubmitting} className="mt-8 self-end">
        {isSubmitting ? "Saving..." : "Save & Continue"}
      </Button>
    </div>
  );
}
