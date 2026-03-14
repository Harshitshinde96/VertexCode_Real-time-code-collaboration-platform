import userModel from "../models/userModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import transporter from "../config/nodemailer.js";
import { PASSWORD_RESET_TEMPLATE } from "../config/emailTemplates.js";

export const registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new ErrorHandler(400, "All details are required!"));
  }

  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler(409, "User already exists"));
  }

  const user = await userModel.create({ name, email, password });

  const token = user.generateJWTToken();

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  // Sending welcome email
  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL,
    to: email,
    subject: "Welcome to VertexCode",
    text: `Welcome to VertexCode, Your account has been created with email id: ${email}. You can now start collaborating!`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Welcome email failed:", error.message);
  }

  return res
    .status(201)
    .cookie("token", token, cookieOptions)
    .json(
      new ApiResponse(
        201,
        {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        "User registered successfully",
      ),
    );
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler(400, "Email and password are required!"));
  }

  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler(401, "Invalid email or password"));
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    return next(new ErrorHandler(401, "Invalid email or password"));
  }

  const token = user.generateJWTToken();

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  return res
    .status(200)
    .cookie("token", token, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        "Login successful",
      ),
    );
});

export const logout = asyncHandler(async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  };

  return res
    .status(200)
    .clearCookie("token", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

export const checkAuth = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, {}, "Authenticated"));
});

// --- Password Reset Flow ---

export const sendResetOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new ErrorHandler(400, "Email is required"));
  }

  const user = await userModel.findOne({ email });
  if (!user) {
    return next(new ErrorHandler(404, "User not found"));
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  user.resetOtp = otp;
  user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000; // 15min

  await user.save();

  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL,
    to: user.email,
    subject: "Password Reset OTP | VertexCode",
    html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace(
      "{{email}}",
      user.email,
    ),
  };

  try {
    await transporter.sendMail(mailOptions);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password reset OTP Sent on Email"));
  } catch (error) {
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;
    await user.save();
    return next(
      new ErrorHandler(500, "Email could not be sent. Please try again later."),
    );
  }
});

export const resetPassowrd = asyncHandler(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return next(
      new ErrorHandler(400, "Email, OTP and New Password are required"),
    );
  }

  const user = await userModel.findOne({ email });

  if (!user) {
    return next(new ErrorHandler(404, "User not found"));
  }

  if (user.resetOtp === "" || user.resetOtp !== otp) {
    return next(new ErrorHandler(400, "Invalid OTP"));
  }

  if (user.resetOtpExpireAt < Date.now()) {
    return next(new ErrorHandler(400, "OTP has Expired"));
  }

  user.password = newPassword;
  user.resetOtp = "";
  user.resetOtpExpireAt = 0;

  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
      "Password changed successfully",
    ),
  );
});
