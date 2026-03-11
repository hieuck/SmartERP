# Test Registration API
$baseUrl = "http://localhost:3000"
$endpoint = "$baseUrl/auth/register"

$payload = @{
    companyName = "Test Company"
    fullName = "John Doe"
    email = "test@example.com"
    password = "SecurePass123!"
    phone = "0901234567"
} | ConvertTo-Json

Write-Host "Testing Registration API..."
Write-Host "Endpoint: $endpoint"
Write-Host "Payload: $payload"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $endpoint `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload `
        -ErrorAction Stop

    Write-Host "✅ SUCCESS - Status: $($response.StatusCode)"
    Write-Host "Response:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ FAILED - Status: $($_.Exception.Response.StatusCode)"
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
