let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;

  const AudioContextClass =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) return null;

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

export function warmUpChatOpenSound() {
  const context = getAudioContext();
  if (!context || context.state !== "suspended") return;
  void context.resume();
}

export function playChatOpenChime() {
  const context = getAudioContext();
  if (!context) return;

  const play = () => {
    const startTime = context.currentTime;
    const notes = [523.25, 659.25];

    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      gain.connect(context.destination);

      const noteStart = startTime + index * 0.09;
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.055, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.2);

      oscillator.start(noteStart);
      oscillator.stop(noteStart + 0.22);
    });
  };

  if (context.state === "suspended") {
    void context.resume().then(play).catch(() => {});
    return;
  }

  play();
}
