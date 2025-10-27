import Client from "@/components/Client";
import CodeEditor from "@/components/CodeEditor";
import { Button } from "@/components/ui/button";
import React, { useEffect, useRef, useState } from "react";

// --- Imports for the language dropdown ---
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Code2, Play, Square } from "lucide-react";
import { initSocket } from "@/socket";
import ACTIONS from "@/Actions";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "sonner";

// --- Language options ---
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
  const codeRef = useRef(null);
  const location = useLocation();
  const reactNavigator = useNavigate();
  const { roomId } = useParams();
  const [language, setLanguage] = useState("javascript");

  const [clients, setClients] = useState([]);

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
            console.log(`${username} joined`);
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
          return prev.filter((client) => client.socketId !== socketId); // this removes coming socketId from current client list and retunrs updated listed filtering the passed socketId
        });
      });
    };
    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
      }
    };
  }, []);

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

  if (!location.state) {
    return <Navigate to="/" />;
  }

  return (
    // Main grid layout: 230px sidebar, remaining space for editor
    <div className="grid grid-cols-[230px_1fr] h-screen bg-[#1c1e29]">
      {/* Sidebar Column */}
      <div className="bg-[#282a36] p-4 text-white flex flex-col border-r border-neutral-700/80">
        {/* Logo (Stays at the top, separated by a border) */}
        <div className="logo pb-4 mb-4 shrink-0 border-b border-neutral-700">
          <img
            src="/vertex-code-logo-white.png"
            alt="VertexCode Logo"
            className="w-40" // Corrected from w-45
          />
        </div>

        {/* Connected Clients (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto pr-2">
          <h3 className="text-sm uppercase font-semibold tracking-wider text-neutral-400 mb-3 sticky top-0 py-2 bg-[#282a36]/90 backdrop-blur-sm border-b border-neutral-700/50">
            Connected
          </h3>

          <div className="clientList flex flex-wrap gap-3">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>

        {/* Bottom Buttons*/}
        <div className="mt-auto shrink-0 border-t border-neutral-700 pt-4 space-y-3">
          <Button
            className="w-full font-bold py-3 bg-green-500 hover:bg-green-700 transition-all duration-200 focus:ring-2 focus:ring-green-500"
            onClick={copyRoomId}
          >
            Copy Room ID
          </Button>
          <Button
            className="w-full font-bold py-3 transition-all duration-200 focus:ring-2 bg-red-500 hover:bg-red-700" // Used red-600 as per your last code
            onClick={leaveRoom}
          >
            Leave
          </Button>
        </div>
      </div>

      {/* Editor Column (NOW A FLEX CONTAINER) */}
      <div className="flex flex-col h-full">
        {/* === NEW: Top Control Bar === */}
        <div className="flex items-center justify-between p-2 bg-[#282a36] border-b border-neutral-700/80 shrink-0">
          {/* Left Side: Language Selector */}
          <Select
            value={language}
            onValueChange={(value) => setLanguage(value)}
          >
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
            <Button className="font-semibold bg-green-500 hover:bg-green-700">
              <Play className="h-4 w-4 mr-2" />
              Run
            </Button>
            <Button className="font-semibold bg-red-500 hover:bg-red-700">
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </div>
        </div>

        {/* === Editor (Fills remaining space) === */}
        <div className="flex-1 overflow-hidden">
          {/* Pass the selected language to the editor */}
          <CodeEditor
            language={language}
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => {
              // this is going to be used for syncing code for new user when a joins newly
              codeRef.current = code;
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
