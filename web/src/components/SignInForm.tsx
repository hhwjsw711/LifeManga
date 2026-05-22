import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Button } from "./Button";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="flex flex-col gap-6 w-80 mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">漫画人生</h1>
        <p className="text-ink-muted">将你的照片变成漫画</p>
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
          className="px-4 py-3 border-2 border-cream-dark dark:border-ink-light rounded-card bg-transparent focus:outline-none focus:border-ember transition-colors"
          type="email"
          name="email"
          placeholder="邮箱"
          aria-label="邮箱"
          required
          autoComplete="email"
        />
        <input
          className="px-4 py-3 border-2 border-cream-dark dark:border-ink-light rounded-card bg-transparent focus:outline-none focus:border-ember transition-colors"
          type="password"
          name="password"
          placeholder="密码"
          aria-label="密码"
          required
          autoComplete={flow === "signIn" ? "current-password" : "new-password"}
        />
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={isSubmitting}
        >
          {isSubmitting ? "..." : flow === "signIn" ? "登录" : "注册"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setFlow(flow === "signIn" ? "signUp" : "signIn");
            setError(null);
          }}
          className="text-sm text-ink-muted hover:text-ember transition-colors"
        >
          {flow === "signIn" ? "没有账户？注册" : "已有账户？登录"}
        </button>
        {error && (
          <div
            role="alert"
            className="p-3 bg-error/8 dark:bg-error/20 border border-error/30 dark:border-error/50 rounded-card"
          >
            <p className="text-xs text-error">{error}</p>
          </div>
        )}
      </form>
    </div>
  );
}
