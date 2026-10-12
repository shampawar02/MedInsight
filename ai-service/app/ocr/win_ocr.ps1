param (
    [Parameter(Mandatory=$true)]
    [string]$ImagePath
)

$ErrorActionPreference = "Stop"

try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime
    $asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
        $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' 
    }[0]

    Function Await-WinRtTask($WinRtTask, $ResultType) {
        $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
        $netTask = $asTask.Invoke($null, @($WinRtTask))
        $netTask.Wait(-1) | Out-Null
        return $netTask.Result
    }

    [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
    [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType = WindowsRuntime] | Out-Null
    [Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType = WindowsRuntime] | Out-Null

    $resolved = (Resolve-Path $ImagePath).Path
    $file = Await-WinRtTask ([Windows.Storage.StorageFile]::GetFileFromPathAsync($resolved)) ([Windows.Storage.StorageFile])
    $stream = Await-WinRtTask ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    $decoder = Await-WinRtTask ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap = Await-WinRtTask ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])

    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if ($null -eq $engine) {
        $lang = [Windows.Globalization.Language]::new("en-US")
        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
    }

    if ($null -eq $engine) {
        Write-Error "No Windows OCR engine available for installed languages"
        exit 1
    }

    $ocrResult = Await-WinRtTask ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
    
    # Collect all words with spatial coordinates
    $words = @()
    foreach ($line in $ocrResult.Lines) {
        foreach ($word in $line.Words) {
            $rect = $word.BoundingRect
            $words += [PSCustomObject]@{
                Text = $word.Text
                X = [double]$rect.X
                Y = [double]$rect.Y
                Width = [double]$rect.Width
                Height = [double]$rect.Height
                MidY = [double]($rect.Y + ($rect.Height / 2.0))
            }
        }
    }

    if ($words.Count -eq 0) {
        exit 0
    }

    # Group words by vertical baseline (MidY) using running line average
    $sortedWords = $words | Sort-Object MidY

    $lines = @()
    $currentLine = @()

    foreach ($w in $sortedWords) {
        if ($currentLine.Count -eq 0) {
            $currentLine += $w
        } else {
            $avgMidY = ($currentLine | Measure-Object -Property MidY -Average).Average
            if ([Math]::Abs($w.MidY - $avgMidY) -le 18.0) {
                $currentLine += $w
            } else {
                $sortedLine = $currentLine | Sort-Object X
                $lines += ($sortedLine | ForEach-Object { $_.Text }) -join " "
                $currentLine = @($w)
            }
        }
    }
    if ($currentLine.Count -gt 0) {
        $sortedLine = $currentLine | Sort-Object X
        $lines += ($sortedLine | ForEach-Object { $_.Text }) -join " "
    }

    foreach ($l in $lines) {
        Write-Output $l
    }
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
