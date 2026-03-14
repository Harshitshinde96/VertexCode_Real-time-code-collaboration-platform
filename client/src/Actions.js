const ACTIONS = {
  JOIN: "join",
  JOINED: "joined",
  DISCONNECTED: "disconnected",
  CODE_CHANGE: "code-change",
  SYNC_CODE: "sync-code",
  LEAVE: "leave",
  CODE_RUNNING: "code-running",
  CODE_OUTPUT: "code-output",
  LANGUAGE_CHANGE: "language-change",
  PROVIDE_INPUT: "provide-input",
  STDIN_CHANGE: "stdin-change",

  // --- NEW LEVEL 4 (WAITING ROOM) ACTIONS ---
  ASK_TO_JOIN: "ask-to-join", // Guest asks to enter
  JOIN_REQUEST: "join-request", // Server tells Host someone is knocking
  ADMIT_USER: "admit-user", // Host clicks "Admit"
  DENY_USER: "deny-user", // Host clicks "Deny"
  REQUEST_DENIED: "request-denied", // Server tells Guest they were rejected
  WAITING_FOR_HOST: "waiting-for-host", // Server tells Guest the Host isn't here yet
};

export default ACTIONS;
