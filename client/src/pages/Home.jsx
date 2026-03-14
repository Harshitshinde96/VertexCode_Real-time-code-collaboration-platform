import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Changed variable name to better reflect that it can be a URL or an ID
  const [joinInput, setJoinInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const createNewRoom = async (e) => {
    e.preventDefault();
    if (isCreating) return;

    setIsCreating(true);
    try {
      const response = await axios.post(
        "http://localhost:4000/api/room/create",
        {},
        { withCredentials: true },
      );

      const newRoomId = response.data.data.roomId;

      // Instead of just joining, we generate the full URL for the host to easily copy later
      const fullUrl = `${window.location.origin}/editor/${newRoomId}`;
      setJoinInput(fullUrl);

      toast.success("Created a new room");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  // --- THE SMART PARSER ---
  const joinRoom = () => {
    if (!joinInput.trim()) {
      toast.error("Please enter a Room ID or Link");
      return;
    }

    let finalRoomId = joinInput.trim();

    // If the user pasted a full HTTP link, extract the ID from the end
    if (finalRoomId.startsWith("http")) {
      try {
        const url = new URL(finalRoomId);
        const parts = url.pathname.split("/");
        finalRoomId = parts[parts.length - 1]; // Grabs the 'abc-123' from '/editor/abc-123'
      } catch (err) {
        toast.error("Invalid URL format");
        return;
      }
    }

    // Strip out any weird spaces or slashes just in case
    finalRoomId = finalRoomId.replace(/[^a-zA-Z0-9-]/g, "");

    navigate(`/editor/${finalRoomId}`, {
      state: {
        username: user?.name || "Guest",
      },
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  return (
    <div className="min-h-screen bg-[#1c1e29] text-white flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-6 right-6 flex items-center gap-4">
        <span className="text-gray-400 text-sm hidden md:inline-block">
          Logged in as <strong className="text-white">{user?.name}</strong>
        </span>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition"
        >
          Logout
        </Button>
      </div>

      <div className="w-full max-w-md bg-[#282a36] p-8 rounded-xl shadow-lg flex flex-col gap-7">
        <img
          src="/vertex-code-logo-white.png"
          alt="VertexCode Logo"
          className="w-48 mx-auto mb-2"
        />

        <div className="flex flex-col gap-5">
          <Input
            type="text"
            placeholder="Enter a code or link" // Updated placeholder to match Google Meet UX
            onChange={(e) => setJoinInput(e.target.value)}
            value={joinInput}
            className="bg-neutral-800 border-2 border-neutral-700 rounded-lg px-4 py-3 placeholder:text-neutral-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/50 transition-colors duration-200"
            onKeyUp={handleInputEnter}
          />

          <Button
            className="w-full font-bold py-3 mt-2 bg-green-600 hover:bg-green-700"
            onClick={joinRoom}
          >
            Join
          </Button>
        </div>

        <p className="text-center text-sm text-neutral-400">
          If you don't have an invite, create a&nbsp;
          <a
            onClick={createNewRoom}
            href="#"
            className={`text-green-400 hover:underline underline-offset-4 font-semibold ${isCreating ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isCreating ? "creating..." : "new room"}
          </a>
        </p>
      </div>

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
