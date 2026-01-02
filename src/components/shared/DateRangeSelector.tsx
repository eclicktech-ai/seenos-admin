import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export interface DateRangeOption {
  value: number;
  label: string;
}

export interface CustomDateRange {
  startDate: string;
  endDate: string;
}

export const DEFAULT_DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { value: 7, label: "7D" },
  { value: 30, label: "30D" },
  { value: 90, label: "90D" },
  { value: 365, label: "1Y" },
];

interface DateRangeSelectorProps {
  value: number;
  onChange: (days: number) => void;
  onCustomRangeChange?: (range: CustomDateRange) => void;
  customRange?: CustomDateRange | null;
  options?: DateRangeOption[];
  showIcon?: boolean;
  showCustom?: boolean;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function DateRangeSelector({
  value,
  onChange,
  onCustomRangeChange,
  customRange,
  options = DEFAULT_DATE_RANGE_OPTIONS,
  showIcon = false,
  showCustom = true,
  label,
  size = "sm",
  className = "",
}: DateRangeSelectorProps) {
  const { t } = useI18n();
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(
    customRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [tempEndDate, setTempEndDate] = useState(
    customRange?.endDate || new Date().toISOString().split("T")[0]
  );
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const buttonSizeClass = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm";
  const isCustomActive = customRange !== null && customRange !== undefined;

  // Update dropdown position when opening - ensure it stays within viewport
  useEffect(() => {
    if (showCustomPicker && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownWidth = 480; // Approximate width of dropdown
      const viewportWidth = window.innerWidth;
      const padding = 16; // Padding from edge
      
      // Calculate left position, ensuring dropdown doesn't overflow right edge
      let left = rect.left;
      if (left + dropdownWidth > viewportWidth - padding) {
        // Align to right edge of container instead
        left = Math.max(padding, rect.right - dropdownWidth);
      }
      
      setDropdownPosition({
        top: rect.bottom + 8,
        left: left,
      });
    }
  }, [showCustomPicker]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setShowCustomPicker(false);
      }
    };
    if (showCustomPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCustomPicker]);

  const handlePresetClick = (days: number) => {
    setShowCustomPicker(false);
    onChange(days);
  };

  const handleCustomApply = () => {
    if (onCustomRangeChange && tempStartDate && tempEndDate) {
      onCustomRangeChange({ startDate: tempStartDate, endDate: tempEndDate });
      setShowCustomPicker(false);
    }
  };

  const handleClearCustom = () => {
    if (onCustomRangeChange) {
      // Reset to default preset
      onChange(30);
    }
  };

  return (
    <div className={`relative flex items-center gap-2 ${className}`} ref={containerRef}>
      {showIcon && <Calendar className="h-4 w-4 text-muted-foreground" />}
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <div className="flex gap-1 flex-wrap items-center">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handlePresetClick(option.value)}
            className={`${buttonSizeClass} rounded font-medium cursor-pointer select-none transition-all duration-150 ${
              value === option.value && !isCustomActive
                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/80 active:scale-95"
                : "bg-muted hover:bg-accent hover:text-accent-foreground active:bg-accent/80 active:scale-95"
            }`}
          >
            {option.label}
          </button>
        ))}
        {showCustom && onCustomRangeChange && (
          <div className="relative">
            <button
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className={`${buttonSizeClass} rounded font-medium cursor-pointer select-none transition-all duration-150 flex items-center gap-1 ${
                isCustomActive
                  ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/80 active:scale-95"
                  : "bg-muted hover:bg-accent hover:text-accent-foreground active:bg-accent/80 active:scale-95"
              }`}
            >
              {isCustomActive
                ? `${customRange.startDate.slice(5)} ~ ${customRange.endDate.slice(5)}`
                : t("dateRange.custom")}
              <ChevronDown className={`h-3 w-3 transition-transform ${showCustomPicker ? "rotate-180" : ""}`} />
            </button>
            {isCustomActive && (
              <button
                onClick={handleClearCustom}
                className="absolute -right-1.5 -top-1.5 p-0.5 bg-muted rounded-full cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-all duration-150 active:scale-90"
                title="Clear custom range"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Inline dropdown panel - use fixed positioning to avoid overflow issues */}
      {showCustomPicker && (
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] p-4 rounded-lg border border-border shadow-xl date-picker-dropdown"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">{t("dateRange.from")}</label>
              <input
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                className="px-2 py-1.5 text-sm rounded border border-input bg-background w-[130px] cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">{t("dateRange.to")}</label>
              <input
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                className="px-2 py-1.5 text-sm rounded border border-input bg-background w-[130px] cursor-pointer"
              />
            </div>
            <button
              onClick={handleCustomApply}
              className="px-3 py-1.5 text-xs rounded font-medium cursor-pointer select-none bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md active:bg-primary/80 active:scale-95 transition-all duration-150"
            >
              {t("common.apply")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

