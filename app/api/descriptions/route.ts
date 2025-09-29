import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Autenticação via Supabase (email/senha)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado - faça login' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Acesso negado - apenas admins' }, { status: 403 })
    }

    const formData = await request.formData()
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const title = formData.get('title') as string

    if (!description || !category || !title) {
      return NextResponse.json({ error: 'Descrição, categoria e título são obrigatórios' }, { status: 400 })
    }

    // Para uploads de admin, usar o ID do usuário admin logado
    const userId = session.user.id
    const fileName = `${userId}/${Date.now()}.txt`

    // Upload da descrição para o bucket 'descriptions'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('descriptions')
      .upload(fileName, new Blob([description], { type: 'text/plain' }), {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Erro no upload da descrição:', uploadError)
      return NextResponse.json({ error: 'Erro no upload da descrição' }, { status: 500 })
    }

    // Obter URL pública da descrição
    const { data: { publicUrl } } = supabase.storage
      .from('descriptions')
      .getPublicUrl(fileName)

    // Criar registro no banco de dados
    const { data: descriptionData, error: dbError } = await supabase
      .from('descriptions')
      .insert({
        title: title,
        content: description,
        category: category,
        author_id: userId,
        file_url: publicUrl,
        is_active: true
      })
      .select()
      .single()

    if (dbError) {
      console.error('Erro ao salvar descrição no banco:', dbError)
      // Tentar remover o arquivo do storage se falhou ao salvar no banco
      await supabase.storage.from('descriptions').remove([fileName])
      return NextResponse.json({ error: 'Erro ao salvar descrição' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Descrição salva com sucesso!',
      data: {
        id: descriptionData.id,
        title: title,
        category: category,
        description: description,
        fileUrl: publicUrl,
        uploadedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erro no upload da descrição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Autenticação via Supabase (email/senha)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado - faça login' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Acesso negado - apenas admins' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Buscar descrições
    let query = supabase
      .from('descriptions')
      .select(`
        id,
        title,
        content,
        category,
        file_url,
        created_at,
        is_active,
        users!descriptions_author_id_fkey(name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: descriptions, error } = await query

    if (error) {
      console.error('Erro ao buscar descrições:', error)
      return NextResponse.json({ error: 'Erro ao buscar descrições' }, { status: 500 })
    }

    // Formatar dados para o frontend
    const formattedDescriptions = descriptions?.map(desc => ({
      id: desc.id,
      title: desc.title,
      category: desc.category,
      content: desc.content,
      fileUrl: desc.file_url,
      uploadDate: new Date(desc.created_at),
      isActive: desc.is_active,
      authorName: desc.users?.name || 'Admin'
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedDescriptions,
      total: formattedDescriptions.length
    })

  } catch (error) {
    console.error('Erro ao buscar descrições:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}