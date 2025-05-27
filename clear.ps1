# Remove all contents of downloads\ if the directory exists
if (Test-Path "downloads") {
    Remove-Item "downloads\*" -Recurse -Force -ErrorAction SilentlyContinue
}

# Remove all contents of output\ if the directory exists
if (Test-Path "output") {
    Remove-Item "output\*" -Recurse -Force -ErrorAction SilentlyContinue
}