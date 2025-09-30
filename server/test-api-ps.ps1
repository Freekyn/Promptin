$uri = "http://localhost:3000/api/analyze-intent"
$body = @{
    userRequest = "I need to create a marketing strategy for our new product launch"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "✅ API is working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Analysis:" -ForegroundColor Yellow
    Write-Host "- Intent: $($response.data.analysis.intent)"
    Write-Host "- Domain: $($response.data.analysis.domain)"
    Write-Host "- Framework: $($response.data.recommendedFramework.name)"
    Write-Host "- Confidence: $($response.data.confidence.frameworkMatch)%"
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}