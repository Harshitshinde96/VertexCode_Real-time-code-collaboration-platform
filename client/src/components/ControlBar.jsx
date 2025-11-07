import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Code2, Play, Square } from "lucide-react";

const ControlBar = ({
  language,
  onLanguageChange,
  languages,
  onRunCode,
  isLoading,
}) => {
  return (
    <div className="flex items-center justify-between p-2 bg-[#282a36] border-b border-neutral-700/80 shrink-0">
      {/* Left Side: Language Selector */}
      <Select value={language} onValueChange={onLanguageChange}>
        <SelectTrigger className="w-[180px] bg-neutral-800 border-neutral-700 text-white">
          <Code2 className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent className="bg-neutral-800 text-white border-neutral-700">
          {languages.map((lang) => (
            <SelectItem
              key={lang.id}
              value={lang.id}
              className="focus:bg-neutral-700"
            >
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Right Side: Run/Stop Buttons */}
      <div className="flex gap-2">
        <Button
          className="font-semibold bg-green-500 hover:bg-green-700"
          onClick={onRunCode}
          disabled={isLoading}
        >
          <Play className="h-4 w-4 mr-2" />
          {isLoading ? "Running..." : "Run"}
        </Button>
        <Button variant="destructive" className="font-semibold">
          <Square className="h-4 w-4 mr-2" />
          Stop
        </Button>
      </div>
    </div>
  );
};

export default ControlBar;
