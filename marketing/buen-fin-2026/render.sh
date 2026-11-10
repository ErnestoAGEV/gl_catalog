#!/usr/bin/env bash
# bash render.sh → out/gl-buen-fin-2026.mp4 (regenera la mezcla, la verifica y une cuadros + audio)
set -euo pipefail
cd "$(dirname "$0")"
python audio.py
node check.mjs audio
node frames.cjs all
mkdir -p out
ffmpeg -v error -y -framerate 30 -i frames/f%04d.png -i audio/mix.wav \
  -vf "scale=out_color_matrix=bt709:out_range=tv,setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv" \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -b:a 192k -shortest -movflags +faststart \
  out/gl-buen-fin-2026.mp4
echo out/gl-buen-fin-2026.mp4
