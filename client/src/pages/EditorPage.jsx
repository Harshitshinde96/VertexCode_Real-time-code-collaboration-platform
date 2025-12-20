import React, { useEffect, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Hooks & Constants
import { useEditorSocket } from "@/hooks/useEditorSocket";
import { LANGUAGES } from "@/constants";

// Components
import CodeEditor from "@/components/CodeEditor";
import Sidebar from "@/components/Sidebar";
import ControlBar from "@/components/ControlBar";
import BottomPanel from "@/components/BottomPanel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

const FullPageLoader = ({ text }) => (
  <div className="min-h-screen bg-[#1c1e29] text-white flex flex-col items-center justify-center p-4">
    <Loader2 className="h-12 w-12 animate-spin mb-4" />
    <h2 className="text-xl font-semibold">{text}</h2>
    <p className="text-neutral-400">This may take up to 30 seconds...</p>
  </div>
);

const EditorPage = () => {
  const location = useLocation();
  const reactNavigator = useNavigate();
  const { roomId } = useParams();

  // Initialize username from state OR local storage
  const [username] = useState(
    location.state?.username || localStorage.getItem("savedUsername")
  );

  // Use Custom Hook for all Socket Logic
  const {
    socketRef,
    codeRef,
    language,
    clients,
    output,
    isWaitingForInput,
    isLoading,
    stdin,
    isConnected,
    runCode,
    submitInput,
    handleLanguageChange,
    handleStdinChange,
  } = useEditorSocket(roomId, username);

  // --- Security Check ---
  useEffect(() => {
    // If no username found in state OR local storage, kick them out
    if (!username) {
      toast.error("Please join via the home page.");
      reactNavigator("/");
    }
  }, [username, reactNavigator]);

  if (!username) return <Navigate to="/" />;

  // Show this *until* the socket is connected
  if (!isConnected) {
    return <FullPageLoader text="Waking up server..." />;
  }

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to your clipboard ");
    } catch (error) {
      toast.error("Could not copy Room ID");
      console.error(error);
    }
  };

  const leaveRoom = () => {
    reactNavigator("/");
  };

  return (
    <div className="grid grid-cols-[230px_1fr] h-screen bg-[#1c1e29]">
      <Sidebar
        clients={clients}
        onCopyRoomId={copyRoomId}
        onLeaveRoom={leaveRoom}
      />

      {/* Main Panel (Editor + Output/Input) */}
      <div className="flex flex-col h-full">
        <ControlBar
          language={language}
          onLanguageChange={handleLanguageChange}
          languages={LANGUAGES}
          onRunCode={runCode}
          isLoading={isLoading}
        />

        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={70}>
            <div className="flex-1 overflow-hidden h-full">
              <CodeEditor
                language={language}
                socketRef={socketRef}
                roomId={roomId}
                onCodeChange={(code) => {
                  codeRef.current = code;
                }}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30}>
            <BottomPanel
              output={output}
              isWaitingForInput={isWaitingForInput}
              onInputSubmit={submitInput}
              isLoading={isLoading}
              stdin={stdin}
              onStdinChange={handleStdinChange}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default EditorPage;
