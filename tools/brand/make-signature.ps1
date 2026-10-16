# Renders the photographer's mark used on every gallery photo: tools\brand\signature.png (white on transparent).
# Lockup:  [NT monogram in a thin ring] | NAZIH TALBI
#                                       | PHOTOGRAPHY
# Run again after changing the text:  powershell -ExecutionPolicy Bypass -File tools\brand\make-signature.ps1
param([string]$Name = 'NAZIH TALBI', [string]$Sub = 'PHOTOGRAPHY', [string]$Mono = 'NT', [string]$Out = "$PSScriptRoot\signature.png")
Add-Type -AssemblyName System.Drawing
$famName = New-Object Drawing.FontFamily 'Bahnschrift SemiBold Condensed'
$famSub = New-Object Drawing.FontFamily 'Bahnschrift Light SemiCondensed'
$famMono = New-Object Drawing.FontFamily 'Bahnschrift Light Condensed'
$fmt = [Drawing.StringFormat]::GenericTypographic
$probe = New-Object Drawing.Bitmap 10, 10; $gp = [Drawing.Graphics]::FromImage($probe)
function Track($fam, $em, $text, $track) {   # glyph advances with letter spacing
  $f = New-Object Drawing.Font $fam, $em, ([Drawing.FontStyle]::Regular), ([Drawing.GraphicsUnit]::Pixel); $ws = @()
  foreach ($ch in $text.ToCharArray()) { $w = $gp.MeasureString([string]$ch, $f, 10000, $fmt).Width; if ($ch -eq ' ') { $w = $em * 0.28 }; $ws += $w }
  @{ ws = $ws; total = ($ws | Measure-Object -Sum).Sum + $track * ($text.Length - 1) } }
function Draw($path, $fam, $em, $text, $track, $x, $y, $ws) { $i = 0; foreach ($ch in $text.ToCharArray()) { if ($ch -ne ' ') { $path.AddString([string]$ch, $fam, 0, $em, (New-Object Drawing.PointF $x, $y), $fmt) }; $x += $ws[$i] + $track; $i++ } }
function Top($fam, $em, $boxTop) { $asc = $fam.GetCellAscent(0) / $fam.GetEmHeight(0) * $em; $boxTop - ($asc - $em * 0.70) }   # y so that cap tops sit at $boxTop

$S = 4                                                     # supersampling
$nameEm = 150 * $S; $nameTr = 0.16 * $nameEm; $subEm = 58 * $S; $subTr = 0.62 * $subEm
$tn = Track $famName $nameEm $Name $nameTr; $ts = Track $famSub $subEm $Sub $subTr
$capN = $nameEm * 0.70; $capS = $subEm * 0.70; $gapLines = 40 * $S
$blockH = $capN + $gapLines + $capS
$ring = [int]($blockH * 1.0); $stroke = 4.5 * $S; $hair = 3 * $S; $gapA = 56 * $S
$textW = [Math]::Max($tn.total, $ts.total)
$pad = 12 * $S; $W = [int]($pad * 2 + $ring + $gapA * 2 + $hair + $textW); $H = [int]($pad * 2 + $ring)
$bmp = New-Object Drawing.Bitmap $W, $H, ([Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [Drawing.Graphics]::FromImage($bmp); $g.SmoothingMode = 'AntiAlias'; $g.Clear([Drawing.Color]::Transparent)
$white = [Drawing.Brushes]::White
# monogram ring + letters
$pen = New-Object Drawing.Pen ([Drawing.Color]::White), $stroke
$g.DrawEllipse($pen, $pad + $stroke / 2, $pad + $stroke / 2, $ring - $stroke, $ring - $stroke)
$monoEm = $ring * 0.50; $tm = Track $famMono $monoEm $Mono ($monoEm * 0.04)
$pm = New-Object Drawing.Drawing2D.GraphicsPath ([Drawing.Drawing2D.FillMode]::Winding)
Draw $pm $famMono $monoEm $Mono ($monoEm * 0.04) ($pad + ($ring - $tm.total) / 2) (Top $famMono $monoEm ($pad + ($ring - $monoEm * 0.70) / 2)) $tm.ws
$g.FillPath($white, $pm)
# hairline divider
$hx = $pad + $ring + $gapA; $g.FillRectangle($white, [float]$hx, [float]($pad + $ring * 0.08), [float]$hair, [float]($ring * 0.84))
# name + subtitle (left aligned, vertically centred on the ring)
$tx = $hx + $hair + $gapA; $y0 = $pad + ($ring - $blockH) / 2
$pt = New-Object Drawing.Drawing2D.GraphicsPath ([Drawing.Drawing2D.FillMode]::Winding)
Draw $pt $famName $nameEm $Name $nameTr $tx (Top $famName $nameEm $y0) $tn.ws
Draw $pt $famSub $subEm $Sub $subTr $tx (Top $famSub $subEm ($y0 + $capN + $gapLines)) $ts.ws
$g.FillPath($white, $pt); $g.Dispose()
# downsample for clean edges
$fin = New-Object Drawing.Bitmap ([int]($W / $S)), ([int]($H / $S)), ([Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g2 = [Drawing.Graphics]::FromImage($fin); $g2.InterpolationMode = 'HighQualityBicubic'; $g2.CompositingMode = 'SourceCopy'; $g2.DrawImage($bmp, 0, 0, $fin.Width, $fin.Height); $g2.Dispose()
$fin.Save($Out, [Drawing.Imaging.ImageFormat]::Png); "$Out  ($($fin.Width) x $($fin.Height))"
$bmp.Dispose(); $fin.Dispose(); $gp.Dispose(); $probe.Dispose()
