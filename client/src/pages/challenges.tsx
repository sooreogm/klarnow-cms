import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Challenge, InsertChallenge } from "@shared/schema";

export default function Challenges() {
  const { toast } = useToast();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [challengeName, setChallengeName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);

  const { data: challenges, isLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertChallenge) => {
      const res = await apiRequest("POST", "/api/challenges", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setChallengeName("");
      toast({ title: "Success", description: "Challenge created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create challenge", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertChallenge }) => {
      const res = await apiRequest("PATCH", `/api/challenges/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setSelectedChallenge(null);
      setChallengeName("");
      toast({ title: "Success", description: "Challenge updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update challenge", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/challenges/${id}`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setDeleteDialogOpen(false);
      setChallengeToDelete(null);
      if (selectedChallenge?.id === challengeToDelete?.id) {
        setSelectedChallenge(null);
        setChallengeName("");
      }
      toast({ title: "Success", description: "Challenge deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete challenge", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!challengeName.trim()) return;
    if (selectedChallenge) {
      updateMutation.mutate({ id: selectedChallenge.id, data: { name: challengeName } });
    } else {
      createMutation.mutate({ name: challengeName });
    }
  };

  const handleEdit = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setChallengeName(challenge.name);
  };

  const handleDelete = (challenge: Challenge) => {
    setChallengeToDelete(challenge);
    setDeleteDialogOpen(true);
  };

  const handleNewChallenge = () => {
    setSelectedChallenge(null);
    setChallengeName("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <h1 className="text-3xl font-semibold mb-8">Challenges</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Challenges</span>
              <Button size="icon" variant="ghost" onClick={handleNewChallenge} data-testid="button-new-challenge">
                <Plus className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {challenges?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No challenges yet</p>
            ) : (
              <div className="space-y-1">
                {challenges?.map((challenge) => (
                  <div
                    key={challenge.id}
                    className={`py-3 px-4 rounded-md cursor-pointer hover-elevate flex items-center justify-between ${
                      selectedChallenge?.id === challenge.id ? "bg-accent" : ""
                    }`}
                    onClick={() => handleEdit(challenge)}
                    data-testid={`challenge-item-${challenge.id}`}
                  >
                    <span className="font-medium">{challenge.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(challenge);
                      }}
                      data-testid={`button-delete-challenge-${challenge.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{selectedChallenge ? "Edit Challenge" : "New Challenge"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="challenge-name">Challenge Name</Label>
                <Input
                  id="challenge-name"
                  value={challengeName}
                  onChange={(e) => setChallengeName(e.target.value)}
                  placeholder="Enter challenge name"
                  className="mt-2"
                  data-testid="input-challenge-name"
                />
              </div>
              <div className="flex gap-2 justify-end">
                {selectedChallenge && (
                  <Button variant="outline" onClick={handleNewChallenge} data-testid="button-cancel-edit-challenge">
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={!challengeName.trim() || createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-challenge"
                >
                  {selectedChallenge ? "Update" : "Create"} Challenge
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Challenge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{challengeToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => challengeToDelete && deleteMutation.mutate(challengeToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-challenge"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


