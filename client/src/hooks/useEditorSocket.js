import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { initSocket } from "@/socket";
import ACTIONS from "@/Actions";

export const useEditorSocket = (roomId, username) => {
  const socketRef = useRef(null);
  const codeRef = useRef(
    "// Welcome to VertexCode, Made with ❤️ by Harhsit Shinde \n"
  );
  const skipStdinChange = useRef(false);
  const languageRef = useRef("javascript");
  const reactNavigator = useNavigate();

  // State
  const [language, setLanguage] = useState("javascript");
  const [clients, setClients] = useState([]);
  const [output, setOutput] = useState("");
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stdin, setStdin] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  // 2. ADD THIS EFFECT: Keep the Ref in sync with the State
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Socket and event logic (remains unchanged)
  useEffect(() => {
    const init = () => {
      socketRef.current = initSocket();

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Connecting... Server may be waking up.");
        // reactNavigator("/");
      }

      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      socketRef.current.on("connect", () => {
        setIsConnected(true);
        toast.success("Successfully connected to the room!");

        socketRef.current.emit(ACTIONS.JOIN, {
          roomId,
          username: username,
        });
      });

      socketRef.current.on("disconnect", () => {
        toast.warning("Connection lost. Reconnecting...");
        setIsConnected(false);
      });

      //Listening for joined event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(`${username} joined the room`);
            // console.log(`${username} joined`); //TODO: Remove
          }
          setClients(clients);

          // FIX: Check if the joined user is NOT 'me'
          // We only want the EXISTING user (User A) to emit the code/language.
          // The NEW user (User B) should just listen.
          if (socketId !== socketRef.current.id) {
            // 1. Sync Code (User A sends code to User B)
            socketRef.current.emit(ACTIONS.SYNC_CODE, {
              code: codeRef.current,
              socketId, // Send to the specific new user
            });

            // 2. Sync Language (User A sends current language to the room/user)
            // Since User A has the "truth" (e.g., Python), they broadcast it.
            // User B receives this and switches from JS -> Python.
            socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, {
              roomId,
              newLanguage: languageRef.current, // User A's current state
            });
          }
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
          languageRef.current = newLanguage;
        }
      });

      socketRef.current.on(ACTIONS.STDIN_CHANGE, ({ newInput }) => {
        if (newInput !== null) {
          // Use the skip flag to prevent an echo
          skipStdinChange.current = true;
          setStdin(newInput);
        }
      });
    };

    if (username) {
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
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("connect_error");
        socketRef.current.off("connect_failed");
      }
    };
  }, [roomId, username, reactNavigator]);

  // --- All Handler Functions ---

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
    runCode,
    submitInput,
    handleLanguageChange,
    handleStdinChange,
  };
};
