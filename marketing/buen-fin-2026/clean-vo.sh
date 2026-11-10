#!/usr/bin/env bash
# bash clean-vo.sh <entrada> <n> <desde_s> <hasta_s>  → audio/vo/s<n>.wav (mono 48 kHz, limpio)
# Silencios internos > 0.35 s se acortan; inicio y final sin silencio.
set -euo pipefail
cd "$(dirname "$0")"
in=$1 n=$2 from=$3 to=$4
mkdir -p audio/vo
ffmpeg -v error -y -ss "$from" -to "$to" -i "$in" -ac 1 -ar 48000 -af "\
highpass=f=80,afftdn=nf=-45,\
silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.03:stop_periods=-1:stop_duration=0.35:stop_threshold=-40dB:stop_silence=0.2,\
acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2,\
loudnorm=I=-16:TP=-2:LRA=7,\
afade=t=in:d=0.01" "audio/vo/s$n.wav"
