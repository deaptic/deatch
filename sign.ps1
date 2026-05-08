$exe = "$PSScriptRoot\src-tauri\target\release\deatch.exe"
$cert = Get-Item Cert:\CurrentUser\My\9A778F2CF026C88E776B85610AA3A5386ACC4DBA

if (-not (Test-Path $exe)) {
    Write-Error "Executable not found. Run 'deno task tauri build' first."
    exit 1
}

Write-Host "Signing $exe..."
$result = Set-AuthenticodeSignature -FilePath $exe -Certificate $cert -TimestampServer "http://timestamp.digicert.com"

if ($result.Status -eq "Valid") {
    Write-Host "Signed successfully." -ForegroundColor Green
} else {
    Write-Error "Signing failed: $($result.StatusMessage)"
    exit 1
}
