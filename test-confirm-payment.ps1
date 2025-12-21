# 뱅크다A confirm-payment API 실제 테스트

$baseUrl = "https://runten.co.kr"
$orderId = "d6948015-229a-42c3-9c5c-231b1b02c1d3"  # 조은영님 주문번호

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "뱅크다A 입금 확인 API 테스트" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 현재 상태 확인
Write-Host "[1단계] 현재 등록 상태 확인" -ForegroundColor Yellow
Write-Host "주문번호: $orderId" -ForegroundColor White
Write-Host ""

# 2. POST 요청 준비
$body = @{
    requests = @(
        @{ order_id = $orderId }
    )
} | ConvertTo-Json -Compress

Write-Host "[2단계] POST 요청 전송" -ForegroundColor Yellow
Write-Host "URL: $baseUrl/api/bankda/confirm-payment" -ForegroundColor White
Write-Host "Body: $body" -ForegroundColor Gray
Write-Host ""

try {
    # POST 요청 실행
    $response = Invoke-RestMethod `
        -Uri "$baseUrl/api/bankda/confirm-payment" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop

    Write-Host "[3단계] API 응답 결과" -ForegroundColor Yellow
    Write-Host "응답:" -ForegroundColor White
    $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Green
    Write-Host ""

    # 결과 분석
    if ($response.return_code -eq 200) {
        Write-Host "✅ 성공! 입금 확인 처리 완료" -ForegroundColor Green
        Write-Host "DB에서 payment_status가 'confirmed'로 변경되었는지 확인하세요." -ForegroundColor Cyan
    } elseif ($response.return_code -eq 415) {
        Write-Host "⚠️  order_id 오류 발생" -ForegroundColor Yellow
        Write-Host "상세:" -ForegroundColor White
        $response.orders | ForEach-Object {
            Write-Host "  - $($_.order_id): $($_.description)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ 알 수 없는 응답" -ForegroundColor Red
    }

} catch {
    Write-Host "❌ API 호출 실패" -ForegroundColor Red
    Write-Host "오류: $($_.Exception.Message)" -ForegroundColor Red

    if ($_.Exception.Response) {
        Write-Host "상태 코드: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "응답 본문: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "테스트 완료" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
