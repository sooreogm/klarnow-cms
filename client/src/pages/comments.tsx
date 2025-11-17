import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { CommentWithRelations } from "@shared/schema";
import { format } from "date-fns";

export default function Comments() {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "comment" | "reply"; id: string } | null>(null);

  const { data: comments, isLoading } = useQuery<CommentWithRelations[]>({
    queryKey: ["/api/comments"],
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/comments/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/replies/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      toast({
        title: "Success",
        description: "Reply deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete reply",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (type: "comment" | "reply", id: string) => {
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === "comment") {
      deleteCommentMutation.mutate(itemToDelete.id);
    } else {
      deleteReplyMutation.mutate(itemToDelete.id);
    }
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
      <h1 className="text-3xl font-semibold mb-8">Comments</h1>

      {comments?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No comments yet</h3>
            <p className="text-sm text-muted-foreground">
              Comments will appear here once users start engaging with articles
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments?.map((comment) => (
            <Card key={comment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      {comment.avatar ? (
                        <AvatarImage src={comment.avatar} alt={comment.username || ""} />
                      ) : (
                        <AvatarFallback>
                          {comment.username?.[0] || "A"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {comment.username || "Anonymous"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete("comment", comment.id)}
                    data-testid={`button-delete-comment-${comment.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{comment.comment}</p>

                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 space-y-4 border-l-2 border-border pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {reply.author?.name?.[0] || "A"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-xs">
                                {reply.author?.name || "Anonymous"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(reply.createdAt), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDelete("reply", reply.id)}
                            data-testid={`button-delete-reply-${reply.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-sm">{reply.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {itemToDelete?.type === "comment" ? "Comment" : "Reply"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}?
              {itemToDelete?.type === "comment" && " This will also delete all replies."}
              {" "}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
