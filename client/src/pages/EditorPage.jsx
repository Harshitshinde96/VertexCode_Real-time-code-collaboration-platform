import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Context
import { useAuth } from "../context/AuthContext";

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

// A reusable full-page loader
const FullPageLoader = ({ title, subtitle }) => (
  <div className="min-h-screen bg-[#1c1e29] text-white flex flex-col items-center justify-center p-4">
    <Loader2 className="h-12 w-12 animate-spin mb-4 text-green-500" />
    <h2 className="text-xl font-semibold">{title}</h2>
    <p className="text-neutral-400 mt-2">{subtitle}</p>
  </div>
);

const EditorPage = () => {
  const reactNavigator = useNavigate();
  const { roomId } = useParams();

  const { user } = useAuth();

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
    isWaiting,
    waitingState,
    runCode,
    submitInput,
    handleLanguageChange,
    handleStdinChange,
  } = useEditorSocket(roomId, user?.name);

  const currentUserClient = clients.find((c) => c.username === user?.name);
  const isHost = currentUserClient?.role === "host";

  const handleProtectedRunCode = () => {
    if (!isHost) {
      toast.error("Only the Room Host can run code.");
      return;
    }
    runCode();
  };

  const handleProtectedLanguageChange = (newLang) => {
    if (!isHost) {
      toast.error("Only the Room Host can change the language.");
      return;
    }
    handleLanguageChange(newLang);
  };

  // --- UI RENDER LOCKS ---

  if (!isConnected) {
    return (
      <FullPageLoader
        title="Connecting..."
        subtitle="Establishing secure connection to the server."
      />
    );
  }

  // 🟢 Intercept the render if they are a Guest waiting for Host approval
  if (isWaiting) {
    return (
      <FullPageLoader
        title={waitingState.title}
        subtitle={waitingState.subtitle}
      />
    );
  }

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to your clipboard");
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

      <div className="flex flex-col h-full">
        <ControlBar
          language={language}
          onLanguageChange={handleProtectedLanguageChange}
          languages={LANGUAGES}
          onRunCode={handleProtectedRunCode}
          isLoading={isLoading}
          isHost={isHost}
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
