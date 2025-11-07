import React, { useRef, useEffect } from "react";

export const OutputPanel = ({
  output,
  isWaitingForInput,
  onInputSubmit,
  isLoading,
}) => {
  const inputRef = useRef(null);
  const consoleEndRef = useRef(null);

  useEffect(() => {
    if (isWaitingForInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isWaitingForInput]);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [output]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && onInputSubmit && !isLoading) {
      onInputSubmit(e.currentTarget.value);
      e.currentTarget.value = ""; // Clear the input field
    }
  };

  return (
    // Main container (now a flex-col)
    <div className="h-full w-full bg-black text-white font-mono text-sm flex flex-col">
      {/* 1. ADDED THIS LABEL BAR */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-neutral-700/80">
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          Output
        </span>
      </div>

      {/* 2. ADDED padding and line-height to this wrapper div */}
      <div className="flex-1 p-4 overflow-y-auto leading-relaxed">
        {/* Main output area */}
        <div className="whitespace-pre-wrap">
          {output}
          {isLoading && !isWaitingForInput && (
            <span className="animate-pulse">Running...</span>
          )}
        </div>

        {/* Conditional input field */}
        {isWaitingForInput && (
          <div className="flex items-center text-green-400 mt-2">
            <span className="mr-2">{">"}</span>
            <input
              type="text"
              className="flex-1 bg-black text-green-400 outline-none border-none placeholder:text-neutral-600"
              ref={inputRef}
              onKeyPress={handleKeyPress}
              placeholder="Type your input and press Enter..."
              disabled={!isWaitingForInput || isLoading}
            />
          </div>
        )}

        <div ref={consoleEndRef} />
      </div>
    </div>
  );
};

export default OutputPanel;
