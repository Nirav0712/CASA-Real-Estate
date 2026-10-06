'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { EngagementService, ConversationItem, MessageItem } from '@/services/engagement-service';
import { Container, Card, Badge } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, ArrowLeft, User as UserIcon, Building, Clock, CheckCheck, RefreshCw } from 'lucide-react';

export default function MessagesDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [conversations, setConversations] = React.useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<MessageItem[]>([]);
  const [messageText, setMessageText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const loadConversations = React.useCallback(async () => {
    try {
      const res = await EngagementService.getConversations();
      if (res.data) {
        setConversations(res.data);
        if (!activeConversationId && res.data.length > 0) {
          setActiveConversationId(res.data[0]._id);
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, loadConversations]);

  const loadMessages = React.useCallback(async (convId: string) => {
    try {
      const res = await EngagementService.getMessages(convId);
      if (res.data) {
        setMessages(res.data);
      }
    } catch {
      // Ignore
    }
  }, []);

  React.useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId, loadMessages]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId || !messageText.trim() || isSending) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setIsSending(true);

    try {
      const res = await EngagementService.sendMessage(activeConversationId, textToSend);
      if (res.data) {
        setMessages((prev) => [...prev, res.data as MessageItem]);
        loadConversations();
      }
    } catch (err: any) {
      toast.error('Message failed', err.message || 'Could not send message');
    } finally {
      setIsSending(false);
    }
  };

  const activeConv = conversations.find((c) => c._id === activeConversationId);

  return (
    <div className="min-h-screen bg-casa-canvas py-8">
      <Container>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-casa-text-primary">
              Direct Messages & Conversations
            </h1>
            <p className="text-xs text-casa-text-secondary mt-0.5">
              Chat in real-time with verified property agents and interested buyers.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadConversations}
            className="flex items-center gap-1.5 text-xs border-zinc-300 dark:border-zinc-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Messaging Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[650px]">
          {/* Conversation List Sidebar */}
          <Card className="p-0 border-casa-border-light flex flex-col overflow-hidden shadow-subtle">
            <div className="p-4 border-b border-casa-border-light bg-casa-canvas/50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-casa-text-primary">
                Inbox ({conversations.length})
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-casa-border-light">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 bg-casa-canvas rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-casa-text-secondary">
                  <MessageSquare className="w-8 h-8 text-casa-text-muted mx-auto mb-2 opacity-40" />
                  <p>No active conversations yet.</p>
                  <p className="text-[11px] text-casa-text-muted mt-1">
                    Contact an agent from any property page to start a chat.
                  </p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv._id === activeConversationId;
                  return (
                    <button
                      key={conv._id}
                      onClick={() => setActiveConversationId(conv._id)}
                      className={`w-full p-4 text-start transition-colors flex items-start gap-3 ${
                        isActive
                          ? 'bg-casa-brand/5 dark:bg-casa-brand/10 border-s-4 border-casa-brand'
                          : 'hover:bg-casa-canvas/60'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-casa-brand/10 text-casa-brand flex items-center justify-center font-bold text-sm flex-shrink-0">
                        <UserIcon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-xs text-casa-text-primary truncate">
                            {conv.otherParticipant?.name || 'User / Agent'}
                          </span>
                          {conv.lastMessageAt && (
                            <span className="text-[10px] text-casa-text-muted flex-shrink-0">
                              {new Date(conv.lastMessageAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>

                        {conv.propertyContext && (
                          <div className="text-[11px] text-casa-brand font-semibold truncate mb-1">
                            {conv.propertyContext.title}
                          </div>
                        )}

                        <p className="text-xs text-casa-text-secondary truncate">
                          {conv.lastMessage || 'Click to view conversation'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          {/* Active Chat Window */}
          <Card className="p-0 border-casa-border-light md:col-span-2 flex flex-col overflow-hidden shadow-subtle">
            {activeConv ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-casa-border-light bg-casa-canvas/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-casa-brand/10 text-casa-brand flex items-center justify-center font-bold">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-casa-text-primary">
                        {activeConv.otherParticipant?.name || 'User / Agent'}
                      </h3>
                      {activeConv.propertyContext && (
                        <div className="text-xs text-casa-text-secondary flex items-center gap-1 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-casa-brand" />
                          <span className="truncate max-w-xs">{activeConv.propertyContext.title}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {activeConv.propertyContext?.slug && (
                    <Link href={`/property/${activeConv.propertyContext.slug}`}>
                      <Button variant="outline" size="sm" className="text-xs h-8">
                        View Property
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-casa-canvas/30">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-xs text-casa-text-muted">
                      <MessageSquare className="w-8 h-8 text-casa-text-muted mx-auto mb-2 opacity-40" />
                      <p>Start the conversation below.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId?._id === user?.id || msg.senderId === user?.id;
                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                              isMe
                                ? 'bg-casa-brand text-white rounded-br-none'
                                : 'bg-casa-surface border border-casa-border-light text-casa-text-primary rounded-bl-none'
                            }`}
                          >
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <div
                              className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                                isMe ? 'text-white/80' : 'text-casa-text-muted'
                              }`}
                            >
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isMe && <CheckCheck className="w-3 h-3" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-casa-border-light bg-casa-surface flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2.5 bg-casa-canvas border border-casa-border-light rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-casa-brand text-casa-text-primary"
                  />
                  <Button
                    type="submit"
                    disabled={!messageText.trim() || isSending}
                    className="bg-casa-brand hover:bg-casa-brand-hover text-white h-10 px-4 text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-casa-text-muted">
                <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                <h3 className="font-bold text-sm text-casa-text-primary mb-1">No Conversation Selected</h3>
                <p className="text-xs max-w-xs">
                  Select a chat from the left sidebar or contact an agent directly from any property listing page.
                </p>
              </div>
            )}
          </Card>
        </div>
      </Container>
    </div>
  );
}
