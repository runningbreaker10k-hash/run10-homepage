import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { user_id, push_id } = await request.json()

    // 1. 필수 파라미터 검증
    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'user_id가 필요합니다' },
        { status: 400 }
      )
    }

    if (!push_id || typeof push_id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'push_id가 필요합니다' },
        { status: 400 }
      )
    }

    // 2. push_id 길이 검증 (OneSignal player_id는 36자)
    if (push_id.length > 64) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 push_id입니다' },
        { status: 400 }
      )
    }

    // 3. 동일 push_id를 가진 다른 사용자는 null로 초기화
    //    (같은 기기에서 다른 계정으로 로그인한 경우)
    await supabase
      .from('users')
      .update({ push_id: null })
      .eq('push_id', push_id)
      .neq('id', user_id)

    // 4. 현재 사용자의 push_id 업데이트
    const { data, error } = await supabase
      .from('users')
      .update({ push_id })
      .eq('id', user_id)
      .select('id')

    if (error) {
      console.error('push_id 저장 실패:', error)
      return NextResponse.json(
        { success: false, error: 'push_id 저장에 실패했습니다' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 4. 성공 응답
    return NextResponse.json({
      success: true,
      message: 'push_id가 저장되었습니다'
    })

  } catch (error) {
    console.error('push_id 업데이트 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
