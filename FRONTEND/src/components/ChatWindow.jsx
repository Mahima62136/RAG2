import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Upload, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import client from '../api/client';

const ChatWindow = ({ chat, onSendMessage, onFileUpload, onSelectExistingDocument, isLoading }) => {
  const [input, setInput] = useState('');
  const [selectedSources, setSelectedSources] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [existingDocs, setExistingDocs] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages, isLoading]);

  const openUploadModal = async () => {
    try {
      const res = await client.get('/upload/list');
      if (res.data.success) {
        setExistingDocs(res.data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch existing documents', err);
    }
    setShowUploadModal(true);
  };

  const handleSelectExisting = (documentId) => {
    onSelectExistingDocument(documentId);
    setShowUploadModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  if (!chat) {
    return (
      <div className="chat-window empty">
        <Bot size={48} />
        <h2>Welcome to AI Chat</h2>
        <p>Select a chat from the sidebar or start a new one.</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>{chat.title}</h3>
        {chat.document && (
          <div className="document-badge">
            Uploaded: {chat.document.originalName}
          </div>
        )}
      </div>

      <div className="messages-list">
        {chat.messages.length === 0 ? (
          <div className="empty-chat">
            <Bot size={32} />
            <p>Start a conversation! You can also upload a document to chat with it.</p>
          </div>
        ) : (
          chat.messages.map((msg, index) => (
            <div key={index} className={`message-wrapper ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="message-content">
                {msg.role === 'assistant' ? (
                  <div className="markdown-container">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
                {msg.sources && msg.sources.length > 0 && (
                  <button 
                    onClick={() => setSelectedSources(msg.sources)}
                    className="sources-btn"
                  >
                    View Context Sources ({msg.sources.length})
                  </button>
                )}
                <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="message-wrapper assistant">
            <div className="message-avatar">
              <Bot size={16} />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        {chat.document && (
          <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginBottom: '8px', fontStyle: 'italic' }}>
            Document is already uploaded. Open a new chat for uploading a new document.
          </div>
        )}
        <form className="chat-form" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            {chat.document ? (
              <div 
                className="upload-icon" 
                style={{ opacity: 0.4, cursor: 'not-allowed', padding: '0 8px', display: 'flex', alignItems: 'center' }}
                title="Document already uploaded"
              >
                <Upload size={20} />
              </div>
            ) : (
              <button 
                type="button"
                className="upload-icon"
                onClick={openUploadModal}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 8px', display: 'flex', alignItems: 'center', color: '#666' }}
              >
                <Upload size={20} />
              </button>
            )}
          </div>
          <button type="submit" className="send-btn" disabled={!input.trim()}>
            <Send size={20} />
          </button>
        </form>
      </div>

      {selectedSources && (
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '350px', height: '100%',
          backgroundColor: '#fff', borderLeft: '1px solid #ddd', boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
          padding: '20px', overflowY: 'auto', zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Top Context Sources</h3>
            <button onClick={() => setSelectedSources(null)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {selectedSources.map((source, idx) => (
              <div key={idx} style={{ background: '#f9f9f9', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }}>
                <div style={{ fontSize: '14px', color: '#333', fontWeight: 'bold' }}>Match #{idx + 1}</div>
                <div style={{ fontSize: '13px', color: '#888', marginTop: '6px' }}>Similarity Score: {(source.similarity * 100).toFixed(2)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showUploadModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '10px', width: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Select a Document</h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '14px', color: '#555' }}>Previously Uploaded:</h4>
              {existingDocs.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#888' }}>No existing documents found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {existingDocs.map((doc) => (
                    <div key={doc._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
                      <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{doc.originalName}</span>
                      <button onClick={() => handleSelectExisting(doc._id)} style={{ fontSize: '11px', padding: '4px 8px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Use This</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #eee', marginBottom: '15px' }} />
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '14px', color: '#555' }}>Or upload a new one:</h4>
              <label style={{ display: 'inline-block', padding: '8px 16px', background: '#28a745', color: '#fff', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="file" style={{ display: 'none' }} onChange={(e) => { onFileUpload(e.target.files[0]); setShowUploadModal(false); }} />
                Browse File
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
