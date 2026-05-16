import { useEffect, useState } from 'react';

interface TypewriterTextProps {
  content: string;
  isFast?: boolean;
}

export function TypewriterText({ content, isFast = false }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // If content hasn't changed (e.g. hydrated from persistence), show immediately
    setIsComplete(false);
    setDisplayed('');

    let characterIndex = 0;
    const interval = window.setInterval(
      () => {
        if (characterIndex <= content.length) {
          setDisplayed(content.slice(0, characterIndex));
          characterIndex += 1;
          return;
        }

        setIsComplete(true);
        window.clearInterval(interval);
      },
      isFast ? 5 : 20,
    );

    return () => window.clearInterval(interval);
  }, [content, isFast]);

  return (
    <div className="whitespace-pre-wrap">
      {displayed}
      {!isComplete && <span className="animate-pulse text-primary">▌</span>}
    </div>
  );
}
