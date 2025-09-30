import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

// Configurações de upload em lote
const BATCH_UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB por arquivo
  maxFiles: 50, // Máximo de arquivos por lote
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  buckets: {
    'sketch-by-image': 'sketch-by-image',
    'blind-study': 'blind-study', 
    'sketch-by-description': 'sketch-by-description'
  }
}

// Função para validar arquivo individual
function validateFile(file: File, index: number): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: `Arquivo ${index + 1}: Nenhum arquivo enviado` }
  }

  if (!BATCH_UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Arquivo ${index + 1} (${file.name}): Tipo não permitido. Permitidos: ${BATCH_UPLOAD_CONFIG.allowedTypes.join(', ')}` 
    }
  }

  if (file.size > BATCH_UPLOAD_CONFIG.maxFileSize) {
    return { 
      valid: false, 
      error: `Arquivo ${index + 1} (${file.name}): Muito grande. Máximo: ${BATCH_UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB` 
    }
  }

  return { valid: true }
}

// Função para autenticar usuário
async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Token de autorização necessário', status: 401 }
  }

  const token = authHeader.replace('Bearer ', '')
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return { error: 'Token inválido', status: 401 }
  }

  // Verificar se é admin
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (userError || !userData?.is_admin) {
    return { error: 'Acesso negado - apenas admins podem fazer upload', status: 403 }
  }

  return { user }
}

// Função para gerar nome único do arquivo
function generateFileName(userId: string, category: string, originalName: string, index: number): string {
  const timestamp = Date.now() + index // Adicionar índice para evitar conflitos
  const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const sanitizedCategory = category || 'general'
  
  return `${userId}/${sanitizedCategory}/batch-${timestamp}.${fileExtension}`
}

// Função para processar um arquivo individual
async function processFile(
  file: File, 
  index: number, 
  userId: string, 
  category: string, 
  description: string, 
  bucketName: string
) {
  console.log(`📁 [BATCH] Processando arquivo ${index + 1}:`, {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    category,
    bucketName
  })

  try {
    // 1. Validar arquivo
    console.log(`📋 [BATCH] Validando arquivo ${index + 1}`)
    const validation = validateFile(file)
    if (!validation.valid) {
      console.error(`❌ [BATCH] Validação falhou para arquivo ${index + 1}:`, validation.error)
      return { success: false, error: validation.error }
    }

    // 2. Gerar nome do arquivo
    console.log(`📋 [BATCH] Gerando nome para arquivo ${index + 1}`)
    const fileName = generateFileName(userId, category, file.name)
    console.log(`📋 [BATCH] Nome gerado para arquivo ${index + 1}:`, fileName)

    // 3. Upload para storage
    console.log(`☁️ [BATCH] Fazendo upload do arquivo ${index + 1} para storage`)
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (error) {
      console.error(`❌ [BATCH] Erro no upload do arquivo ${index + 1}:`, {
        error: error.message,
        statusCode: error.statusCode,
        bucket: bucketName,
        fileName
      })
      return { success: false, error: `Erro no upload: ${error.message}` }
    }

    console.log(`✅ [BATCH] Upload bem-sucedido para arquivo ${index + 1}:`, data)

    // 4. Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    console.log(`🔗 [BATCH] URL pública gerada para arquivo ${index + 1}:`, publicUrl)

    // 5. Salvar no banco de dados
    console.log(`💾 [BATCH] Salvando arquivo ${index + 1} no banco de dados`)
    const { data: drawingData, error: drawingError } = await supabase
      .from('drawings')
      .insert({
        title: file.name,
        description: description || `Batch upload - ${file.name}`,
        mode: category,
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
          category: category,
          batchIndex: index,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString()
        })
      })
      .select()
      .single()

    if (drawingError) {
      console.error(`❌ [BATCH] Erro ao salvar no banco (arquivo ${index + 1}):`, drawingError)
      // Limpar arquivo do storage se falhou no banco
      console.log(`🧹 [BATCH] Limpando arquivo ${index + 1} do storage devido a erro no banco`)
      await supabase.storage.from(bucketName).remove([fileName])
      return { success: false, error: `Erro ao salvar no banco: ${drawingError.message}` }
    }

    console.log(`✅ [BATCH] Arquivo ${index + 1} salvo no banco com sucesso:`, drawingData.id)

    // 6. Adicionar à galeria (opcional)
    if (category && ['sketch-by-image', 'blind-study', 'sketch-by-description'].includes(category)) {
      console.log(`🖼️ [BATCH] Adicionando arquivo ${index + 1} à galeria`)
      const { error: galleryError } = await supabase
        .from('gallery_images')
        .insert({
          drawing_id: drawingData.id,
          category: category,
          is_active: true,
          featured_by: userId,
          position: 0
        })

      if (galleryError) {
        console.warn(`⚠️ [BATCH] Erro ao adicionar arquivo ${index + 1} à galeria:`, galleryError)
        // Não falhar completamente, apenas logar o erro
      } else {
        console.log(`✅ [BATCH] Arquivo ${index + 1} adicionado à galeria com sucesso`)
      }
    }

    console.log(`🎉 [BATCH] Processamento completo do arquivo ${index + 1}`)
    return {
      success: true,
      data: {
        id: drawingData.id,
        fileName: fileName,
        originalName: file.name,
        publicUrl: publicUrl,
        category: category,
        size: file.size
      }
    }

  } catch (error) {
    console.error(`❌ [BATCH] Erro geral no processamento do arquivo ${index + 1}:`, {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      fileName: file.name
    })
    return { success: false, error: 'Erro interno no processamento' }
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 [BATCH] Iniciando processo de upload em lote')
  console.log('🚀 [BATCH] URL da requisição:', request.url)
  console.log('🚀 [BATCH] Método:', request.method)
  console.log('🚀 [BATCH] Headers:', Object.fromEntries(request.headers.entries()))

  try {
    // 1. Autenticar usuário
    console.log('📋 [BATCH] Etapa 1: Autenticação')
    const authResult = await authenticateUser(request)
    if ('error' in authResult) {
      console.error('❌ [BATCH] Falha na autenticação:', authResult.error)
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const { user } = authResult
    console.log('✅ [BATCH] Usuário autenticado:', user.id)

    // 2. Obter dados do formulário
    console.log('📋 [BATCH] Etapa 2: Processando FormData')
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const category = (formData.get('category') as string) || 'sketch-by-image'
    const description = formData.get('description') as string

    console.log('📋 [BATCH] Dados do formulário:', {
      filesCount: files.length,
      category,
      description: description ? 'presente' : 'ausente',
      formDataKeys: Array.from(formData.keys())
    })

    // 3. Validações iniciais
    console.log('📋 [BATCH] Etapa 3: Validações iniciais')
    if (!files || files.length === 0) {
      console.error('❌ [BATCH] Nenhum arquivo enviado')
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (files.length > BATCH_UPLOAD_CONFIG.maxFiles) {
      console.error('❌ [BATCH] Muitos arquivos:', files.length, 'máximo:', BATCH_UPLOAD_CONFIG.maxFiles)
      return NextResponse.json({ 
        error: `Máximo de ${BATCH_UPLOAD_CONFIG.maxFiles} arquivos por lote` 
      }, { status: 400 })
    }

    console.log('✅ [BATCH] Validações iniciais aprovadas')

    // 4. Determinar bucket
    console.log('📋 [BATCH] Etapa 4: Determinando bucket')
    const bucketName = BATCH_UPLOAD_CONFIG.buckets[category as keyof typeof BATCH_UPLOAD_CONFIG.buckets] || 'sketch-by-image'
    console.log('📋 [BATCH] Bucket selecionado:', bucketName, 'para categoria:', category)

    // 5. Processar arquivos
    console.log('📋 [BATCH] Etapa 5: Processando arquivos')
    const results = []
    const errors = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`📁 [BATCH] Iniciando processamento do arquivo ${i + 1}/${files.length}:`, file.name)
      
      const result = await processFile(file, i, user.id, category, description, bucketName)
      
      if (result.success) {
        console.log(`✅ [BATCH] Arquivo ${i + 1} processado com sucesso`)
        results.push(result.data)
      } else {
        console.error(`❌ [BATCH] Falha no processamento do arquivo ${i + 1}:`, result.error)
        errors.push({
          fileName: file.name,
          index: i,
          error: result.error
        })
      }
    }

    console.log('📊 [BATCH] Resumo do processamento:', {
      totalFiles: files.length,
      successful: results.length,
      failed: errors.length
    })

    // 6. Retornar resultado
    const responseData = {
      success: true,
      data: {
        uploaded: results,
        errors: errors,
        summary: {
          total: files.length,
          successful: results.length,
          failed: errors.length
        }
      }
    }

    console.log('✅ [BATCH] Upload em lote concluído')
    console.log('✅ [BATCH] Dados de resposta:', responseData)
    
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('❌ [BATCH] Erro geral no upload em lote:', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    })
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticar usuário
    const authResult = await authenticateUser(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // 2. Obter parâmetros da query
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Máximo 100
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    // 3. Buscar uploads em lote
    let query = supabase
      .from('drawings')
      .select(`
        id,
        title,
        description,
        mode,
        image_url,
        thumbnail_url,
        file_size,
        created_at,
        canvas_data,
        users!drawings_author_id_fkey(name)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category && category !== 'all') {
      query = query.eq('mode', category)
    }

    // Filtrar apenas uploads em lote
    const { data: drawings, error } = await query

    if (error) {
      console.error('Erro ao buscar uploads em lote:', error)
      return NextResponse.json({ error: 'Erro ao buscar uploads' }, { status: 500 })
    }

    // 4. Filtrar e formatar dados
    const batchUploads = drawings?.filter(drawing => {
      try {
        const canvasData = JSON.parse(drawing.canvas_data || '{}')
        return canvasData.type === 'admin-batch-upload'
      } catch {
        return false
      }
    }).map(drawing => ({
      id: drawing.id,
      filename: drawing.title,
      category: drawing.mode,
      description: drawing.description || '',
      uploadDate: new Date(drawing.created_at),
      size: drawing.file_size ? `${(drawing.file_size / 1024).toFixed(1)} KB` : 'N/A',
      dimensions: '800x600',
      isActive: true,
      imageUrl: drawing.image_url,
      thumbnailUrl: drawing.thumbnail_url,
      authorName: drawing.users?.name || 'Admin',
      batchInfo: (() => {
        try {
          const canvasData = JSON.parse(drawing.canvas_data || '{}')
          return {
            batchIndex: canvasData.batchIndex,
            originalFileName: canvasData.originalFileName
          }
        } catch {
          return null
        }
      })()
    })) || []

    return NextResponse.json({
      success: true,
      data: batchUploads,
      total: batchUploads.length,
      offset,
      limit
    })

  } catch (error) {
    console.error('Erro ao buscar uploads em lote:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}