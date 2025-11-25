"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link, useParams, useNavigate } from "react-router-dom"; // Added useParams and useNavigate
import {
  DollarSign,
  ClipboardList,
  FileText,
  Warehouse,
  MenuSquare,
  Utensils,
  CalendarPlus,
  UserPlus,
  AlertCircle,
  CalendarCheck,
  Settings,
  Edit,
  Trash2,
  PlusCircle,
} from "lucide-react";
import { useCateringStore, Client, CriticalTask, Note } from "@/store/cateringStore"; // Added Note import
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClientForm, ClientFormData } from "@/components/ClientForm";
import { useState, useEffect } from "react"; // Added useEffect
import { toast } from "sonner";
import { NotesCard } from "@/components/NotesCard";
import { DateDisplay } from "@/components/DateDisplay";
import { TimeDisplay } from "@/components/TimeDisplay";
import { TwoMonthCalendar } from "@/components/TwoMonthCalendar";
import { OverdueSidebar } from "@/components/OverdueSidebar";
import { format, isPast, differenceInDays, parseISO, isFuture } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea"; // Added Textarea for note editing

const Dashboard = () => {
  console.log("Dashboard.tsx is rendering with LucideIcons!");

  const { noteId } = useParams<{ noteId?: string }>(); // Get noteId from URL
  const navigate = useNavigate(); // For programmatic navigation

  const proposals = useCateringStore((state) => state.proposals);
  const bookings = useCateringStore((state) => state.bookings);
  const estimates = useCateringStore((state) => state.estimates);
  const addClient = useCateringStore((state) => state.addClient);
  const criticalTasks = useCateringStore((state) => state.criticalTasks);
  const addCriticalTask = useCateringStore((state) => state.addCriticalTask);
  const updateCriticalTask = useCateringStore((state) => state.updateCriticalTask);
  const deleteCriticalTask = useCateringStore((state) => state.deleteCriticalTask);
  const notes = useCateringStore((state) => state.notes); // Get notes
  const updateNote = useCateringStore((state) => state.updateNote); // Get updateNote action

  const [isClientFormDialogOpen, setIsClientFormDialogOpen] = useState(false);
  const [isManageTasksDialogOpen, setIsManageTasksDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CriticalTask | null>(null);
  const [newTaskContent, setNewTaskContent] = useState("");

  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false); // State for note edit dialog
  const [editingNote, setEditingNote] = useState<Note | null>(null); // State for the note being edited
  const [editedNoteContent, setEditedNoteContent] = useState(""); // State for content in edit dialog

  // Effect to open note edit dialog if noteId is in URL
  useEffect(() => {
    if (noteId) {
      const noteToEdit = notes.find(n => n.id === noteId);
      if (noteToEdit) {
        setEditingNote(noteToEdit);
        setEditedNoteContent(noteToEdit.content);
        setIsEditNoteDialogOpen(true);
      } else {
        toast.error("Note not found.");
        navigate("/dashboard"); // Redirect if note not found
      }
    } else {
      setIsEditNoteDialogOpen(false); // Close dialog if noteId is cleared from URL
      setEditingNote(null);
      setEditedNoteContent("");
    }
  }, [noteId, notes, navigate]);

  // Handle saving changes from the edit note dialog
  const handleSaveEditedNote = () => {
    if (editingNote && editedNoteContent.trim()) {
      updateNote(editingNote.id, editedNoteContent.trim());
      toast.success("Note updated!");
      setIsEditNoteDialogOpen(false);
      navigate("/dashboard"); // Navigate back to clean URL
    } else {
      toast.error("Note content cannot be empty.");
    }
  };

  // Updated proposal counts for clarity
  const draftProposalsCount = proposals.filter(p => p.status === "Draft").length;
  const sentProposalsCount = proposals.filter(p => p.status === "Sent").length;
  const acceptedProposalsCount = proposals.filter(p => p.status === "Accepted").length;

  const handleAddClientSubmit = (data: ClientFormData) => {
    addClient(data as Omit<Client, 'id'>);
    toast.success("New client added successfully!");
    setIsClientFormDialogOpen(false);
  };

  // --- Dynamic "Today's Tasks" Logic ---
  const overdueThresholdDays = 7;
  const upcomingEventsThresholdDays = 7;

  const overdueProposals = proposals.filter(p => {
    const createdAtDate = parseISO(p.createdAt);
    return (p.status === "Draft" || p.status === "Sent") &&
           isPast(createdAtDate) &&
           differenceInDays(new Date(), createdAtDate) >= overdueThresholdDays;
  });

  const overdueEstimates = estimates.filter(e => {
    const createdAtDate = parseISO(e.createdAt);
    return isPast(createdAtDate) && differenceInDays(new Date(), createdAtDate) >= overdueThresholdDays;
  });

  const upcomingEvents = bookings.filter(b => {
    const eventDate = parseISO(b.eventDate);
    const today = new Date();
    return b.status === "pending" && isFuture(eventDate) && differenceInDays(eventDate, today) <= upcomingEventsThresholdDays;
  }).sort((a, b) => parseISO(a.eventDate).getTime() - parseISO(b.eventDate).getTime());

  // --- Critical Task Management Handlers ---
  const handleAddTask = () => {
    if (newTaskContent.trim()) {
      addCriticalTask(newTaskContent.trim());
      setNewTaskContent("");
      toast.success("Task added!");
    } else {
      toast.error("Task content cannot be empty.");
    }
  };

  const handleEditTask = (task: CriticalTask) => {
    setEditingTask(task);
    setNewTaskContent(task.content);
  };

  const handleUpdateTask = () => {
    if (editingTask && newTaskContent.trim()) {
      updateCriticalTask(editingTask.id, newTaskContent.trim());
      setEditingTask(null);
      setNewTaskContent("");
      toast.success("Task updated!");
    } else if (!newTaskContent.trim()) {
      toast.error("Task content cannot be empty.");
    }
  };

  const handleDeleteTask = (id: string) => {
    deleteCriticalTask(id);
    toast.info("Task deleted.");
  };

  return (
    <div
      className="space-y-3 p-2 relative min-h-screen flex flex-col"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="relative z-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4 flex-1">
        {/* Row 1: Today's Action Items and Take Notes */}
        <Card className="lg:col-span-2 hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] p-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Action Items
            </CardTitle>
            <div className="flex items-center gap-2">
              <Dialog open={isManageTasksDialogOpen} onOpenChange={setIsManageTasksDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Settings className="mr-1 h-3 w-3" /> Manage Tasks
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Manage Daily Critical Path Tasks</DialogTitle>
                    <DialogDescription>
                      Add, edit, or remove tasks from your daily critical path.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-2 py-2">
                    <div className="flex items-center space-x-2">
                      <Input
                        id="newTask"
                        placeholder="New critical task..."
                        value={newTaskContent}
                        onChange={(e) => setNewTaskContent(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (editingTask) {
                              handleUpdateTask();
                            } else {
                              handleAddTask();
                            }
                          }
                        }}
                      />
                      <Button onClick={editingTask ? handleUpdateTask : handleAddTask}>
                        {editingTask ? <Edit className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                      </Button>
                    </div>
                    <ScrollArea className="h-[200px] pr-4">
                      <div className="space-y-1">
                        {criticalTasks.length === 0 ? (
                          <p className="text-muted-foreground text-sm text-center py-2">No critical tasks added yet.</p>
                        ) : (
                          criticalTasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-1 border rounded-md bg-secondary/20">
                              <span className="text-sm">{task.content}</span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditTask(task)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDeleteTask(task.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setIsManageTasksDialogOpen(false);
                      setEditingTask(null);
                      setNewTaskContent("");
                    }}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col justify-between h-full">
            <div className="space-y-2">
              {/* Overdue Proposals */}
              {overdueProposals.length > 0 && (
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> Overdue Proposals:
                  </h3>
                  <ul className="list-disc list-inside text-xs text-destructive ml-4">
                    {overdueProposals.map(p => (
                      <li key={p.id}>
                        <Link to={`/quoting/proposals/${p.id}`} className="hover:underline">
                          {p.eventName} ({format(parseISO(p.createdAt), "MMM d")})
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Overdue Estimates */}
              {overdueEstimates.length > 0 && (
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> Overdue Estimates:
                  </h3>
                  <ul className="list-disc list-inside text-xs text-destructive ml-4">
                    {overdueEstimates.map(e => (
                      <li key={e.id}>
                        <Link to={`/quoting/estimates/${e.id}`} className="hover:underline">
                          {e.eventName} ({format(parseISO(e.createdAt), "MMM d")})
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-primary flex items-center gap-1">
                    <CalendarCheck className="h-4 w-4" /> Upcoming Events (Next {upcomingEventsThresholdDays} Days):
                  </h3>
                  <ul className="list-disc list-inside text-xs text-muted-foreground ml-4">
                    {upcomingEvents.map(b => (
                      <li key={b.id}>
                        <Link to={`/events/calendar/${b.id}`} className="hover:underline">
                          {b.eventName} on {format(parseISO(b.eventDate), "MMM d")}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Critical Path Tasks */}
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Daily Critical Path:
                </h3>
                <ul className="list-disc list-inside text-xs text-muted-foreground ml-4">
                  {criticalTasks.length === 0 ? (
                    <li>No critical tasks defined. Click 'Manage Tasks' to add some!</li>
                  ) : (
                    criticalTasks.map((task) => (
                      <li key={task.id}>{task.content}</li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <NotesCard />
        </div>

        {/* Row 2: Calendar and Overdue Sidebar */}
        <div className="lg:col-span-2">
          <TwoMonthCalendar proposals={proposals} estimates={estimates} bookings={bookings} />
        </div>
        <div>
          <OverdueSidebar />
        </div>

        {/* Remaining hotlinks */}
        <Link to="/quoting/proposals" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Quote Pipeline
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <div className="space-y-1">
                <div className="text-2xl font-bold">{draftProposalsCount} Drafts</div>
                <div className="text-2xl font-bold">{sentProposalsCount} Sent</div>
                <div className="text-2xl font-bold text-green-500">{acceptedProposalsCount} Accepted</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Overview of your current proposal pipeline.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/quoting/proposals" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Build Proposal
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <div className="text-lg font-bold">Create a new client proposal</div>
              <p className="text-xs text-muted-foreground">
                Generate detailed quotes for upcoming events.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/menu/inventory" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Manage Inventory
              </CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <div className="text-lg font-bold">Add or update stock levels</div>
              <p className="text-xs text-muted-foreground">
                Keep track of all your ingredients and equipment.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/menu/menus" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Build Menu
              </CardTitle>
              <MenuSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <div className="text-lg font-bold">Design new event menus</div>
              <p className="text-xs text-muted-foreground">
                Combine recipes into curated offerings for clients.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/menu/recipes" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Build Recipes
              </CardTitle>
              <Utensils className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <div className="text-lg font-bold">Create or modify recipes</div>
              <p className="text-xs text-muted-foreground">
                Manage ingredients and instructions for all your dishes.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/events/bookings" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Build Event
              </CardTitle>
              <CalendarPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <div className="text-lg font-bold">Schedule a new event booking</div>
              <p className="text-xs text-muted-foreground">
                Add confirmed events to your calendar and manage details.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] p-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Create New Client
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="text-lg font-bold mb-2">Add a new client to your database</div>
            <p className="text-xs text-muted-foreground mb-3">
              Quickly add contact and company information for a new client.
            </p>
            <Dialog open={isClientFormDialogOpen} onOpenChange={setIsClientFormDialogOpen}>
              <DialogTrigger>
                <Button
                  size="sm"
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Fill in the details to add a new client to your database.
                  </DialogDescription>
                </DialogHeader>
                <ClientForm
                  onSubmit={handleAddClientSubmit}
                  onCancel={() => setIsClientFormDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
      {/* Footer for Date, MadeWithDyad, and Time */}
      <div className="relative z-10 flex justify-between items-center mt-6 p-3 bg-card/90 rounded-lg shadow-md">
        <DateDisplay />
        <MadeWithDyad />
        <TimeDisplay />
      </div>

      {/* NEW: Edit Note Dialog (managed by Dashboard) */}
      <Dialog open={isEditNoteDialogOpen} onOpenChange={(open) => {
        setIsEditNoteDialogOpen(open);
        if (!open) {
          navigate("/dashboard"); // Clear noteId from URL when dialog closes
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Make changes to your note here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <Textarea
              id="editNoteContent"
              value={editedNoteContent}
              onChange={(e) => setEditedNoteContent(e.target.value)}
              rows={6}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEditedNote}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;