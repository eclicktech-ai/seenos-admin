import { useQuery } from "@tanstack/react-query";
import Markdown from "react-markdown";
import {
  ThumbsUp,
  ThumbsDown,
  User,
  Bot,
  Wrench,
  MessageSquare,
  Cpu,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { feedbackApi } from "@/api/feedback";
import { formatRelativeTime, cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { FeedbackDetail, ConversationMessage } from "@/types/feedback";

// Markdown component styles
const markdownComponents = {
  // Style tables
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full text-xs border-collapse border border-border" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-muted/50" {...props}>{children}</thead>
  ),
  th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="border border-border px-2 py-1 text-left font-medium" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="border border-border px-2 py-1" {...props}>{children}</td>
  ),
  // Style code blocks
  code: ({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) => {
    const isInline = !className;
    return isInline ? (
      <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
    ) : (
      <code className="block bg-muted p-2 rounded text-xs font-mono overflow-x-auto my-2" {...props}>{children}</code>
    );
  },
  pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre className="bg-muted rounded overflow-x-auto my-2" {...props}>{children}</pre>
  ),
  // Style lists
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-inside my-1 space-y-0.5" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-inside my-1 space-y-0.5" {...props}>{children}</ol>
  ),
  // Style paragraphs
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="my-1" {...props}>{children}</p>
  ),
  // Style headings
  h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-base font-bold my-2" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-sm font-bold my-2" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-sm font-semibold my-1" {...props}>{children}</h3>
  ),
  // Style blockquotes
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="border-l-2 border-muted-foreground/30 pl-3 my-2 italic text-muted-foreground" {...props}>{children}</blockquote>
  ),
  // Style links
  a: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
  ),
};

interface FeedbackDetailDrawerProps {
  feedbackId: string | null;
  onClose: () => void;
}

export function FeedbackDetailDrawer({
  feedbackId,
  onClose,
}: FeedbackDetailDrawerProps) {
  const { t } = useI18n();

  const { data: detail, isLoading, error } = useQuery({
    queryKey: ["feedback-detail", feedbackId],
    queryFn: () => feedbackApi.getDetail(feedbackId!),
    enabled: !!feedbackId,
  });

  const isOpen = !!feedbackId;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="sm:max-w-xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t("feedback.details")}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full p-4">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-destructive p-4">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>Failed to load feedback detail</p>
              <p className="text-sm text-muted-foreground">
                {(error as Error).message}
              </p>
            </div>
          ) : detail ? (
            <div className="space-y-6 p-6">
              {/* Feedback Info */}
              <FeedbackInfoSection detail={detail} t={t} />

              {/* Model Info */}
              <ModelInfoSection detail={detail} t={t} />

              {/* User Input */}
              {detail.userInput && (
                <UserInputSection input={detail.userInput} t={t} />
              )}

              {/* Assistant Output */}
              {detail.assistantOutput && (
                <AssistantOutputSection output={detail.assistantOutput} t={t} />
              )}

              {/* Tools Used */}
              {detail.toolCallsUsed && detail.toolCallsUsed.length > 0 && (
                <ToolsUsedSection tools={detail.toolCallsUsed} t={t} />
              )}

              {/* Conversation History */}
              {detail.conversationHistory && detail.conversationHistory.length > 0 && (
                <ConversationHistorySection
                  history={detail.conversationHistory}
                  t={t}
                />
              )}

              {/* IDs Section */}
              <IDsSection detail={detail} />
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Feedback Info Section
function FeedbackInfoSection({
  detail,
  t,
}: {
  detail: FeedbackDetail;
  t: (key: string) => string;
}) {
  const isLike = detail.feedbackType === "like";

  return (
    <section>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        {t("feedback.reason")}
      </h3>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {isLike ? (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <ThumbsUp className="w-3 h-3 mr-1" />
              {t("feedback.likeCount")}
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <ThumbsDown className="w-3 h-3 mr-1" />
              {t("feedback.dislikeCount")}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(detail.createdAt)}
          </span>
        </div>
        <div
          className={cn(
            "p-4 rounded-lg",
            isLike
              ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900"
              : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{detail.reason}</p>
        </div>
      </div>
    </section>
  );
}

// Model Info Section
function ModelInfoSection({
  detail,
  t,
}: {
  detail: FeedbackDetail;
  t: (key: string) => string;
}) {
  return (
    <section className="border-t border-border pt-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <Cpu className="h-4 w-4" />
        {t("config.model")}
      </h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">{t("config.model")}:</span>
          <code className="ml-2 bg-muted px-1.5 py-0.5 rounded text-xs">
            {detail.modelName || "-"}
          </code>
        </div>
        {detail.modelVersion && (
          <div>
            <span className="text-muted-foreground">Version:</span>
            <span className="ml-2">{detail.modelVersion}</span>
          </div>
        )}
        {detail.tokenUsage && (
          <>
            <div>
              <span className="text-muted-foreground">Input Tokens:</span>
              <span className="ml-2 font-mono">
                {detail.tokenUsage.promptTokens.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Output Tokens:</span>
              <span className="ml-2 font-mono">
                {detail.tokenUsage.completionTokens.toLocaleString()}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// User Input Section
function UserInputSection({
  input,
  t,
}: {
  input: string;
  t: (key: string) => string;
}) {
  return (
    <section className="border-t border-border pt-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <User className="h-4 w-4" />
        {t("feedback.userInput")}
      </h3>
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4 rounded-lg">
        <p className="text-sm whitespace-pre-wrap">{input}</p>
      </div>
    </section>
  );
}

// Assistant Output Section
function AssistantOutputSection({
  output,
  t,
}: {
  output: string;
  t: (key: string) => string;
}) {
  return (
    <section className="border-t border-border pt-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <Bot className="h-4 w-4" />
        {t("feedback.assistantOutput")}
      </h3>
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-4 rounded-lg max-h-[400px] overflow-y-auto">
        <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
          <Markdown components={markdownComponents}>{output}</Markdown>
        </div>
      </div>
    </section>
  );
}

// Tools Used Section
function ToolsUsedSection({
  tools,
  t,
}: {
  tools: Array<{ name: string; type: string; status: string }>;
  t: (key: string) => string;
}) {
  return (
    <section className="border-t border-border pt-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <Wrench className="h-4 w-4" />
        {t("feedback.toolsUsed")}
      </h3>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool, idx) => (
          <Badge
            key={idx}
            variant={
              tool.status === "success"
                ? "default"
                : tool.status === "error"
                ? "destructive"
                : "secondary"
            }
            className="gap-1"
          >
            <Wrench className="h-3 w-3" />
            {tool.name}
            <span className="text-[10px] opacity-70">({tool.status})</span>
          </Badge>
        ))}
      </div>
    </section>
  );
}

// Conversation History Section
function ConversationHistorySection({
  history,
  t,
}: {
  history: ConversationMessage[];
  t: (key: string) => string;
}) {
  return (
    <section className="border-t border-border pt-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        {t("feedback.conversationHistory")} ({history.length})
      </h3>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {history.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "p-3 rounded-lg text-sm",
              msg.role === "user"
                ? "bg-blue-50 dark:bg-blue-950/20 ml-4"
                : msg.role === "system"
                ? "bg-gray-100 dark:bg-gray-800/50"
                : "bg-muted mr-4"
            )}
          >
            <span className="text-xs text-muted-foreground block mb-1 capitalize flex items-center gap-1">
              {msg.role === "user" ? (
                <User className="h-3 w-3" />
              ) : msg.role === "assistant" ? (
                <Bot className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {msg.role}
            </span>
            <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-6">
              <Markdown components={markdownComponents}>{msg.content}</Markdown>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// IDs Section (for debugging)
function IDsSection({ detail }: { detail: FeedbackDetail }) {
  return (
    <section className="border-t border-border pt-6 text-xs text-muted-foreground space-y-1">
      <div className="font-mono">Feedback ID: {detail.id || "-"}</div>
      <div className="font-mono">Message ID: {detail.messageId || "-"}</div>
      <div className="font-mono">User ID: {detail.userId || "-"}</div>
      {detail.projectId && (
        <div className="font-mono">Project ID: {detail.projectId}</div>
      )}
    </section>
  );
}
