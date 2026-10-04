# added by gyc 2026-10-04：安装：只复制插件运行文件，保留个人 marketplace 的其他插件与批准设置。
$ErrorActionPreference = 'Stop'
$repoDir = Split-Path -Parent $PSScriptRoot
$userDir = [Environment]::GetFolderPath('UserProfile')
$pluginDir = Join-Path $userDir '.codex/plugins/local/normify'
$catalogPath = Join-Path $userDir '.agents/plugins/marketplace.json'
if (-not (Test-Path -LiteralPath (Join-Path $repoDir 'dist/normify.mjs'))) {
    throw '请先运行 npm run build:codex'
}
New-Item -ItemType Directory -Path $pluginDir -Force | Out-Null
foreach ($entry in @('.codex-plugin', 'dist', 'skills', 'docs', '.mcp.json', 'LICENSE')) {
    Copy-Item -LiteralPath (Join-Path $repoDir $entry) -Destination $pluginDir -Recurse -Force
}
New-Item -ItemType Directory -Path (Split-Path -Parent $catalogPath) -Force | Out-Null
if (Test-Path -LiteralPath $catalogPath) {
    $catalog = Get-Content -LiteralPath $catalogPath -Raw -Encoding utf8 | ConvertFrom-Json -AsHashtable
} else {
    $catalog = @{ name = 'personal'; interface = @{ displayName = 'Personal' }; plugins = @() }
}
$entry = @{
    name = 'normify'
    source = @{ source = 'local'; path = './.codex/plugins/local/normify' }
    policy = @{ installation = 'AVAILABLE'; authentication = 'ON_INSTALL' }
    category = 'Productivity'
}
$catalog.plugins = @($catalog.plugins | Where-Object { $_.name -ne 'normify' }) + @($entry)
$catalog | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath $catalogPath -Encoding utf8NoBOM
& codex plugin add "normify@$($catalog.name)"
if ($LASTEXITCODE -ne 0) { throw 'Codex 插件安装失败' }
Write-Output "Normify 已安装；重启或新建会话后检查工具目录。插件源：$pluginDir"
