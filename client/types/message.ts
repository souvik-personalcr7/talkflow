export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  senderType: 'user' | 'ai';
  text: string;
  messageType: 'text';
  isSeen: boolean;
  createdAt: string;
  updatedAt?: string;
}
