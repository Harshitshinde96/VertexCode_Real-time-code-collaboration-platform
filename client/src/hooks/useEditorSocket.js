import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { initSocket } from "@/socket";
import ACTIONS from "@/Actions";

export const useEditorSocket = (roomId, currentUsername) => {
  const socketRef = useRef(null);
  const codeRef = useRef("// Welcome to VertexCode\n// Start typing here...\n");
  const skipStdinChange = useRef(false);
  const languageRef = useRef("javascript");
  const reactNavigator = useNavigate();

  const [language, setLanguage] = useState("javascript");
  const [clients, setClients] = useState([]);
  const [output, setOutput] = useState("");
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stdin, setStdin] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  const [waitingState, setWaitingState] = useState({
    title: "Asking to join...",
    subtitle: "Waiting for the host to admit you to the room.",
  });

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    const init = () => {
      socketRef.current = initSocket();

      function handleErrors(err) {
        if (err.message && err.message.includes("Authentication error")) {
          toast.error("Session expired or unauthorized. Please log in again.");
          reactNavigator("/login");
          return;
        }
        toast.error("Connecting... Server may be waking up.");
      }

      socketRef.current.on("connect_error", handleErrors);
      socketRef.current.on("connect_failed", handleErrors);

      socketRef.current.on("connect", () => {
        setIsConnected(true);
        setIsWaiting(true);
        socketRef.current.emit(ACTIONS.ASK_TO_JOIN, { roomId });
      });

      socketRef.current.on(ACTIONS.WAITING_FOR_HOST, ({ message }) => {
        setIsWaiting(true);
        setWaitingState({
          title: "Waiting for Host...",
          subtitle: message || "The host has not joined this session yet.",
        });
      });

      socketRef.current.on(ACTIONS.REQUEST_DENIED, ({ message }) => {
        toast.error(message || "The host declined your request.");
        reactNavigator("/");
      });

      // 🟢 FIX FOR ISSUE 2: Listen for the backend sending the live code state
      socketRef.current.on(ACTIONS.SYNC_CODE, ({ code, language: newLang }) => {
        codeRef.current = code; // Updates the ref so when the Editor mounts, it uses this!
        if (newLang) {
          setLanguage(newLang);
          languageRef.current = newLang;
        }
      });

      socketRef.current.on(
        ACTIONS.JOIN_REQUEST,
        ({ guestSocketId, guestName }) => {
          toast(`${guestName} is asking to join`, {
            id: guestName, // 🟢 FIX: Prevents duplicate toasts for the same user
            duration: 15000,
            action: {
              label: "Admit",
              onClick: () => {
                socketRef.current.emit(ACTIONS.ADMIT_USER, {
                  guestSocketId,
                  roomId,
                });
              },
            },
            cancel: {
              label: "Deny",
              onClick: () => {
                socketRef.current.emit(ACTIONS.DENY_USER, { guestSocketId });
              },
            },
          });
        },
      );

      socketRef.current.on("disconnect", () => {
        toast.warning("Connection lost. Reconnecting...");
        setIsConnected(false);
      });

      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, role, socketId }) => {
          if (socketId === socketRef.current.id) {
            // Because the backend sent SYNC_CODE milliseconds before this,
            // codeRef.current now contains the live code. Dropping the loading screen mounts the editor perfectly!
            setIsWaiting(false);
            toast.success("You have joined the room.");
          } else {
            toast.success(`${username} joined as ${role}`);
          }

          setClients(clients);

          // Note: We removed the Host-side SYNC_CODE emission here because the Backend handles it now.
        },
      );

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        if (username) {
          toast.success(`${username} left the room.`);
        }
        setClients((prev) =>
          prev.filter((client) => client.socketId !== socketId),
        );
      });

      socketRef.current.on(ACTIONS.CODE_RUNNING, () => {
        setOutput("");
        setIsLoading(true);
        setIsWaitingForInput(false);
      });

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
        },
      );

      socketRef.current.on(ACTIONS.LANGUAGE_CHANGE, ({ newLanguage }) => {
        if (newLanguage) {
          setLanguage(newLanguage);
          languageRef.current = newLanguage;
        }
      });

      socketRef.current.on(ACTIONS.STDIN_CHANGE, ({ newInput }) => {
        if (newInput !== null) {
          skipStdinChange.current = true;
          setStdin(newInput);
        }
      });
    };

    if (currentUsername) {
      init();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off(ACTIONS.CODE_RUNNING);
        socketRef.current.off(ACTIONS.CODE_OUTPUT);
        socketRef.current.off(ACTIONS.LANGUAGE_CHANGE);
        socketRef.current.off(ACTIONS.STDIN_CHANGE);
        socketRef.current.off(ACTIONS.JOIN_REQUEST);
        socketRef.current.off(ACTIONS.WAITING_FOR_HOST);
        socketRef.current.off(ACTIONS.REQUEST_DENIED);
        socketRef.current.off(ACTIONS.SYNC_CODE); // Cleanup the new listener
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("connect_error");
        socketRef.current.off("connect_failed");
      }
    };
  }, [roomId, currentUsername, reactNavigator]);

  const runCode = () => {
    socketRef.current.emit(ACTIONS.RUN_CODE, {
      roomId,
      language: languageRef.current,
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

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, {
      roomId,
      newLanguage,
    });
  };

  const handleStdinChange = (e) => {
    const newValue = e.target.value;
    setStdin(newValue);

    if (skipStdinChange.current) {
      skipStdinChange.current = false;
      return;
    }

    socketRef.current.emit(ACTIONS.STDIN_CHANGE, {
      roomId,
      newInput: newValue,
    });
  };

  return {
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
  };
};
