import { Response } from "express";
import { CustomRequest } from "../middleware/auth.middleware";
import User from "../models/user.model";
import Message from "../models/message.model";
import cloudinary from "../lib/cloudinary";

export const getUsersForSidebar = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const loggedInUserId = req.user ? req.user._id : null;

    const filteredUser = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUser);
  } catch (error) {
    console.log(
      "Error in get users for sidebar controller:",
      error instanceof Error ? error.message : error
    );
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMessages = async (req: CustomRequest, res: Response) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user?._id;

    if (!myId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const message = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(message);
    return;
  } catch (error) {
    console.log(
      "Error in get messages controller:",
      error instanceof Error ? error.message : error
    );
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
};

export const sendMessage = async (req: CustomRequest, res: Response) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user?._id;

    if (!senderId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!text && !image) {
      res.status(400).json({ message: "Text or image is required" });
      return;
    }

    let imageUrl;
    if (image) {
      const uploadedResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadedResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    //realtime functionality goes here

    res.status(201).json(newMessage);
    return;
  } catch (error) {
    console.log(
      "Error in send message controller:",
      error instanceof Error ? error.message : error
    );
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
};
