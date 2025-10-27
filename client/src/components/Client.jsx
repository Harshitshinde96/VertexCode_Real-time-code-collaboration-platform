import React from "react";
import Avatar from "react-avatar";

const Client = ({ username }) => {
  return (
    // Main wrapper for each client (vertical layout)
    <div
      className="flex flex-col items-center gap-2 w-20"
      title={username} // Good for accessibility on long names
    >
      {/* Avatar component */}
      <Avatar name={username} size="50" round="14px" />

      {/* Username text styling */}
      <span className="text-sm font-medium text-neutral-300 w-full text-center break-words">
        {username}
      </span>
    </div>
  );
};

export default Client;
