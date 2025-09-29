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
    const file = formData.get('file') as File
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const filter = formData.get('filter') as string

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Apenas imagens são permitidas' }, { status: 400 })
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande (máximo 10MB)' }, { status: 400 })
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split('.').pop()
    const userId = user.id
    const timestamp = Date.now()
    
    // Determinar bucket baseado na categoria
    let bucketName = 'images' // fallback para bucket padrão
    if (['sketch-by-image', 'blind-study', 'sketch-by-description'].includes(category)) {
      bucketName = category
    }
    
    // Para uploads de admin, usar estrutura de pasta com userId como primeira pasta
    // Isso é necessário para as políticas RLS que verificam storage.foldername(name)[1]
    const fileName = `${userId}/admin-uploads/${timestamp}.${fileExtension}`
    const filePath = fileName

    // Upload para o Supabase Storage no bucket específico
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return NextResponse.json({ error: 'Erro no upload da imagem' }, { status: 500 })
    }

    // Obter URL pública da imagem
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    // Criar um desenho temporário para representar a imagem na galeria
    const { data: drawingData, error: drawingError } = await supabase
      .from('drawings')
      .insert({
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extensão
        description: description || 'Imagem enviada pelo admin',
        mode: category || 'admin-upload',
        author_id: userId,
        image_url: publicUrl,
        thumbnail_url: publicUrl,
        is_public: true,
        canvas_width: 800,
        canvas_height: 600,
        file_size: file.size,
        canvas_data: JSON.stringify({
          type: 'admin-upload',
          originalFileName: file.name,
          filter: filter,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString()
        })
      })
      .select()
      .single()

    if (drawingError) {
      console.error('Erro ao salvar no banco:', drawingError)
      // Tentar remover o arquivo do storage se falhou ao salvar no banco
      await supabase.storage.from(bucketName).remove([filePath])
      return NextResponse.json({ error: 'Erro ao salvar informações da imagem' }, { status: 500 })
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
          position: 0
        })

      if (galleryError) {
        console.error('Erro ao adicionar à galeria:', galleryError)
        // Não falhar completamente, apenas logar o erro
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: drawingData.id,
        fileName: fileName,
        filePath: filePath,
        publicUrl: publicUrl,
        category: category,
        description: description,
        filter: filter,
        size: file.size,
        uploadedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Buscar imagens da galeria
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

    const { data: drawings, error } = await query

    if (error) {
      console.error('Erro ao buscar imagens:', error)
      return NextResponse.json({ error: 'Erro ao buscar imagens' }, { status: 500 })
    }

    // Formatar dados para o frontend
    const formattedImages = drawings?.map(drawing => ({
      id: drawing.id,
      filename: drawing.title,
      category: drawing.mode,
      description: drawing.description || '',
      uploadDate: new Date(drawing.created_at),
      size: drawing.file_size ? `${(drawing.file_size / 1024).toFixed(1)} KB` : 'N/A',
      dimensions: '800x600', // Padrão, pode ser extraído do canvas_data se necessário
      isActive: true,
      imageUrl: drawing.image_url,
      thumbnailUrl: drawing.thumbnail_url,
      authorName: drawing.users?.name || 'Admin'
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedImages,
      total: formattedImages.length
    })

  } catch (error) {
    console.error('Erro ao buscar imagens:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}