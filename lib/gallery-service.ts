import { supabase, Drawing, GalleryFilters, Tag } from './supabase-client'

export class GalleryService {
  // Buscar desenhos do usuário
  static async getUserDrawings(userId: string, filters: GalleryFilters = {}) {
    try {
      const { data, error } = await supabase.rpc('get_user_drawings', {
        p_user_id: userId,
        p_search_term: filters.searchTerm || null,
        p_filter_mode: filters.filterMode || 'all',
        p_sort_by: filters.sortBy || 'recent',
        p_limit: filters.limit || 20,
        p_offset: filters.offset || 0
      })

      if (error) {
        console.error('Erro ao buscar desenhos do usuário:', error)
        throw error
      }

      return data as Drawing[]
    } catch (error) {
      console.error('Erro no serviço de galeria:', error)
      throw error
    }
  }

  // Buscar desenhos públicos da galeria geral
  static async getPublicGalleryDrawings(filters: GalleryFilters = {}) {
    try {
      const { data, error } = await supabase.rpc('get_public_gallery_drawings', {
        p_search_term: filters.searchTerm || null,
        p_filter_mode: filters.filterMode || 'all',
        p_sort_by: filters.sortBy || 'recent',
        p_limit: filters.limit || 20,
        p_offset: filters.offset || 0
      })

      if (error) {
        console.error('Erro ao buscar galeria pública:', error)
        throw error
      }

      return data as Drawing[]
    } catch (error) {
      console.error('Erro no serviço de galeria pública:', error)
      throw error
    }
  }

  // Alternar favorito
  static async toggleFavorite(userId: string, drawingId: string) {
    try {
      const { data, error } = await supabase.rpc('toggle_drawing_favorite', {
        p_user_id: userId,
        p_drawing_id: drawingId
      })

      if (error) {
        console.error('Erro ao alternar favorito:', error)
        throw error
      }

      return data as boolean
    } catch (error) {
      console.error('Erro no toggle favorito:', error)
      throw error
    }
  }

  // Incrementar visualizações
  static async incrementViews(drawingId: string) {
    try {
      const { error } = await supabase.rpc('increment_drawing_views', {
        p_drawing_id: drawingId
      })

      if (error) {
        console.error('Erro ao incrementar visualizações:', error)
        throw error
      }
    } catch (error) {
      console.error('Erro no incremento de views:', error)
      throw error
    }
  }

  // Curtir/descurtir desenho
  static async toggleLike(userId: string, drawingId: string) {
    try {
      // Verificar se já curtiu
      const { data: existingLike } = await supabase
        .from('drawing_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('drawing_id', drawingId)
        .single()

      if (existingLike) {
        // Remover like
        const { error } = await supabase
          .from('drawing_likes')
          .delete()
          .eq('user_id', userId)
          .eq('drawing_id', drawingId)

        if (error) throw error
        return false
      } else {
        // Adicionar like
        const { error } = await supabase
          .from('drawing_likes')
          .insert({
            user_id: userId,
            drawing_id: drawingId
          })

        if (error) throw error
        return true
      }
    } catch (error) {
      console.error('Erro ao curtir/descurtir:', error)
      throw error
    }
  }

  // Buscar tags populares
  static async getPopularTags(limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Erro ao buscar tags populares:', error)
        throw error
      }

      return data as Tag[]
    } catch (error) {
      console.error('Erro no serviço de tags:', error)
      throw error
    }
  }

  // Criar ou buscar tag
  static async createOrGetTag(tagName: string) {
    try {
      // Primeiro tentar buscar a tag existente
      const { data: existingTag } = await supabase
        .from('tags')
        .select('*')
        .eq('name', tagName.toLowerCase())
        .single()

      if (existingTag) {
        return existingTag as Tag
      }

      // Se não existir, criar nova tag
      const { data, error } = await supabase
        .from('tags')
        .insert({
          name: tagName.toLowerCase(),
          color: '#3B82F6' // Cor padrão azul
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar tag:', error)
        throw error
      }

      return data as Tag
    } catch (error) {
      console.error('Erro no serviço de criar/buscar tag:', error)
      throw error
    }
  }

  // Adicionar tags ao desenho
  static async addTagsToDrawing(drawingId: string, tagNames: string[]) {
    try {
      const tagIds: string[] = []

      // Criar ou buscar cada tag
      for (const tagName of tagNames) {
        const tag = await this.createOrGetTag(tagName)
        tagIds.push(tag.id)
      }

      // Adicionar relações drawing_tags
      const drawingTags = tagIds.map(tagId => ({
        drawing_id: drawingId,
        tag_id: tagId
      }))

      const { error } = await supabase
        .from('drawing_tags')
        .insert(drawingTags)

      if (error) {
        console.error('Erro ao adicionar tags ao desenho:', error)
        throw error
      }
    } catch (error) {
      console.error('Erro no serviço de adicionar tags:', error)
      throw error
    }
  }

  // Remover tag do desenho
  static async removeTagFromDrawing(drawingId: string, tagId: string) {
    try {
      const { error } = await supabase
        .from('drawing_tags')
        .delete()
        .eq('drawing_id', drawingId)
        .eq('tag_id', tagId)

      if (error) {
        console.error('Erro ao remover tag do desenho:', error)
        throw error
      }
    } catch (error) {
      console.error('Erro no serviço de remover tag:', error)
      throw error
    }
  }

  // Deletar desenho
  static async deleteDrawing(drawingId: string) {
    try {
      const { error } = await supabase
        .from('drawings')
        .delete()
        .eq('id', drawingId)

      if (error) {
        console.error('Erro ao deletar desenho:', error)
        throw error
      }
    } catch (error) {
      console.error('Erro no serviço de deletar desenho:', error)
      throw error
    }
  }

  // Atualizar visibilidade do desenho
  static async updateDrawingVisibility(drawingId: string, isPublic: boolean) {
    try {
      const { error } = await supabase
        .from('drawings')
        .update({ is_public: isPublic })
        .eq('id', drawingId)

      if (error) {
        console.error('Erro ao atualizar visibilidade:', error)
        throw error
      }
    } catch (error) {
      console.error('Erro no serviço de visibilidade:', error)
      throw error
    }
  }

  // Buscar comentários do desenho
  static async getDrawingComments(drawingId: string) {
    try {
      const { data, error } = await supabase
        .from('drawing_comments')
        .select(`
          *,
          user:users(name, avatar_url)
        `)
        .eq('drawing_id', drawingId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao buscar comentários:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro no serviço de comentários:', error)
      throw error
    }
  }

  // Adicionar comentário
  static async addComment(drawingId: string, userId: string, content: string) {
    try {
      const { data, error } = await supabase
        .from('drawing_comments')
        .insert({
          drawing_id: drawingId,
          user_id: userId,
          content: content
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao adicionar comentário:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro no serviço de adicionar comentário:', error)
      throw error
    }
  }
}