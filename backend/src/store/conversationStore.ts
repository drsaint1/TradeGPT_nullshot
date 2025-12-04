import { v4 as uuidv4 } from "uuid";
import { ChatMessage } from "../types.js";

export class ConversationStore {
  private readonly messagesByUser = new Map<string, ChatMessage[]>();

  append(userId: string, role: ChatMessage["role"], content: string): ChatMessage {
    const message: ChatMessage = {
      id: uuidv4(),
      role,
      content,
      createdAt: new Date(),
    };
    const history = this.messagesByUser.get(userId) ?? [];
    history.push(message);
    this.messagesByUser.set(userId, history.slice(-20));
    return message;
  }

  history(userId: string): ChatMessage[] {
    return this.messagesByUser.get(userId) ?? [];
  }
}
