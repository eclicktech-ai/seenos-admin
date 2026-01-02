import { useQuery } from "@tanstack/react-query";
import { 
  User, Bot, AlertCircle, FileText, Download, Image, FileCode, File,
  FileSpreadsheet, FileType, Presentation, Archive, Video, Music,
  FileJson, Database
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { RoleAvatar } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { conversationsApi } from "@/api/conversations";
import { formatRelativeTime, cn, formatBytes } from "@/lib/utils";
import { roleColors } from "@/lib/styles";
import type { Conversation, Message, ConversationFile } from "@/types";

// File type definitions for better categorization
interface FileTypeInfo {
  icon: React.ReactNode;
  color: string;
  label: string;
  category: string;
}

const FILE_TYPE_MAP: Record<string, FileTypeInfo> = {
  // Documents
  docx: { icon: <FileType className="h-4 w-4" />, color: "text-sky-600", label: "Word", category: "Document" },
  doc: { icon: <FileType className="h-4 w-4" />, color: "text-sky-600", label: "Word", category: "Document" },
  pdf: { icon: <FileText className="h-4 w-4" />, color: "text-red-500", label: "PDF", category: "Document" },
  txt: { icon: <FileText className="h-4 w-4" />, color: "text-gray-500", label: "Text", category: "Document" },
  rtf: { icon: <FileText className="h-4 w-4" />, color: "text-gray-500", label: "RTF", category: "Document" },
  odt: { icon: <FileText className="h-4 w-4" />, color: "text-sky-500", label: "ODT", category: "Document" },
  
  // Spreadsheets
  xlsx: { icon: <FileSpreadsheet className="h-4 w-4" />, color: "text-green-600", label: "Excel", category: "Spreadsheet" },
  xls: { icon: <FileSpreadsheet className="h-4 w-4" />, color: "text-green-600", label: "Excel", category: "Spreadsheet" },
  csv: { icon: <FileSpreadsheet className="h-4 w-4" />, color: "text-green-500", label: "CSV", category: "Spreadsheet" },
  ods: { icon: <FileSpreadsheet className="h-4 w-4" />, color: "text-green-500", label: "ODS", category: "Spreadsheet" },
  
  // Presentations
  pptx: { icon: <Presentation className="h-4 w-4" />, color: "text-orange-500", label: "PowerPoint", category: "Presentation" },
  ppt: { icon: <Presentation className="h-4 w-4" />, color: "text-orange-500", label: "PowerPoint", category: "Presentation" },
  odp: { icon: <Presentation className="h-4 w-4" />, color: "text-orange-500", label: "ODP", category: "Presentation" },
  
  // Code & Markup
  md: { icon: <FileCode className="h-4 w-4" />, color: "text-cyan-500", label: "Markdown", category: "Code" },
  html: { icon: <FileCode className="h-4 w-4" />, color: "text-orange-600", label: "HTML", category: "Code" },
  css: { icon: <FileCode className="h-4 w-4" />, color: "text-sky-500", label: "CSS", category: "Code" },
  js: { icon: <FileCode className="h-4 w-4" />, color: "text-yellow-500", label: "JavaScript", category: "Code" },
  ts: { icon: <FileCode className="h-4 w-4" />, color: "text-sky-600", label: "TypeScript", category: "Code" },
  tsx: { icon: <FileCode className="h-4 w-4" />, color: "text-sky-600", label: "TSX", category: "Code" },
  jsx: { icon: <FileCode className="h-4 w-4" />, color: "text-yellow-500", label: "JSX", category: "Code" },
  py: { icon: <FileCode className="h-4 w-4" />, color: "text-green-600", label: "Python", category: "Code" },
  
  // Data formats
  json: { icon: <FileJson className="h-4 w-4" />, color: "text-yellow-600", label: "JSON", category: "Data" },
  yaml: { icon: <FileCode className="h-4 w-4" />, color: "text-red-400", label: "YAML", category: "Data" },
  yml: { icon: <FileCode className="h-4 w-4" />, color: "text-red-400", label: "YAML", category: "Data" },
  xml: { icon: <FileCode className="h-4 w-4" />, color: "text-orange-400", label: "XML", category: "Data" },
  sql: { icon: <Database className="h-4 w-4" />, color: "text-sky-500", label: "SQL", category: "Data" },
  
  // Images
  png: { icon: <Image className="h-4 w-4" />, color: "text-green-500", label: "PNG", category: "Image" },
  jpg: { icon: <Image className="h-4 w-4" />, color: "text-green-500", label: "JPEG", category: "Image" },
  jpeg: { icon: <Image className="h-4 w-4" />, color: "text-green-500", label: "JPEG", category: "Image" },
  gif: { icon: <Image className="h-4 w-4" />, color: "text-cyan-500", label: "GIF", category: "Image" },
  webp: { icon: <Image className="h-4 w-4" />, color: "text-sky-500", label: "WebP", category: "Image" },
  svg: { icon: <Image className="h-4 w-4" />, color: "text-orange-500", label: "SVG", category: "Image" },
  ico: { icon: <Image className="h-4 w-4" />, color: "text-gray-500", label: "Icon", category: "Image" },
  
  // Audio
  mp3: { icon: <Music className="h-4 w-4" />, color: "text-pink-500", label: "MP3", category: "Audio" },
  wav: { icon: <Music className="h-4 w-4" />, color: "text-pink-500", label: "WAV", category: "Audio" },
  ogg: { icon: <Music className="h-4 w-4" />, color: "text-pink-500", label: "OGG", category: "Audio" },
  m4a: { icon: <Music className="h-4 w-4" />, color: "text-pink-500", label: "M4A", category: "Audio" },
  
  // Video
  mp4: { icon: <Video className="h-4 w-4" />, color: "text-red-500", label: "MP4", category: "Video" },
  webm: { icon: <Video className="h-4 w-4" />, color: "text-red-500", label: "WebM", category: "Video" },
  mov: { icon: <Video className="h-4 w-4" />, color: "text-red-500", label: "MOV", category: "Video" },
  avi: { icon: <Video className="h-4 w-4" />, color: "text-red-500", label: "AVI", category: "Video" },
  
  // Archives
  zip: { icon: <Archive className="h-4 w-4" />, color: "text-yellow-600", label: "ZIP", category: "Archive" },
  rar: { icon: <Archive className="h-4 w-4" />, color: "text-cyan-600", label: "RAR", category: "Archive" },
  "7z": { icon: <Archive className="h-4 w-4" />, color: "text-gray-600", label: "7Z", category: "Archive" },
  tar: { icon: <Archive className="h-4 w-4" />, color: "text-gray-600", label: "TAR", category: "Archive" },
  gz: { icon: <Archive className="h-4 w-4" />, color: "text-gray-600", label: "GZIP", category: "Archive" },
};

function getFileTypeInfo(path: string, isBinary: boolean): FileTypeInfo {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  
  if (FILE_TYPE_MAP[ext]) {
    return FILE_TYPE_MAP[ext];
  }
  
  // Default based on binary flag
  if (isBinary) {
    return { 
      icon: <File className="h-4 w-4" />, 
      color: "text-orange-500", 
      label: ext.toUpperCase() || "Binary", 
      category: "Binary" 
    };
  }
  
  return { 
    icon: <FileText className="h-4 w-4" />, 
    color: "text-muted-foreground", 
    label: ext.toUpperCase() || "File", 
    category: "Other" 
  };
}

interface ConversationDetailDrawerProps {
  conversation: Conversation | null;
  onClose: () => void;
}

export function ConversationDetailDrawer({
  conversation,
  onClose,
}: ConversationDetailDrawerProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["conversation-detail", conversation?.cid],
    queryFn: () => conversationsApi.get(conversation!.cid),
    enabled: !!conversation?.cid,
  });

  return (
    <Sheet open={!!conversation} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="pr-12">
          <SheetTitle className="truncate">
            {conversation?.title || `Conversation ${conversation?.cid.slice(0, 8)}...`}
          </SheetTitle>
          <p className="text-sm text-muted-foreground font-mono truncate">
            {conversation?.cid}
          </p>
        </SheetHeader>

        {/* Meta info */}
        {conversation && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <Badge variant="secondary">
              {conversation.messageCount} messages
            </Badge>
            <Badge
              variant={
                conversation.status === "completed"
                  ? "success"
                  : conversation.status === "error"
                  ? "destructive"
                  : "secondary"
              }
            >
              {conversation.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Updated {formatRelativeTime(conversation.updatedAt)}
            </span>
          </div>
        )}

        {/* Content area with tabs-like sections */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full p-4">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-destructive p-4">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>Failed to load messages</p>
              <p className="text-sm text-muted-foreground">
                {(error as Error).message}
              </p>
            </div>
          ) : (
            <>
              {/* Files Section */}
              {data?.files && data.files.length > 0 && (
                <div className="border-b border-border">
                  <div className="px-4 py-3 bg-muted/30 flex items-center justify-between">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <File className="h-4 w-4" />
                      Files ({data.files.length})
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {data.files.filter(f => f.downloadUrl).length} downloadable
                    </span>
                  </div>
                  <div className="p-3 space-y-2">
                    {data.files.map((file: ConversationFile) => (
                      <FileItem key={file.path} file={file} />
                    ))}
                  </div>
                </div>
              )}

              {/* Messages Section */}
              <div className="p-4 space-y-4">
                {data?.messages?.length ? (
                  data.messages.map((message: Message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))
                ) : (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    No messages in this conversation
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FileItem({ file }: { file: ConversationFile }) {
  const filename = file.path.split("/").pop() || file.path;
  const typeInfo = getFileTypeInfo(file.path, file.isBinary);
  
  const handleDownload = () => {
    if (file.downloadUrl) {
      // Construct full URL with API base
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const fullUrl = file.downloadUrl.startsWith("http") 
        ? file.downloadUrl 
        : `${baseUrl}${file.downloadUrl}`;
      window.open(fullUrl, "_blank");
    }
  };

  // Determine badge color based on category
  const getBadgeVariant = (category: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (category) {
      case "Document": return "default";
      case "Spreadsheet": return "secondary";
      case "Code": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        {/* File icon with color */}
        <div className={cn("shrink-0", typeInfo.color)}>
          {typeInfo.icon}
        </div>
        
        <div className="min-w-0 flex-1">
          {/* Filename */}
          <p className="text-sm font-medium truncate" title={filename}>
            {filename}
          </p>
          
          {/* File metadata */}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {/* File type badge */}
            <Badge 
              variant={getBadgeVariant(typeInfo.category)} 
              className="text-[10px] px-1.5 py-0 h-4"
            >
              {typeInfo.label}
            </Badge>
            
            {/* Language badge (if different from type) */}
            {file.language && file.language.toLowerCase() !== typeInfo.label.toLowerCase() && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {file.language}
              </Badge>
            )}
            
            {/* File size */}
            {file.fileSize && file.fileSize > 0 && (
              <span className="text-xs text-muted-foreground">
                {formatBytes(file.fileSize)}
              </span>
            )}
            
            {/* Update time */}
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(file.updatedAt)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Download button */}
      {file.downloadUrl && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
          onClick={handleDownload}
          title={`Download ${filename}`}
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const role = message.role as "user" | "assistant" | "system";
  const colors = roleColors[role] || roleColors.assistant;

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <RoleAvatar role={role}>
          {isSystem ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </RoleAvatar>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          colors.bg,
          colors.text
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium opacity-70">
            {message.role.charAt(0).toUpperCase() + message.role.slice(1)}
          </span>
          <span className="text-xs opacity-50">
            {formatRelativeTime(message.createdAt)}
          </span>
        </div>
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content || (
            <span className="italic opacity-50">(empty message)</span>
          )}
        </div>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <span className="text-xs font-medium opacity-70">
              Tool Calls: {message.toolCalls.length}
            </span>
            <div className="mt-1 space-y-1">
              {message.toolCalls.map((tool) => (
                <div
                  key={tool.id}
                  className="text-xs bg-background/50 rounded px-2 py-1"
                >
                  <span className="font-mono">{tool.name}</span>
                  <Badge
                    variant={
                      tool.status === "success"
                        ? "success"
                        : tool.status === "error"
                        ? "destructive"
                        : "secondary"
                    }
                    className="ml-2 text-[10px]"
                  >
                    {tool.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <RoleAvatar role="user">
          <User className="h-4 w-4" />
        </RoleAvatar>
      )}
    </div>
  );
}
