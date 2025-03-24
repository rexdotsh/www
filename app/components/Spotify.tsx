'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SpotifyTrack {
  isPlaying: boolean;
  name: string;
  artist: string;
  album: string;
  image: Array<{
    '#text': string;
    size: 'small' | 'medium' | 'large';
  }>;
  url: string;
  id: string;
}

const SpotifyNowPlaying = () => {
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTrackId = useRef<string | null>(null);

  const fetchPreviewUrl = useCallback(async (trackId: string) => {
    try {
      const response = await fetch(`/api/spotify/preview/${trackId}`);
      const data = await response.json();
      return data.url;
    } catch (err) {
      console.error('Failed to fetch preview URL:', err);
      return null;
    }
  }, []);

  // preload preview url when track changes
  useEffect(() => {
    if (track?.id && track.id !== lastTrackId.current) {
      lastTrackId.current = track.id;
      fetchPreviewUrl(track.id).then((url) => {
        if (url) setPreviewUrl(url);
      });
    }
  }, [track?.id, fetchPreviewUrl]);

  const fetchTrack = useCallback(async () => {
    try {
      const res = await fetch('/api/spotify/playing');
      const data = await res.json();
      setTrack(data);
    } catch (err) {
      console.error('Failed to fetch track:', err);
    }
  }, []);

  const getAlbumArt = useCallback(() => {
    const images = track?.image || [];
    return images.find((img) => img.size === 'medium')?.['#text'] || '';
  }, [track]);
  const handlePlayPreview = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!track) return;

    try {
      // if we don't have preview url yet (somehow), fetch it
      if (!previewUrl) {
        const url = await fetchPreviewUrl(track.id);
        if (!url) {
          console.error('No preview URL available');
          return;
        }
        setPreviewUrl(url);
      }

      if (!audioRef.current && previewUrl) {
        const audio = new Audio(previewUrl);
        audio.volume = 0;
        audio.addEventListener('ended', () => setIsPlaying(false));
        audio.addEventListener('error', () => setIsPlaying(false));
        audioRef.current = audio;
      }

      if (isPlaying && audioRef.current) {
        setIsPlaying(false);
        fadeAudioVolume(audioRef.current, audioRef.current.volume, 0).then(
          () => {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
          },
        );
      } else if (audioRef.current) {
        audioRef.current.volume = 0;
        setIsPlaying(true);
        try {
          await audioRef.current.play();
          fadeAudioVolume(audioRef.current, 0, 0.2).catch(() => {
            setIsPlaying(false);
          });
        } catch (error) {
          console.error('Failed to play audio:', error);
          setIsPlaying(false);
        }
      }
    } catch (error) {
      console.error('Error in handlePlayPreview:', error);
      setIsPlaying(false);
    }
  };

  const fadeAudioVolume = (
    audio: HTMLAudioElement,
    start: number,
    end: number,
  ) => {
    return new Promise<void>((resolve) => {
      const step = start < end ? 0.02 : -0.04;
      const interval = setInterval(() => {
        const newVolume = audio.volume + step;

        if ((step > 0 && newVolume >= end) || (step < 0 && newVolume <= end)) {
          audio.volume = end;
          clearInterval(interval);
          resolve();
        } else {
          audio.volume = newVolume;
        }
      }, 150);
    });
  };

  const checkVisibility = useCallback(() => {
    const minHeightForSpotify = 900;
    const isMobileScreen = window.innerWidth < 768;
    setShouldShow(isMobileScreen || window.innerHeight >= minHeightForSpotify);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const poll = () => {
      fetchTrack();
      pollTimeoutRef.current = setTimeout(poll, 30000);
    };

    checkVisibility();
    window.addEventListener('resize', checkVisibility);
    poll();

    return () => {
      window.removeEventListener('resize', checkVisibility);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [checkVisibility, fetchTrack]);

  if (!track || !shouldShow) return null;

  return (
    <div className="fixed bottom-20 md:bottom-32 w-full px-6">
      <div className="max-w-sm mx-auto">
        <div className="relative">
          <a
            href={track.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex items-center gap-4 bg-neutral-900/50 backdrop-blur-sm p-4 
                    rounded-lg border border-neutral-800 hover:border-neutral-700 
                    transition-all duration-300 pr-16
                    ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}
          >
            <div className="relative min-w-16 h-16">
              <Image
                src={getAlbumArt()}
                alt={`${track.album} album art`}
                className="rounded-md object-cover"
                width={64}
                height={64}
                onLoad={() => setTimeout(() => setIsVisible(true), 1)}
              />
              {track.isPlaying && isVisible && (
                <div className="absolute -bottom-2 -right-2 flex items-end gap-[2px] bg-neutral-900/90 p-1.5 rounded-md">
                  <div className="w-[3px] h-3 bg-rose-400/80 origin-bottom animate-bar-1" />
                  <div className="w-[3px] h-3 bg-rose-400/80 origin-bottom animate-bar-2" />
                  <div className="w-[3px] h-3 bg-rose-400/80 origin-bottom animate-bar-3" />
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1 mr-2">
              <span className="text-xs text-rose-400/80 mb-0.5">
                {track.isPlaying ? 'currently listening to' : 'last played'}
              </span>
              <span className="font-medium text-neutral-200 truncate group-hover:text-rose-400/80 transition-colors">
                {track.name}
              </span>
              <span className="text-neutral-400 text-sm truncate">
                {track.artist}
              </span>
              <span className="text-neutral-500 text-sm truncate">
                {track.album}
              </span>
            </div>
          </a>
          <button
            type="button"
            onClick={handlePlayPreview}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400/80 
                     transition-colors duration-300 cursor-pointer
                     ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}
            title={isPlaying ? 'Pause Preview' : 'Play Preview'}
            aria-label={isPlaying ? 'Pause song preview' : 'Play song preview'}
          >
            {isPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
                role="img"
              >
                <path
                  fillRule="evenodd"
                  d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
                role="img"
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpotifyNowPlaying;
