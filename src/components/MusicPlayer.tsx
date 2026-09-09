import { useEffect, useRef, useState } from "react";

type MusicPlayerProps = {
  autoStart: boolean;
  src: string;
};

export function MusicPlayer({ autoStart, src }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasAutoStartedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!autoStart || hasAutoStartedRef.current) {
      return;
    }
    hasAutoStartedRef.current = true;
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.volume = 0.45;
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [autoStart]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (audio.paused) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  return (
    <>
      <audio ref={audioRef} src={src} loop />
      <button
        type="button"
        className="music-toggle"
        onClick={toggle}
        aria-label={isPlaying ? "Pausar música" : "Reproducir música"}
      >
        {isPlaying ? "❚❚" : "▶"}
      </button>
    </>
  );
}
