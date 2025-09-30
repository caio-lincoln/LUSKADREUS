import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    // Obter token de autorização do header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verificar token com Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Acesso negado - apenas admins' }, { status: 403 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const category = formData.get('category') as string
    const description = formData.get('description') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validar número máximo de arquivos (50)
    if (files.length > 50) {
      return NextResponse.json({ error: 'Máximo de 50 imagens por lote' }, { status: 400 })
    }

    const results = []
    const errors = []
    const userId = user.id

    // Determinar bucket baseado na categoria
    // Para uploads de admin, sempre usar o bucket admin-uploads
    const bucketName = 'admin-uploads'

    // Processar cada arquivo
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          errors.push({
            fileName: file.name,
            error: 'Apenas imagens são permitidas'
          })
          continue
        }

        // Validar tamanho (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          errors.push({
            fileName: file.name,
            error: 'Arquivo muito grande (máximo 10MB)'
          })
          continue
        }

        // Gerar nome único para o arquivo
        const fileExtension = file.name.split('.').pop()
        const timestamp = Date.now() + i // Adicionar índice para evitar conflitos
        // Para uploads de admin, usar estrutura de pasta com userId como primeira pasta
        // Isso é necessário para as políticas RLS que verificam storage.foldername(name)[1]
        const categoryFolder = category || 'general'
        const fileName = `${userId}/${categoryFolder}/batch-${timestamp}.${fileExtension}`
        const filePath = fileName

        // Upload para o Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          errors.push({
            fileName: file.name,
            error: `Erro no upload: ${uploadError.message}`
          })
          continue
        }

        // Obter URL pública da imagem
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath)

        // Criar entrada no banco de dados
        const { data: drawingData, error: drawingError } = await supabase
          .from('drawings')
          .insert({
            title: file.name.replace(/\.[^/.]+$/, ''), // Remove extensão
            description: description || `Imagem ${i + 1} do lote enviado pelo admin`,
            mode: category || 'admin-batch-upload',
            author_id: userId,
            image_url: publicUrl,
            thumbnail_url: publicUrl,
            is_public: true,
            canvas_width: 800,
            canvas_height: 600,
            file_size: file.size,
            canvas_data: JSON.stringify({
              type: 'admin-batch-upload',
              originalFileName: file.name,
              batchIndex: i + 1,
              batchTotal: files.length,
              uploadedBy: userId,
              uploadedAt: new Date().toISOString()
            })
          })
          .select()
          .single()

        if (drawingError) {
          // Remover arquivo do storage se falhou ao salvar no banco
          await supabase.storage.from(bucketName).remove([filePath])
          errors.push({
            fileName: file.name,
            error: `Erro ao salvar no banco: ${drawingError.message}`
          })
          continue
        }

        // Adicionar à galeria se especificado
        if (category && ['sketch-by-image', 'blind-study', 'sketch-by-description'].includes(category)) {
          const { error: galleryError } = await supabase
            .from('gallery_images')
            .insert({
              drawing_id: drawingData.id,
              category: category,
              is_active: true,
              featured_by: userId,
              position: i
            })

          if (galleryError) {
            console.error('Erro ao adicionar à galeria:', galleryError)
            // Não falhar completamente, apenas logar o erro
          }
        }

        results.push({
          fileName: file.name,
          id: drawingData.id,
          publicUrl: publicUrl,
          success: true
        })

      } catch (error) {
        errors.push({
          fileName: file.name,
          error: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalFiles: files.length,
        successCount: results.length,
        errorCount: errors.length,
        results: results,
        errors: errors,
        category: category,
        bucketName: bucketName
      }
    })

  } catch (error) {
    console.error('Erro no upload em lote:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}