import React, { useState, useRef, useEffect } from "react";
import MonacoEditor from "@monaco-editor/react";
import ACTIONS from "@/Actions"; // Make sure this path is correct

const CodeEditor = ({ language, socketRef, roomId, onCodeChange }) => {
  const [code, setCode] = useState(
    "// Welcome to VertexCode, Made with ❤️ by Harhsit Shinde \n"
  );

  // A ref to prevent firing socket events for changes we just received(It is just like its name skipChnage means means skip the CODE_CHANGE Action).
  const skipChange = useRef(false);

  //Listen for incoming code changes from other users
  useEffect(() => {
    if (!socketRef.current) {
      return;
    }

    const handler = ({ code: receivedCode }) => {
      if (receivedCode !== null) {
        // Set the flag to true to skip emitting this change
        // Basically it is used for stopping the infinite loop of socket events
        // when we receive code changes from other users
        skipChange.current = true;
        setCode(receivedCode);
      }
    };

    socketRef.current.on(ACTIONS.CODE_CHANGE, handler);

    // Cleanup the listener
    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE, handler);
    };
  }, [socketRef.current]);

  
  //Handle local code changes and emit them to other users
  const handleEditorChange = (value, event) => {
    // Always update the local state
    setCode(value);

    // If the change was triggered by our socket listener,
    // reset the flag and do not emit the change.
    // Basically it is used to prevent emitting socket events for updates that originated from remote users (avoids infinite update loops)
    if (skipChange.current) {
      skipChange.current = false;
      return;
    }

    // If it was a local user change, emit it to the server.
    if (socketRef.current) {
      onCodeChange(value);

      socketRef.current.emit(ACTIONS.CODE_CHANGE, {
        roomId,
        code: value,
      });
    }
  };

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
