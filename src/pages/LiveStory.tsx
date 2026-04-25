import React from "react";
import { HeroStory } from "@/components/live-story/HeroStory";
import { StoryScroll } from "@/components/live-story/StoryScroll";
import { ThreeDPortal } from "@/components/live-story/ThreeDPortal";

const LiveStory = () => {
  return (
    <div className="min-h-screen">
      <HeroStory
        title="Catering By Wendy"
        subtitle="High-end, heritage-focused, cinematic catering for luxury galas and weddings."
      />
      <StoryScroll title="Live Story" />
      <ThreeDPortal />
    </div>
  );
};

export default LiveStory;

