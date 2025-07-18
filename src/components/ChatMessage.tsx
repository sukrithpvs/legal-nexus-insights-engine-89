
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Eye, User, Bot, ChevronDown, ChevronRight, Brain } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Source {
  document: string;
  pages: number[];
  chunks: number;
  max_score: number;
  file_path?: string;
  downloadable?: boolean;
}

interface ChatMessageProps {
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Source[];
  queryType?: string;
  intent?: string;
  onSourceClick?: (source: Source) => void;
}

export function ChatMessage({ 
  type, 
  content, 
  timestamp, 
  sources = [], 
  queryType, 
  intent, 
  onSourceClick 
}: ChatMessageProps) {
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  // Extract thinking content and main content
  const parseContent = (text: string) => {
    const thinkingMatch = text.match(/<think>([\s\S]*?)<\/think>/);
    let thinkingContent = '';
    let mainContent = text;

    if (thinkingMatch) {
      thinkingContent = thinkingMatch[1].trim();
      mainContent = text.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    }

    return { thinkingContent, mainContent };
  };

  // Clean the content by removing references, confidence scores, and technical metadata
  const cleanContent = (text: string) => {
    let cleaned = text;
    
    // Remove reference citations like [1], [2], etc.
    cleaned = cleaned.replace(/\[\d+\]/g, '');
    
    // Remove confidence and page references like "(Page 0, Confidence: 0.00)"
    cleaned = cleaned.replace(/\(Page \d+[^)]*Confidence[^)]*\)/g, '');
    
    // Remove sections and confidence info like "(3 sections, confidence: 7.00)"
    cleaned = cleaned.replace(/\(\d+\s+sections?,\s+confidence:\s+[\d.]+\)/g, '');
    
    // Remove asterisks from document names and numbers
    cleaned = cleaned.replace(/\*\*/g, '');
    
    // Remove "References:" section and everything after it
    const referencesIndex = cleaned.indexOf('References:');
    if (referencesIndex !== -1) {
      cleaned = cleaned.substring(0, referencesIndex);
    }
    
    // Remove "**Maximum Recall Validated Sources:**" section and everything after it
    const sourcesIndex = cleaned.indexOf('Maximum Recall Validated Sources:');
    if (sourcesIndex !== -1) {
      cleaned = cleaned.substring(0, sourcesIndex);
    }
    
    // Remove "📊 Maximum Recall Summary:" section and everything after it
    const summaryIndex = cleaned.indexOf('📊 Maximum Recall Summary:');
    if (summaryIndex !== -1) {
      cleaned = cleaned.substring(0, summaryIndex);
    }
    
    // Remove "📚 Sources Referenced from Collection" section and everything after it
    const sourcesRefIndex = cleaned.indexOf('📚 Sources Referenced from Collection');
    if (sourcesRefIndex !== -1) {
      cleaned = cleaned.substring(0, sourcesRefIndex);
    }
    
    // Remove "*Total sources consulted:" section and everything after it
    const totalSourcesIndex = cleaned.indexOf('*Total sources consulted:');
    if (totalSourcesIndex !== -1) {
      cleaned = cleaned.substring(0, totalSourcesIndex);
    }
    
    // Clean up extra whitespace and line breaks
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleaned = cleaned.trim();
    
    return cleaned;
  };

  // Convert markdown formatting to JSX elements
  const formatContent = (text: string) => {
    const lines = text.split('\n');
    const formattedLines: JSX.Element[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('### ')) {
        // H3 headers
        formattedLines.push(
          <h3 key={i} className="text-base font-semibold mt-4 mb-2 text-foreground">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        // H2 headers
        formattedLines.push(
          <h2 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        // H1 headers
        formattedLines.push(
          <h1 key={i} className="text-xl font-bold mt-4 mb-3 text-foreground">
            {line.replace('# ', '')}
          </h1>
        );
      } else if (line.startsWith('- ')) {
        // Bullet points
        formattedLines.push(
          <div key={i} className="ml-4 mb-1">
            <span className="text-muted-foreground mr-2">•</span>
            {line.replace('- ', '')}
          </div>
        );
      } else if (line.trim() === '') {
        // Empty lines for spacing
        formattedLines.push(<div key={i} className="h-2" />);
      } else {
        // Regular text
        formattedLines.push(
          <p key={i} className="mb-2 leading-relaxed">
            {line}
          </p>
        );
      }
    }
    
    return formattedLines;
  };

  const { thinkingContent, mainContent } = type === 'assistant' ? parseContent(content) : { thinkingContent: '', mainContent: content };
  const displayContent = type === 'assistant' ? cleanContent(mainContent) : mainContent;

  return (
    <div className={`flex gap-3 ${type === 'user' ? 'justify-end' : 'justify-start'}`}>
      {type === 'assistant' && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      
      <div className={`flex flex-col gap-2 max-w-[80%] ${type === 'user' ? 'items-end' : 'items-start'}`}>
        <Card className={`p-4 ${type === 'user' ? 'bg-primary text-primary-foreground ml-12' : 'bg-muted'}`}>
          <div className="space-y-3">
            {/* Thinking Process - Collapsible (for assistant messages only) */}
            {type === 'assistant' && thinkingContent && (
              <Collapsible open={isThinkingOpen} onOpenChange={setIsThinkingOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-2 h-auto text-xs text-muted-foreground hover:bg-background/50">
                    <Brain className="h-3 w-3 mr-2" />
                    <span>Show AI thinking process</span>
                    {isThinkingOpen ? (
                      <ChevronDown className="h-3 w-3 ml-auto" />
                    ) : (
                      <ChevronRight className="h-3 w-3 ml-auto" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="p-3 bg-background/50 rounded border-l-2 border-primary/20">
                    <div className="text-xs text-muted-foreground mb-2 font-medium">AI Reasoning:</div>
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {thinkingContent}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Main Message Content */}
            <div className="text-sm leading-relaxed">
              {type === 'assistant' ? formatContent(displayContent) : displayContent}
            </div>
            
            {/* Sources - Only show if available and not empty */}
            {type === 'assistant' && sources && sources.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="text-xs font-medium text-muted-foreground">
                  Sources ({sources.length}):
                </div>
                <div className="space-y-2">
                  {sources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 p-2 bg-background/50 rounded text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">
                          {source.document}
                        </span>
                        {source.pages && source.pages.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {source.pages.join(', ')}
                          </Badge>
                        )}
                      </div>
                      {onSourceClick && (
                        <Button
                          variant="ghost"  
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => onSourceClick(source)}
                          title="View PDF"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
        
        {/* Timestamp */}
        <div className="text-xs text-muted-foreground px-1">
          {formatTimestamp(timestamp)}
        </div>
      </div>
      
      {type === 'user' && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="h-4 w-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
}
