"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = React.ComponentProps<typeof Input> & {
  toggleLabel?: string;
};

function inferAutocomplete(nameOrId?: string) {
  const value = (nameOrId || "").toLowerCase();
  if (value.includes("confirm") || value.includes("new")) return "new-password";
  return "current-password";
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, toggleLabel = "Toggle password visibility", ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const innerRef = React.useRef<HTMLInputElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        innerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    const toggleVisibility = React.useCallback(() => {
      const input = innerRef.current;
      const selectionStart = input?.selectionStart ?? null;
      const selectionEnd = input?.selectionEnd ?? null;

      setVisible((current) => !current);

      requestAnimationFrame(() => {
        if (!input) return;
        input.focus({ preventScroll: true });
        if (selectionStart !== null && selectionEnd !== null) {
          input.setSelectionRange(selectionStart, selectionEnd);
        }
      });
    }, []);

    return (
      <div className="relative">
        <Input
          {...props}
          ref={setRefs}
          type={visible ? "text" : "password"}
          autoComplete={props.autoComplete ?? inferAutocomplete(props.name ?? props.id?.toString())}
          className={cn("pr-11", className)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={toggleVisibility}
          aria-label={toggleLabel}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
