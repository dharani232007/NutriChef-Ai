import { useState } from 'react';

export function useStreamResponse() {
  const [streamText, setStreamText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);

  const startStream = async (url, options = {}) => {
    setIsStreaming(true);
    setStreamText('');
    setStreamError(null);

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setStreamText(accumulated);
      }
      return accumulated;
    } catch (err) {
      setStreamError(err.message || 'Stream connection interrupted');
    } finally {
      setIsStreaming(false);
    }
  };

  const clearStream = () => {
    setStreamText('');
    setStreamError(null);
  };

  return { streamText, isStreaming, streamError, startStream, clearStream };
}