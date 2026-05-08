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
  Printer,
  Lock,
  Sparkles,
  BookText,
  Share2,
  Download
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
import { useBrand } from "@/context/BrandContext";
import { useEventContext } from "@/context/EventContext";
import { generateProposalPDF } from "@/logic/PDFGenerator";
import { saveToVault } from "@/logic/persistence";
import { logSystemAlert } from "@/lib/switchboardHook";
import { supabase } from "@/logic/supabaseClient";
import { PACKET_01_12_GOLD_DATA_URI } from "@/branding/packet-01-12-gold-data-uri";

const Dashboard = () => {
  console.log("Dashboard.tsx is rendering with LucideIcons!");

  const { noteId } = useParams<{ noteId?: string }>();
  const navigate = useNavigate();
  const { brand } = useBrand();
  const { eventState, updateEventState } = useEventContext();

  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [actualCostsInput, setActualCostsInput] = useState<number>(0);
  const [lessonsLearnedInput, setLessonsLearnedInput] = useState<string>("");

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
  const inventory = useCateringStore((state) => state.inventory);

  const profitWarnings = inventory.filter(item => {
    if (!item.market_scraped_cost || item.market_scraped_cost <= 0) return false;
    const margin = ((item.market_scraped_cost - item.costPerUnit) / item.market_scraped_cost) * 100;
    return margin < (item.margin_goal || 70.00);
  });

  // Trigger Switchboard hook for Profit Alerts
  useEffect(() => {
    if (profitWarnings.length > 0) {
      logSystemAlert({
        alert_type: 'Profit Alert',
        severity: 'warning',
        message: `${profitWarnings.length} item(s) are threatening the target margin.`,
        metadata: {
          items: profitWarnings.map(item => ({
            id: item.id,
            name: item.name,
            currentCost: item.costPerUnit,
            marketScrapedCost: item.market_scraped_cost,
            targetMargin: item.margin_goal || 70.00
          }))
        }
      });
    }
  }, [profitWarnings.length]);

  const [isClientFormDialogOpen, setIsClientFormDialogOpen] = useState(false);
  const [isCateringIntakeDialogOpen, setIsCateringIntakeDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CriticalTask | null>(null);
  const [currentTaskContent, setCurrentTaskContent] = useState("");

  const [heroImageError, setHeroImageError] = useState(false);
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

  const handleSealMasterpiece = async () => {
    const finalEventState = {
      ...eventState,
      actualCosts: actualCostsInput,
      lessonsLearned: lessonsLearnedInput,
      isLegacy: true,
      archivedAt: new Date().toISOString()
    };
    
    updateEventState(finalEventState);
    
    // Save to local JSON vault
    const fileName = `Legacy_Masterpiece_${eventState.eventName.replace(/\s+/g, '_')}_${Date.now()}.json`;
    const success = await saveToVault(fileName, finalEventState);
    
    if (success) {
      toast.success("Masterpiece Sealed in Legacy Vault!", {
        description: "You can now duplicate this exact setup for next year."
      });
      setIsAuditDialogOpen(false);
    } else {
      toast.error("Failed to seal Masterpiece.");
    }
  };

  const vaultStatus = getVaultStatus();
  const { t } = useTranslation();

  return (
    <div
      className="space-y-6 px-6 pb-6 pt-16 sm:pt-[4.5rem] relative min-h-screen flex flex-col bg-slate-950 text-slate-50"
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

      <header
        className="-mx-6 mb-8 border-b border-[#081924] bg-[#0a1628] px-6 py-6"
        style={{ backgroundColor: "#0a1628" }}
      >
        <div className="flex w-full items-center justify-center">
          <div className="flex w-full max-w-5xl flex-col items-center justify-center leading-none">
            {!heroImageError ? (
              <img
                src={PACKET_01_12_GOLD_DATA_URI}
                alt="Delicious Catering & Events by Wendy"
                className="mx-auto block h-auto max-h-64 w-auto max-w-full object-contain object-center select-none"
                fetchPriority="high"
                decoding="async"
                onError={() => setHeroImageError(true)}
              />
            ) : (
              <p
                className="w-full max-w-md text-center font-serif text-xl font-bold uppercase leading-snug tracking-wide text-[#fbbf24] drop-shadow-sm sm:text-2xl"
                aria-live="polite"
              >
                {"DELICIOUS CATERING & EVENTS ~ BY WENDY"}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Client Proposal Portal — directly under hero */}
      <div className="w-full max-w-6xl mx-auto mb-8">
        <Card className="bg-slate-900/80 border border-[#fbbf24]/40 backdrop-blur-xl shadow-[0_0_30px_rgba(251,191,36,0.12)] hover:shadow-[0_0_36px_rgba(251,191,36,0.22)] rounded-2xl overflow-hidden relative transition-all group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#fbbf24]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#fbbf24]" />
          <CardHeader className="relative z-10 flex flex-row flex-wrap items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-2xl font-serif text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#fbbf24]" />
                Client Proposal Portal
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                Active Event: <span className="text-[#fbbf24] font-medium">{eventState.eventName || "Untitled Event"}</span>
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  const url = `${window.location.origin}/quote/${eventState.eventId || 'current'}`;
                  navigator.clipboard.writeText(url);
                  toast.success("Read-Only Link Copied!", {
                    description: "Share this URL with your client."
                  });
                }}
                variant="outline" 
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white"
              >
                <Share2 className="w-4 h-4 mr-2 text-[#fbbf24]" /> Share Link
              </Button>
              <Button 
                onClick={async () => {
                  toast.loading("Compiling Proposal PDF...");
                  try {
                    // We pass a dummy ID or the actual map ID if it were on the page. 
                    // Since the map isn't on the dashboard, the PDF generator will skip the map snapshot gracefully
                    // or we could redirect them to the Venue Architect to print. For now, we generate the data-driven PDF.
                    await generateProposalPDF(eventState, "venue-map-canvas", brand);
                    toast.dismiss();
                    toast.success("Proposal PDF Generated!");
                  } catch (error) {
                    toast.dismiss();
                    toast.error("Failed to generate PDF.");
                  }
                }}
                className="bg-[#fbbf24] hover:bg-amber-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(251,191,36,0.4)]"
              >
                <Download className="w-4 h-4 mr-2" /> Generate PDF Proposal
              </Button>
              <Button 
                onClick={() => setIsAuditDialogOpen(true)}
                variant="destructive"
                className="bg-red-950 hover:bg-red-900 text-red-400 border border-red-900/50 shadow-[0_0_15px_rgba(220,38,38,0.2)]"
              >
                <Lock className="w-4 h-4 mr-2" /> Close Event
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Post-Event Audit Dialog */}
      <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
          <DialogContent className="bg-slate-950 border-slate-800 text-slate-50 sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif text-[#fbbf24] flex items-center gap-2">
                <Lock className="w-6 h-6" /> Post-Event Audit
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Close out <strong className="text-white">{eventState.eventName}</strong> and seal it into the Legacy Vault.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                  <div className="text-sm text-slate-400 mb-1">MarketWatch Estimate</div>
                  <div className="text-2xl font-bold text-white">
                    ${(eventState.estimatedTotalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg relative">
                  <div className="text-sm text-slate-400 mb-1">Actual Costs</div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <Input 
                      type="number" 
                      value={actualCostsInput || ""}
                      onChange={(e) => setActualCostsInput(parseFloat(e.target.value) || 0)}
                      className="pl-7 bg-slate-950 border-slate-700 text-white text-xl font-bold h-auto py-1"
                    />
                  </div>
                </div>
              </div>

              {actualCostsInput > 0 && (
                <div className={`p-4 rounded-lg border ${actualCostsInput > (eventState.estimatedTotalValue || 0) ? 'bg-red-950/30 border-red-900/50 text-red-400' : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'}`}>
                  Variance: <strong className="text-lg">
                    ${Math.abs((eventState.estimatedTotalValue || 0) - actualCostsInput).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong> 
                  {actualCostsInput > (eventState.estimatedTotalValue || 0) ? ' Over Budget' : ' Under Budget (Extra Profit)'}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="lessons" className="text-slate-300">Lessons Learned (e.g., "1:10 server ratio was perfect for Harrison layout")</Label>
                <Textarea 
                  id="lessons"
                  value={lessonsLearnedInput}
                  onChange={(e) => setLessonsLearnedInput(e.target.value)}
                  placeholder="Record layout adjustments, vendor performance, or staffing notes for next year..."
                  className="bg-slate-900 border-slate-700 text-white min-h-[100px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAuditDialogOpen(false)} className="text-slate-400 hover:text-white">Cancel</Button>
              <Button onClick={handleSealMasterpiece} className="bg-[#fbbf24] hover:bg-amber-500 text-slate-950 font-bold">
                <Lock className="w-4 h-4 mr-2" /> Seal Masterpiece to Vault
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Primary selection — Delicious Express, Staffed, MainVision */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full flex-1 justify-items-stretch">
        {/* Door 1: Quick Drop-Off */}
        <Link to="/events/bookings" className="block group h-full">
          <Card className="h-full bg-slate-900/80 border border-[#fbbf24]/40 hover:border-[#fbbf24] hover:shadow-[0_0_32px_rgba(251,191,36,0.28)] transition-all duration-500 backdrop-blur-xl rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#fbbf24]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />
            <CardHeader className="text-center pb-4 relative z-10">
              <div className="mx-auto bg-amber-500/15 border border-[#fbbf24]/25 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_18px_rgba(251,191,36,0.18)] group-hover:shadow-[0_0_28px_rgba(251,191,36,0.35)]">
                <Utensils className="w-10 h-10" style={{ color: brand.primaryColor }} />
              </div>
              <CardTitle className="text-2xl font-serif text-white">
                <span style={{ color: brand.primaryColor }}>RBW ~ </span>Delicious Express & Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center relative z-10">
              <p className="text-slate-400 leading-relaxed">
                {t('dashboard.quickDropOffDesc')}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Door 2: Staffed Buffet */}
        <Link to="/events/calendar" className="block group h-full">
          <Card className="h-full bg-slate-900/80 border border-[#fbbf24]/40 hover:border-[#fbbf24] hover:shadow-[0_0_32px_rgba(251,191,36,0.28)] transition-all duration-500 backdrop-blur-xl rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#fbbf24]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />
            <CardHeader className="text-center pb-4 relative z-10">
              <div className="mx-auto bg-amber-500/15 border border-[#fbbf24]/25 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_18px_rgba(251,191,36,0.18)] group-hover:shadow-[0_0_28px_rgba(251,191,36,0.35)]">
                <UserPlus className="w-10 h-10" style={{ color: brand.primaryColor }} />
              </div>
              <CardTitle className="text-2xl font-serif text-white">
                <span style={{ color: brand.primaryColor }}>RBW ~ </span>Delicious Staffed Events
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center relative z-10">
              <p className="text-slate-400 leading-relaxed">
                {t('dashboard.staffedBuffetDesc')}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Door 3: Full Production */}
        <Link to="/logistics/venue-architect" className="block group h-full">
          <Card className="h-full bg-slate-900/80 border border-[#fbbf24]/40 hover:border-[#fbbf24] hover:shadow-[0_0_32px_rgba(251,191,36,0.28)] transition-all duration-500 backdrop-blur-xl rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#fbbf24]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />
            <CardHeader className="text-center pb-4 relative z-10">
              <div className="mx-auto bg-amber-500/15 border border-[#fbbf24]/25 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_18px_rgba(251,191,36,0.18)] group-hover:shadow-[0_0_28px_rgba(251,191,36,0.35)]">
                <Sparkles className="w-10 h-10" style={{ color: brand.primaryColor }} />
              </div>
              <CardTitle className="text-2xl font-serif text-white">
                <span style={{ color: brand.primaryColor }}>RBW ~ </span>MainVision Productions
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center relative z-10">
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

      {/* NBS Intelligence: Profit Monitoring */}
      {profitWarnings.length > 0 && (
        <div className="max-w-6xl mx-auto w-full mt-6">
          <Card className="bg-red-950/20 border-red-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-red-400 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                NBS Profit Monitoring Warning
              </CardTitle>
              <CardDescription className="text-red-300/70">
                The following items have a current cost that threatens the target 70% margin based on market scraped costs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {profitWarnings.map(item => {
                  const currentMargin = ((item.market_scraped_cost! - item.costPerUnit) / item.market_scraped_cost!) * 100;
                  return (
                    <div key={item.id} className="bg-slate-900/50 border border-red-900/30 p-4 rounded-lg">
                      <div className="font-bold text-white mb-1">{item.name}</div>
                      <div className="text-sm text-slate-400 flex justify-between">
                        <span>Category:</span>
                        <span className="text-slate-300">{item.category}</span>
                      </div>
                      <div className="text-sm text-slate-400 flex justify-between">
                        <span>Current Cost:</span>
                        <span className="text-slate-300">${item.costPerUnit.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-slate-400 flex justify-between">
                        <span>Market Price:</span>
                        <span className="text-slate-300">${item.market_scraped_cost?.toFixed(2)}</span>
                      </div>
                      <div className="text-sm font-medium mt-2 pt-2 border-t border-slate-800 flex justify-between">
                        <span className="text-red-400">Current Margin:</span>
                        <span className="text-red-400">{currentMargin.toFixed(1)}%</span>
                      </div>
                      <div className="text-xs text-slate-500 flex justify-between mt-1">
                        <span>Target Margin:</span>
                        <span>{item.margin_goal || 70.0}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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