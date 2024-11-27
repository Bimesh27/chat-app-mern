import { Request, Response } from "express";
import User from "../models/user.model";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils";

interface SignUpBody {
  fullName: string;
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
    }

    if (password.length < 6) {
      res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const user = await User.findOne({ email });
    if (user) {
      res.status(400).json({
        message: "Email already exists",
      });
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
    } else {
      res.status(400).json({
        message: "Invalid user data",
      });
    }
  } catch (error: unknown) {
    console.log(
      "Error in signup controller:",
      error instanceof Error ? error.message : error
    );
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const login = (req: Request, res: Response) => {
  res.send("login route");
};

export const logout = (req: Request, res: Response) => {
  res.send("logout route");
};
