/**
 * PDP Switches - Audio Playback Controller
 * Manages switch sound playback with accessibility support
 */

(function() {
  'use strict';

  // State management
  let currentPlayingAudio = null;
  let currentPlayingButton = null;

  // Initialize audio player
  const initAudioPlayers = () => {
    const buttons = document.querySelectorAll('.pdp-switches__play');
    const statusElement = document.querySelector('.pdp-switches__status');

    buttons.forEach(button => {
      const audioId = button.getAttribute('data-audio-id');
      const audio = document.getElementById(audioId);

      if (!audio) return;

      // Handle button click
      button.addEventListener('click', () => {
        handlePlayButtonClick(button, audio, statusElement);
      });

      // Handle audio end
      audio.addEventListener('ended', () => {
        resetButton(button);
        updateStatus('', statusElement);
        currentPlayingAudio = null;
        currentPlayingButton = null;
      });

      // Handle audio errors
      audio.addEventListener('error', () => {
        resetButton(button);
        updateStatus('Audio playback error', statusElement);
        currentPlayingAudio = null;
        currentPlayingButton = null;
      });
    });
  };

  // Handle play button click
  const handlePlayButtonClick = (button, audio, statusElement) => {
    const isPressed = button.getAttribute('aria-pressed') === 'true';
    const switchName = button.getAttribute('aria-label').replace('Play ', '').replace(' sound', '');

    // Stop currently playing audio if different
    if (currentPlayingAudio && currentPlayingAudio !== audio) {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
      if (currentPlayingButton) {
        resetButton(currentPlayingButton);
      }
    }

    if (isPressed) {
      // Stop current audio
      audio.pause();
      audio.currentTime = 0;
      resetButton(button);
      updateStatus(`${switchName} stopped`, statusElement);
      currentPlayingAudio = null;
      currentPlayingButton = null;
    } else {
      // Load audio if not already loaded (first play)
      if (audio.readyState === 0) {
        const src = audio.getAttribute('data-src');
        if (src) {
          audio.src = src;
          audio.load();
        }
      }

      // Play audio
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            button.setAttribute('aria-pressed', 'true');
            updateButtonText(button, 'Pause');
            updateStatus(`Playing ${switchName}`, statusElement);
            currentPlayingAudio = audio;
            currentPlayingButton = button;
          })
          .catch(error => {
            console.error('Audio playback failed:', error);
            resetButton(button);
            updateStatus('Playback failed. Please try again.', statusElement);
          });
      }
    }
  };

  // Reset button to initial state
  const resetButton = (button) => {
    button.setAttribute('aria-pressed', 'false');
    updateButtonText(button, 'Listen');
  };

  // Update button text
  const updateButtonText = (button, text) => {
    const textElement = button.querySelector('.pdp-switches__play-text');
    if (textElement) {
      textElement.textContent = text;
    }
  };

  // Update status for screen readers
  const updateStatus = (message, statusElement) => {
    if (statusElement) {
      statusElement.textContent = message;
    }
  };

  // Stop all audio on page unload
  const stopAllAudio = () => {
    const audios = document.querySelectorAll('.pdp-switches__audio');
    audios.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAudioPlayers);
  } else {
    initAudioPlayers();
  }

  // Clean up on page unload
  window.addEventListener('beforeunload', stopAllAudio);

  // Stop audio when user navigates away (for single-page apps)
  if ('onpagehide' in window) {
    window.addEventListener('pagehide', stopAllAudio);
  }

})();
