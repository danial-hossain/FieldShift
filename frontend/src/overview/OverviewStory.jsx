import { useEffect, useRef } from 'react';
import { mountOverviewStory } from './overviewStory.js';
import './overviewStory.css';

/**
 * <OverviewStory data={storyData} lang="en" onNavigate={(page) => ...} />
 * storyData: same shape as demoData.js, built from the app's stores/APIs for the active field.
 */
export default function OverviewStory({ data, lang = 'en', onNavigate }) {
  const ref = useRef(null);
  const api = useRef(null);
  const nav = useRef(onNavigate);
  nav.current = onNavigate;

  useEffect(() => {
    if (!ref.current || !data) return undefined;
    api.current = mountOverviewStory(ref.current, data, {
      assetBase: import.meta.env.BASE_URL || '/',
      lang,
      onNavigate: (p) => nav.current?.(p),
    });
    return () => { api.current?.destroy(); api.current = null; };
  }, [lang]); // remount only when the language changes

  useEffect(() => { if (api.current && data) api.current.update(data); }, [data]);

  return <div ref={ref} />;
}
