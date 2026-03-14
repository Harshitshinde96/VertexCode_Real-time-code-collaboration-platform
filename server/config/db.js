import mongoose from "mongoose";

const dbConnect = async () => {
  try {
    // console.log("MONGO URI:", process.env.MONGODB_URI);
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(
      `MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`,
    );
  } catch (error) {
    console.error("MONGODB connection FAILED:", error);
    process.exit(1);
  }
};

export default dbConnect;
