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
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ru } from "date-fns/locale";
import {
  getChats,
  getMessages,
  sendMessage,
  uploadAttachment,
  createPersonalChat,
  createGroupChat,
  addMembers,
  leaveChat,
  deleteChat,
} from "@/src/api/chat.api";
import type { Chat, Message } from "@/src/models/chat.model";
import { getCurrentUser } from "@/lib/auth";
import { CustomSelect } from "@/components/ui/custom-select";
import { listUsers } from "@/src/api/users.api";
import type { User } from "@/src/models/users.model";
import useWebSocket from "@/hooks/useWebSocket";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, CheckCheck, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const currentUser = getCurrentUser();

  const [isCreateChatModalOpen, setIsCreateChatModalOpen] = useState(false);
  const [createPersonalChatUserId, setCreatePersonalChatUserId] = useState<string | null>(null);
  const [createGroupChatName, setCreateGroupChatName] = useState("");
  const [createGroupChatMembers, setCreateGroupChatMembers] = useState<string[]>([]);

  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [addMembersList, setAddMembersList] = useState<string[]>([]);
  const [isChatVisible, setIsChatVisible] = useState(false);

  const handleNewMessage = useCallback((newMessage: Message) => {
    if (newMessage.chat_id === selectedChat?.id) {
      setMessages(prevMessages => [...prevMessages, newMessage]);
    }
    const chat = (chats || []).find(c => c.id === newMessage.chat_id);
    if (chat) {
      chat.last_message_text = newMessage.text;
      chat.last_message_at = newMessage.created_at;
      if (newMessage?.sender_id?.toString() !== currentUser?.id?.toString()) {
        chat.unread_count++;
      }
      setChats([...chats]);
    }
  }, [selectedChat, chats]);

  useWebSocket(selectedChat?.id ?? null, handleNewMessage);


  useEffect(() => {
    fetchChats();
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setUsersLoading(true);
    try {
      const res = await listUsers();
      setUsers(Array.isArray(res) ? res : (res as any).data || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  }

  async function fetchChats() {
    setChatsLoading(true);
    setChatsError(null);
    try {
      const res = await getChats();
      setChats(res);
    } catch (e: any) {
      console.error(e);
      setChatsError(e.message || "Не удалось загрузить чаты");
    } finally {
      setChatsLoading(false);
    }
  }

  useEffect(() => {
    if (selectedChat) fetchMessages(selectedChat.id);
  }, [selectedChat]);

  async function fetchMessages(chatId: number) {
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const res = await getMessages(chatId, 50, 0);
      setMessages(Array.isArray(res) ? res : []);

      // Mark messages as read
      const chat = chats.find(c => c.id === chatId);
      if (chat && chat.unread_count > 0) {
        // Optimistic update
        chat.unread_count = 0;
        setChats([...chats]);

        // API call
        try {
          const { markAsRead } = await import("@/src/api/chat.api");
          await markAsRead(chatId);
        } catch (err) {
          console.error("Failed to mark messages as read", err);
        }
      }
    } catch (e: any) {
      console.error(e);
      setMessagesError(e.message || "Не удалось загрузить сообщения");
    } finally {
      setMessagesLoading(false);
    }
  }

  const handleSendMessage = async (text: string, attachments: string[] = []) => {
    if (!text.trim() || !selectedChat) return;

    try {
      await sendMessage(selectedChat.id, { text, attachments });
      setMessage("");
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedChat) return;
    try {
      const { url } = await uploadAttachment(selectedChat.id, file);
      await handleSendMessage(file.name, [url]);
    } catch (e: any) {
      console.error(e);
    }
  }

  const handleCreatePersonalChat = async () => {
    if (!createPersonalChatUserId) return;

    // Check if chat already exists
    const existingChat = (chats || []).find(c =>
      !c.is_group &&
      c.members?.includes(parseInt(createPersonalChatUserId)) &&
      c.members?.length === 2
    );

    if (existingChat) {
      setSelectedChat(existingChat);
      setIsChatVisible(true);
      setIsCreateChatModalOpen(false);
      return;
    }

    try {
      await createPersonalChat({ user_id: parseInt(createPersonalChatUserId) });
      await fetchChats();
      setIsCreateChatModalOpen(false);
    } catch (e: any) {
      console.error(e);
    }
  }

  const handleCreateGroupChat = async () => {
    if (!createGroupChatName.trim() || createGroupChatMembers.length === 0) return;
    try {
      await createGroupChat({ name: createGroupChatName, members: createGroupChatMembers.map(id => parseInt(id)) });
      await fetchChats();
      setIsCreateChatModalOpen(false);
    } catch (e: any) {
      console.error(e);
    }
  }

  const handleAddMembers = async () => {
    if (!selectedChat || addMembersList.length === 0) return;
    try {
      await addMembers(selectedChat.id, { members: addMembersList.map(id => parseInt(id)) });
      await fetchChats();
      setIsAddMembersModalOpen(false);
    } catch (e: any) {
      console.error(e);
    }
  }

  const handleLeaveChat = async () => {
    if (!selectedChat) return;
    try {
      await leaveChat(selectedChat.id);
      setSelectedChat(null);
      await fetchChats();
    } catch (e: any) {
      console.error(e);
    }
  }

  const handleDeleteChat = async () => {
    if (!selectedChat) return;
    try {
      await deleteChat(selectedChat.id);
      setSelectedChat(null);
      await fetchChats();
    } catch (e: any) {
      console.error(e);
    }
  }

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getChatName = (chat: Chat) => {
    if (chat.is_group && chat.name) return chat.name;

    const otherMemberId = chat.members?.find(m => m.toString() !== currentUser?.id?.toString());

    if (!otherMemberId) return chat.name || "Чат";

    const otherUser = users.find(u => u.id.toString() === otherMemberId.toString());
    if (otherUser) {
      return otherUser.firstName
        ? `${otherUser.firstName} ${otherUser.lastName || ''}`.trim()
        : (otherUser.company_name || otherUser.email || `Пользователь ${otherMemberId}`);
    }

    return usersLoading ? "Загрузка..." : (chat.name || `Пользователь ${otherMemberId}`);
  };

  const filteredChats = (chats || []).filter((chat) =>
    getChatName(chat).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const UserSelect = ({
    users,
    value,
    onChange,
    multiple = false,
    placeholder = "Выберите пользователя..."
  }: {
    users: any[],
    value: string | string[],
    onChange: (val: string | string[]) => void,
    multiple?: boolean,
    placeholder?: string
  }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const getUserLabel = (user: any) => user.firstName ? `${user.firstName} ${user.lastName}` : (user.company_name || user.email || "Без имени");

    // Filter users based on search
    const filteredUsers = users.filter((user) =>
      getUserLabel(user).toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (userId: string) => {
      if (multiple) {
        const currentValues = Array.isArray(value) ? value : [];
        const newValues = currentValues.includes(userId)
          ? currentValues.filter((v) => v !== userId)
          : [...currentValues, userId];
        onChange(newValues);
      } else {
        onChange(userId);
        setOpen(false);
      }
    };

    const displayValue = multiple
      ? (Array.isArray(value) && value.length > 0
        ? `${value.length} выбрано`
        : placeholder)
      : (users.find((u) => u.id.toString() === value)
        ? getUserLabel(users.find((u) => u.id.toString() === value))
        : placeholder);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">{displayValue}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Поиск участника..." onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>Пользователь не найден.</CommandEmpty>
              <CommandGroup>
                {filteredUsers.map((user) => {
                  const isSelected = multiple
                    ? (Array.isArray(value) && value.includes(user.id.toString()))
                    : value === user.id.toString();
                  return (
                    <CommandItem
                      key={user.id}
                      value={getUserLabel(user)}
                      onSelect={() => handleSelect(user.id.toString())}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {getUserLabel(user)}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="flex h-screen">
      {/* Chat List */}
      <div className={`
        ${isChatVisible ? 'hidden' : 'flex'}
        w-full flex-col bg-white border-r border-gray-200
        md:flex md:w-80
    `}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Чаты</h2>
            <Dialog open={isCreateChatModalOpen} onOpenChange={setIsCreateChatModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать чат</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="personal">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="personal">Личный</TabsTrigger>
                    <TabsTrigger value="group">Групповой</TabsTrigger>
                  </TabsList>
                  <TabsContent value="personal">
                    <div className="py-4">
                      <Label htmlFor="user">Выберите пользователя</Label>
                      <UserSelect
                        users={users.filter(u => u.id.toString() !== currentUser?.id)}
                        value={createPersonalChatUserId || ""}
                        onChange={(val) => setCreatePersonalChatUserId(val as string)}
                        placeholder="Поиск..."
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="ghost">Отмена</Button></DialogClose>
                      <Button onClick={handleCreatePersonalChat}>
                        {createPersonalChatUserId && (chats || []).some(c =>
                          !c.is_group &&
                          c.members?.includes(parseInt(createPersonalChatUserId)) &&
                          c.members?.length === 2
                        )
                          ? "Перейти в чат"
                          : "Создать"
                        }
                      </Button>
                    </DialogFooter>
                  </TabsContent>
                  <TabsContent value="group">
                    <div className="py-4 space-y-4">
                      <div>
                        <Label htmlFor="group-name">Название группы</Label>
                        <Input id="group-name" value={createGroupChatName} onChange={e => setCreateGroupChatName(e.target.value)} />
                      </div>
                      <div>
                        <Label>Участники</Label>
                        <div className="space-y-2">
                          {usersLoading ? (
                            <div>Загрузка...</div>
                          ) : (
                            <UserSelect
                              users={users.filter(u => u.id.toString() !== currentUser?.id)}
                              value={createGroupChatMembers.map(String)}
                              onChange={(val) => setCreateGroupChatMembers(val as string[])}
                              multiple
                              placeholder="Выберите участников..."
                            />
                          )}
                          {createGroupChatMembers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {createGroupChatMembers.map(id => {
                                const user = users.find(u => u.id.toString() === id);
                                return user ? (
                                  <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                    {user.company_name || user.email || user.firstName || "Без имени"}
                                    <X
                                      className="h-3 w-3 cursor-pointer hover:text-red-500"
                                      onClick={() => setCreateGroupChatMembers(prev => prev.filter(m => m !== id))}
                                    />
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="ghost">Отмена</Button></DialogClose>
                      <Button onClick={handleCreateGroupChat}>Создать группу</Button>
                    </DialogFooter>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск чатов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {chatsLoading && <div className="py-4 text-center">Загрузка чатов...</div>}
            {chatsError && (
              <div className="py-2 text-red-600 text-center">{chatsError}</div>
            )}
            {!chatsLoading && !chatsError && (
              (chats || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center mt-10">
                  <MessageSquare className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">Чатов пока нет</p>
                  <p className="text-sm text-gray-400">Начните свое первое общение!</p>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="p-4 text-center text-gray-500">Чаты не найдены</div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setSelectedChat(chat);
                      setIsChatVisible(true);
                    }}
                    className={`p-3 rounded-xl cursor-pointer transition-colors ${selectedChat?.id === chat.id
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={''} />
                          <AvatarFallback>
                            {chat.is_group ? <Users className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                          </AvatarFallback>
                        </Avatar>
                        {chat.online && (
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-500`}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm truncate">
                            {getChatName(chat)}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(chat.last_message_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate">
                            {chat.last_message_text || "Нет сообщений"}
                          </p>
                          {chat.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {chat.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </ScrollArea>
      </div >

      {/* Chat Area */}
      < div className={`
        ${isChatVisible ? 'flex' : 'hidden'}
        flex-1 flex-col
        md:flex
    `}>
        {
          selectedChat ? (
            <>
              {/* Chat Header */}
              < div className="p-4 bg-white border-b border-gray-200" >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsChatVisible(false)}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </Button>
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={''} />
                        <AvatarFallback>
                          {selectedChat.is_group ? <Users className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                      {selectedChat.online && (
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-500`}
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{getChatName(selectedChat)}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedChat.is_group
                          ? `${selectedChat.members?.length || 0} участников`
                          : (() => {
                            const otherMemberId = selectedChat.members?.find(m => m.toString() !== currentUser?.id);
                            const status = selectedChat.member_statuses?.find(s => s.user_id === otherMemberId);
                            return status?.is_online ? <span className="text-green-600">В сети</span> : 'Не в сети';
                          })()
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {selectedChat.is_group && <DropdownMenuItem onClick={() => setIsAddMembersModalOpen(true)}><UserPlus className="h-4 w-4 mr-2" />Добавить участников</DropdownMenuItem>}
                        <DropdownMenuItem onClick={handleLeaveChat}><LogOut className="h-4 w-4 mr-2" />Покинуть чат</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDeleteChat} className="text-red-500"><Trash2 className="h-4 w-4 mr-2" />Удалить чат</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div >

              {/* Messages */}
              < ScrollArea className="flex-1 p-4 bg-gray-50" >
                <div className="space-y-4">
                  {messagesLoading && (
                    <div className="py-4 text-center">Загрузка сообщений...</div>
                  )}
                  {messagesError && (
                    <div className="py-2 text-red-600 text-center">{messagesError}</div>
                  )}
                  {!messagesLoading &&
                    !messagesError &&
                    messages.reduce((acc: React.ReactNode[], msg, index) => {
                      const isCurrentUser = msg?.sender_id?.toString() === currentUser?.id?.toString();

                      // Date Separator Logic
                      const messageDate = new Date(msg.created_at);
                      const prevMessage = index > 0 ? messages[index - 1] : null;
                      const prevMessageDate = prevMessage ? new Date(prevMessage.created_at) : null;

                      let showDateSeparator = false;
                      if (!prevMessageDate ||
                        messageDate.getDate() !== prevMessageDate.getDate() ||
                        messageDate.getMonth() !== prevMessageDate.getMonth() ||
                        messageDate.getFullYear() !== prevMessageDate.getFullYear()) {
                        showDateSeparator = true;
                      }

                      if (showDateSeparator) {
                        let dateLabel = format(messageDate, 'd MMMM yyyy', { locale: ru });
                        if (isToday(messageDate)) dateLabel = "Сегодня";
                        else if (isYesterday(messageDate)) dateLabel = "Вчера";

                        acc.push(
                          <div key={`date-${msg.id}`} className="flex justify-center my-4">
                            <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                              {dateLabel}
                            </span>
                          </div>
                        );
                      }

                      // Find sender user for group chats
                      const senderUser = users.find(u => u.id.toString() === msg?.sender_id?.toString());
                      const senderName = senderUser
                        ? (senderUser.firstName ? `${senderUser.firstName} ${senderUser.lastName || ''}`.trim() : (senderUser.company_name || senderUser.email))
                        : "Неизвестный";

                      acc.push(
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} mb-2`}
                        >
                          {!isCurrentUser && selectedChat?.is_group && (
                            <span className="text-xs text-muted-foreground ml-2 mb-1">{senderName}</span>
                          )}
                          <div
                            className={`max-w-[85%] md:max-w-[70%] px-3 py-2 rounded-2xl shadow-sm relative ${isCurrentUser
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                              }`}
                          >
                            <p className="whitespace-pre-wrap break-words leading-relaxed text-sm pr-12 pb-1">
                              {msg.text}
                            </p>

                            {/* Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {msg.attachments.map((att, index) => (
                                  <a
                                    href={`https://api.kubcrm.kz${att}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    key={index}
                                    className={`block text-xs underline truncate ${isCurrentUser ? "text-blue-100" : "text-blue-500"}`}
                                  >
                                    Вложение {index + 1}
                                  </a>
                                ))}
                              </div>
                            )}

                            <div className="flex justify-end items-center gap-1 absolute bottom-1 right-2">
                              <span className={`text-[10px] ${isCurrentUser ? "text-blue-100 opacity-80" : "text-gray-400"}`}>
                                {format(new Date(msg.created_at), 'HH:mm')}
                              </span>
                              {isCurrentUser && (
                                msg.is_read ? (
                                  <CheckCheck className="h-3 w-3 text-blue-200" />
                                ) : (
                                  <Check className="h-3 w-3 text-blue-200 opacity-70" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                      return acc;
                    }, [])}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea >

              {/* Message Input */}
              < div className="p-4 bg-white border-t border-gray-200" >
                <div className="flex items-center space-x-2">
                  <Input type="file" className="hidden" id="file-upload" onChange={e => e.target.files && handleFileUpload(e.target.files[0])} />
                  <Label htmlFor="file-upload">
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </Label>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Введите сообщение..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(message)}
                      className="pr-10"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button onClick={() => handleSendMessage(message)} disabled={!message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div >
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Выберите чат
                </h3>
                <p className="text-gray-600">
                  Выберите чат из списка, чтобы начать общение
                </p>
              </div>
            </div>
          )}
      </div >
      {selectedChat && <Dialog open={isAddMembersModalOpen} onOpenChange={setIsAddMembersModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить участников</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Участники</Label>
            <div className="space-y-2">
              {usersLoading ? (
                <div>Загрузка...</div>
              ) : (
                users.filter(u => u.id.toString() !== currentUser?.id && !selectedChat.members.includes(parseInt(u.id))).map(user => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Input type="checkbox" id={`add-user-${user.id}`} onChange={e => {
                      if (e.target.checked) {
                        setAddMembersList([...addMembersList, user.id]);
                      } else {
                        setAddMembersList(addMembersList.filter(id => id !== user.id));
                      }
                    }} />
                    <Label htmlFor={`add-user-${user.id}`}>{user.firstName} {user.lastName}</Label>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Отмена</Button></DialogClose>
            <Button onClick={handleAddMembers}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}
    </div >
  );
}
