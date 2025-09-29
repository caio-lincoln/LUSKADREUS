"use client"

import { supabase } from "@/lib/supabase-client"

// Serviço de autenticação com email/senha
export interface AuthUser {
  id: string
  name: string
  email: string
  avatar: string
  provider: "email"
}

class AuthService {
  private currentUser: AuthUser | null = null

  // Login com Supabase Auth
  async login(email: string, password: string): Promise<AuthUser> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.user) {
        throw new Error("Falha na autenticação")
      }

      const user: AuthUser = {
        id: data.user.id,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Usuário',
        email: data.user.email!,
        avatar: data.user.user_metadata?.avatar_url || null,
        provider: data.user.app_metadata?.provider || "email",
      }

      this.currentUser = user
      return user
    } catch (error) {
      console.error("Erro no login:", error)
      throw error
    }
  }

  // Registro de novo usuário
  async register(email: string, password: string, name: string): Promise<AuthUser> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.user) {
        throw new Error("Falha no registro")
      }

      const user: AuthUser = {
        id: data.user.id,
        name: name,
        email: data.user.email!,
        avatar: data.user.user_metadata?.avatar_url || null,
        provider: "email",
      }

      this.currentUser = user
      return user
    } catch (error) {
      console.error("Erro no registro:", error)
      throw error
    }
  }

  // Login com Google
  async loginWithGoogle(): Promise<AuthUser> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      // O usuário será redirecionado para o Google e depois de volta
      // O estado será gerenciado pelo onAuthStateChange
      throw new Error("Redirecionando para Google...")
    } catch (error) {
      console.error("Erro no login com Google:", error)
      throw error
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Erro no logout:", error)
      }
    } catch (error) {
      console.error("Erro no logout:", error)
    } finally {
      this.currentUser = null
    }
  }

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  // Obter usuário atual
  getCurrentUser(): AuthUser | null {
    return this.currentUser
  }

  // Verificar se o usuário atual é admin
  async isAdmin(): Promise<boolean> {
    try {
      if (!this.currentUser) {
        return false
      }

      // Buscar informações do usuário na tabela users para verificar is_admin
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', this.currentUser.id)
        .single()

      if (error) {
        console.error("Erro ao verificar status de admin:", error)
        return false
      }

      return data?.is_admin || false
    } catch (error) {
      console.error("Erro ao verificar status de admin:", error)
      return false
    }
  }

  // Inicializar estado de autenticação
  async initializeAuth(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const user: AuthUser = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email!,
          avatar: session.user.user_metadata?.avatar_url || null,
          provider: session.user.app_metadata?.provider || "email",
        }
        this.currentUser = user
      }
    } catch (error) {
      console.error("Erro ao inicializar autenticação:", error)
    }
  }

  // Listener para mudanças de estado de autenticação
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user: AuthUser = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email!,
          avatar: session.user.user_metadata?.avatar_url || null,
          provider: session.user.app_metadata?.provider || "email",
        }
        this.currentUser = user
        callback(user)
      } else {
        this.currentUser = null
        callback(null)
      }
    })
  }
}

export const authService = new AuthService()
