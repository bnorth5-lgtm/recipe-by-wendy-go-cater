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
import { PlusCircle, Edit, Trash2, User as UserIcon, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useCateringStore, User, UserRole } from "@/store/cateringStore";
import { UserForm, UserFormData } from "@/components/UserForm"; // Import the new UserForm and its type
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UsersSettings = () => {
  const users = useCateringStore((state) => state.users);
  const currentUser = useCateringStore((state) => state.currentUser);
  const addUser = useCateringStore((state) => state.addUser);
  const updateUser = useCateringStore((state) => state.updateUser);
  const deleteUser = useCateringStore((state) => state.deleteUser);
  const setCurrentUser = useCateringStore((state) => state.setCurrentUser);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);

  const handleAddUserSubmit = (data: UserFormData) => {
    addUser(data as Omit<User, 'id'>);
    toast.success("User added successfully!");
    setIsFormDialogOpen(false);
  };

  const handleUpdateUserSubmit = (data: UserFormData) => {
    if (editingUser) {
      updateUser({ ...data, id: editingUser.id } as User);
      toast.success("User updated successfully!");
    }
    setEditingUser(null);
    setIsFormDialogOpen(false);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    // Prevent deleting the current user or the last owner
    if (currentUser?.id === id) {
      toast.error("Cannot delete the currently logged-in user.");
      return;
    }
    if (users.filter(u => u.role === "Owner").length === 1 && users.find(u => u.id === id)?.role === "Owner") {
      toast.error("Cannot delete the last Owner. Please assign another user as Owner first.");
      return;
    }

    deleteUser(id);
    toast.info("User deleted.");
  };

  const handleLoginAs = (userId: string) => {
    const userToLogin = users.find(u => u.id === userId);
    if (userToLogin) {
      setCurrentUser(userToLogin);
      toast.success(`Logged in as ${userToLogin.name} (${userToLogin.role})`);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-3">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold mb-2">User Management</h1>
        <p className="text-xl text-muted-foreground">
          Manage user accounts, roles, and permissions for your team.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-4">
        <Card className="bg-card p-3 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">
              {editingUser ? "Edit User" : "Add New User"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {editingUser ? "Update the details of this user." : "Fill in the details to add a new user account."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isFormDialogOpen} onOpenChange={(open) => {
              setIsFormDialogOpen(open);
              if (!open) { // Reset editing user when dialog closes
                setEditingUser(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="w-full mb-3">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                  <DialogDescription>
                    {editingUser ? "Make changes to the user's information here. Click save when you're done." : "Add a new user to your system. Click save when you're done."}
                  </DialogDescription>
                </DialogHeader>
                <UserForm
                  initialData={editingUser || undefined}
                  onSubmit={editingUser ? handleUpdateUserSubmit : handleAddUserSubmit}
                  onCancel={() => setIsFormDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Display Existing Users */}
        <Card className="bg-card p-3 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Existing Users</CardTitle>
            <CardDescription className="text-muted-foreground">A list of all user accounts and their roles.</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-muted-foreground text-center">No users added yet. Click "Add New User" to get started!</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-3 py-2">Name</TableHead>
                      <TableHead className="px-3 py-2">Email</TableHead>
                      <TableHead className="px-3 py-2">Role</TableHead>
                      <TableHead className="px-3 py-2 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium px-3 py-2">{user.name}</TableCell>
                        <TableCell className="px-3 py-2">{user.email}</TableCell>
                        <TableCell className="px-3 py-2">{user.role}</TableCell>
                        <TableCell className="text-right flex justify-end space-x-2 px-3 py-2">
                          {currentUser?.id !== user.id && ( // Cannot edit or delete self
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(user)}
                                className="mr-2"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDelete(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {currentUser?.id === user.id && (
                            <span className="text-muted-foreground text-sm italic">Current User</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simulate Login Card */}
        <Card className="bg-card p-3 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">Simulate User Login</CardTitle>
            <CardDescription className="text-muted-foreground">
              Switch between user roles to test permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Select onValueChange={handleLoginAs} value={currentUser?.id || ""}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select user to login as" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setCurrentUser(null)} variant="outline">
                Logout
              </Button>
            </div>
            {currentUser && (
              <p className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
                <LogIn className="h-4 w-4" /> Currently logged in as: <span className="font-semibold">{currentUser.name} ({currentUser.role})</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default UsersSettings;