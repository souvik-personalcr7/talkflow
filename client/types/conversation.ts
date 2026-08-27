import { User } from './index';

export interface Conversation {
  id: string;
  type: 'private' | 'ai';
  participants: User[];
  lastMessage?: string;
  lastMessageAt?: string | null;
  mutedBy?: string[];
  createdAt: string;
  updatedAt: string;
}
