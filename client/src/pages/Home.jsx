import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { v4 as uuidV4 } from "uuid";

const Home = () => {
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidV4();
    setRoomId(id);
    toast.success("Created a new room");
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("ROOM ID & username is required");
      return;
    }

    // Save to local storage
    localStorage.setItem("savedUsername", username);

    //Redirect
    navigate(`/editor/${roomId}`, {
      state: {
        username,
        roomId,
      },
    });
  };

  //Handels Enter key hit on keybord
  const handleInputEnter = (e) => {
    // console.log("event", e.code);
    if (e.code === "Enter") {
      joinRoom();
    }
  };
  return (
    <div className="min-h-screen bg-[#1c1e29] text-white flex flex-col items-center justify-center p-4">
      {/* The main content form card */}
      <div className="w-full max-w-md bg-[#282a36] p-8 rounded-xl shadow-lg flex flex-col gap-7">
        {/* Logo */}
        <img
          src="/vertex-code-logo-white.png"
          alt="VertexCode Logo"
          className="w-48 mx-auto mb-2"
        />

        {/* Form Fields Section */}
        <div className="flex flex-col gap-5">
          <Input
            type="text"
            placeholder="ROOM ID"
            onChange={(e) => setRoomId(e.target.value)}
            value={roomId}
            className="bg-neutral-800 border-2 border-neutral-700 rounded-lg px-4 py-3 placeholder:text-neutral-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/50 transition-colors duration-200"
            onKeyUp={handleInputEnter}
          />
          <Input
            type="text"
            placeholder="USERNAME"
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            className="bg-neutral-800 border-2 border-neutral-700 rounded-lg px-4 py-3 placeholder:text-neutral-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/50 transition-colors duration-200"
            //Handels Enter key hit on keybord
            onKeyUp={handleInputEnter}
          />
          <Button
            className="w-full font-bold py-3 mt-2 bg-green-600 hover:bg-green-700"
            onClick={joinRoom}
          >
            Join
          </Button>
        </div>

        {/* 'Create New Room' Link Section */}
        <p className="text-center text-sm text-neutral-400">
          If you don't have an invite, create a&nbsp;
          <a
            onClick={createNewRoom}
            href="#"
            className="text-green-400 hover:underline underline-offset-4 font-semibold"
          >
            new room
          </a>
        </p>
      </div>

      {/* Footer Section */}
      <footer className="absolute bottom-5 text-neutral-500 text-sm">
        <p>
          Built with 💛 by{" "}
          <a
            href="https://github.com/Harshitshinde96"
            className="font-semibold text-green-500 transition-all duration-300 hover:underline hover:drop-shadow-[0_0_8px_rgba(74,222,128,0.7)]"
            target="_blank"
            rel="noopener noreferrer"
          >
            Harshit Shinde
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Home;
