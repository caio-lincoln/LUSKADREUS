import { redirect } from "next/navigation"
import { LoginPage } from "@/components/auth/login-page"

export default function HomePage() {
  // Verificar se usuário está autenticado
  const isAuthenticated = false // Implementar verificação real

  if (isAuthenticated) {
    redirect("/dashboard")
  }

  return <LoginPage />
}
