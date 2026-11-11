// frontend/src/FarmerHomeView.jsx
// Overview route component rendering <OverviewStory /> with real story data.
import React from 'react';
import OverviewStory, { OverviewStoryErrorBoundary } from './overview/OverviewStory.jsx';
import { useStoryData } from './overview/useStoryData.js';

export { OverviewStoryErrorBoundary as StoryErrorBoundary };

export function FarmerHomeView({
  activeField,
  lang = 'en',
  onNavigate = () => {},
}) {
  const storyData = useStoryData(activeField, lang);

  return (
    <OverviewStory
      data={storyData}
      lang={lang}
      onNavigate={onNavigate}
    />
  );
}

export default FarmerHomeView;
