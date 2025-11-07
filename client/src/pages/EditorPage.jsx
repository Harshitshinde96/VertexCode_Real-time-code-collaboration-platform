import React, { useEffect, useRef, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "sonner";

import { initSocket } from "@/socket";
import ACTIONS from "@/Actions";

// Import all our new components
import CodeEditor from "@/components/CodeEditor";
import Sidebar from "@/components/Sidebar";
import ControlBar from "@/components/ControlBar";
import BottomPanel from "@/components/BottomPanel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

// Language options are now local to this file
const languages = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "c", label: "C" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
];

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(
    "// Welcome to VertexCode, Made with ❤️ by Harhsit Shinde \n"
  );
  const skipStdinChange = useRef(false);

  const location = useLocation();
  const reactNavigator = useNavigate();
  const { roomId } = useParams();

  // State
  const [language, setLanguage] = useState("javascript");
  const [clients, setClients] = useState([]);
  const [output, setOutput] = useState("");
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stdin, setStdin] = useState("");

  // Socket and event logic (remains unchanged)
  useEffect(() => {
    const init = () => {
      socketRef.current = initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }
      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      //Listening for joined event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(`${username} joined the room`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      //Listeing for disconnected
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });

      socketRef.current.on(ACTIONS.CODE_RUNNING, () => {
        setOutput(""); // Clear the console
        setIsLoading(true);
        setIsWaitingForInput(false);
      });

      //Listen for code output
      socketRef.current.on(
        ACTIONS.CODE_OUTPUT,
        ({ output, error, waitingForInput }) => {
          setIsLoading(false);
          if (error) {
            setOutput((prev) => prev + `\nError: ${error}\n`);
          } else {
            setOutput((prev) => prev + output);
          }
          setIsWaitingForInput(waitingForInput);
        }
      );

      socketRef.current.on(ACTIONS.LANGUAGE_CHANGE, ({ newLanguage }) => {
        if (newLanguage) {
          setLanguage(newLanguage);
        }
      });

      // --- ADD THIS LISTENER for Stdin Change ---
      socketRef.current.on(ACTIONS.STDIN_CHANGE, ({ newInput }) => {
        if (newInput !== null) {
          // Use the skip flag to prevent an echo
          skipStdinChange.current = true;
          setStdin(newInput);
        }
      });
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off(ACTIONS.CODE_RUNNING);
        socketRef.current.off(ACTIONS.CODE_OUTPUT);
        socketRef.current.off(ACTIONS.LANGUAGE_CHANGE);
        socketRef.current.off(ACTIONS.STDIN_CHANGE);
      }
    };
  }, []);

  // --- All Handler Functions ---

  const runCode = () => {
    socketRef.current.emit(ACTIONS.RUN_CODE, {
      roomId,
      language,
      code: codeRef.current,
      stdin: stdin,
    });
  };

  const submitInput = (input) => {
    setOutput((prev) => prev + `${input}\n`);
    setIsLoading(true);
    setIsWaitingForInput(false);
    socketRef.current.emit(ACTIONS.PROVIDE_INPUT, {
      roomId,
      input,
    });
  };

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

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage); // Update local state
    // Emit the change to the server
    socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, {
      roomId,
      newLanguage,
    });
  };

  // --- ADD THIS HANDLER for Stdin Change ---
  const handleStdinChange = (e) => {
    const newValue = e.target.value;
    setStdin(newValue); // Update local state

    // Check the skip flag to prevent echo
    if (skipStdinChange.current) {
      skipStdinChange.current = false;
      return;
    }
    // Emit the change to the server
    socketRef.current.emit(ACTIONS.STDIN_CHANGE, {
      roomId,
      newInput: newValue,
    });
  };

  // --- Security Check ---
  if (!location.state) {
    return <Navigate to="/" />;
  }

  // --- Cleaned-up JSX ---
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
          languages={languages}
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
