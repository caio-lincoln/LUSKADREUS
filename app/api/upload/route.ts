import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Configurações de upload
const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  buckets: {
    'sketch-by-image': 'sketch-by-image',
    'blind-study': 'blind-study', 
    'sketch-by-description': 'sketch-by-description'
  }
}

// Função para validar arquivo
function validateFile(file: File): { valid: boolean; error?: string } {
  console.log('🔍 [UPLOAD] Validando arquivo:', {
    name: file?.name,
    type: file?.type,
    size: file?.size,
    sizeInMB: file ? (file.size / (1024 * 1024)).toFixed(2) : 'N/A'
  })

  if (!file) {
    console.error('❌ [UPLOAD] Erro: Nenhum arquivo enviado')
    return { valid: false, error: 'Nenhum arquivo enviado' }
  }

  if (!UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
    console.error('❌ [UPLOAD] Erro: Tipo de arquivo não permitido:', file.type)
    return { valid: false, error: `Tipo de arquivo não permitido. Permitidos: ${UPLOAD_CONFIG.allowedTypes.join(', ')}` }
  }

  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    console.error('❌ [UPLOAD] Erro: Arquivo muito grande:', file.size, 'bytes')
    return { valid: false, error: `Arquivo muito grande. Máximo: ${UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB` }
  }

  console.log('✅ [UPLOAD] Arquivo válido')
  return { valid: true }
}

// Função para autenticar usuário
async function authenticateUser(request: NextRequest) {
  console.log('🔐 [UPLOAD] Iniciando autenticação do usuário')
  
  const authHeader = request.headers.get('authorization')
  console.log('🔐 [UPLOAD] Header de autorização presente:', !!authHeader)
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ [UPLOAD] Erro: Token de autorização ausente ou inválido')
    return { error: 'Token de autorização necessário', status: 401 }
  }

  const token = authHeader.replace('Bearer ', '')
  console.log('🔐 [UPLOAD] Token extraído, comprimento:', token.length)
  
  // Criar cliente Supabase com o token do usuário
  const supabaseWithAuth = createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  })
  
  const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser(token)
  if (authError || !user) {
    console.error('❌ [UPLOAD] Erro na autenticação:', authError?.message || 'Usuário não encontrado')
    return { error: 'Token inválido', status: 401 }
  }

  console.log('✅ [UPLOAD] Usuário autenticado:', user.id)

  // Verificar se é admin
  console.log('🔍 [UPLOAD] Verificando permissões de admin para usuário:', user.id)
  const { data: userData, error: userError } = await supabaseWithAuth
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (userError) {
    console.error('❌ [UPLOAD] Erro ao verificar permissões:', userError.message)
    return { error: 'Erro ao verificar permissões', status: 500 }
  }

  if (!userData?.is_admin) {
    console.error('❌ [UPLOAD] Acesso negado: usuário não é admin')
    return { error: 'Acesso negado - apenas admins podem fazer upload', status: 403 }
  }

  console.log('✅ [UPLOAD] Usuário é admin, acesso autorizado')
  return { user, supabaseWithAuth }
}

// Função para gerar nome único do arquivo
function generateFileName(userId: string, category: string, originalName: string): string {
  const timestamp = Date.now()
  const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  
  // Não incluir a categoria no caminho do arquivo, apenas userId/timestamp.ext
  const fileName = `${userId}/${timestamp}.${fileExtension}`
  
  console.log('📝 [UPLOAD] Nome do arquivo gerado:', {
    original: originalName,
    generated: fileName,
    userId,
    category,
    timestamp
  })
  
  return fileName
}

// Função para fazer upload no Supabase Storage
async function uploadToStorage(bucketName: string, fileName: string, file: File, supabaseClient: any) {
  console.log('☁️ [UPLOAD] Iniciando upload para storage:', {
    bucket: bucketName,
    fileName,
    fileSize: file.size,
    fileType: file.type
  })

  try {
    const { data, error } = await supabaseClient.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (error) {
      console.error('❌ [UPLOAD] Erro no upload do storage:', {
        error: error.message,
        bucket: bucketName,
        fileName,
        statusCode: error.statusCode
      })
      return { error: `Erro no upload: ${error.message}` }
    }

    console.log('✅ [UPLOAD] Upload para storage bem-sucedido:', data)

    // Obter URL pública
    const { data: { publicUrl } } = supabaseClient.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    console.log('🔗 [UPLOAD] URL pública gerada:', publicUrl)

    return { data, publicUrl }
  } catch (error) {
    console.error('❌ [UPLOAD] Erro interno no upload do storage:', error)
    return { error: 'Erro interno no upload' }
  }
}

// Função para salvar no banco de dados
async function saveToDatabase(userId: string, file: File, publicUrl: string, category: string, supabaseClient: any, description?: string) {
  console.log('💾 [UPLOAD] Salvando imagem de referência no banco de dados:', {
    userId,
    fileName: file.name,
    publicUrl,
    category,
    description,
    fileSize: file.size
  })

  try {
    const referenceImageData = {
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extensão
      description: description || `Imagem de referência ${category} enviada pelo admin`,
      mode: category || 'sketch-by-image',
      uploaded_by: userId,
      image_url: publicUrl,
      thumbnail_url: publicUrl,
      is_active: true,
      file_size: file.size,
      dimensions: { width: 800, height: 600 }, // Valores padrão, podem ser atualizados depois
      position: 0
    }

    console.log('💾 [UPLOAD] Dados para inserção em reference_images:', referenceImageData)

    const { data: insertedData, error: referenceError } = await supabaseClient
      .from('reference_images')
      .insert(referenceImageData)
      .select()
      .single()

    if (referenceError) {
      console.error('❌ [UPLOAD] Erro ao salvar imagem de referência:', {
        error: referenceError.message,
        code: referenceError.code,
        details: referenceError.details,
        hint: referenceError.hint
      })
      return { error: `Erro ao salvar imagem de referência: ${referenceError.message}` }
    }

    console.log('✅ [UPLOAD] Imagem de referência salva com sucesso:', insertedData)
    return { data: insertedData }
  } catch (error) {
    console.error('❌ [UPLOAD] Erro interno ao salvar imagem de referência:', error)
    return { error: 'Erro interno ao salvar imagem de referência' }
  }
}

// Função para adicionar à galeria
async function addToGallery(drawingId: string, category: string, userId: string, supabaseClient: any) {
  console.log('🖼️ [UPLOAD] Adicionando à galeria:', {
    drawingId,
    category,
    userId
  })

  if (!category || !['sketch-by-image', 'blind-study', 'sketch-by-description'].includes(category)) {
    console.log('⚠️ [UPLOAD] Categoria inválida para galeria, pulando:', category)
    return { success: true } // Não adicionar à galeria se categoria inválida
  }

  try {
    const { error: galleryError } = await supabaseClient
      .from('gallery_images')
      .insert({
        drawing_id: drawingId,
        category: category,
        is_active: true,
        featured_by: userId,
        position: 0
      })

    if (galleryError) {
      console.error('❌ [UPLOAD] Erro ao adicionar à galeria:', {
        error: galleryError.message,
        code: galleryError.code,
        drawingId,
        category
      })
      return { error: `Erro ao adicionar à galeria: ${galleryError.message}` }
    }

    console.log('✅ [UPLOAD] Adicionado à galeria com sucesso')
    return { success: true }
  } catch (error) {
    console.error('❌ [UPLOAD] Erro interno ao adicionar à galeria:', error)
    return { error: 'Erro interno ao adicionar à galeria' }
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 [UPLOAD] Iniciando processo de upload')
  console.log('🚀 [UPLOAD] URL da requisição:', request.url)
  console.log('🚀 [UPLOAD] Método:', request.method)
  console.log('🚀 [UPLOAD] Headers:', Object.fromEntries(request.headers.entries()))

  try {
    // 1. Autenticar usuário
    console.log('📋 [UPLOAD] Etapa 1: Autenticação')
    const authResult = await authenticateUser(request)
    if ('error' in authResult) {
      console.error('❌ [UPLOAD] Falha na autenticação')
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const { user, supabaseWithAuth } = authResult

    // 2. Obter dados do formulário
    console.log('📋 [UPLOAD] Etapa 2: Processando FormData')
    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = (formData.get('category') as string) || 'sketch-by-image'
    const description = formData.get('description') as string

    console.log('📋 [UPLOAD] Dados do formulário:', {
      hasFile: !!file,
      category,
      description: description ? 'presente' : 'ausente',
      formDataKeys: Array.from(formData.keys())
    })

    // 3. Validar arquivo
    console.log('📋 [UPLOAD] Etapa 3: Validação do arquivo')
    const validation = validateFile(file)
    if (!validation.valid) {
      console.error('❌ [UPLOAD] Validação falhou')
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // 4. Determinar bucket
    console.log('📋 [UPLOAD] Etapa 4: Determinando bucket')
    const bucketName = UPLOAD_CONFIG.buckets[category as keyof typeof UPLOAD_CONFIG.buckets] || 'sketch-by-image'
    console.log('📋 [UPLOAD] Bucket selecionado:', bucketName, 'para categoria:', category)

    // 5. Gerar nome do arquivo
    console.log('📋 [UPLOAD] Etapa 5: Gerando nome do arquivo')
    const fileName = generateFileName(user.id, category, file.name)

    // 6. Upload para storage
    console.log('📋 [UPLOAD] Etapa 6: Upload para storage')
    const uploadResult = await uploadToStorage(bucketName, fileName, file, supabaseWithAuth)
    if ('error' in uploadResult) {
      console.error('❌ [UPLOAD] Falha no upload para storage')
      return NextResponse.json({ error: uploadResult.error }, { status: 500 })
    }

    // 7. Salvar no banco de dados
    console.log('📋 [UPLOAD] Etapa 7: Salvando no banco de dados')
    const dbResult = await saveToDatabase(user.id, file, uploadResult.publicUrl, category, supabaseWithAuth, description)
    if ('error' in dbResult) {
      console.error('❌ [UPLOAD] Falha ao salvar no banco, limpando storage')
      // Limpar arquivo do storage se falhou no banco
      await supabaseWithAuth.storage.from(bucketName).remove([fileName])
      return NextResponse.json({ error: dbResult.error }, { status: 500 })
    }

    // 8. Retornar sucesso (não precisamos mais adicionar à galeria separadamente)
    console.log('✅ [UPLOAD] Upload de imagem de referência concluído com sucesso!')
    const responseData = {
      success: true,
      data: {
        id: dbResult.data.id,
        fileName: fileName,
        publicUrl: uploadResult.publicUrl,
        category: category,
        description: description,
        size: file.size,
        uploadedAt: new Date().toISOString()
      }
    }
    
    console.log('✅ [UPLOAD] Dados de resposta:', responseData)
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('❌ [UPLOAD] Erro geral no upload:', {
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

    // 2. Inicializar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 3. Obter parâmetros da query
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Máximo 100
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    console.log('🔍 [GET] Buscando imagens de referencia:', { category, limit, offset })

    // 4. Buscar imagens de referencia
    let query = supabase
      .from('reference_images')
      .select(`
        id,
        title,
        description,
        mode,
        image_url,
        thumbnail_url,
        file_size,
        dimensions,
        position,
        is_active,
        created_at,
        users!reference_images_uploaded_by_fkey(name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category && category !== 'all') {
      query = query.eq('mode', category)
    }

    const { data: referenceImages, error } = await query

    if (error) {
      console.error('Erro ao buscar imagens de referencia:', error)
    return NextResponse.json({ error: 'Erro ao buscar imagens de referencia' }, { status: 500 })
    }

    // 4. Formatar dados
    const formattedImages = referenceImages?.map(refImage => {
      return {
        id: refImage.id,
        filename: refImage.title,
        category: refImage.mode,
        description: refImage.description || '',
        uploadDate: new Date(refImage.created_at),
        size: refImage.file_size ? `${(refImage.file_size / 1024).toFixed(1)} KB` : 'N/A',
        dimensions: refImage.dimensions ? `${refImage.dimensions.width}x${refImage.dimensions.height}` : '800x600',
        isActive: refImage.is_active,
        imageUrl: refImage.image_url,
        thumbnailUrl: refImage.thumbnail_url,
        authorName: refImage.users?.name || 'Admin',
        position: refImage.position
      }
    }) || []

    console.log('✅ [GET] Imagens formatadas:', {
      count: formattedImages.length,
      images: formattedImages.map(img => ({
        id: img.id,
        filename: img.filename,
        category: img.category
      }))
    })

    return NextResponse.json({
      success: true,
      data: formattedImages,
      total: formattedImages.length,
      offset,
      limit
    })

  } catch (error) {
    console.error('Erro ao buscar imagens:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}