import React from 'react';
import Client from './Client'; // Make sure this path is correct
import { Button } from './ui/button';

const Sidebar = ({ clients, onCopyRoomId, onLeaveRoom }) => {
  return (
    <div className="bg-[#282a36] p-4 text-white flex flex-col border-r border-neutral-700/80">
      {/* Logo (Stays at the top, separated by a border) */}
      <div className="logo pb-4 mb-4 shrink-0 border-b border-neutral-700">
        <img
          src="/vertex-code-logo-white.png"
          alt="VertexCode Logo"
          className="w-40"
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
          onClick={onCopyRoomId}
        >
          Copy Room ID
        </Button>
        <Button
          variant="destructive"
          className="w-full font-bold py-3 transition-all duration-200 focus:ring-2"
          onClick={onLeaveRoom}
        >
          Leave
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;