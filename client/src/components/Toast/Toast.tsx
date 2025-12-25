import { toast, Toast } from "react-hot-toast";

interface CustomToastProps {
  t: Toast;
  title: string;
  message?: string;
  type?: "success" | "error" | "info";
}

const bgMap = {
  success: "bg-green-500",
  error: "bg-red-500",
  info: "bg-blue-500",
};

export const CustomToast = ({
  t,
  title,
  message,
  type = "info",
}: CustomToastProps) => {
  return (
    <div
      className={`
        ${bgMap[type]}
        text-white
        px-4
        py-3
        rounded-lg
        shadow-lg
        flex
        items-start
        gap-3
        min-w-70
        animate-enter
      `}
    >
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        {message && <p className="text-sm opacity-90">{message}</p>}
      </div>

      <button
        onClick={() => toast.dismiss(t.id)}
        className="text-white/80 hover:text-white text-xl cusror-pointer ml-4"
      >
        ✕
      </button>
    </div>
  );
};
