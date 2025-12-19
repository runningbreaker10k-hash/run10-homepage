import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import Papa from 'papaparse'

type CSVRow = {
  rank: string
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
  // 영문 코드도 그대로 허용
  'cheetah': 'cheetah',
  'horse': 'horse',
  'wolf': 'wolf',
  'turtle': 'turtle',
  'bolt': 'bolt'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const gender = formData.get('gender') as string

    if (!file) {
      return NextResponse.json(
        { error: '파일이 선택되지 않았습니다.' },
        { status: 400 }
      )
    }

    if (!gender || (gender !== 'male' && gender !== 'female')) {
      return NextResponse.json(
        { error: '성별을 선택해주세요.' },
        { status: 400 }
      )
    }

    // CSV 파일 읽기
    const text = await file.text()

    // CSV 파싱
    const parseResult = Papa.parse<CSVRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: 'CSV 파일 파싱 중 오류가 발생했습니다.', details: parseResult.errors },
        { status: 400 }
      )
    }

    const rows = parseResult.data

    // 데이터 검증
    const errors: string[] = []

    // 필수 컬럼 체크
    if (rows.length === 0) {
      errors.push('CSV 파일에 데이터가 없습니다.')
    }

    const firstRow = rows[0]
    if (!firstRow.rank || !firstRow.name || !firstRow.tier || !firstRow.record || !firstRow.birth_date) {
      errors.push('필수 컬럼이 누락되었습니다. (rank, name, tier, record, birth_date)')
    }

    // 각 행 검증 및 변환
    rows.forEach((row, index) => {
      const rowNum = index + 2 // CSV 헤더 다음 행부터 시작

      // 순위 검증
      const rank = parseInt(row.rank)
      if (isNaN(rank) || rank < 1 || rank > 100) {
        errors.push(`${rowNum}행: 순위는 1-100 사이여야 합니다. (현재: ${row.rank})`)
      }

      // 이름 검증
      if (!row.name || row.name.trim() === '') {
        errors.push(`${rowNum}행: 이름이 비어있습니다.`)
      }

      // 티어 변환 (한글 -> 영문)
      const originalTier = row.tier.trim()
      const convertedTier = TIER_MAPPING[originalTier]

      if (!convertedTier) {
        errors.push(`${rowNum}행: 유효하지 않은 티어입니다. (현재: ${originalTier}, 가능: 치타족, 홀스족, 울프족, 터틀족, 볼타족 또는 ${VALID_TIERS.join(', ')})`)
      } else {
        // 변환된 티어로 업데이트
        row.tier = convertedTier
      }

      // 기록 검증 (HH:MM:SS 형식)
      if (!/^\d{1,2}:\d{2}:\d{2}$/.test(row.record)) {
        errors.push(`${rowNum}행: 기록 형식이 올바르지 않습니다. (HH:MM:SS 형식, 예: 00:35:42)`)
      }

      // 생년월일 검증 (YYMMDD 형식)
      if (!/^\d{6}$/.test(row.birth_date)) {
        errors.push(`${rowNum}행: 생년월일 형식이 올바르지 않습니다. (YYMMDD 형식, 예: 900515)`)
      }
    })

    // 중복 순위 체크
    const ranks = rows.map(row => parseInt(row.rank))
    const uniqueRanks = new Set(ranks)
    if (ranks.length !== uniqueRanks.size) {
      errors.push('중복된 순위가 있습니다.')
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: '검증 오류', details: errors },
        { status: 400 }
      )
    }

    // JSON 데이터 생성
    const jsonData = {
      updated_at: new Date().toISOString().split('T')[0],
      data: rows.map(row => ({
        rank: parseInt(row.rank),
        name: row.name.trim(),
        tier: row.tier.trim(),
        record: row.record.trim(),
        birth_date: row.birth_date.trim()
      })).sort((a, b) => a.rank - b.rank)
    }

    // JSON 파일 저장
    const publicDir = join(process.cwd(), 'public', 'data')
    const fileName = `rank-${gender}.json`
    const filePath = join(publicDir, fileName)

    await writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf-8')

    return NextResponse.json({
      success: true,
      message: `${gender === 'male' ? '남자' : '여자'} 랭커 데이터가 업데이트되었습니다.`,
      count: rows.length,
      updated_at: jsonData.updated_at
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
