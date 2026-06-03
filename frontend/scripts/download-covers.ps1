# Optional maintainer script — re-download paper cover JPEGs from Unsplash.
#
# IMPORTANT: The committed files under frontend/public/paper-covers/ are the
# source of truth for the app. Unsplash photo IDs expire or 404 over time;
# a failed download must NOT overwrite an existing good JPEG. After running,
# verify file sizes differ across categories and spot-check in the browser.
#
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File frontend/scripts/download-covers.ps1
#
$dir = Join-Path $PSScriptRoot "..\public\paper-covers"
$q = "ixlib=rb-4.0.3&auto=format&fit=crop&w=640&h=224&q=85"
Set-Location $dir

$map = @{
  "ai-1.jpg" = "photo-1677442136019-21780ecad995"
  "ai-2.jpg" = "photo-1485827404703-89b55fcc595e"
  "architecture-1.jpg" = "photo-1487958449943-ccc76565352d"
  "architecture-2.jpg" = "photo-1511818963802-90aebbac9247"
  "arts-1.jpg" = "photo-1460661419201-fd4bcdf72535"
  "arts-2.jpg" = "photo-1547891654-e66ed7ebb968"
  "biohacking-1.jpg" = "photo-1571019613454-1cb2f99b2d8b"
  "biohacking-2.jpg" = "photo-1517836357463-d25dfeac3438"
  "biology-1.jpg" = "photo-1530026405186-ed1f139313f8"
  "biology-2.jpg" = "photo-1576086218319-68c19feaa629"
  "business-1.jpg" = "photo-1454165804606-c3d57bc86b40"
  "business-2.jpg" = "photo-1556761175-b413da4baf72"
  "chemistry-1.jpg" = "photo-1532187863486-ab9a9ad31403"
  "chemistry-2.jpg" = "photo-1582719471384-894fbb16e074"
  "data-science-1.jpg" = "photo-1551288049-bebda4e38f71"
  "data-science-2.jpg" = "photo-1460925895917-afdab827c52f"
  "design-1.jpg" = "photo-1561070791-2526d30994b5"
  "design-2.jpg" = "photo-1586717791821-3f875a562061"
  "economics-1.jpg" = "photo-1611974789855-9c98a0b0360a"
  "economics-2.jpg" = "photo-1590283603385-17ffb3a7f29f"
  "education-1.jpg" = "photo-1503676260728-1c00da094a0b"
  "education-2.jpg" = "photo-1518152006812-edab29b069ac"
  "engineering-1.jpg" = "photo-1581091226825-a6a2a5aee158"
  "engineering-2.jpg" = "photo-1535378623769-b8f0a3d2a151"
  "fashion-1.jpg" = "photo-1445205170230-053b83016050"
  "fashion-2.jpg" = "photo-1469334031218-e382a71b716b"
  "gastronomy-1.jpg" = "photo-1414235077428-338989a2e8c0"
  "gastronomy-2.jpg" = "photo-1504674900247-0877df9cc836"
  "health-1.jpg" = "photo-1576091160399-112ba8d25d1d"
  "health-2.jpg" = "photo-1579684385127-1ef15b5a9519"
  "history-1.jpg" = "photo-1481627834876-b7833e8f5570"
  "history-2.jpg" = "photo-1471107349295-9b1ecf246e86"
  "law-1.jpg" = "photo-1589829545855-d5d963f06c4b"
  "law-2.jpg" = "photo-1450101499163-c8848c66ca85"
  "lifestyle-1.jpg" = "photo-1511632765486-a01980e01a18"
  "lifestyle-2.jpg" = "photo-1529156069898-49953e39b3ac"
  "maths-1.jpg" = "photo-1635070041078-e363dbe005cb"
  "maths-2.jpg" = "photo-1509228465518-324dd45745e3"
  "music-1.jpg" = "photo-1511379939023-ca7dab6279af"
  "music-2.jpg" = "photo-1493225457124-a3eb161ffa5f"
  "nature-1.jpg" = "photo-1501785888041-af3ef285b470"
  "nature-2.jpg" = "photo-1472214103451-9374bd1c798e"
  "nature-3.jpg" = "photo-1506905925346-21bda4d32df4"
  "philosophy-1.jpg" = "photo-1457369804613-52c61a468e7d"
  "philosophy-2.jpg" = "photo-1507003211169-0a1dd7228f2d"
  "physics-1.jpg" = "photo-1636466497215-26a378c0f9ed"
  "physics-2.jpg" = "photo-1532094349884-54311bbf67af"
  "politics-1.jpg" = "photo-1529107386315-d1ae706132a6"
  "politics-2.jpg" = "photo-1523580494863-6f3031224c94"
  "pop-culture-1.jpg" = "photo-1470229722913-7c0e2dbbafd3"
  "pop-culture-2.jpg" = "photo-1514525253161-7a46d19cd819"
  "psychology-1.jpg" = "photo-1551836022-deb4986cc585"
  "psychology-2.jpg" = "photo-1507003211169-0a1dd7228f2d"
  "science-1.jpg" = "photo-1524683745036-b46f52b8505a"
  "science-2.jpg" = "photo-1532094349884-54311bbf67af"
  "sociology-1.jpg" = "photo-1517245386807-bb43f82c33c4"
  "sociology-2.jpg" = "photo-1522071820081-009f0129c71c"
  "sports-1.jpg" = "photo-1461896836934-ffe607ba8211"
  "sports-2.jpg" = "photo-1552674605-db6ffd4facb5"
  "technology-1.jpg" = "photo-1778146476147-5f8d4bd03c79"
  "technology-2.jpg" = "photo-1762242298589-582f5f6c3fb1"
  "default-1.jpg" = "photo-1507842217343-583bb7270f66"
  "default-2.jpg" = "photo-1456513080510-7bf3a84b82f8"
}

$ok = 0; $fail = @()
foreach ($entry in $map.GetEnumerator()) {
  $url = "https://images.unsplash.com/$($entry.Value)?$q"
  $dest = $entry.Key
  $prevLen = if (Test-Path $dest) { (Get-Item $dest).Length } else { 0 }
  curl.exe -fsSL "$url" -o "$dest.tmp"
  if ((Test-Path "$dest.tmp") -and (Get-Item "$dest.tmp").Length -gt 2000) {
    Move-Item -Force "$dest.tmp" $dest
    $ok++
  } else {
    if (Test-Path "$dest.tmp") { Remove-Item "$dest.tmp" -Force }
    if ($prevLen -gt 2000) {
      Write-Host "Skipped (kept existing): $dest"
      $ok++
    } else {
      $fail += $entry.Key
    }
  }
}
Write-Host "OK: $ok / $($map.Count)"
if ($fail.Count) { Write-Host "Failed: $($fail -join ', ')" }
