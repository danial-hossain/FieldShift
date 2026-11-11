// frontend/src/FarmerHomeView.jsx
// Overview route component rendering <OverviewStory /> with real story data.
import React, { useEffect } from 'react';
import OverviewStory, { OverviewStoryErrorBoundary } from './overview/OverviewStory.jsx';
import { useStoryData } from './overview/useStoryData.js';

export { OverviewStoryErrorBoundary as StoryErrorBoundary };

export function FarmerHomeView({
  activeField,
  lang = 'en',
  onNavigate = () => {},
}) {
  const storyData = useStoryData(activeField, lang);

  useEffect(() => {
    if (typeof window !== 'undefined' && storyData) {
      window.__FS_STORY_DATA__ = storyData;
    }
  }, [storyData]);

  return (
    <OverviewStory
      data={storyData}
      lang={lang}
      onNavigate={onNavigate}
    />
  );
}

export default FarmerHomeView;
