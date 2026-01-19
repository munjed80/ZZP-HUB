"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    naam: string | null;
    email: string;
    role: string;
  };
}

interface NotesListProps {
  entityType: "invoice" | "expense";
  entityId: string;
  companyId: string;
  canAddNotes?: boolean;
}

export function NotesList({ entityType, entityId, companyId, canAddNotes = true }: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadNotes = async () => {
    try {
      const params = new URLSearchParams({
        [`${entityType}Id`]: entityId,
        companyId,
      });

      const response = await fetch(`/api/notes/${entityType}?${params}`);
      const data = await response.json();

      if (data.success) {
        setNotes(data.notes || []);
      } else {
        toast.error(data.message || "Fout bij laden van notities");
      }
    } catch (error) {
      console.error("Error loading notes:", error);
      toast.error("Fout bij laden van notities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId, companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNote.trim()) {
      toast.error("Notitie mag niet leeg zijn");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/notes/${entityType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [`${entityType}Id`]: entityId,
          companyId,
          content: newNote.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Notitie toegevoegd");
        setNewNote("");
        // Add new note to the list
        if (data.note) {
          setNotes([data.note, ...notes]);
        }
      } else {
        toast.error(data.message || "Fout bij toevoegen van notitie");
      }
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Fout bij toevoegen van notitie");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getRoleBadge = (role: string) => {
    if (role === "ACCOUNTANT" || role === "ACCOUNTANT_VIEW" || role === "ACCOUNTANT_EDIT") {
      return (
        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
          Accountant
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
        ZZP
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Note Form */}
      {canAddNotes && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-muted-foreground mt-3" />
            <div className="flex-1 space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Voeg een notitie toe..."
                rows={3}
                disabled={submitting}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !newNote.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Bezig...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Verstuur notitie</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nog geen notities</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-muted/50 border border-border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {note.user.naam || note.user.email}
                  </span>
                  {getRoleBadge(note.user.role)}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(note.createdAt)}
                </span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
