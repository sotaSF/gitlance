"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Send, Paperclip, X, FileIcon, ImageIcon, Download, Reply, SmilePlus, Loader2, Lock, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// Using native overflow-y-auto instead of ScrollArea for reliable flex-based scrolling
import { createClient } from "@/lib/supabase/client";
import { WorkspaceChannelMessage } from "@/types/workspace";
import { toast } from "sonner";
import Image from "next/image";
import { editChannelMessage, deleteChannelMessage } from "../actions";

interface ChatInterfaceProps {
    channelId: string;
    initialMessages: WorkspaceChannelMessage[];
    currentUserId: string;
    workspaceId: string;
    isPaused?: boolean;
}

export function ChatInterface({ channelId, initialMessages, currentUserId, workspaceId, isPaused = false }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<WorkspaceChannelMessage[]>(initialMessages);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingFile, setUploadingFile] = useState<File | null>(null);
    const [replyTo, setReplyTo] = useState<WorkspaceChannelMessage | null>(null);

    // Lazy loading state
    const [hasMore, setHasMore] = useState(initialMessages.length >= 30);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Emoji reaction menu hover state
    const [activeEmojiMenuMsgId, setActiveEmojiMenuMsgId] = useState<string | null>(null);
    const emojiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Edit state
    const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState("");
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Delete confirm state
    const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const userScrolledRef = useRef(false);
    // Used to anchor scroll position when loading older messages
    const previousScrollHeightRef = useRef<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [supabase] = useState(() => createClient());
    const [channel] = useState(() => supabase.channel(`workspace_room:${channelId}`));

    // Scroll to bottom on new message if user is at the bottom
    useEffect(() => {
        if (!userScrolledRef.current && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "auto" });
        }
    }, [messages]);

    // When initial messages load, reset hasMore appropriately based on count
    useEffect(() => {
        setHasMore(initialMessages.length >= 30);
        setMessages(initialMessages);
    }, [initialMessages]);

    const loadMoreMessages = async () => {
        if (!hasMore || isLoadingMore || messages.length === 0) return;
        setIsLoadingMore(true);

        const oldestMessage = messages[0];

        try {
            const { data, error } = await supabase
                .from("workspace_channel_messages")
                .select(`
                    *,
                    profiles (
                        display_name,
                        avatar_url
                    )
                `)
                .eq("channel_id", channelId)
                .lt("created_at", oldestMessage.created_at)
                .order("created_at", { ascending: false })
                .limit(30);

            if (error) throw error;

            if (data && data.length > 0) {
                const olderMessages = [...data].reverse();

                // Snapshot the scroll height before React renders the new older messages
                if (scrollContainerRef.current) {
                    previousScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
                }

                setMessages(prev => [...olderMessages, ...prev]);

                if (data.length < 30) {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (error: any) {
            console.error("Error loading more messages:", error);
            toast.error("Failed to load older messages");
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Restore scroll position after older messages are prepended and rendered
    useEffect(() => {
        if (previousScrollHeightRef.current > 0 && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const newScrollHeight = container.scrollHeight;
            const heightDifference = newScrollHeight - previousScrollHeightRef.current;

            // Adjust scroll position to account for the newly inserted messages at the top
            container.scrollTop += heightDifference;

            // Reset the snapshot
            previousScrollHeightRef.current = 0;
        }
    }, [messages]);

    // Handle Realtime Broadcasts (Bypasses strict RLS `postgres_changes` limits)
    useEffect(() => {
        channel
            .on(
                "broadcast",
                { event: "chat_event" },
                (payload) => {
                    const { type, message } = payload.payload;
                    if (type === 'NEW_MESSAGE') {
                        setMessages((prev) => {
                            // Check if message already exists
                            if (prev.some(m => m.id === message.id)) return prev;
                            // Remove optimistic local versions if they match content/user
                            const filtered = prev.filter(m => !(m.id.startsWith('temp-') && m.content === message.content && m.user_id === message.user_id));
                            return [...filtered, message as WorkspaceChannelMessage];
                        });
                    } else if (type === 'NEW_REACTION') {
                        setMessages((prev) => prev.map(m => m.id === message.id ? message : m));
                    } else if (type === 'EDIT_MESSAGE') {
                        setMessages((prev) => prev.map(m => m.id === message.id ? message : m));
                    } else if (type === 'DELETE_MESSAGE') {
                        setMessages((prev) => prev.map(m => m.id === message.id ? message : m));
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log("Subscribed to broadcast channel for realtime messages!");
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [channel, supabase]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB");
            return;
        }

        setUploadingFile(file);
    };

    const removeFile = () => {
        setUploadingFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const uploadFileToSupabase = async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${workspaceId}/${channelId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from("channel_attachments")
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        return filePath;
    };

    const toggleReaction = async (msgId: string, emoji: string) => {
        if (isPaused) return;

        const msg = messages.find(m => m.id === msgId);
        if (!msg) return;

        // Optimistic Update
        const reactions = msg.reactions || {};
        let userReactions = reactions[emoji] || [];

        if (userReactions.includes(currentUserId)) {
            userReactions = userReactions.filter(id => id !== currentUserId);
        } else {
            userReactions = [...userReactions, currentUserId];
        }

        const newReactions = {
            ...reactions,
            [emoji]: userReactions
        };

        // Clean up empty reaction arrays
        if (userReactions.length === 0) {
            delete newReactions[emoji];
        }

        const updatedMsg = { ...msg, reactions: newReactions };
        setMessages(prev => prev.map(m => m.id === msgId ? updatedMsg : m));

        // Update DB
        const { error } = await supabase
            .from('workspace_channel_messages')
            .update({ reactions: newReactions })
            .eq('id', msgId);

        if (error) {
            toast.error("Failed to add reaction");
            // Revert optimistic update
            setMessages(prev => prev.map(m => m.id === msgId ? msg : m));
        } else {
            // Broadcast
            channel.send({
                type: 'broadcast',
                event: 'chat_event',
                payload: { type: 'NEW_REACTION', message: updatedMsg }
            });
        }
    };

    const handleEmojiMouseEnter = (msgId: string) => {
        if (emojiTimeoutRef.current) {
            clearTimeout(emojiTimeoutRef.current);
            emojiTimeoutRef.current = null;
        }
        setActiveEmojiMenuMsgId(msgId);
    };

    const handleEmojiMouseLeave = () => {
        emojiTimeoutRef.current = setTimeout(() => {
            setActiveEmojiMenuMsgId(null);
        }, 1500); // 1.5 seconds delay
    };

    // ── Edit handlers ──────────────────────────────────────────────────────────
    const startEdit = (msg: WorkspaceChannelMessage) => {
        setEditingMsgId(msg.id);
        setEditingContent(msg.content);
        setDeletingMsgId(null);
    };

    const cancelEdit = () => {
        setEditingMsgId(null);
        setEditingContent("");
    };

    const handleSaveEdit = async (msgId: string) => {
        if (isPaused) return;
        const trimmed = editingContent.trim();
        if (!trimmed) return;

        const original = messages.find(m => m.id === msgId);
        if (!original || trimmed === original.content) { cancelEdit(); return; }

        setIsSavingEdit(true);
        // Optimistic update
        const optimistic = { ...original, content: trimmed, edited_at: new Date().toISOString() };
        setMessages(prev => prev.map(m => m.id === msgId ? optimistic : m));
        cancelEdit();

        const result = await editChannelMessage(msgId, trimmed);
        if (result.error) {
            toast.error("Failed to edit message");
            setMessages(prev => prev.map(m => m.id === msgId ? original : m));
        } else if (result.message) {
            setMessages(prev => prev.map(m => m.id === msgId ? result.message! : m));
            channel.send({
                type: 'broadcast',
                event: 'chat_event',
                payload: { type: 'EDIT_MESSAGE', message: result.message }
            });
        }
        setIsSavingEdit(false);
    };

    // ── Delete handlers ────────────────────────────────────────────────────────
    const confirmDelete = (msgId: string) => {
        setDeletingMsgId(msgId);
        setEditingMsgId(null);
    };

    const cancelDelete = () => setDeletingMsgId(null);

    const handleConfirmDelete = async (msgId: string) => {
        if (isPaused) return;

        const original = messages.find(m => m.id === msgId);
        if (!original) return;

        // Optimistic update
        const optimistic: WorkspaceChannelMessage = {
            ...original,
            is_deleted: true,
            content: "",
            attachment_url: null,
            attachment_name: null,
            attachment_type: null,
            attachment_size: null,
        };
        setMessages(prev => prev.map(m => m.id === msgId ? optimistic : m));
        setDeletingMsgId(null);

        const result = await deleteChannelMessage(msgId);
        if (result.error) {
            toast.error("Failed to delete message");
            setMessages(prev => prev.map(m => m.id === msgId ? original : m));
        } else if (result.message) {
            setMessages(prev => prev.map(m => m.id === msgId ? result.message! : m));
            channel.send({
                type: 'broadcast',
                event: 'chat_event',
                payload: { type: 'DELETE_MESSAGE', message: result.message }
            });
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isPaused) return;
        if (!newMessage.trim() && !uploadingFile) return;

        setIsLoading(true);
        try {
            let attachmentUrl = null;
            let attachmentName = null;
            let attachmentType = null;
            let attachmentSize = null;

            if (uploadingFile) {
                attachmentUrl = await uploadFileToSupabase(uploadingFile);
                attachmentName = uploadingFile.name;
                attachmentType = uploadingFile.type;
                attachmentSize = uploadingFile.size;
            }

            const tempId = `temp-${Date.now()}`;

            // clear input immediately for better UX
            const messageToSend = newMessage.trim();
            setNewMessage("");
            removeFile();
            const replyToMsg = replyTo;
            setReplyTo(null);

            const tempMsg: WorkspaceChannelMessage = {
                id: tempId,
                channel_id: channelId,
                user_id: currentUserId,
                content: messageToSend,
                attachment_url: attachmentUrl,
                attachment_name: attachmentName,
                attachment_type: attachmentType,
                attachment_size: attachmentSize,
                reply_to_id: replyToMsg?.id || null,
                reactions: {},
                created_at: new Date().toISOString(),
                updated_at: null,
            };
            setMessages((prev) => [...prev, tempMsg]);

            const { data, error } = await supabase
                .from("workspace_channel_messages")
                .insert([{
                    channel_id: channelId,
                    user_id: currentUserId,
                    content: messageToSend,
                    attachment_url: attachmentUrl,
                    attachment_name: attachmentName,
                    attachment_type: attachmentType,
                    attachment_size: attachmentSize,
                    reply_to_id: replyToMsg?.id || null,
                    reactions: {}
                }])
                .select(`
                    *,
                    profiles (
                        display_name,
                        avatar_url
                    )
                `).single();

            if (error) {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                throw error;
            }

            // Replace optimistic temp message with real db message
            setMessages(prev => prev.map(m => m.id === tempId ? data : m));

            // Broadcast the new message to everyone else without waiting for db replication
            channel.send({
                type: 'broadcast',
                event: 'chat_event',
                payload: { type: 'NEW_MESSAGE', message: data }
            });

        } catch (error: any) {
            toast.error(error.message || "Failed to send message");
        } finally {
            setIsLoading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const renderAttachment = (msg: WorkspaceChannelMessage) => {
        if (!msg.attachment_url) return null;

        let fileUrl = "";
        try {
            fileUrl = supabase.storage.from("channel_attachments").getPublicUrl(msg.attachment_url).data.publicUrl;
        } catch (e) {
            console.error("Error getting public url:", e);
        }

        const isImage = msg.attachment_type?.startsWith("image/");

        return (
            <div className="mt-2 rounded-md border bg-muted/30 p-2 max-w-sm inline-block">
                {isImage ? (
                    <div className="flex flex-col gap-2">
                        <div className="relative h-48 w-full max-w-sm overflow-hidden rounded-md bg-muted">
                            <Image
                                src={fileUrl}
                                alt={msg.attachment_name || "Image attachment"}
                                fill
                                className="object-contain"
                                unoptimized
                            />
                        </div>
                        <div className="flex items-center justify-between gap-4 text-xs">
                            <span className="truncate flex-1 font-medium">{msg.attachment_name}</span>
                            <a
                                href={fileUrl}
                                target="_blank"
                                download
                                className="hover:bg-muted p-1 rounded-sm shrink-0 transition-colors cursor-pointer"
                                title="Download"
                            >
                                <Download className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex items-center justify-center bg-primary/10 rounded-md shrink-0">
                            <FileIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-medium truncate">{msg.attachment_name}</span>
                            <span className="text-xs text-muted-foreground">{formatFileSize(msg.attachment_size || 0)}</span>
                        </div>
                        <a
                            href={fileUrl}
                            target="_blank"
                            download
                            className="h-8 w-8 hover:bg-muted rounded-md flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                            title="Download"
                        >
                            <Download className="h-4 w-4" />
                        </a>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden w-full">
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0"
                onScroll={() => {
                    // When user manually scrolls, mark it so auto-scroll to bottom stops
                    if (scrollContainerRef.current) {
                        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
                        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
                        userScrolledRef.current = !isAtBottom;
                    }
                }}
            >
                <div className="flex flex-col gap-3 max-w-4xl mx-auto pb-4">
                    {/* Infinite Scroll Trigger */}
                    {hasMore && (
                        <div
                            ref={(node) => {
                                if (!node) return;
                                const observer = new IntersectionObserver(
                                    (entries) => {
                                        if (entries[0].isIntersecting && !isLoadingMore) {
                                            loadMoreMessages();
                                        }
                                    },
                                    { threshold: 0.1 }
                                );
                                observer.observe(node);
                                return () => observer.disconnect();
                            }}
                            className="flex justify-center my-4 h-8"
                        >
                            {isLoadingMore && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                        </div>
                    )}

                    {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground my-8">
                            No messages yet. Say hello!
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const showAvatar = idx === 0 || messages[idx - 1].user_id !== msg.user_id;
                            const isMine = msg.user_id === currentUserId;
                            const isDeleted = msg.is_deleted === true;
                            const isEditing = editingMsgId === msg.id;
                            const isConfirmingDelete = deletingMsgId === msg.id;

                            return (
                                <div key={msg.id} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''} group relative`}>
                                    <Avatar className={`h-8 w-8 mt-1 ${!showAvatar ? 'invisible' : ''} shrink-0`}>
                                        <AvatarImage src={msg.profiles?.avatar_url || ""} />
                                        <AvatarFallback className="text-[10px]">
                                            {msg.profiles?.display_name?.substring(0, 2).toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className={`flex flex-col w-fit max-w-[85%] relative ${isMine ? 'items-end' : 'items-start'}`}>
                                        {showAvatar && (
                                            <div className={`flex items-baseline gap-2 mb-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                                                <span className="text-sm font-semibold">
                                                    {isMine ? 'You' : (msg.profiles?.display_name || "Unknown User")}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {format(new Date(msg.created_at), "MMM d, h:mm a")}
                                                </span>
                                                {/* Edited label */}
                                                {!isDeleted && msg.edited_at && (
                                                    <span className="text-[10px] text-muted-foreground italic">(edited)</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Reply Context Info */}
                                        {msg.reply_to_id && !isDeleted && (
                                            <div onClick={() => {
                                                const target = document.getElementById(`msg-${msg.reply_to_id}`);
                                                if (target) {
                                                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    target.animate([{ backgroundColor: 'rgba(255,255,255,0.1)' }, { backgroundColor: 'transparent' }], { duration: 2000 });
                                                }
                                            }} className={`text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md mb-1 cursor-pointer hover:underline flex items-center gap-1 opacity-70 ${isMine ? 'mr-1' : 'ml-1'}`}>
                                                <Reply className="h-3 w-3" />
                                                <span>Replying to {messages.find(m => m.id === msg.reply_to_id)?.profiles?.display_name || 'a message'}</span>
                                                <span className="truncate max-w-[150px] italic">"{messages.find(m => m.id === msg.reply_to_id)?.content}"</span>
                                            </div>
                                        )}

                                        {/* Message Bubble + Hover Actions Container */}
                                        <div id={`msg-${msg.id}`} className="relative group/bubble flex items-center">

                                            {/* ─── Left-side actions (own messages) ─── */}
                                            {isMine && !isDeleted && !isEditing && (
                                                <div className="mr-2 opacity-0 group-hover/bubble:opacity-100 flex items-center gap-1 bg-background/80 backdrop-blur-sm border rounded-md shadow-sm p-1 z-10 transition-opacity">
                                                    {/* Emoji react */}
                                                    <div
                                                        className="relative flex items-center"
                                                        onMouseEnter={() => handleEmojiMouseEnter(msg.id)}
                                                        onMouseLeave={handleEmojiMouseLeave}
                                                    >
                                                        <button className="p-1 hover:bg-muted text-muted-foreground rounded transition-colors" title="React">
                                                            <SmilePlus className="h-3 w-3" />
                                                        </button>
                                                        {activeEmojiMenuMsgId === msg.id && (
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 flex items-center gap-1 bg-background border rounded-full shadow-md p-1.5 z-20 animate-in fade-in zoom-in-95 duration-200">
                                                                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={() => { toggleReaction(msg.id, emoji); setActiveEmojiMenuMsgId(null); }}
                                                                        className="p-1 hover:bg-muted rounded-full text-sm transition-transform hover:scale-125 focus:outline-none"
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Reply */}
                                                    <button onClick={() => setReplyTo(msg)} className="p-1 hover:bg-muted text-muted-foreground rounded transition-colors" title="Reply">
                                                        <Reply className="h-3 w-3" />
                                                    </button>
                                                    {/* Edit */}
                                                    <button onClick={() => startEdit(msg)} className="p-1 hover:bg-muted text-muted-foreground rounded transition-colors" title="Edit">
                                                        <Pencil className="h-3 w-3" />
                                                    </button>
                                                    {/* Delete */}
                                                    <button onClick={() => confirmDelete(msg.id)} className="p-1 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded transition-colors" title="Delete">
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex flex-col items-start min-w-[30px]">
                                                {/* ─── Deleted placeholder ─── */}
                                                {isDeleted ? (
                                                    <div className={`text-xs italic text-muted-foreground px-4 py-2 w-fit border border-dashed rounded-2xl opacity-60 ${isMine ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                                                        Message deleted
                                                    </div>
                                                ) : isEditing ? (
                                                    /* ─── Inline edit input ─── */
                                                    <div className="flex flex-col gap-2 w-full min-w-[200px]">
                                                        <Input
                                                            value={editingContent}
                                                            onChange={e => setEditingContent(e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(msg.id); }
                                                                if (e.key === 'Escape') cancelEdit();
                                                            }}
                                                            className="text-sm"
                                                            autoFocus
                                                            disabled={isSavingEdit}
                                                        />
                                                        <div className="flex items-center gap-1 justify-end">
                                                            <span className="text-[10px] text-muted-foreground mr-auto">Enter to save · Esc to cancel</span>
                                                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={cancelEdit} disabled={isSavingEdit}>
                                                                <X className="h-3 w-3 mr-1" />Cancel
                                                            </Button>
                                                            <Button size="sm" className="h-6 px-2 text-xs" onClick={() => handleSaveEdit(msg.id)} disabled={isSavingEdit || !editingContent.trim()}>
                                                                {isSavingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}Save
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* ─── Normal message bubble ─── */
                                                    <>
                                                        {msg.content && (
                                                            <div className={`text-sm px-4 py-2 w-fit leading-relaxed ${isMine
                                                                ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm'
                                                                : 'bg-muted rounded-2xl rounded-tl-sm'
                                                                }`}>
                                                                {msg.content}
                                                            </div>
                                                        )}
                                                        {renderAttachment(msg)}
                                                    </>
                                                )}

                                                {/* Delete confirmation inline */}
                                                {isConfirmingDelete && !isDeleted && (
                                                    <div className="mt-1 flex items-center gap-2 text-xs bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-1.5 animate-in fade-in zoom-in-95 duration-200">
                                                        <span className="text-destructive font-medium">Delete this message?</span>
                                                        <button onClick={() => handleConfirmDelete(msg.id)} className="text-destructive font-semibold hover:underline">Yes</button>
                                                        <button onClick={cancelDelete} className="text-muted-foreground hover:underline">No</button>
                                                    </div>
                                                )}

                                                {/* In-Line Reactions */}
                                                {!isDeleted && msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                    <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end w-full' : 'justify-start'}`}>
                                                        {Object.entries(msg.reactions).map(([emoji, users]) => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => toggleReaction(msg.id, emoji)}
                                                                className={`text-[10px] px-1.5 py-0.5 min-w-[28px] rounded-full border flex items-center gap-1 transition-colors ${users.includes(currentUserId)
                                                                    ? 'bg-primary/20 border-primary/30'
                                                                    : 'bg-muted/50 border-border hover:bg-muted'
                                                                    }`}
                                                            >
                                                                <span>{emoji}</span>
                                                                <span className="font-semibold opacity-80">{users.length}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* ─── Right-side actions (other people's messages) ─── */}
                                            {!isMine && !isDeleted && (
                                                <div className="ml-2 opacity-0 group-hover/bubble:opacity-100 flex items-center gap-1 bg-background/80 backdrop-blur-sm border rounded-md shadow-sm p-1 z-10 transition-opacity">
                                                    <button onClick={() => setReplyTo(msg)} className="p-1 hover:bg-muted text-muted-foreground rounded transition-colors" title="Reply">
                                                        <Reply className="h-3 w-3" />
                                                    </button>
                                                    <div
                                                        className="relative flex items-center"
                                                        onMouseEnter={() => handleEmojiMouseEnter(msg.id)}
                                                        onMouseLeave={handleEmojiMouseLeave}
                                                    >
                                                        <button className="p-1 hover:bg-muted text-muted-foreground rounded transition-colors" title="React">
                                                            <SmilePlus className="h-3 w-3" />
                                                        </button>
                                                        {activeEmojiMenuMsgId === msg.id && (
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 flex items-center gap-1 bg-background border rounded-full shadow-md p-1.5 z-20 animate-in fade-in zoom-in-95 duration-200">
                                                                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={() => { toggleReaction(msg.id, emoji); setActiveEmojiMenuMsgId(null); }}
                                                                        className="p-1 hover:bg-muted rounded-full text-sm transition-transform hover:scale-125 focus:outline-none"
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} className="h-1" />
                </div>
            </div>

            <div className="p-4 border-t bg-background">
                {isPaused ? (
                    <div className="mb-3 px-3 py-6 bg-muted/30 rounded-md border border-dashed text-sm text-center text-muted-foreground flex flex-col items-center justify-center gap-2 max-w-4xl mx-auto">
                        <Lock className="h-6 w-6 text-muted-foreground/50 mb-1" />
                        <span className="font-medium">Workspace is paused</span>
                        <span className="text-xs">This channel is read-only. Members cannot send new messages.</span>
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex flex-col gap-2 relative">

                        {/* Reply Preview Area */}
                        {replyTo && (
                            <div className="flex items-start gap-2 bg-muted/40 p-2 px-3 rounded-lg border max-w-[85%] mb-2 relative group animate-in slide-in-from-bottom-2">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg opacity-80"></div>
                                <div className="flex flex-col flex-1 overflow-hidden ml-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-primary">{replyTo.profiles?.display_name || 'User'}</span>
                                        <span className="text-[10px] text-muted-foreground">{format(new Date(replyTo.created_at), "h:mm a")}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground truncate">{replyTo.content || 'Attachment'}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setReplyTo(null)}
                                    className="bg-transparent hover:bg-muted rounded-full p-1"
                                >
                                    <X className="h-3 w-3 text-muted-foreground" />
                                </button>
                            </div>
                        )}

                        {/* File Preview Area */}
                        {uploadingFile && (
                            <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-md border max-w-sm mb-2 relative">
                                {isLoading && (
                                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center gap-2 rounded-md">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        <span className="text-xs font-medium text-foreground">Uploading...</span>
                                    </div>
                                )}
                                <div className="h-10 w-10 flex items-center justify-center bg-background rounded border shrink-0">
                                    {uploadingFile.type.startsWith('image/') ? (
                                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-medium truncate">{uploadingFile.name}</span>
                                    <span className="text-xs text-muted-foreground">{formatFileSize(uploadingFile.size)}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    disabled={isLoading}
                                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:bg-destructive/90 disabled:opacity-50"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        )}

                        <div className="flex items-end gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                title="Attach File"
                            >
                                <Paperclip className="h-4 w-4" />
                            </Button>
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={replyTo ? `Reply to ${replyTo.profiles?.display_name}...` : "Type a message..."}
                                className="flex-1"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="shrink-0"
                                disabled={isLoading || (!newMessage.trim() && !uploadingFile)}
                            >
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Send message</span>
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
