$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true
$package = npm pack --json | ConvertFrom-Json
$tarball = Join-Path $PWD $package.filename
$prefix = Join-Path $env:RUNNER_TEMP 'ava-cli-session'
npm install --prefix $prefix --no-audit --no-fund $tarball
$bin = Join-Path $prefix 'node_modules/.bin'
$env:PATH = "$bin;$env:PATH"
$ava = Join-Path $bin 'ava.cmd'
$csv = Join-Path $prefix '销售 明细.csv'
$semantic = Join-Path $prefix '销售 口径.json'
$sql = Join-Path $prefix 'GMV total.sql'
@('status,amount', 'paid,150.50', 'cancelled,999.00') | Set-Content -Encoding utf8 $csv
'{"description":"Only paid orders count toward GMV."}' | Set-Content -Encoding utf8 $semantic
"SELECT sum(amount)::DOUBLE AS gmv FROM data WHERE status = 'paid'" | Set-Content -Encoding utf8 $sql

$id = (& $ava source $csv | ConvertFrom-Json).datasetId
if (!$id) { throw 'Missing datasetId' }
$key = Join-Path (node -p "require('os').homedir()") ".ava/sessions/ava-$id/key"
try {
    $schema = & $ava schema $id | ConvertFrom-Json
    if ($schema.language -ne 'duckdb-sql' -or $schema.models[0].columns[1].name -ne 'amount') {
        throw 'Unexpected dataset schema'
    }

    & $ava semantic $id --file $semantic | Out-Null
    $definition = & $ava semantic $id | ConvertFrom-Json
    if ($definition.description -ne 'Only paid orders count toward GMV.') { throw 'Semantic did not persist' }

    $result = & $ava query $id --dsl "@$sql" | ConvertFrom-Json
    if ($result.rowCount -ne 1 -or $result.data[0].gmv -ne 150.50) { throw 'Unexpected GMV' }

    $report = Join-Path $PWD 'skills/ava/scripts/report.mjs'
    $evidence = Join-Path $prefix 'query evidence'
    $recorded = node $report query $id --dsl $sql --source sales.csv --evidence $evidence | ConvertFrom-Json
    if (!$recorded.queryId -or $recorded.data[0].gmv -ne 150.50 -or !(Test-Path $recorded.evidenceOutput)) {
        throw 'The report recorder did not preserve the query evidence'
    }

    $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    $directoryAcl = Get-Acl (Split-Path $key)
    $acl = Get-Acl $key
    $grants = $acl.GetAccessRules($true, $true, [Security.Principal.SecurityIdentifier]) |
        Where-Object AccessControlType -eq Allow |
        ForEach-Object { $_.IdentityReference.Value }
    # SYSTEM and local administrators already have privileged access to user files.
    $allowed = @($sid, 'S-1-5-18', 'S-1-5-32-544')
    if (!$directoryAcl.AreAccessRulesProtected -or $sid -notin $grants -or ($grants | Where-Object { $_ -notin $allowed })) {
        throw "Unexpected key ACL (directory protected: $($directoryAcl.AreAccessRulesProtected), grants: $($grants -join ', '))"
    }

    # A client with an incorrect key must not receive a dataset response.
    $original = [IO.File]::ReadAllBytes($key)
    try {
        [IO.File]::WriteAllBytes($key, [byte[]]::new(32))
        $PSNativeCommandUseErrorActionPreference = $false
        $unauthenticated = & $ava schema $id 2>$null
        if ($LASTEXITCODE -eq 0 -or $unauthenticated) { throw 'The pipe accepted an incorrect key' }
    } finally {
        [IO.File]::WriteAllBytes($key, $original)
        $PSNativeCommandUseErrorActionPreference = $true
    }
} finally {
    $disposal = & $ava dispose $id | ConvertFrom-Json
    if (!$disposal.disposed -or (Test-Path $key)) { throw 'Dataset disposal left session state behind' }
}
