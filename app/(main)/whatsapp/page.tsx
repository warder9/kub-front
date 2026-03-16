"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  MessageCircle,
  Send,
  MoreVertical,
  Search,
  Plus,
  Paperclip,
  Smile,
  Users,
  User as UserIcon,
  Trash2,
  LogOut,
  UserPlus,
  MessageSquare,
  Phone,
  Video,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  UserCheck,
  ArrowRight,
  Settings,
  RefreshCw
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ru } from "date-fns/locale";
import { getWazzupIframe } from "@/src/api/integrations_wazzup.api";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

// Types for WhatsApp integration
interface WhatsAppDialog {
  id: string;
  phone: string;
  name?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline: boolean;
  assignedTo?: string;
  assignedToName?: string;
  leadId?: number;
  clientId?: number;
  dealId?: number;
  status: 'active' | 'archived' | 'blocked';
}

interface WhatsAppMessage {
  id: string;
  text: string;
  timestamp: string;
  isIncoming: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: string[];
  senderName?: string;
}

export default function WhatsAppPage() {
  const [selectedDialog, setSelectedDialog] = useState<WhatsAppDialog | null>(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [iframeUrl, setIframeUrl] = useState<string>("");
  const [isLoadingIframe, setIsLoadingIframe] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data for dialogs
  const [dialogs, setDialogs] = useState<WhatsAppDialog[]>([]);
  const [dialogsLoading, setDialogsLoading] = useState(false);
  const [dialogsError, setDialogsError] = useState<string | null>(null);

  // Mock messages
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const currentUser = getCurrentUser();
  const [isChatVisible, setIsChatVisible] = useState(false);

  // Fetch WhatsApp dialogs
  const fetchDialogs = async () => {
    setDialogsLoading(true);
    setDialogsError(null);
    try {
      // TODO: Replace with actual API call when backend provides dialogs endpoint
      // For now, we'll keep it empty until the backend implements WhatsApp dialog listing
      setDialogs([]);
    } catch (error: any) {
      console.error("Failed to fetch WhatsApp dialogs:", error);
      setDialogsError(error.message || "Не удалось загрузить диалоги WhatsApp");
    } finally {
      setDialogsLoading(false);
    }
  };

  useEffect(() => {
    fetchDialogs();
  }, []);

  const loadWhatsAppChat = async (dialog: WhatsAppDialog) => {
    setIsLoadingIframe(true);
    try {
      const response = await getWazzupIframe({
        phone: dialog.phone,
        lead_id: dialog.leadId,
        client_id: dialog.clientId
      });
      setIframeUrl(response.iframe_url);
    } catch (error) {
      console.error("Failed to load WhatsApp chat:", error);
    } finally {
      setIsLoadingIframe(false);
    }
  };

  useEffect(() => {
    if (selectedDialog) {
      loadWhatsAppChat(selectedDialog);
      // Reset messages when dialog changes
      setMessages([]);
    }
  }, [selectedDialog]);

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "";
    return timestamp;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const filteredDialogs = dialogs.filter((dialog) =>
    dialog.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dialog.phone.includes(searchTerm.replace(/\s/g, ''))
  );

  const handleAssignDialog = (userId: string) => {
    if (selectedDialog) {
      setDialogs(prev => prev.map(d => 
        d.id === selectedDialog.id 
          ? { ...d, assignedTo: userId, assignedToName: `Менеджер ${userId}` }
          : d
      ));
      setIsAssignModalOpen(false);
      // TODO: Call API to update assignment in backend
    }
  };

  const navigateToCRM = (type: 'lead' | 'client' | 'deal', id: number) => {
    const path = `/${type}s/${id}`;
    window.open(path, '_blank');
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedDialog) return;
    
    // TODO: Implement actual message sending via Wazzup API
    // For now, just clear the input
    setMessage("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen">
      {/* Dialog List */}
      <div className={`
        ${isChatVisible ? 'hidden' : 'flex'}
        w-full flex-col bg-white border-r border-gray-200
        md:flex md:w-80
    `}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold">WhatsApp</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" onClick={() => setIsSetupModalOpen(true)}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск по имени или номеру..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {dialogsLoading && <div className="py-4 text-center">Загрузка диалогов...</div>}
            {dialogsError && (
              <div className="py-2 text-red-600 text-center">{dialogsError}</div>
            )}
            {!dialogsLoading && !dialogsError && (
              dialogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center mt-10">
                  <MessageSquare className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">Диалогов пока нет</p>
                  <p className="text-sm text-gray-400">Настройте интеграцию с WhatsApp для начала работы</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsSetupModalOpen(true)}
                  >
                    Настроить интеграцию
                  </Button>
                </div>
              ) : filteredDialogs.length === 0 ? (
                <div className="p-4 text-center text-gray-500">Диалоги не найдены</div>
              ) : (
                filteredDialogs.map((dialog) => (
                <div
                  key={dialog.id}
                  onClick={() => {
                    setSelectedDialog(dialog);
                    setIsChatVisible(true);
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-colors ${selectedDialog?.id === dialog.id
                    ? "bg-green-50"
                    : "hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={dialog.avatar} />
                        <AvatarFallback>
                          <UserIcon className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      {dialog.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-500" />
                      )}
                      <div className="absolute -top-1 -right-1">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs" style={{ fontSize: '8px' }}>WA</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm truncate">
                          {dialog.name || dialog.phone}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {dialog.lastMessageTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {dialog.lastMessage || "Нет сообщений"}
                        </p>
                        <div className="flex items-center space-x-1">
                          {dialog.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {dialog.unreadCount}
                            </Badge>
                          )}
                          {dialog.assignedTo && (
                            <Badge variant="secondary" className="text-xs">
                              <UserCheck className="h-3 w-3 mr-1" />
                              {dialog.assignedToName?.split(' ')[0]}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{dialog.phone}</span>
                        {dialog.leadId && (
                          <Badge variant="outline" className="text-xs">
                            <Button size="sm" variant="ghost" className="h-auto p-0" onClick={(e) => {
                              e.stopPropagation();
                              navigateToCRM('lead', dialog.leadId!);
                            }}>
                              Лид {dialog.leadId}
                            </Button>
                          </Badge>
                        )}
                        {dialog.clientId && (
                          <Badge variant="outline" className="text-xs">
                            <Button size="sm" variant="ghost" className="h-auto p-0" onClick={(e) => {
                              e.stopPropagation();
                              navigateToCRM('client', dialog.clientId!);
                            }}>
                              Клиент {dialog.clientId}
                            </Button>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`
        ${isChatVisible ? 'flex' : 'hidden'}
        flex-1 flex-col
        md:flex
    `}>
        {selectedDialog ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsChatVisible(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </Button>
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedDialog.avatar} />
                      <AvatarFallback>
                        <UserIcon className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    {selectedDialog.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedDialog.name || selectedDialog.phone}</h3>
                    <p className="text-sm text-gray-600 flex items-center space-x-2">
                      <span>{selectedDialog.phone}</span>
                      {selectedDialog.isOnline && <span className="text-green-600">• В сети</span>}
                      {selectedDialog.assignedTo && (
                        <span className="text-blue-600">
                          • Ответственный: {selectedDialog.assignedToName}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Video className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setIsAssignModalOpen(true)}>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Назначить ответственного
                      </DropdownMenuItem>
                      {selectedDialog.leadId && (
                        <DropdownMenuItem onClick={() => navigateToCRM('lead', selectedDialog.leadId!)}>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Перейти к лиду
                        </DropdownMenuItem>
                      )}
                      {selectedDialog.clientId && (
                        <DropdownMenuItem onClick={() => navigateToCRM('client', selectedDialog.clientId!)}>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Перейти к клиенту
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-red-500">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Архивировать диалог
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Messages or Iframe */}
            <div className="flex-1 bg-gray-50">
              {iframeUrl ? (
                <iframe
                  src={iframeUrl}
                  className="w-full h-full border-0"
                  title="WhatsApp Chat"
                  onLoad={() => setIsLoadingIframe(false)}
                />
              ) : isLoadingIframe ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600">Загрузка WhatsApp...</p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.isIncoming ? 'items-start' : 'items-end'} mb-2`}
                      >
                        {msg.isIncoming && (
                          <span className="text-xs text-muted-foreground ml-2 mb-1">
                            {msg.senderName}
                          </span>
                        )}
                        <div
                          className={`max-w-[85%] md:max-w-[70%] px-3 py-2 rounded-2xl shadow-sm relative ${msg.isIncoming
                            ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                            : 'bg-green-600 text-white rounded-tr-none'
                            }`}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed text-sm pr-12 pb-1">
                            {msg.text}
                          </p>
                          <div className="flex justify-end items-center gap-1 absolute bottom-1 right-2">
                            <span className={`text-[10px] ${msg.isIncoming ? "text-gray-400" : "text-green-100"}`}>
                              {msg.timestamp}
                            </span>
                            {!msg.isIncoming && getStatusIcon(msg.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="ghost">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Введите сообщение..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="pr-10"
                    disabled={!!iframeUrl}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={handleSendMessage} disabled={!message.trim() || !!iframeUrl}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                WhatsApp интеграция
              </h3>
              <p className="text-gray-600">
                Выберите диалог для начала общения
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Assign Dialog Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначить ответственного</DialogTitle>
            <DialogDescription>
              Выберите менеджера, который будет отвечать за этот диалог
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {['user1', 'user2', 'user3'].map(userId => (
              <div key={userId} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                   onClick={() => handleAssignDialog(userId)}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {userId.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Менеджер {userId}</p>
                  <p className="text-sm text-gray-500">user{userId}@example.com</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Отмена</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Setup Modal */}
      <Dialog open={isSetupModalOpen} onOpenChange={setIsSetupModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Настройка WhatsApp интеграции</DialogTitle>
            <DialogDescription>
              Настройте подключение к Wazzup для работы с WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input id="webhook-url" placeholder="https://your-domain.com/webhooks/wazzup" />
            </div>
            <div>
              <Label htmlFor="api-key">API Key</Label>
              <Input id="api-key" type="password" placeholder="Введите API ключ Wazzup" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Отмена</Button>
            </DialogClose>
            <Button>Сохранить настройки</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
