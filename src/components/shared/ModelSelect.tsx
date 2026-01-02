import { useQuery } from "@tanstack/react-query";
import { Cpu, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { modelsApi } from "@/api/config";
import type { ProviderModels } from "@/types";

// Special value for "Use Default" option (Radix doesn't allow empty string)
const DEFAULT_VALUE = "__use_default__";

// Provider icons mapping
const providerIcons: Record<string, string> = {
  azure: "🔷",
  anthropic: "🟠",
  google: "🔴",
  perplexity: "🟣",
  aws: "🟡",
  openai: "🟢",
};

interface ModelSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Show "Use Default" option */
  showDefault?: boolean;
  /** Label for the default option */
  defaultLabel?: string;
}

/**
 * Model selector component with provider grouping
 * Fetches available models from the API and displays them grouped by provider
 */
export function ModelSelect({
  value,
  onValueChange,
  placeholder = "Select model...",
  disabled = false,
  className,
  showDefault = true,
  defaultLabel = "Use Default",
}: ModelSelectProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["models", "grouped"],
    queryFn: () => modelsApi.grouped(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const providers = data?.providers || [];

  // Convert between internal value (empty string) and select value (special token)
  const selectValue = value === "" ? DEFAULT_VALUE : value;
  
  const handleValueChange = (newValue: string) => {
    // Convert special token back to empty string
    onValueChange(newValue === DEFAULT_VALUE ? "" : newValue);
  };

  // Get display text for selected value
  const getDisplayText = (modelId: string): string => {
    if (!modelId || modelId === DEFAULT_VALUE) return defaultLabel;
    
    for (const provider of providers) {
      const model = provider.models.find((m) => m.id === modelId);
      if (model) {
        return model.name;
      }
    }
    
    // Fallback: show the ID itself
    return modelId;
  };

  if (isLoading) {
    return (
      <div className={`flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading models...</span>
      </div>
    );
  }

  if (isError || providers.length === 0) {
    return (
      <div className={`flex h-9 items-center gap-2 rounded-md border border-destructive/50 bg-background px-3 ${className}`}>
        <Cpu className="h-4 w-4 text-destructive" />
        <span className="text-sm text-destructive">Failed to load models</span>
      </div>
    );
  }

  return (
    <Select value={selectValue} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue>
          {selectValue ? getDisplayText(selectValue) : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {/* Default option */}
        {showDefault && (
          <>
            <SelectItem value={DEFAULT_VALUE}>
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">⚙️</span>
                <span>{defaultLabel}</span>
              </span>
            </SelectItem>
            <SelectSeparator />
          </>
        )}

        {/* Provider groups */}
        {providers.map((provider: ProviderModels, index: number) => (
          <div key={provider.providerId}>
            {index > 0 && <SelectSeparator />}
            <SelectGroup>
              <SelectLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <span>{providerIcons[provider.icon] || "🔹"}</span>
                <span>{provider.providerName}</span>
              </SelectLabel>
              {provider.models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    {model.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {model.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Compact model selector - shows only model name, no description
 */
export function ModelSelectCompact({
  value,
  onValueChange,
  placeholder = "Select model...",
  disabled = false,
  className,
  showDefault = true,
  defaultLabel = "Default",
}: ModelSelectProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["models", "grouped"],
    queryFn: () => modelsApi.grouped(),
    staleTime: 5 * 60 * 1000,
  });

  const providers = data?.providers || [];

  // Convert between internal value (empty string) and select value (special token)
  const selectValue = value === "" ? DEFAULT_VALUE : value;
  
  const handleValueChange = (newValue: string) => {
    onValueChange(newValue === DEFAULT_VALUE ? "" : newValue);
  };

  const getDisplayText = (modelId: string): string => {
    if (!modelId || modelId === DEFAULT_VALUE) return defaultLabel;
    for (const provider of providers) {
      const model = provider.models.find((m) => m.id === modelId);
      if (model) return model.name;
    }
    return modelId;
  };

  if (isLoading) {
    return (
      <div className={`flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Select value={selectValue} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue>
          {selectValue ? getDisplayText(selectValue) : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {showDefault && (
          <>
            <SelectItem value={DEFAULT_VALUE}>
              <span className="text-muted-foreground">{defaultLabel}</span>
            </SelectItem>
            <SelectSeparator />
          </>
        )}
        {providers.map((provider: ProviderModels, index: number) => (
          <div key={provider.providerId}>
            {index > 0 && <SelectSeparator />}
            <SelectGroup>
              <SelectLabel className="text-xs text-muted-foreground">
                {providerIcons[provider.icon] || "🔹"} {provider.providerName}
              </SelectLabel>
              {provider.models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}

