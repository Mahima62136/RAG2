import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, LogOut, User, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import client from '../api/client';

const Sidebar = ({ chats, currentChatId, onSelectChat, onNewChat, onDeleteChat, onLogout, user }) => {
  const [showDocs, setShowDocs] = useState(false);
  const [documents, setDocuments] = useState([]);

  const fetchDocuments = async () => {
    try {
      const res = await client.get('/upload/list');
      if (res.data.success) {
        setDocuments(res.data.documents);
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
    }
  };

  useEffect(() => {
    if (showDocs) {
      fetchDocuments();
    }
  }, [showDocs]);

  const handleDeleteDoc = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this document? It will be removed from all chats.")) return;
    try {
      const res = await client.delete(`/upload/${id}`);
      if (res.data.success) {
        setDocuments(prevDocs => prevDocs.filter(doc => doc._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete document', err);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <button className="new-chat-btn" onClick={onNewChat} style={{ marginBottom: '10px' }}>
          <Plus size={20} />
          <span>New Chat</span>
        </button>

        <div className="docs-dropdown-container" style={{ width: '100%' }}>
          <button 
            className="new-chat-btn" 
            onClick={() => {
              setShowDocs(!showDocs);
            }}
            style={{ justifyContent: 'space-between', padding: '0.75rem 1rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} />
              <span>Uploaded Docs</span>
            </div>
            {showDocs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {showDocs && (
            <div className="docs-dropdown-list" style={{
              marginTop: '5px',
              maxHeight: '200px',
              overflowY: 'auto',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '5px'
            }}>
              {documents.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#666', padding: '10px', textAlign: 'center' }}>No documents found</p>
              ) : (
                documents.map(doc => (
                  <div key={doc._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px',
                    fontSize: '13px',
                    borderBottom: '1px solid #eee',
                    gap: '8px'
                  }}>
                    <span style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      flex: 1 
                    }} title={doc.originalName}>
                      {doc.originalName}
                    </span>
                    <button 
                      onClick={(e) => handleDeleteDoc(doc._id, e)}
                      style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '2px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="chat-history">
        <h3>Recent Chats</h3>
        {chats.length === 0 ? (
          <p className="empty-history">No chats yet</p>
        ) : (
          chats.map(chat => (
            <div
              key={chat._id}
              className={`chat-item ${currentChatId === chat._id ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '8px' }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '8px', cursor: 'pointer', overflow: 'hidden' }}
                onClick={() => onSelectChat(chat._id)}
              >
                <MessageSquare size={18} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteChat(chat._id); }}
                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Delete Chat"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            <User size={20} />
          </div>
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className="user-email">{user?.email}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
