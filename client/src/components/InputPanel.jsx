import React from 'react';

const InputPanel = ({ value, onChange, placeholder }) => {
  return (
    <div className="h-full flex flex-col bg-[#0c0c0c]">
      {/* Label Bar */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-neutral-700/80">
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          Input
        </span>
      </div>

      {/* Input Textarea */}
      <textarea
        className="h-full w-full bg-[#0c0c0c] text-white font-mono text-sm p-4 outline-none resize-none leading-relaxed"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default InputPanel;