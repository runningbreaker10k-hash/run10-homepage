# 뱅크다A API 테스트 스크립트

# 1. 실제 주문번호를 입력하세요 (DB에 있는 pending 상태의 주문)
$orderId = "d6948015-229a-42c3-9c5c-231b1b02c1d3"  # 조은영님 주문번호

# 2. Vercel 배포 URL을 입력하세요
$baseUrl = "https://your-domain.vercel.app"

Write-Host "=== 뱅크다A 자동 입금확인 API 테스트 ===" -ForegroundColor Cyan

# API 호출
$body = @{
    requests = @(
        @{ order_id = $orderId }
    )
} | ConvertTo-Json

Write-Host "`n요청 데이터:" -ForegroundColor Yellow
Write-Host $body

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/bankda/confirm-payment" -Method Post -Body $body -ContentType "application/json"

    Write-Host "`n응답:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10

    Write-Host "`n✅ API 호출 성공!" -ForegroundColor Green
    Write-Host "DB를 확인하여 payment_status가 'confirmed'로 변경되었는지 확인하세요." -ForegroundColor Yellow
}
catch {
    Write-Host "`n❌ API 호출 실패:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n=== 테스트 완료 ===" -ForegroundColor Cyan
