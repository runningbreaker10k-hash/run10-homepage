import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

type RankRow = {
  rank: number | string
  name: string
  tier: string
  record: string
  birth_date: string
}

const VALID_TIERS = ['cheetah', 'horse', 'wolf', 'turtle', 'bolt']

// 한글 티어명 -> 영문 코드 매핑
const TIER_MAPPING: Record<string, string> = {
  '치타족': 'cheetah',
  '홀스족': 'horse',
  '울프족': 'wolf',
  '터틀족': 'turtle',
  '볼타족': 'bolt',
  'cheetah': 'cheetah',
  'horse': 'horse',
  'wolf': 'wolf',
  'turtle': 'turtle',
  'bolt': 'bolt'
}

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function validateAndTransformRows(rows: RankRow[], sheetName: string): { errors: string[], data: RankRow[] } {
  const errors: string[] = []

  if (rows.length === 0) {
    errors.push(`[${sheetName}] 데이터가 없습니다.`)
    return { errors, data: [] }
  }

  const firstRow = rows[0]
  if (!firstRow.rank || !firstRow.name || !firstRow.tier || !firstRow.record || !firstRow.birth_date) {
    errors.push(`[${sheetName}] 필수 컬럼이 누락되었습니다. (rank, name, tier, record, birth_date)`)
    return { errors, data: [] }
  }

  rows.forEach((row, index) => {
    const rowNum = index + 2

    const rank = parseInt(String(row.rank))
    if (isNaN(rank) || rank < 1 || rank > 100) {
      errors.push(`[${sheetName}] ${rowNum}행: 순위는 1-100 사이여야 합니다. (현재: ${row.rank})`)
    }

    if (!row.name || String(row.name).trim() === '') {
      errors.push(`[${sheetName}] ${rowNum}행: 이름이 비어있습니다.`)
    }

    const originalTier = String(row.tier).trim()
    const convertedTier = TIER_MAPPING[originalTier]
    if (!convertedTier) {
      errors.push(`[${sheetName}] ${rowNum}행: 유효하지 않은 티어입니다. (현재: ${originalTier}, 가능: 치타족, 홀스족, 울프족, 터틀족, 볼타족 또는 ${VALID_TIERS.join(', ')})`)
    } else {
      row.tier = convertedTier
    }

    if (!/^\d{1,2}:\d{2}:\d{2}$/.test(String(row.record))) {
      errors.push(`[${sheetName}] ${rowNum}행: 기록 형식이 올바르지 않습니다. (HH:MM:SS 형식, 예: 00:35:42)`)
    }

    const birthDate = String(row.birth_date).trim()
    if (!/^\d{6}$/.test(birthDate)) {
      errors.push(`[${sheetName}] ${rowNum}행: 생년월일 형식이 올바르지 않습니다. (YYMMDD 형식, 예: 900515)`)
    }
  })

  return { errors, data: rows }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: '파일이 선택되지 않았습니다.' },
        { status: 400 }
      )
    }

    // xlsx 파일 파싱
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array', raw: false })

    if (workbook.SheetNames.length < 2) {
      return NextResponse.json(
        { error: '엑셀 파일에 시트가 2개 이상 있어야 합니다. (Sheet1: 남자, Sheet2: 여자)' },
        { status: 400 }
      )
    }

    // Sheet1 = 남자, Sheet2 = 여자
    const maleSheet = workbook.Sheets[workbook.SheetNames[0]]
    const femaleSheet = workbook.Sheets[workbook.SheetNames[1]]

    const maleRows = XLSX.utils.sheet_to_json<RankRow>(maleSheet)
    const femaleRows = XLSX.utils.sheet_to_json<RankRow>(femaleSheet)

    // 검증
    const maleValidation = validateAndTransformRows(maleRows, '남자')
    const femaleValidation = validateAndTransformRows(femaleRows, '여자')

    const allErrors = [...maleValidation.errors, ...femaleValidation.errors]
    if (allErrors.length > 0) {
      return NextResponse.json(
        { error: '검증 오류', details: allErrors },
        { status: 400 }
      )
    }

    const updatedAt = new Date().toISOString().split('T')[0]

    // 남자 JSON 생성 및 저장
    const maleJson = {
      updated_at: updatedAt,
      data: maleRows.map(row => ({
        rank: parseInt(String(row.rank)),
        name: String(row.name),
        tier: String(row.tier).trim(),
        record: String(row.record).trim(),
        birth_date: String(row.birth_date).trim()
      })).sort((a, b) => a.rank - b.rank)
    }

    // 여자 JSON 생성 및 저장
    const femaleJson = {
      updated_at: updatedAt,
      data: femaleRows.map(row => ({
        rank: parseInt(String(row.rank)),
        name: String(row.name),
        tier: String(row.tier).trim(),
        record: String(row.record).trim(),
        birth_date: String(row.birth_date).trim()
      })).sort((a, b) => a.rank - b.rank)
    }

    const { error: maleError } = await supabase.storage
      .from('rank-data')
      .upload('rank-male.json', Buffer.from(JSON.stringify(maleJson, null, 2), 'utf-8'), {
        contentType: 'application/json',
        upsert: true
      })

    if (maleError) {
      return NextResponse.json(
        { error: '남자 랭커 데이터 저장 중 오류가 발생했습니다.', details: maleError.message },
        { status: 500 }
      )
    }

    const { error: femaleError } = await supabase.storage
      .from('rank-data')
      .upload('rank-female.json', Buffer.from(JSON.stringify(femaleJson, null, 2), 'utf-8'), {
        contentType: 'application/json',
        upsert: true
      })

    if (femaleError) {
      return NextResponse.json(
        { error: '여자 랭커 데이터 저장 중 오류가 발생했습니다.', details: femaleError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `랭커 데이터가 업데이트되었습니다. (남자 ${maleRows.length}명, 여자 ${femaleRows.length}명)`,
      male_count: maleRows.length,
      female_count: femaleRows.length,
      updated_at: updatedAt
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
