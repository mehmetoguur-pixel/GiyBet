# GitHub'a yüklemek için temiz kopya oluşturur (node_modules, .next vb. hariç)
# Kullanım: powershell -ExecutionPolicy Bypass -File scripts/prepare-github-upload.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path (Join-Path $root "package.json"))) {
    $root = Split-Path $PSScriptRoot -Parent
}

$outName = "GiyBet-github"
$outDir = Join-Path ([Environment]::GetFolderPath("Desktop")) $outName
$zipPath = Join-Path ([Environment]::GetFolderPath("Desktop")) "$outName.zip"

$excludeDirs = @(
    "node_modules",
    ".next",
    ".vercel",
    "out",
    "build",
    "coverage",
    ".git"
)

$excludeDirNames = @(
    ".gradle",
    "build"
)

Write-Host "Kaynak: $root"
Write-Host "Hedef:  $outDir"

if (Test-Path $outDir) {
    Remove-Item $outDir -Recurse -Force
}
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

function ShouldSkip($fullPath) {
    $rel = $fullPath.Substring($root.Length).TrimStart("\", "/")
    foreach ($d in $excludeDirs) {
        if ($rel -eq $d -or $rel.StartsWith("$d\") -or $rel.StartsWith("$d/")) {
            return $true
        }
    }
    $parts = $rel -split "[\\/]"
    foreach ($p in $parts) {
        if ($excludeDirNames -contains $p) { return $true }
    }
    if ($rel -like ".env*") { return $true }
    if ($rel -like "*.apk" -or $rel -like "*.aab") { return $true }
    if ($rel -like "android\local.properties") { return $true }
    return $false
}

$count = 0
Get-ChildItem $root -Recurse -File | ForEach-Object {
    if (ShouldSkip $_.FullName) { return }
    $rel = $_.FullName.Substring($root.Length).TrimStart("\", "/")
    $dest = Join-Path $outDir $rel
    $destParent = Split-Path $dest -Parent
    if (-not (Test-Path $destParent)) {
        New-Item -ItemType Directory -Path $destParent -Force | Out-Null
    }
    Copy-Item $_.FullName $dest -Force
    $count++
}

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}
Compress-Archive -Path $outDir -DestinationPath $zipPath -Force

$sizeMb = [math]::Round((Get-ChildItem $outDir -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)

Write-Host ""
Write-Host "Tamam: $count dosya kopyalandi (~$sizeMb MB)"
Write-Host "Klasor: $outDir"
Write-Host "ZIP:    $zipPath"
Write-Host ""
Write-Host "GitHub web yukleme icin bu klasoru veya ZIP'i kullan."
Write-Host "ONEMLI: .env.local dahil edilmedi (anahtarlar guvende)."
