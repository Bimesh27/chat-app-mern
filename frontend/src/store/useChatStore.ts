import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

interface ChatUser {
  _id: string;
  fullName: string;
  profilePic: string;
}

interface MessageData {
  text?: string;
  image?: string;
}

interface Message {
  _id: string;
  text?: string;
  image?: string;
  senderId: string;
  receiverId: string;
  createdAt?: string;
}

interface ChatStore {
  messages: Message[];
  users: ChatUser[];
  selectedUser: ChatUser | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  setSelectedUser: (selectedUser: ChatUser | null) => void;
  sendMessage: (messageData: MessageData) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error: unknown) {
      const errorMessage = (error as Error).message;
      toast.error(errorMessage);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser?._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast.error(errorMessage);
    }
  },

  //optimize this one later
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
