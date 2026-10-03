// Los navegadores bloquean el audio hasta que la persona toca la pantalla,
// por eso desbloquearAudio() se llama desde un botón.
let ctx = null;

export function desbloquearAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = ctx || new AC();
  if (ctx.state === "suspended") ctx.resume();
}

export function audioListo() {
  return !!ctx && ctx.state === "running";
}

// "Ding-dong" generado con Web Audio, sin archivos de sonido
export function campana() {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  [
    [880, 0],
    [660, 0.38],
  ].forEach(([freq, retraso]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0 + retraso);
    gain.gain.exponentialRampToValueAtTime(0.45, t0 + retraso + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + retraso + 1.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0 + retraso);
    osc.stop(t0 + retraso + 1.2);
  });
}

// Lee el turno en voz alta con la voz del sistema
export function anunciar(texto) {
  if (!("speechSynthesis" in window)) return;
  const voz = new SpeechSynthesisUtterance(texto);
  voz.lang = "es-MX";
  voz.rate = 0.92;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(voz);
}

// "C-012" + "Ventanilla 2" -> "Turno C 12. Pasar a Ventanilla 2"
export function textoAnuncio(turno) {
  const ventanilla = turno.ventanilla?.nombre ?? "ventanilla";
  return `Turno ${turno.servicio?.prefijo ?? ""} ${turno.numero}. Pasar a ${ventanilla}`;
}
