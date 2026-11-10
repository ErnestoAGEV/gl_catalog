# python audio.py → audio/voice.wav, audio/music_ducked.wav, audio/mix.wav
# Música original sintetizada (120 BPM, F mayor) + golpes y whooshes en los cues de timeline.js + voz con ducking.
# Basado en brag-output/work/audio4.py.
import json, os, subprocess, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
T = json.loads(subprocess.check_output(['node', '-p', "JSON.stringify(require('./timeline.js'))"], text=True, encoding='utf-8'))

SR, DUR, BPM = 48000, float(T['duration']), T['bpm']
BEAT = 60 / BPM
BAR = 4 * BEAT
N = int(round(SR * DUR))
rng = np.random.default_rng(7)


def hz(m): return 440 * 2 ** ((m - 69) / 12)


def bus():
    return np.zeros(N), np.zeros(N)


def add(b, sig, t, gain=1.0, pan=0.0):
    L, R = b
    i = int(round(t * SR))
    if i < 0:
        sig, i = sig[-i:], 0
    j = min(N, i + len(sig))
    if i >= N or j <= i:
        return
    s = sig[: j - i] * gain
    L[i:j] += s * np.sqrt((1 - pan) / 2) * 1.414
    R[i:j] += s * np.sqrt((1 + pan) / 2) * 1.414


def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def kick(depth=1.0):
    n = int(.35 * SR); t = np.arange(n) / SR
    f = 48 + 90 * depth * np.exp(-t / .03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .16) * np.minimum(1, t / .002)


def clap():
    n = int(.25 * SR); t = np.arange(n) / SR
    x = np.diff(rng.standard_normal(n), prepend=0)
    return x * np.exp(-t / .06) * .5


def hat(open_=False):
    n = int((.18 if open_ else .05) * SR); t = np.arange(n) / SR
    x = np.diff(rng.standard_normal(n), prepend=0)
    return x * np.exp(-t / (.05 if open_ else .012)) * .35


def pluck(m, dur=.45, bright=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    s = sum(np.sin(2 * np.pi * f * k * t) * (bright ** (k - 1)) / k for k in range(1, 6))
    return s * env(n, .004, dur / 3.5)


def pad(ms, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * hz(m) * t + np.sin(2 * np.pi * .3 * t)) for m in ms)
    a = np.minimum(1, t / .02) * np.minimum(1, (dur - t) / .4).clip(0)
    return s * a * np.exp(-t / 2.5)


def bass(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    s = np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t)
    return s * np.minimum(1, t / .006) * np.minimum(1, (dur - t) / .03).clip(0)


def whoosh(dur=.45):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    y = np.zeros(n); a = np.exp(-2 * np.pi * (300 + 5000 * (t / dur) ** 2) / SR); acc = 0.0
    for i in range(n):
        acc = a[i] * acc + (1 - a[i]) * x[i]; y[i] = acc
    out = y * (t / dur) ** 2 * .9
    out[-int(.015 * SR):] *= np.linspace(1, 0, int(.015 * SR))  # sin corte seco en el pico
    return out


def boom():
    # golpe para los porcentajes: kick profundo + sub + ráfaga de ruido
    n = int(.9 * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t / .05)) / SR) * np.exp(-t / .4)
    noise = np.diff(rng.standard_normal(n), prepend=0) * np.exp(-t / .03) * .6
    k = np.zeros(n); kk = kick(1.4); k[:len(kk)] = kk
    return (sub * .9 + noise + k * .8) * np.minimum(1, t / .002)


# ---------- música ----------
music = bus()
PROG = [[53, 57, 60, 65], [57, 60, 64, 69], [58, 62, 65, 70], [60, 64, 67, 72]]   # F Am Bb C
ROOT = [41, 45, 46, 48]
NB = int(np.ceil(DUR / BAR))
for bar in range(NB):
    t0 = bar * BAR; ch = PROG[bar % 4]; root = ROOT[bar % 4]
    last = bar == NB - 1
    if last:  # cierre: acorde que resuena
        add(music, kick(), t0, .8); add(music, pad(PROG[0], BAR + 1), t0, .06)
        for m in PROG[0]: add(music, pluck(m + 12, 1.6, .6), t0, .09, rng.uniform(-.4, .4))
        continue
    for b in range(4):
        add(music, kick(), t0 + b * BEAT, .85)
        add(music, hat(open_=(b % 2 == 1)), t0 + b * BEAT + BEAT / 2, .45, .3)
        add(music, hat(), t0 + b * BEAT + BEAT / 4 * 3, .2, -.3)
        if b in (1, 3): add(music, clap(), t0 + b * BEAT, .45)
        add(music, bass(root, BEAT * .42), t0 + b * BEAT + BEAT / 2, .38)
    for e in (0, 3, 6):
        for m in ch: add(music, pluck(m + 12, .4, .55), t0 + e * BEAT / 2, .07, rng.uniform(-.5, .5))
    add(music, pad(ch, BAR), t0, .035)

# ---------- efectos en los cues ----------
sfx = bus()  # golpes y whooshes: bus propio, casi no se bajan con la voz
W = whoosh()
for s in T['scenes']:
    for c in s['cues']:
        at = s['start'] + c['at']
        if c['type'] == 'hit':
            add(sfx, boom(), at, .5)
        else:
            add(sfx, W, at + 0.2 - len(W) / SR, .14, rng.uniform(-.3, .3))  # culmina a media animación

L, R = music
for d, g in ((.023, .18), (.037, .14), (.061, .1)):
    k = int(d * SR); L[k:] += R[:-k] * g; R[k:] += L[:-k] * g * .9
mus = np.stack([L, R], 1)
mus = np.tanh(mus * 1.1); mus *= .89 / np.abs(mus).max()

# ---------- voz ----------
voice = np.zeros(N)
for i, s in enumerate(T['scenes']):
    with wave.open(f'audio/vo/s{i + 1}.wav') as w:
        assert w.getframerate() == SR and w.getnchannels() == 1 and w.getsampwidth() == 2
        x = np.frombuffer(w.readframes(w.getnframes()), '<i2') / 32768
    j = int(round(s['voStart'] * SR)); voice[j:j + len(x)] += x[: N - j]
voice *= .9 / np.abs(voice).max()

# ducking: música a ~15% bajo la voz (ataque 60 ms, relajación 350 ms)
lvl = np.abs(voice); envl = np.zeros(N); a, r = np.exp(-1 / (.06 * SR)), np.exp(-1 / (.35 * SR)); e = 0.0
step = 48
for i in range(0, N, step):
    v = lvl[i:i + step].max(); c = a if v > e else r; e = c ** step * e + (1 - c ** step) * v; envl[i:i + step] = e
LOOK = int(.12 * SR)  # anticipación: la música baja un poco antes de que entre la voz
envl = np.concatenate([envl[LOOK:], np.full(LOOK, envl[-1])])
duck = 1 - .7 * np.clip(envl / .15, 0, 1)
fade = np.minimum(1, (DUR - np.arange(N) / SR) / 1.0)[:, None]
music_ducked = mus * (duck[:, None] * .55) * fade
voice_st = np.repeat(voice[:, None], 2, 1)
sfx_st = np.stack(sfx, 1) * (1 - .4 * np.clip(envl / .15, 0, 1))[:, None] * .55 * fade

mix = music_ducked + sfx_st + voice_st  # suma lineal, sin saturar la voz
peak = 10 ** (-2.1 / 20)
g = peak / np.abs(mix).max()


def write(name, x):
    with wave.open(f'audio/{name}', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())


# voice.wav y music_ducked.wav llevan la misma ganancia que en la mezcla, para que check.mjs compare niveles reales
write('voice.wav', voice_st * g)
write('music_ducked.wav', music_ducked * g)
write('sfx.wav', sfx_st * g)
write('mix.wav', mix * g)
print('ok', DUR, 's')
