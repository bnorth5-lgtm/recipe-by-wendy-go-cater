"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Trash2, NotebookText, Mic, StopCircle } from "lucide-react";
import { useCateringStore, Note } from "@/store/cateringStore";
import { format } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// Extend Window interface for WebkitSpeechRecognition and SpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const NotesCard: React.FC = () => {
  const notes = useCateringStore((state) => state.notes);
  const addNote = useCateringStore((state) => state.addNote);
  const deleteNote = useCateringStore((state) => state.deleteNote);

  const [newNoteContent, setNewNoteContent] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported in this browser.");
      toast.error("Dictation not supported by your browser.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setNewNoteContent((prev) => prev + finalTranscript);
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      toast.info("Dictation stopped.");
    };

    recognitionRef.current.onerror = (event: any) => {
      setIsListening(false);
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please enable it in your browser settings.");
      } else if (event.error === "no-speech") {
        toast.warning("No speech detected. Please try again.");
      } else {
        toast.error(`Dictation error: ${event.error}`);
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      addNote(newNoteContent.trim());
      setNewNoteContent("");
      toast.success("Note added!");
    } else {
      toast.error("Note content cannot be empty.");
    }
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id);
    toast.info("Note deleted.");
  };

  const toggleDictation = () => {
    if (!recognitionRef.current) {
      toast.error("Dictation not supported by your browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info("Listening for dictation...");
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast.error("Could not start dictation. Check microphone permissions.");
        setIsListening(false);
      }
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] flex flex-col p-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Take Notes
        </CardTitle>
        <NotebookText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <div className="flex flex-col space-y-1 mb-3">
          <Textarea
            placeholder="Jot down a quick note..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddNote();
              }
            }}
            rows={4}
            className="w-full"
          />
          <div className="flex gap-2">
            <Button onClick={handleAddNote} className="flex-1">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Note
            </Button>
            <Button
              onClick={toggleDictation}
              variant={isListening ? "destructive" : "outline"}
              className="w-auto"
            >
              {isListening ? (
                <StopCircle className="mr-2 h-4 w-4" />
              ) : (
                <Mic className="mr-2 h-4 w-4" />
              )}
              {isListening ? "Stop Dictation" : "Start Dictation"}
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[200px] flex-1 pr-4">
          {notes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No notes yet. Add one above!</p>
          ) : (
            <div className="space-y-1">
              {notes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((note) => (
                <div key={note.id} className="flex items-start justify-between p-1 border rounded-md bg-secondary/20 hover:bg-secondary/30 transition-colors">
                  <Link to={`/dashboard/notes/${note.id}`} className="flex-1 block p-2 -m-2">
                    <p className="text-sm font-medium">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(note.timestamp), "MMM d, yyyy HH:mm")}
                    </p>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};