"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { routes } from "@/lib/routes";

const bricolage = "var(--font-bricolage), 'Bricolage Grotesque', sans-serif";
const hanken = "var(--font-hanken), 'Hanken Grotesk', system-ui, sans-serif";

const formSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres"),
});

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const response = await api.post(routes.api.auth.login(), values);
      const { access_token, user } = response.data;

      setAuth(user, access_token);
      toast.success("¡Bienvenido a Mirador!");
      router.push(routes.dashboard.home());
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string | string[] } };
      };
      const rawMessage = err.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage[0]
        : rawMessage || "Credenciales inválidas. Intenta nuevamente.";

      setErrorMsg(message);
      toast.error(message);
      form.reset({ username: "", password: "" });
    } finally {
      setIsLoading(false);
    }
  }

  const inlineError =
    form.formState.errors.username?.message ||
    form.formState.errors.password?.message ||
    errorMsg;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        fontFamily: hanken,
        color: "#1E251A",
        background: "#F3EFE4",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* Left brand panel */}
      <div
        style={{
          position: "relative",
          flex: "none",
          width: "48%",
          minWidth: 380,
          background:
            "linear-gradient(165deg,#1C3A27 0%,#102017 60%,#0C1A12 100%)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "46px 48px",
        }}
        className="hidden md:flex"
      >
        <svg
          viewBox="0 0 600 800"
          preserveAspectRatio="xMidYMax slice"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0.18,
            pointerEvents: "none",
          }}
        >
          <g fill="none" stroke="#C2683E" strokeWidth={1.4}>
            <path d="M-40,560 C120,470 240,660 380,560 C480,490 560,560 660,510" />
            <path d="M-40,620 C120,530 240,720 380,620 C480,550 560,620 660,570" />
            <path d="M-40,680 C120,590 240,780 380,680 C480,610 560,680 660,630" />
          </g>
          <g fill="none" stroke="#7FA88A" strokeWidth={1.2}>
            <path d="M-40,470 C120,380 240,570 380,470 C480,400 560,470 660,420" />
            <path d="M-40,420 C120,330 240,520 380,420 C480,350 560,420 660,370" />
            <path d="M-40,370 C120,280 240,470 380,370 C480,300 560,370 660,320" />
          </g>
        </svg>

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              flex: "none",
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "linear-gradient(150deg,#C2683E,#A8552F)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(168,85,47,0.4)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="16.5" cy="7" r="2.6" fill="#F6E2C8" />
              <path d="M2 19 L8.5 9 L13 15.5 L16 11 L22 19 Z" fill="#FBF6ED" />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontFamily: bricolage,
                fontWeight: 800,
                fontSize: 22,
                color: "#FBF6ED",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              Mirador
            </div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#7E9683",
                marginTop: 4,
              }}
            >
              Hotel Suite
            </div>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <div
            style={{
              fontFamily: bricolage,
              fontWeight: 700,
              fontSize: 38,
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
              color: "#FBF6ED",
              textWrap: "balance",
            }}
          >
            Donde la montaña
            <br />
            recibe a tus huéspedes.
          </div>
          <div
            style={{
              fontSize: 15,
              color: "#A9BCAE",
              marginTop: 18,
              maxWidth: 400,
              lineHeight: 1.55,
            }}
          >
            Gestiona reservas, habitaciones y la operación diaria de tu hostería
            de naturaleza desde un solo lugar.
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              marginTop: 30,
              fontSize: 12.5,
              color: "#7E9683",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: "#C2683E",
              }}
            />
            Turismo rural · Cabañas · Glamping
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          style={{ width: "100%", maxWidth: 368 }}
        >
          <div
            style={{
              fontFamily: bricolage,
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            Bienvenida de vuelta
          </div>
          <div style={{ fontSize: 14, color: "#6E7567", marginTop: 6 }}>
            Inicia sesión para continuar con tu turno.
          </div>

          <div
            style={{
              marginTop: 30,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <label
              style={{ display: "flex", flexDirection: "column", gap: 7 }}
            >
              <span
                style={{ fontSize: 12.5, fontWeight: 600, color: "#3F463A" }}
              >
                Usuario
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  background: "#fff",
                  border: "1px solid #E6E0D1",
                  borderRadius: 12,
                }}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9AA08F"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
                </svg>
                <input
                  {...form.register("username")}
                  disabled={isLoading}
                  placeholder="camila.rios"
                  autoComplete="username"
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontFamily: "inherit",
                    fontSize: 14,
                    color: "#1E251A",
                    width: "100%",
                  }}
                />
              </div>
            </label>

            <label
              style={{ display: "flex", flexDirection: "column", gap: 7 }}
            >
              <span
                style={{ fontSize: 12.5, fontWeight: 600, color: "#3F463A" }}
              >
                Contraseña
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  background: "#fff",
                  border: "1px solid #E6E0D1",
                  borderRadius: 12,
                }}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9AA08F"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2.5" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  {...form.register("password")}
                  disabled={isLoading}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontFamily: "inherit",
                    fontSize: 14,
                    color: "#1E251A",
                    width: "100%",
                    letterSpacing: "0.1em",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  style={{
                    flex: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                    color: "#9AA08F",
                  }}
                >
                  {showPassword ? (
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 13,
              }}
            >
              <label
                onClick={() => setRemember((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  color: "#3F463A",
                }}
              >
                <span
                  style={{
                    width: 17,
                    height: 17,
                    borderRadius: 5,
                    border: `1px solid ${remember ? "#C2683E" : "#C9C2B2"}`,
                    background: remember ? "#C2683E" : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      color: "#fff",
                      fontSize: 11,
                      lineHeight: 1,
                      display: remember ? "block" : "none",
                    }}
                  >
                    ✓
                  </span>
                </span>
                Recordarme
              </label>
              <span
                style={{
                  color: "#C2683E",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() =>
                  toast.info("Contacta a tu administrador para restablecerla.")
                }
              >
                ¿Olvidaste tu contraseña?
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                padding: 13,
                marginTop: 4,
                background: btnHover && !isLoading ? "#A8552F" : "#C2683E",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontFamily: "inherit",
                fontSize: 15,
                fontWeight: 600,
                cursor: isLoading ? "default" : "pointer",
                opacity: isLoading ? 0.8 : 1,
                boxShadow: "0 6px 16px rgba(168,85,47,0.3)",
                transition: "background 0.15s",
              }}
            >
              {isLoading ? "Iniciando sesión…" : "Iniciar sesión"}
              {!isLoading && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>

            {inlineError && (
              <div
                style={{
                  fontSize: 13,
                  color: "#B4452B",
                  background: "#F7E7DF",
                  border: "1px solid #E7C9BB",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                {inlineError as string}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 30,
              color: "#B0B3A4",
              fontSize: 12,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: "#3C7A4E",
              }}
            />
            Sistema operativo · v2.4 · Hostería Mirador
          </div>
        </form>
      </div>
    </div>
  );
}
