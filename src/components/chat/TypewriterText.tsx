import { useEffect, useState } from 'react';

interface TypewriterTextProps {
  content: string;
  isFast?: boolean;
}

export function TypewriterText({ content, isFast = false }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let characterIndex = 0;
    const interval = window.setInterval(
      () => {
        if (characterIndex <= content.length) {
          setDisplayed(content.slice(0, characterIndex));
          characterIndex += 1;
          return;
        }

        window.clearInterval(interval);
      },
      isFast ? 5 : 20,
    );

    return () => window.clearInterval(interval);
  }, [content, isFast]);

  return <div className="whitespace-pre-wrap">{displayed}</div>;
}
