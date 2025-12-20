import React from "react";
import MonacoEditor from "@monaco-editor/react";
import { useCodeSync } from "@/hooks/useCodeSync";

const CodeEditor = ({ language, socketRef, roomId, onCodeChange }) => {
  const { code, handleEditorChange } = useCodeSync(
    socketRef,
    roomId,
    onCodeChange,
    "// Welcome to VertexCode, Made with ❤️ by Harhsit Shinde \n"
  );

  return (
    <div className="h-full w-full">
      <MonacoEditor
        height="100%"
        width="100%"
        theme="vs-dark"
        language={language}
        value={code}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: true },
          fontSize: 16,
          cursorStyle: "line",
          wordWrap: "on",
          autoClosingBrackets: "always",
          autoClosingTags: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;