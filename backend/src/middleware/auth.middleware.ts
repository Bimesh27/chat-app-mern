import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { NextFunction, Request, Response } from "express";

type UserInstance = InstanceType<typeof User>;

interface DecodedToken {
  userId: string;
}

interface CustomRequest extends Request {
  user?: UserInstance;
}

export const protectRoute = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      res.status(401).json({
        message: "You need to be logged in to visit this route",
      });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as DecodedToken;

    if (!decoded) {
      res.status(401).json({ message: "Unauthrized - Invalid token" });
      return;
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    req.user = user;

    next();
  } catch (error) {
    console.log(
      "Error in protectRoute middleware:",
      error instanceof Error ? error.message : error
    );
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};
