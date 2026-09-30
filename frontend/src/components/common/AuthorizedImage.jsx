import { useEffect, useState } from 'react';
import { ImageOff, RefreshCw } from 'lucide-react';
import aiApi from '../../services/aiApi';

export default function AuthorizedImage({ src, alt, className = '', unavailableText = 'Image unavailable', onStateChange }) {
  const [state, setState] = useState(src ? 'loading' : 'unavailable');
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    let active = true;
    let nextObjectUrl = null;
    setObjectUrl(null);
    setState(src ? 'loading' : 'unavailable');

    if (!src) return () => { active = false; };

    aiApi.get(src, { responseType: 'blob' })
      .then(({ data }) => {
        if (!active) return;
        nextObjectUrl = URL.createObjectURL(data);
        setObjectUrl(nextObjectUrl);
        setState('loaded');
      })
      .catch(() => {
        if (active) setState('error');
      });

    return () => {
      active = false;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [src]);

  useEffect(() => { onStateChange?.(state); }, [state, onStateChange]);

  if (state === 'loaded' && objectUrl) return <img src={objectUrl} alt={alt} className={className} />;
  if (state === 'loading') return <div className="flex h-full min-h-24 items-center justify-center p-4 text-center text-xs text-slate-500 dark:text-slate-400" role="status" aria-live="polite"><RefreshCw className="mr-2 h-4 w-4 animate-spin text-emerald-500" aria-hidden="true" />Loading authorized image…</div>;
  return <div className="flex h-full min-h-24 items-center justify-center p-4 text-center text-xs text-slate-500 dark:text-slate-400" role="status"><ImageOff className="mr-2 h-4 w-4" aria-hidden="true" />{unavailableText}</div>;
}
