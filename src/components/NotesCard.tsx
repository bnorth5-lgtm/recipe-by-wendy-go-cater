"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // Keep Input for other potential uses, but we'll use Textarea for new note content
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Trash2, NotebookText } from "lucide-react";
import { useCateringStore, Note } from "@/store/cateringStore";
import { format } from "date-fns";
import { toast } from "sonner";

export const NotesCard: React.FC = () => {
  const notes = useCateringStore((state) => state.notes);
  const addNote = useCateringStore((state) => state.addNote);
  const deleteNote = useCateringStore((state) => state.deleteNote);

  const [newNoteContent, setNewNoteContent] = useState("");

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

  return (
    <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Take Notes
        </CardTitle>
        <NotebookText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <div className="flex flex-col space-y-2 mb-4"> {/* Changed to flex-col and space-y */}
          <Textarea
            placeholder="Jot down a quick note..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { // Allow Shift+Enter for new line
                e.preventDefault(); // Prevent default behavior (e.g., new line)
                handleAddNote();
              }
            }}
            rows={4} // Make it larger
            className="w-full"
          />
          <Button onClick={handleAddNote} className="w-full"> {/* Make button full width */}
            <PlusCircle className="mr-2 h-4 w-4" /> Add Note
          </Button>
        </div>

        <ScrollArea className="flex-1 pr-4">
          {notes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No notes yet. Add one above!</p>
          ) : (
            <div className="space-y-3">
              {notes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((note) => (
                <div key={note.id} className="flex items-start justify-between p-2 border rounded-md bg-secondary/20">
                  <div>
                    <p className="text-sm font-medium">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(note.timestamp), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteNote(note.id)}
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