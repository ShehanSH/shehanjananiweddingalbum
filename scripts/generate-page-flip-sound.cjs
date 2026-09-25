const fs = require("fs");
const path = require("path");

function mulberry32(seed) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function writeWav(file, samples, sampleRate) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(value * 32767, 44 + i * 2);
  }
  fs.writeFileSync(file, buffer);
}

function makeLowpass(sampleRate, cutoff) {
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / sampleRate;
  const alpha = dt / (rc + dt);
  let previous = 0;
  return (input) => {
    previous += alpha * (input - previous);
    return previous;
  };
}

function makeHighpass(sampleRate, cutoff) {
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / sampleRate;
  const alpha = rc / (rc + dt);
  let previousX = 0;
  let previousY = 0;
  return (input) => {
    const next = alpha * (previousY + input - previousX);
    previousX = input;
    previousY = next;
    return next;
  };
}

const sampleRate = 44100;
const duration = 0.62;
const count = Math.floor(sampleRate * duration);
const random = mulberry32(20260926);
let b0 = 0;
let b1 = 0;
let b2 = 0;

function pink() {
  const white = random() * 2 - 1;
  b0 = 0.99765 * b0 + white * 0.099046;
  b1 = 0.963 * b1 + white * 0.2965164;
  b2 = 0.57 * b2 + white * 1.052691;
  return b0 + b1 + b2 + white * 0.1848;
}

const rustleLow = makeLowpass(sampleRate, 3800);
const rustleHigh = makeHighpass(sampleRate, 780);
const airLow = makeLowpass(sampleRate, 640);
const settleLow = makeLowpass(sampleRate, 1600);
const samples = new Float64Array(count);

for (let i = 0; i < count; i += 1) {
  const time = i / sampleRate;
  const noise = pink();

  let lift = 0;
  if (time < 0.2) {
    const envelope = Math.sin((time / 0.2) * Math.PI) * Math.exp(-time * 5.4);
    lift = rustleHigh(rustleLow(noise * 1.8)) * envelope * 0.42;
  }

  let air = 0;
  if (time > 0.05 && time < 0.36) {
    const unit = (time - 0.05) / 0.31;
    air = airLow(noise * 1.35) * Math.sin(unit * Math.PI) * 0.2;
  }

  let flutter = 0;
  if (time > 0.14 && time < 0.44) {
    const unit = (time - 0.14) / 0.3;
    const tremor = 0.6 + 0.4 * Math.sin(time * Math.PI * 2 * 18);
    flutter = rustleHigh(noise * 1.5) * Math.sin(unit * Math.PI) * tremor * 0.22;
  }

  let settle = 0;
  if (time > 0.33) {
    const later = time - 0.33;
    settle += settleLow(noise * 1.15) * Math.exp(-later * 8.5) * 0.28;
    settle += Math.sin(2 * Math.PI * 88 * later) * Math.exp(-later * 16) * 0.11;
    settle += Math.sin(2 * Math.PI * 46 * later) * Math.exp(-later * 12) * 0.07;
  }

  samples[i] = Math.tanh((lift + air + flutter + settle) * 1.05) * 0.62;
}

const output = path.join(__dirname, "..", "public", "sounds", "page-soft.wav");
writeWav(output, samples, sampleRate);
console.log(`Wrote ${output}`);
