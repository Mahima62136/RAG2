import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../components/AuthContext';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (currentChatId) {
      fetchChatDetail(currentChatId);
    } else {
      setCurrentChat(null);
    }
  }, [currentChatId]);

  const fetchChats = async () => {
    try {
      const res = await client.get('/chat');
      if (res.data.success) {
        setChats(res.data.chats);
      }
    } catch (err) {
      console.error('Failed to fetch chats', err);
    }
  };

  const fetchChatDetail = async (id) => {
    try {
      const res = await client.get(`/chat/${id}`);
      if (res.data.success) {
        setCurrentChat(res.data.chat);
      }
    } catch (err) {
      console.error('Failed to fetch chat detail', err);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await client.post('/chat', { title: 'New Chat' });
      if (res.data.success) {
        setChats([res.data.chat, ...chats]);
        setCurrentChat(res.data.chat); // Set chat data immediately
        setCurrentChatId(res.data.chat._id);
      }
    } catch (err) {
      console.error('Failed to create chat', err);
    }
  };

  const handleSendMessage = async (message) => {
    if (!currentChatId || !currentChat) return;
    
    // Optimistic update
    const newUserMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
    const updatedChat = { 
      ...currentChat, 
      messages: [...currentChat.messages, newUserMessage] 
    };
    setCurrentChat(updatedChat);
    setIsLoading(true);

    try {
      const res = await client.post(`/chat/${currentChatId}/message`, { message });
      if (res.data.success) {
        setCurrentChat(res.data.chat);
        fetchChats(); // Update sidebar list to immediately reflect renamed title
      }
    } catch (err) {
      console.error('Failed to send message', err);
      // Rollback optimistic update if failed
      fetchChatDetail(currentChatId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    
    // Use query param if chat already exists
    const url = currentChatId ? `/upload?chatId=${currentChatId}` : '/upload';

    try {
      const res = await client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data.success) {
        if (!currentChatId) {
          fetchChats();
          setCurrentChat(res.data.chat); // Set data immediately
          setCurrentChatId(res.data.chatId);
        } else {
          // If already in a chat, the response should have the updated chat
          if (res.data.chat) {
            setCurrentChat(res.data.chat);
          } else {
            fetchChatDetail(currentChatId);
          }
        }
      }
    } catch (err) {
      console.error('Upload failed', err);
    }
  };

  const handleDeleteChat = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this chat?");
    if (!confirmDelete) return;
    try {
      const res = await client.delete(`/chat/${id}`);
      if (res.data.success) {
        if (currentChatId === id) {
          setCurrentChatId(null);
          setCurrentChat(null);
        }
        fetchChats();
      }
    } catch (err) {
      console.error('Failed to delete chat', err);
    }
  };

  const handleSelectExistingDocument = async (documentId) => {
    if (!currentChatId) return;
    try {
      const res = await client.post('/upload/select', { chatId: currentChatId, documentId });
      if (res.data.success) {
        // Update the current chat with the newly linked document
        fetchChatDetail(currentChatId);
      }
    } catch (err) {
      console.error('Failed to select existing document', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="chat-layout">
      <Sidebar 
        chats={chats} 
        currentChatId={currentChatId} 
        onSelectChat={setCurrentChatId} 
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onLogout={handleLogout}
        user={user}
      />
      <ChatWindow 
        chat={currentChat} 
        onSendMessage={handleSendMessage}
        onFileUpload={handleFileUpload}
        onSelectExistingDocument={handleSelectExistingDocument}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Chat;
