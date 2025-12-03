"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link, useParams, useNavigate } from "react-router-dom";
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
  Printer, // Added Printer icon for BEOs card
} from "lucide-react";
import { useCateringStore, Client, CriticalTask, Note } from "@/store/cateringStore";
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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { NotesCard } from "@/components/NotesCard";
import { DateDisplay } from "@/components/DateDisplay";
import { TimeDisplay } from "@/components/TimeDisplay";
import { TwoMonthCalendar } from "@/components/TwoMonthCalendar";
import { OverdueSidebar } from "@/components/OverdueSidebar";
import { VendorsCard } from "@/components/VendorsCard";
import { YouTubePlayerCard } from "@/components/YouTubePlayerCard";
import { format, isPast, differenceInDays, parseISO, isFuture } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox

const Dashboard = () => {
  console.log("Dashboard.tsx is rendering with LucideIcons!");

  const { noteId } = useParams<{ noteId?: string }>();
  const navigate = useNavigate();

  const proposals = useCateringStore((state) => state.proposals);
  const bookings = useCateringStore((state) => state.bookings);
  const estimates = useCateringStore((state) => state.estimates);
  const addClient = useCateringStore((state) => state.addClient);
  const criticalTasks = useCateringStore((state) => state.criticalTasks);
  const addCriticalTask = useCateringStore((state) => state.addCriticalTask);
  const updateCriticalTask = useCateringStore((state) => state.updateCriticalTask);
  const deleteCriticalTask = useCateringStore((state) => state.deleteCriticalTask);
  const toggleCriticalTaskCompletion = useCateringStore((state) => state.toggleCriticalTaskCompletion);
  const notes = useCateringStore((state) => state.notes);
  const updateNote = useCateringStore((state) => state.updateNote);

  const [isClientFormDialogOpen, setIsClientFormDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CriticalTask | null>(null);
  const [currentTaskContent, setCurrentTaskContent] = useState("");

  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editedNoteContent, setEditedNoteContent] = useState("");

  useEffect(() => {
    if (noteId) {
      const noteToEdit = notes.find(n => n.id === noteId);
      if (noteToEdit) {
        setEditingNote(noteToEdit);
        setEditedNoteContent(noteToEdit.content);
        setIsEditNoteDialogOpen(true);
      } else {
        toast.error("Note not found.");
        navigate("/dashboard");
      }
    } else {
      setIsEditNoteDialogOpen(false);
      setEditingNote(null);
      setEditedNoteContent("");
    }
  }, [noteId, notes, navigate]);

  const handleSaveEditedNote = () => {
    if (editingNote && editedNoteContent.trim()) {
      updateNote(editingNote.id, editedNoteContent.trim());
      toast.success("Note updated!");
      setIsEditNoteDialogOpen(false);
      navigate("/dashboard");
    } else {
      toast.error("Note content cannot be empty.");
    }
  };

  const draftProposalsCount = proposals.filter(p => p.status === "Draft").length;
  const sentProposalsCount = proposals.filter(p => p.status === "Sent").length;
  const acceptedProposalsCount = proposals.filter(p => p.status === "Accepted").length;

  const handleAddClientSubmit = (data: ClientFormData) => {
    addClient(data as Omit<Client, 'id'>);
    toast.success("New client added successfully!");
    setIsClientFormDialogOpen(false);
  };

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

  const handleAddTask = () => {
    if (currentTaskContent.trim()) {
      addCriticalTask(currentTaskContent.trim());
      setCurrentTaskContent("");
      toast.success("Task added!");
    } else {
      toast.error("Task content cannot be empty.");
    }
  };

  const handleEditTask = (task: CriticalTask) => {
    setEditingTask(task);
    setCurrentTaskContent(task.content);
    setIsEditTaskDialogOpen(true);
  };

  const handleUpdateTask = () => {
    if (editingTask && currentTaskContent.trim()) {
      updateCriticalTask(editingTask.id, currentTaskContent.trim());
      setEditingTask(null);
      setCurrentTaskContent("");
      setIsEditTaskDialogOpen(false);
      toast.success("Task updated!");
    } else if (!currentTaskContent.trim()) {
      toast.error("Task content cannot be empty.");
    }
  };

  const handleDeleteTask = (id: string) => {
    deleteCriticalTask(id);
    toast.info("Task deleted.");
  };

  const handleToggleTaskCompletion = (id: string) => {
    toggleCriticalTaskCompletion(id);
    toast.info("Task status updated!");
  };

  return (
    <div
      className="space-y-3 p-3 relative min-h-screen flex flex-col"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="relative z-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4 flex-1">
        {/* Row 1: Daily Action Items & Notes */}
        <Card className="lg:col-span-2 hover:shadow-lg transition-shadow bg-card/90 min-h-[550px] p-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-2xl font-semibold text-primary">
              Daily Action Items
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
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
                    <AlertCircle className="h-4 w-4" /> Overdue Estimates: {/* Changed from Quotes */}
                  </h3>
                  <ul className="list-disc list-inside text-xs text-destructive ml-4">
                    {overdueEstimates.map(e => (
                      <li key={e.id}>
                        <Link to={`/quoting/estimates/${e.id}`} className="hover:underline"> {/* Changed from quotes */}
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
                <ScrollArea className="h-[400px] pr-4"> {/* Adjusted height for scroll */}
                  <div className="space-y-1">
                    {criticalTasks.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-2">No critical tasks defined. Add one below!</p>
                    ) : (
                      criticalTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-1 border rounded-md bg-secondary/20">
                          <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => handleEditTask(task)}>
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => handleToggleTaskCompletion(task.id)}
                              id={`task-${task.id}`}
                            />
                            <label
                              htmlFor={`task-${task.id}`}
                              className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${task.completed ? "line-through text-muted-foreground" : ""}`}
                            >
                              {task.content}
                            </label>
                          </div>
                          <Button variant="destructive" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleDeleteTask(task.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                <div className="flex items-center space-x-2 mt-3">
                  <Input
                    id="newTask"
                    placeholder="Add new task..."
                    value={currentTaskContent}
                    onChange={(e) => setCurrentTaskContent(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTask();
                      }
                    }}
                  />
                  <Button onClick={handleAddTask}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <NotesCard />
        </div>

        {/* Row 2: Calendar - now full width */}
        <div className="lg:col-span-4">
          <TwoMonthCalendar proposals={proposals} estimates={estimates} bookings={bookings} />
        </div>

        {/* NEW Row for full-width VendorsCard */}
        <div className="lg:col-span-4"> {/* This will make it full width */}
          <VendorsCard />
        </div>

        {/* Row 3 (formerly Row 4): Quick Actions */}
        <Link to="/quoting/proposals" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
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

        <Link to="/events/bookings" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
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

        {/* NEW: View BEOs Card */}
        <Link to="/events/beos" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium">
                View BEOs
              </CardTitle>
              <Printer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full">
              <div className="text-lg font-bold">Generate & review Banquet Event Orders</div>
              <p className="text-xs text-muted-foreground">
                Detailed operational plans for your catering staff.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Row 4 (formerly Row 5): Core Management */}
        <Link to="/menu/inventory" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
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

        <Link to="/menu/recipes" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
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

        <Link to="/menu/menus" className="block">
          <Card className="hover:shadow-lg transition-shadow bg-card/90 min-h-[240px] p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
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
      </div>
      {/* Overdue Sidebar moved to the bottom */}
      <div className="relative z-10 lg:col-span-4 mt-3">
        <OverdueSidebar />
      </div>
      {/* Footer for Date, MadeWithDyad, and Time */}
      <div className="relative z-10 flex justify-between items-center mt-6 p-3 bg-card/90 rounded-lg shadow-md">
        <DateDisplay />
        <MadeWithDyad />
        <TimeDisplay />
      </div>

      {/* Edit Note Dialog (managed by Dashboard) */}
      <Dialog open={isEditNoteDialogOpen} onOpenChange={(open) => {
        setIsEditNoteDialogOpen(open);
        if (!open) {
          navigate("/dashboard");
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

      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the content of this critical task.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <Input
              id="editTaskContent"
              value={currentTaskContent}
              onChange={(e) => setCurrentTaskContent(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleUpdateTask();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateTask}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;