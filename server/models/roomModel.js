import mongoose from "mongoose";

// The "Replit Base" sub-schema for files and folders
const fileNodeSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true, // e.g., "/main.js"
  },
  type: {
    type: String,
    enum: ["file", "folder"],
    required: true,
  },
  name: {
    type: String,
    required: true, // e.g., "main.js"
  },
  language: {
    type: String, // e.g., "javascript"
  },
  content: {
    type: String,
    default: "", // We will store content here temporarily until Phase 4 (AWS S3)
  },
});

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    // --- THE GOOGLE MEET UX ---
    accessMode: {
      type: String,
      enum: ["OPEN", "RESTRICTED", "LOCKED"],
      default: "RESTRICTED",
    },
    // We keep track of who the Host has explicitly allowed in
    allowedGuests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    // --- THE REPLIT UX BASE ---
    fileTree: {
      type: [fileNodeSchema],
      default: [
        {
          path: "/main.js",
          type: "file",
          name: "main.js",
          language: "javascript",
          content: "// Welcome to VertexCode\n// Start typing here...",
        },
      ],
    },
  },
  { timestamps: true },
);

export const Room = mongoose.model("Room", roomSchema);
