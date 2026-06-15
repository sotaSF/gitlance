import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, Sparkles, Bot, User, X } from "lucide-react";
import { refineModulesWithAI } from "../../../new-project/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ModuleAIChatProps {
  modules: any[];
  projectContext: string;
  onUpdateModules: (modules: any[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ModuleAIChat({
  modules,
  projectContext,
  onUpdateModules,
  isOpen,
  onClose,
}: ModuleAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I can help you modify your project modules. You can ask me to add features, adjust costs, or split modules. What would you like to do?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await refineModulesWithAI(modules, userMessage.content, projectContext);

      if (result.success && result.modules) {
        onUpdateModules(result.modules);
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.message || "I've updated the modules based on your request.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        toast.success("Modules updated successfully!");
      } else {
        const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "I encountered an error while trying to update the modules. Please try again.",
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        toast.error(result.error || "Failed to update modules");
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-background border-l shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out">
      <div className="p-4 border-b flex items-center justify-between bg-muted/10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-emerald-600/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Project Assistant</h3>
            <p className="text-xs text-muted-foreground">Refining modules</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 max-w-[85%]",
              message.role === "user" ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <Avatar className="h-8 w-8 border">
              {message.role === "assistant" ? (
                <div className="h-full w-full bg-emerald-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                </div>
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </Avatar>
            <div
              className={cn(
                "p-3 rounded-lg text-sm",
                message.role === "user"
                  ? "bg-emerald-600 text-white"
                  : "bg-muted text-foreground"
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%]">
             <Avatar className="h-8 w-8 border">
                <div className="h-full w-full bg-emerald-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                </div>
            </Avatar>
            <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Analyzing changes...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a login module..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
