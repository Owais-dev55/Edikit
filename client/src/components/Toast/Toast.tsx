import { toast, Toast } from "react-hot-toast";
import type { CSSProperties } from "react";

interface CustomToastProps {
  t: Toast;
  title: string;
  message?: string;
  type?: "success" | "error" | "info";
  style?: CSSProperties;
  iconTheme?: {
    primary: string;
    secondary: string;
  };
}

const bgMap = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-blue-600",
};

export const CustomToast = ({
  t,
  title,
  message,
  type = "info",
  style,
  iconTheme,
}: CustomToastProps) => {
  const defaultStyle: CSSProperties = {};

  const defaultIconTheme = {
    primary: "#713200",
    secondary: "#FFFAEE",
  };

  const mergedStyle = { ...defaultStyle, ...(style || {}) };
  const mergedIconTheme = { ...defaultIconTheme, ...(iconTheme || {}) };

  return (
    <div
      className={`
        ${bgMap[type]} text-white ring-1 ring-white/20
        p-4 rounded-lg shadow-lg transform transition-all duration-1200 ease-out
        ${t?.visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-24 scale-95"}
      `}
      style={mergedStyle}
    >
      <div className="flex items-start gap-3">
        {type !== "success" && (
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 bg-white/20 text-white border border-white/40"
          >
            <span className="text-xs font-bold">
              {type === "error" ? "!" : "i"}
            </span>
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold">{title}</p>
          {message && <p className="text-sm opacity-90">{message}</p>}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="ml-3 shrink-0 rounded-full h-6 w-6 flex items-center justify-center text-white/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
          aria-label="Dismiss toast"
        >
          <span aria-hidden="true" className="text-base leading-none">×</span>
        </button>
      </div>
    </div>
  );
};
