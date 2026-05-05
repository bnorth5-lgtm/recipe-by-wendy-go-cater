"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Youtube, Search } from "lucide-react";
import { toast } from "sonner";

export const YouTubePlayerCard: React.FC = () => {
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ"); // Default to Rick Astley
  const [inputUrl, setInputUrl] = useState("");

  const extractVideoId = (url: string) => {
    if (typeof url !== "string") return null;
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/;
    const match = url.match(youtubeRegex);
    return match ? match[1] : null;
  };

  const handleSetVideo = () => {
    if (!inputUrl.trim()) {
      toast.error("Please enter a YouTube URL or video ID.");
      return;
    }

    const extractedId = extractVideoId(inputUrl);
    if (extractedId) {
      setVideoId(extractedId);
      toast.success("Video updated!");
    } else if (inputUrl.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(inputUrl)) {
      // Assume it's a direct video ID if 11 characters and valid format
      setVideoId(inputUrl);
      toast.success("Video updated!");
    } else {
      toast.error("Invalid YouTube URL or video ID. Please check the format.");
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] flex flex-col p-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-medium">
          YouTube Player
        </CardTitle>
        <Youtube className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <CardDescription className="text-xs text-muted-foreground mb-3">
          Watch instructional videos or tutorials.
        </CardDescription>
        <div className="flex items-center space-x-2 mb-3">
          <Input
            placeholder="Enter YouTube URL or Video ID"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSetVideo();
              }
            }}
          />
          <Button size="icon" onClick={handleSetVideo}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative w-full aspect-video rounded-md overflow-hidden">
          {videoId ? (
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-muted text-muted-foreground">
              No video loaded.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};