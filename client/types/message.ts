export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  senderType: 'user' | 'ai';
  messageType: 'text' | 'image' | 'file' | 'contact';
  imageUrl?: string;
  attachment?: {
    url: string;
    name: string;
    size: number;
    mimeType: string;
  };
  contact?: {
    userId: string;
    name: string;
    profilePicture?: string;
  };
  isSeen: boolean;
  isDeletedForEveryone?: boolean;
  createdAt: string;
  updatedAt: string;
}
