"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCateringStore, Client } from "@/store/cateringStore";
import { ClientForm, ClientFormData } from "@/components/ClientForm"; // Import the new ClientForm and its type

const Clients = () => {
  const clients = useCateringStore((state) => state.clients);
  const addClient = useCateringStore((state) => state.addClient);
  const updateClient = useCateringStore((state) => state.updateClient);
  const deleteClient = useCateringStore((state) => state.deleteClient);

  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false); // Renamed from isDialogOpen to be more specific
  const [viewingClient, setViewingClient] = useState<Client | null>(null); // NEW: State for client being viewed
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false); // NEW: State for view details dialog

  const handleAddClientSubmit = (data: ClientFormData) => {
    addClient(data as Omit<Client, 'id'>);
    toast.success("Client added successfully!");
    setIsFormDialogOpen(false);
  };

  const handleUpdateClientSubmit = (data: ClientFormData) => {
    if (editingClient) {
      updateClient({ ...data, id: editingClient.id } as Client);
      toast.success("Client updated successfully!");
    }
    setEditingClient(null);
    setIsFormDialogOpen(false);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsFormDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteClient(id);
    toast.info("Client deleted.");
  };

  // NEW: Handler to view client details
  const handleViewDetails = (client: Client) => {
    setViewingClient(client);
    setIsViewDetailsDialogOpen(true);
  };

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Client Management</h1>
        <p className="text-xl text-muted-foreground">
          Keep track of all your client details and contact information.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">
              {editingClient ? "Edit Client" : "Add New Client"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {editingClient ? "Update the details of your client." : "Fill in the details to add a new client."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isFormDialogOpen} onOpenChange={(open) => {
              setIsFormDialogOpen(open);
              if (!open) { // Reset editing client when dialog closes
                setEditingClient(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="w-full mb-6">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
                  <DialogDescription>
                    {editingClient ? "Make changes to the client's information here. Click save when you're done." : "Add a new client to your database. Click save when you're done."}
                  </DialogDescription>
                </DialogHeader>
                <ClientForm
                  initialData={editingClient || undefined}
                  onSubmit={editingClient ? handleUpdateClientSubmit : handleAddClientSubmit}
                  onCancel={() => setIsFormDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Display Existing Clients */}
        <Card className="bg-card p-6 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Existing Clients</CardTitle>
            <CardDescription className="text-muted-foreground">A list of all your managed clients.</CardDescription>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <p className="text-muted-foreground text-center">No clients added yet. Click "Add New Client" to get started!</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          <span
                            className="cursor-pointer hover:underline text-primary" // NEW: Make client name clickable
                            onClick={() => handleViewDetails(client)}
                          >
                            {client.name}
                          </span>
                        </TableCell>
                        <TableCell>{client.contactPerson}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(client)}
                            className="mr-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />

      {/* NEW: Client Details View Dialog */}
      <Dialog open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>
              Full contact and preference information for {viewingClient?.name}.
            </DialogDescription>
          </DialogHeader>
          {viewingClient && (
            <ClientForm
              initialData={viewingClient}
              onSubmit={() => {}} // No submit action for read-only view
              onCancel={() => setIsViewDetailsDialogOpen(false)}
              readOnly={true} // Set to read-only
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;