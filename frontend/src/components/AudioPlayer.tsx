import React, { useRef, useEffect, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface AudioPlayerProps {
  id: string;
  url: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ id, url }) => {
  const { state, dispatch } = useAppContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const isGloballyPlaying = state.currentlyPlayingId === id;

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        dispatch({ type: 'SET_PLAYING_ID', payload: null });
      };
    }

    // Always respect centralized speed setting
    audioRef.current.playbackRate = state.settings.playbackSpeed;

    if (isGloballyPlaying && audioRef.current.paused) {
      audioRef.current.play().catch((e) => console.warn('Playback failed', e));
      setIsPlaying(true);
    } else if (!isGloballyPlaying && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isGloballyPlaying, url, dispatch, state.settings.playbackSpeed]);

  const togglePlay = () => {
    if (isPlaying) {
      dispatch({ type: 'SET_PLAYING_ID', payload: null });
    } else {
      // Stop any other playing audio first
      dispatch({ type: 'SET_PLAYING_ID', payload: id });
    }
  };

  return (
    <button
      onClick={togglePlay}
      className="p-2 rounded-full bg-primary/20 hover:bg-primary/40 transition-colors text-primary"
      aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
    >
      {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
    </button>
  );
};
