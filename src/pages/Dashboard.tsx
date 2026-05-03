"use client";

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Lock,
  Sparkles,
  BookText,
} from "lucide-react";
import { useCateringStore, Client, CriticalTask, Note } from "@/store/cateringStore";
import { getVaultStatus } from "@/lib/cloudVault";
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
import { CateringIntakeForm, CateringIntakeFormData } from "@/components/CateringIntakeForm";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { NotesCard } from "@/components/NotesCard";
import { DateDisplay } from "@/components/DateDisplay";
import { TimeDisplay } from "@/components/TimeDisplay";
import { TwoMonthCalendar } from "@/components/TwoMonthCalendar";
import { OverdueSidebar } from "@/components/OverdueSidebar";
import { VendorsCard } from "@/components/VendorsCard";
import { YouTubePlayerCard } from "@/components/YouTubePlayerCard";
import { SEED_PROSPECTS } from "@/logic/ProspectingEngine";
import { ProspectCard } from "@/components/ProspectCard";
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
  const [isCateringIntakeDialogOpen, setIsCateringIntakeDialogOpen] = useState(false);
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

  const handleCateringIntakeSubmit = (data: CateringIntakeFormData) => {
    console.log("Catering Intake submitted:", data);
    toast.success("Catering intake captured!");
    setIsCateringIntakeDialogOpen(false);
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

  const vaultStatus = getVaultStatus();
  const { t } = useTranslation();

  return (
    <div
      className="space-y-6 p-6 relative min-h-screen flex flex-col bg-slate-950 text-slate-50"
    >
      {/* Global Status Badges */}
      {vaultStatus.isLocalOnly && (
        <div className="relative z-10 flex justify-end">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 backdrop-blur-sm shadow-sm">
            <Lock className="h-3.5 w-3.5" />
            <span>Secure: Local Only</span>
          </div>
        </div>
      )}

      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white drop-shadow-md" style={{ fontFamily: "'Playfair Display', serif" }}>
          {t('dashboard.title')}
        </h1>
        <p className="text-xl text-amber-200/80 font-medium italic font-serif">
          {t('dashboard.subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto flex-1 w-full">
        {/* Door 1: Quick Drop-Off */}
        <Link to="/events/bookings" className="block group">
          <Card className="h-full bg-slate-900/50 border border-amber-900/30 hover:border-[#fbbf24]/50 transition-all duration-500 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-slate-800/50 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(234,179,8,0.1)] group-hover:shadow-[0_0_25px_rgba(234,179,8,0.3)]">
                <Utensils className="w-10 h-10 text-[#fbbf24]" />
              </div>
              <CardTitle className="text-2xl font-serif text-white">{t('dashboard.quickDropOff')}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-400 leading-relaxed">
                {t('dashboard.quickDropOffDesc')}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Door 2: Staffed Buffet */}
        <Link to="/events/calendar" className="block group">
          <Card className="h-full bg-slate-900/50 border border-amber-900/30 hover:border-[#fbbf24]/50 transition-all duration-500 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-slate-800/50 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(234,179,8,0.1)] group-hover:shadow-[0_0_25px_rgba(234,179,8,0.3)]">
                <UserPlus className="w-10 h-10 text-[#fbbf24]" />
              </div>
              <CardTitle className="text-2xl font-serif text-white">{t('dashboard.staffedBuffet')}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-400 leading-relaxed">
                {t('dashboard.staffedBuffetDesc')}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Door 3: Full Production */}
        <Link to="/logistics/venue-architect" className="block group">
          <Card className="h-full bg-slate-900/50 border border-amber-900/30 hover:border-[#fbbf24]/50 transition-all duration-500 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-slate-800/50 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(234,179,8,0.1)] group-hover:shadow-[0_0_25px_rgba(234,179,8,0.3)]">
                <Sparkles className="w-10 h-10 text-[#fbbf24]" />
              </div>
              <CardTitle className="text-2xl font-serif text-white">{t('dashboard.fullProduction')}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-400 leading-relaxed">
                {t('dashboard.fullProductionDesc')}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto w-full">
        {/* Quick Actions (Smaller Cards) */}
        <Link to="/quoting/proposals" className="block">
          <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Proposals</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{draftProposalsCount + sentProposalsCount}</div>
              <p className="text-xs text-slate-500">Active in pipeline</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/menu/inventory" className="block">
          <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Inventory</CardTitle>
              <Warehouse className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">Manage</div>
              <p className="text-xs text-slate-500">Stock levels & equipment</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/menu/recipes" className="block">
          <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Recipes</CardTitle>
              <BookText className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">Build</div>
              <p className="text-xs text-slate-500">Create & modify dishes</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/menu/menus" className="block">
          <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Menus</CardTitle>
              <MenuSquare className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">Design</div>
              <p className="text-xs text-slate-500">Curated event offerings</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Footer for Date, MadeWithDyad, and Time */}
      <div className="relative z-10 flex justify-between items-center mt-auto pt-8 border-t border-slate-800/50">
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