import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext.tsx';
import { 
  X, 
  MessageSquare, 
  Activity, 
  Send, 
  Users, 
  CheckCircle2, 
  Clock, 
  Sparkles 
} from 'lucide-react';

export const CollaborationDrawer: React.FC = () => {
  const { 
    isChatOpen, 
    setIsChatOpen, 
    chatMessages, 
    sendChatMessage, 
    activityLogs, 
    activeUsers, 
    currentUser 
  } = useProject();

  const [activeTab, setActiveTab] = useState<'chat' | 'activity'>('chat');
  const [inputMsg, setInputMsg] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  if (!isChatOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    sendChatMessage(inputMsg.trim());
    setInputMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-slate-200/70 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeTab === 'chat' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Live Chat</span>
                {chatMessages.length > 0 && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-mono">
                    {chatMessages.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
                  activeTab === 'activity' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Activity</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsChatOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Active Collaborators Bar */}
        <div className="px-4 py-2 bg-blue-50/50 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Active Collaborators:</span>
          </div>
          <div className="flex items-center -space-x-1.5">
            {activeUsers.map(user => (
              <img
                key={user.userId}
                src={user.avatar}
                alt={user.userName}
                title={`${user.userName} (${user.activeView || 'viewing'})`}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full border-2 border-white object-cover"
              />
            ))}
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'chat' ? (
            <div className="space-y-3.5">
              {chatMessages.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p>No project messages yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Send a message below to sync with team members!</p>
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
                    >
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-slate-200"
                      />
                      <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-0.5">
                          <span className="font-bold text-slate-700">{msg.senderName.split(' ')[0]}</span>
                          <span>•</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isMe 
                              ? 'bg-blue-600 text-white rounded-tr-xs' 
                              : 'bg-slate-100 text-slate-800 rounded-tl-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Real-Time Change Log
              </h4>
              {activityLogs.map(log => (
                <div key={log.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 text-xs flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">{log.user}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                      {log.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Input (Only on Chat tab) */}
        {activeTab === 'chat' && (
          <div className="p-3 border-t border-slate-200 bg-slate-50">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder={`Message as ${currentUser.name.split(' ')[0]}...`}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim()}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
