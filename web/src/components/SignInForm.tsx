import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="flex flex-col gap-6 w-80 mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">LifeManga</h1>
        <p className="text-slate-400">将你的照片变成漫画</p>
      </div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          formData.set("flow", flow);
          setIsSubmitting(true);
          void signIn("password", formData)
            .catch((err: Error) => {
              setError(err.message);
            })
            .finally(() => {
              setIsSubmitting(false);
            });
        }}
      >
        <input
          className="px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
          type="email"
          name="email"
          placeholder="邮箱"
          aria-label="邮箱"
          required
          autoComplete="email"
        />
        <input
          className="px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
          type="password"
          name="password"
          placeholder="密码"
          aria-label="密码"
          required
          autoComplete={flow === "signIn" ? "current-password" : "new-password"}
        />
        <button
          className="w-full py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "..." : flow === "signIn" ? "登录" : "注册"}
        </button>
        <button
          type="button"
          onClick={() => {
            setFlow(flow === "signIn" ? "signUp" : "signIn");
            setError(null);
          }}
          className="text-sm text-slate-400 hover:text-indigo-500"
        >
          {flow === "signIn" ? "没有账户？注册" : "已有账户？登录"}
        </button>
        {error && (
          <div
            role="alert"
            className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </form>
    </div>
  );
}
