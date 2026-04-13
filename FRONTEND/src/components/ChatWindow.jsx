import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Upload, X, Info, ChevronDown, Download, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import client from '../api/client';

const ChatWindow = ({ chat, onSendMessage, onFileUpload, onSelectExistingDocument, isLoading }) => {
  const [input, setInput] = useState('');
  const [selectedSources, setSelectedSources] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [existingDocs, setExistingDocs] = useState([]);
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages, isLoading]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleDownload = async (docId, fileName) => {
    try {
      const response = await client.get(`/upload/download/${docId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to download document');
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document? It will be removed from all chats.")) return;
    try {
      const res = await client.delete(`/upload/${docId}`);
      if (res.data.success) {
        setExistingDocs(existingDocs.filter(d => d._id !== docId));
      }
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete document');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  // Find the latest sources to show when clicking the Info icon
  const getLatestSources = () => {
    if (!chat || !chat.messages) return null;
    const lastMsgWithSources = [...chat.messages].reverse().find(msg => msg.role === 'assistant' && msg.sources && msg.sources.length > 0);
    return lastMsgWithSources ? lastMsgWithSources.sources : null;
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

  const latestSources = getLatestSources();

  return (
    <div className="chat-window" style={{ position: 'relative' }}>
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ margin: 0 }}>{chat.title}</h3>
          {chat.document && (
            <div className="document-badge">
              {chat.document.originalName}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} ref={dropdownRef}>
          {chat.document && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => latestSources && setShowDropdown(!showDropdown)}
                disabled={!latestSources}
                style={{
                  background: latestSources ? '#f3f4f6' : 'transparent',
                  border: '1px solid ' + (latestSources ? '#e5e7eb' : 'transparent'),
                  cursor: latestSources ? 'pointer' : 'default',
                  color: latestSources ? '#374151' : '#ccc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  opacity: latestSources ? 1 : 0.5
                }}
                title={latestSources ? "View Similarity Matches" : "No similarity search data yet"}
              >
                <Info size={16} />
                
                {/* <ChevronDown size={14} style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} /> */}
              </button>

              {showDropdown && latestSources && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                  width: '220px', backgroundColor: '#fff', border: '1px solid #e5e7eb',
                  borderRadius: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  zIndex: 1100, overflow: 'hidden'
                }}>
                  <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>
                    Matching Chunks
                  </div>
                  {latestSources.map((source, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedSources([source]);
                        setShowDropdown(false);
                      }}
                      style={{
                        width: '100%', padding: '10px 12px', textAlign: 'left',
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontSize: '13px', color: '#4b5563', borderBottom: '1px solid #f9fafb'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span>Match #{idx + 1}</span>
                      <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: '600' }}>
                        {(source.similarity * 100).toFixed(0)}%
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setSelectedSources(latestSources);
                      setShowDropdown(false);
                    }}
                    style={{
                      width: '100%', padding: '10px 12px', textAlign: 'center',
                      background: '#f8fafc', border: 'none', cursor: 'pointer',
                      fontSize: '12px', fontWeight: '600', color: '#6366f1'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  >
                    View All Matches
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
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
          position: 'absolute', top: 0, right: 0, width: '400px', height: '100%',
          backgroundColor: '#fff', borderLeft: '1px solid #ddd', boxShadow: '-2px 0 15px rgba(0,0,0,0.1)',
          padding: '20px', overflowY: 'auto', zIndex: 1000, display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#111' }}>Similarity Search Log</h3>
            <button onClick={() => setSelectedSources(null)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {selectedSources.map((source, idx) => (
              <div key={idx} style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#6366f1' }}>Match #{idx + 1}</span>
                  <span style={{ fontSize: '12px', background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px' }}>
                    {(source.similarity * 100).toFixed(2)}% Match
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', fontStyle: 'italic', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                  "{source.content}"
                </div>
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
                      <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={doc.originalName}>{doc.originalName}</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {/* <button 
                          onClick={() => handleDownload(doc._id, doc.originalName)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px', display: 'flex' }}
                          title="Download Document"
                        >
                          <Download size={16} />
                        </button> */}
                        <button 
                          onClick={() => handleDeleteDoc(doc._id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px', display: 'flex' }}
                          title="Delete Document"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button onClick={() => handleSelectExisting(doc._id)} style={{ fontSize: '11px', padding: '4px 8px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Use This</button>
                      </div>
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
