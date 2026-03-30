import type { ChangeEventHandler, PropsWithChildren, ReactElement, ReactNode } from "react";

type SectionTitleProps = {
  title: string;
  subtitle?: string;
};

type ButtonProps = {
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  tone?: "primary" | "secondary";
};

type TextFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  type?: "text" | "email" | "password";
  required?: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

type SelectFieldProps = {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: ChangeEventHandler<HTMLSelectElement>;
};

type StatusBadgeProps = {
  tone: "ready" | "muted";
  children: ReactNode;
};

export function AppShell({ children }: PropsWithChildren): ReactElement {
  return (
    <main
      style={{
        width: "min(1120px, calc(100vw - 32px))",
        margin: "0 auto",
        padding: "64px 0 96px",
      }}
    >
      {children}
    </main>
  );
}

export function SectionTitle({ title, subtitle }: SectionTitleProps): ReactElement {
  return (
    <header style={{ display: "grid", gap: 6 }}>
      <h2 style={{ margin: 0, fontSize: "1.6rem" }}>{title}</h2>
      {subtitle ? <p style={{ margin: 0, color: "#6b6256" }}>{subtitle}</p> : null}
    </header>
  );
}

export function PlaceholderCard({
  heading,
  children,
}: PropsWithChildren<{ heading: ReactNode }>): ReactElement {
  return (
    <section
      style={{
        padding: 20,
        borderRadius: 20,
        border: "1px solid rgba(47, 43, 35, 0.12)",
        background: "rgba(255, 255, 255, 0.72)",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{heading}</h3>
      <div>{children}</div>
    </section>
  );
}

export function Button({
  children,
  type = "button",
  disabled = false,
  onClick,
  tone = "primary",
}: ButtonProps): ReactElement {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        appearance: "none",
        border: "none",
        borderRadius: 999,
        padding: "12px 18px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        background: tone === "primary" ? "#0f766e" : "rgba(15, 118, 110, 0.12)",
        color: tone === "primary" ? "#f8fafc" : "#0f766e",
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}

export function TextField({
  label,
  value,
  placeholder,
  type = "text",
  required = false,
  onChange,
}: TextFieldProps): ReactElement {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 16,
          border: "1px solid rgba(47, 43, 35, 0.14)",
          background: "rgba(255, 255, 255, 0.92)",
          color: "#201b16",
        }}
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps): ReactElement {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <select
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 16,
          border: "1px solid rgba(47, 43, 35, 0.14)",
          background: "rgba(255, 255, 255, 0.92)",
          color: "#201b16",
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function StatusBadge({ tone, children }: StatusBadgeProps): ReactElement {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        background: tone === "ready" ? "rgba(15, 118, 110, 0.14)" : "rgba(32, 27, 22, 0.08)",
        color: tone === "ready" ? "#0f766e" : "#6b6256",
        fontSize: "0.85rem",
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}
