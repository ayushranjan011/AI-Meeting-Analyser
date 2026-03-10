$ErrorActionPreference = "Stop"

function Start-ServiceWindow {
    param(
        [Parameter(Mandatory = $true)][string]$Title,
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [Parameter(Mandatory = $true)][string]$Command
    )

    $safeWorkingDirectory = $WorkingDirectory.Replace("'", "''")
    $safeTitle = $Title.Replace("'", "''")

    $psCommand = "Set-Location -LiteralPath '$safeWorkingDirectory'; " +
        "`$Host.UI.RawUI.WindowTitle = '$safeTitle'; " +
        $Command

    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-Command", $psCommand
    ) -WorkingDirectory $WorkingDirectory | Out-Null
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$aiDir = Join-Path $root "Ai service"
$backendDir = Join-Path $root "Backend"
$frontendDir = Join-Path $root "frontend\frontend"
$pythonExe = Join-Path $aiDir "venv311\Scripts\python.exe"
$aiApp = Join-Path $aiDir "app.py"

if (-not (Test-Path -LiteralPath $pythonExe)) {
    throw "Python executable not found: $pythonExe"
}

if (-not (Test-Path -LiteralPath $aiApp)) {
    throw "AI app.py not found: $aiApp"
}

if (-not (Test-Path -LiteralPath $backendDir)) {
    throw "Backend directory not found: $backendDir"
}

if (-not (Test-Path -LiteralPath $frontendDir)) {
    throw "Frontend directory not found: $frontendDir"
}

Write-Host "Starting all services..." -ForegroundColor Cyan

$aiStartCommand = "`$env:AI_USE_MTCNN = if ([string]::IsNullOrWhiteSpace(`$env:AI_USE_MTCNN)) { 'true' } else { `$env:AI_USE_MTCNN }; & '$pythonExe' '$aiApp'"

Start-ServiceWindow `
    -Title "AI Service :5000" `
    -WorkingDirectory $aiDir `
    -Command $aiStartCommand

Write-Host "Waiting for AI service health on :5000..." -ForegroundColor Cyan
$aiReady = $false
for ($i = 0; $i -lt 150; $i++) {
    try {
        $response = Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:5000/health" -TimeoutSec 2
        if ($response.status -eq "ok") {
            $aiReady = $true
            break
        }
    } catch {
    }
    Start-Sleep -Seconds 1
}

if (-not $aiReady) {
    Write-Host "AI service did not become healthy within 150 seconds. Continuing startup..." -ForegroundColor Yellow
    Write-Host "Check the 'AI Service :5000' window logs for TensorFlow/FER errors." -ForegroundColor Yellow
} else {
    Write-Host "AI service is healthy on :5000" -ForegroundColor Green

    $warmupImage = Join-Path $root "frontend\frontend\public\logo192.png"
    if (Test-Path -LiteralPath $warmupImage) {
        Write-Host "Warming up AI detector (first model load)..." -ForegroundColor Cyan
        try {
            & curl.exe -s --max-time 120 -X POST "http://127.0.0.1:5000/detect" -F "frame=@$warmupImage" | Out-Null
            Write-Host "AI detector warm-up complete." -ForegroundColor Green
        } catch {
            Write-Host "AI detector warm-up failed. Live requests will warm it up automatically." -ForegroundColor Yellow
        }
    }
}

Start-ServiceWindow `
    -Title "Backend API :4000" `
    -WorkingDirectory $backendDir `
    -Command "if (-not (Test-Path -LiteralPath 'node_modules')) { npm install }; npm start"

Start-ServiceWindow `
    -Title "Frontend UI :3000" `
    -WorkingDirectory $frontendDir `
    -Command "if (-not (Test-Path -LiteralPath 'node_modules')) { npm install }; npm start"

Write-Host "All service windows launched." -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Backend:  http://127.0.0.1:4000/health" -ForegroundColor Yellow
Write-Host "AI API:   http://127.0.0.1:5000/health" -ForegroundColor Yellow
Write-Host "Tip: If Faces remain 0, relaunch with `$env:AI_USE_MTCNN='false' before npm start." -ForegroundColor Yellow
