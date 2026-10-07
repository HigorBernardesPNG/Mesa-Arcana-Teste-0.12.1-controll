$ErrorActionPreference = "Stop"

$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

Write-Host ""
Write-Host "Mesa Arcana 0.12.0 - geracao do instalador Windows" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js nao foi encontrado. Ele e necessario apenas na maquina de desenvolvimento."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm nao foi encontrado."
}

Write-Host "1/3 Preparando dependencias de desenvolvimento..." -ForegroundColor Yellow
if (Test-Path (Join-Path $raiz "package-lock.json")) {
    npm ci
} else {
    npm install
}
if ($LASTEXITCODE -ne 0) { throw "Falha ao preparar as dependencias." }

Write-Host "2/3 Validando e compilando o MVP..." -ForegroundColor Yellow
npm run validar:mvp
if ($LASTEXITCODE -ne 0) { throw "Falha na validacao do MVP. O instalador nao sera gerado." }

Write-Host "3/3 Gerando instalador NSIS..." -ForegroundColor Yellow
npx electron-builder --win nsis
if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar o instalador." }

$saida = Join-Path $raiz "dist-instalador"
Write-Host ""
Write-Host "Instalador gerado com sucesso:" -ForegroundColor Green
Write-Host (Join-Path $saida "Mesa-Arcana-Setup-0.12.0.exe") -ForegroundColor Green
Write-Host ""
