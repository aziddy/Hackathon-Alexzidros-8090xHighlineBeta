"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatMessage, ChatStorage } from "@/types";

const STORAGE_KEY = "devflow-chat";
const STORAGE_VERSION = 1;

function getStorage(): ChatStorage {
  if (typeof window === "undefined") {
    return { version: STORAGE_VERSION, chats: {} };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ChatStorage;
      if (parsed.version === STORAGE_VERSION) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to parse chat storage:", error);
  }

  return { version: STORAGE_VERSION, chats: {} };
}

function saveStorage(storage: ChatStorage): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error("Failed to save chat storage:", error);
  }
}

export function useChatStorage(issueId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load messages on mount
  useEffect(() => {
    const storage = getStorage();
    const issueMessages = storage.chats[issueId] || [];
    setMessages(issueMessages);
    setIsLoaded(true);
  }, [issueId]);

  // Save messages to storage
  const saveMessages = useCallback((newMessages: ChatMessage[]) => {
    const storage = getStorage();
    storage.chats[issueId] = newMessages;
    saveStorage(storage);
    setMessages(newMessages);
  }, [issueId]);

  // Add a single message
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => {
      const newMessages = [...prev, message];
      const storage = getStorage();
      storage.chats[issueId] = newMessages;
      saveStorage(storage);
      return newMessages;
    });
  }, [issueId]);

  // Update a message (for action execution status)
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => {
      const newMessages = prev.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      );
      const storage = getStorage();
      storage.chats[issueId] = newMessages;
      saveStorage(storage);
      return newMessages;
    });
  }, [issueId]);

  // Clear history for this issue
  const clearIssueHistory = useCallback(() => {
    const storage = getStorage();
    delete storage.chats[issueId];
    saveStorage(storage);
    setMessages([]);
  }, [issueId]);

  // Clear all chat history
  const clearAllHistory = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
  }, []);

  return {
    messages,
    isLoaded,
    addMessage,
    updateMessage,
    saveMessages,
    clearIssueHistory,
    clearAllHistory,
  };
}
