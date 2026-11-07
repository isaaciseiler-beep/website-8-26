/** Album-space motion: a restrained spring for release, faster tracking under a finger. */
export function stepMusicSpring(position: number, velocity: number, target: number, seconds: number, tracking = false) {
  const omega = tracking ? 28 : 16;
  const damping = tracking ? 1 : 0.84;
  const elapsed = Math.max(0, Math.min(seconds, 0.05));
  const displacement = position - target;
  if (damping === 1) {
    const integrated = (velocity + omega * displacement) * elapsed;
    const decay = Math.exp(-omega * elapsed);
    return { position: target + (displacement + integrated) * decay, velocity: (velocity - omega * integrated) * decay };
  }
  const decayRate = omega * damping;
  const frequency = omega * Math.sqrt(1 - damping * damping);
  const decay = Math.exp(-decayRate * elapsed);
  const sine = Math.sin(frequency * elapsed);
  const cosine = Math.cos(frequency * elapsed);
  const coefficient = (velocity + decayRate * displacement) / frequency;
  return {
    position: target + decay * (displacement * cosine + coefficient * sine),
    velocity: decay * (velocity * cosine - (decayRate * velocity + omega * omega * displacement) / frequency * sine),
  };
}

/** Increasing resistance with a small, finite amount of give. */
export const musicRubberBand = (distance: number, limit = 0.16) => Math.sign(distance) * limit * (1 - Math.exp(-Math.abs(distance) / limit));

export function musicDragPull(distance: number, travel: number, atEdge: boolean) {
  const units = distance / Math.max(120, travel);
  if (atEdge) return musicRubberBand(units, 0.12);
  return Math.abs(units) <= 1 ? units : Math.sign(units) * (1 + Math.abs(musicRubberBand(Math.abs(units) - 1, 0.12)));
}

/** A gesture consumes one album; the decaying trackpad tail cannot turn another page. */
export function createMusicWheelGesture() {
  let previousTime = -Infinity;
  let accumulation = 0;
  let consumed = 0;
  return (delta: number, now: number, cover: number) => {
    const direction = Math.sign(delta);
    if (!direction || !Number.isFinite(delta)) return { step: 0, pull: 0 };
    const reversed = consumed !== 0 && direction !== consumed && Math.abs(delta) >= 12;
    if (now - previousTime > 180 || reversed) { accumulation = 0; consumed = 0; }
    previousTime = now;
    if (consumed) return { step: 0, pull: 0 };
    if (accumulation && direction !== Math.sign(accumulation)) accumulation = 0;
    accumulation += delta;
    const threshold = Math.max(60, Math.min(90, cover * 0.22));
    if (Math.abs(accumulation) >= threshold) {
      consumed = direction;
      accumulation = 0;
      return { step: direction, pull: 0 };
    }
    return { step: 0, pull: musicRubberBand(accumulation / threshold * 0.22, 0.2) };
  };
}
