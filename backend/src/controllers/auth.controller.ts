import { Request, Response } from "express";
import User from "../models/user.model";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils";
import { CustomRequest } from "../middleware/auth.middleware";
import cloudinary from "../lib/cloudinary";

interface SignUpBody {
  fullName: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { fullName, email, password }: SignUpBody = req.body;
  try {
    if (!fullName || !email || !password) {
      res.status(400).json({
        message: "All fields are required",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
      return;
    }

    const user = await User.findOne({ email });
    if (user) {
      res.status(400).json({
        message: "Email already exists",
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      generateToken(newUser._id as string, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
      return;
    } else {
      res.status(400).json({
        message: "Invalid user data",
      });
      return;
    }
  } catch (error: unknown) {
    console.log(
      "Error in signup controller:",
      error instanceof Error ? error.message : error
    );
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password }: LoginBody = req.body;
  try {
    if (!email || !password) {
      res.status(400).json({
        message: "All fields are required",
      });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({
        message: "Invalid credentials",
      });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      res.status(400).json({
        message: "Invalid credentials",
      });
      return;
    }

    generateToken(user._id as string, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });

    return;
  } catch (error) {
    console.log(
      "Error in login controller:",
      error instanceof Error ? error.message : error
    );
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const logout = (req: Request, res: Response): void => {
  //no async fn thats y void only
  try {
    res.cookie("jwt", "", { maxAge: 0 });

    res.status(200).json({
      message: "Logged out successfully",
    });

    return;
  } catch (error) {
    console.log(
      "Error in logout controller:",
      error instanceof Error ? error.message : error
    );
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
};

export const updateProfile = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { profilePic } = req.body;
    if (!req.user) {
      res.status(400).json({
        message: "User not found",
      });
      return;
    }

    if (!profilePic) {
      res.status(400).json({
        message: "Profile picture is required",
      });
      return;
    }
    const userId = req.user._id;

    const uploadedResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadedResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error: unknown) {
    console.log(
      "Error in updateProfile controller:",
      error instanceof Error ? error.message : error
    );
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const checkAuth = async (req: CustomRequest, res: Response) => {
  try {
    res.status(200).json(req.user);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : error;
    console.log("Error in checkAuth controller:", errorMessage);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
