import { Globe } from "lucide-react";
import { useI18n, languages, type Language } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageSwitcherProps {
  className?: string;
  showIcon?: boolean;
  compact?: boolean;
}

export function LanguageSwitcher({
  className = "",
  showIcon = true,
  compact = false,
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useI18n();

  const currentLang = languages.find((l) => l.code === language);

  return (
    <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
      <SelectTrigger className={`${compact ? "w-[80px]" : "w-[120px]"} ${className}`}>
        {showIcon && <Globe className="h-4 w-4 mr-2 text-muted-foreground" />}
        <SelectValue>
          {compact ? currentLang?.code.toUpperCase() : currentLang?.nativeName}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <div className="flex items-center gap-2">
              <span>{lang.nativeName}</span>
              {!compact && (
                <span className="text-xs text-muted-foreground">({lang.name})</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

