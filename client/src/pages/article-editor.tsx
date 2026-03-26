import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Upload, Image as ImageIcon, Save } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { IMAGE_UPLOAD_ACCEPT, uploadCmsImage } from "@/lib/uploads";
import type { Article, Category, Challenge, InsertArticle } from "@shared/schema";
import { insertArticleSchema } from "@shared/schema";
import { EditorToolbar } from "@/components/editor-toolbar";
import { CoverImageUpload } from "@/components/cover-image-upload";

const NO_CHALLENGE_VALUE = "__none__";

export default function ArticleEditor() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const articleId = params.id;
  const isEditing = articleId && articleId !== "new";

  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "">("");

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: challenges } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  const { data: article, isLoading } = useQuery<Article>({
    queryKey: [`/api/articles/${articleId}`],
    enabled: !!isEditing,
  });

  const form = useForm<InsertArticle>({
    resolver: zodResolver(insertArticleSchema),
    defaultValues: {
      title: "",
      content: "",
      categoryId: "",
      coverImageUrl: "",
      description: "",
      challengeId: "",
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapImage.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-lg my-4",
        },
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your article...",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose max-w-none p-12 min-h-screen focus:outline-none text-lg",
      },
    },
    onUpdate: ({ editor }) => {
      form.setValue("content", editor.getHTML());
    },
  });

  useEffect(() => {
    if (article && editor) {
      form.reset({
        title: article.title,
        content: article.content,
        categoryId: article.categoryId,
        coverImageUrl: article.coverImageUrl || "",
        description: article.description || "",
        challengeId: article.challengeId || "",
      });
      editor.commands.setContent(article.content);
      setCoverImageUrl(article.coverImageUrl || "");
    }
  }, [article, editor, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: InsertArticle) => {
      setSaveStatus("saving");
      const payload: InsertArticle = {
        ...data,
        coverImageUrl: coverImageUrl || null,
        description: data.description?.trim() ? data.description : null,
        challengeId: data.challengeId?.trim() ? data.challengeId : null,
      };
      
      if (isEditing) {
        const res = await apiRequest("PATCH", `/api/articles/${articleId}`, payload);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/articles", payload);
        return await res.json();
      }
    },
    onSuccess: (data) => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      if (!isEditing && data.id) {
        navigate(`/articles/${data.id}`);
      }
      
      toast({
        title: "Success",
        description: isEditing ? "Article updated successfully" : "Article created successfully",
      });
    },
    onError: () => {
      setSaveStatus("");
      toast({
        title: "Error",
        description: "Failed to save article",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = IMAGE_UPLOAD_ACCEPT;
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsUploadingImage(true);
      try {
        const imageUrl = await uploadCmsImage({
          file,
          kind: "article-content",
          articleId: articleId || undefined,
        });
        
        editor?.commands.setImage({ src: imageUrl });
        
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to upload image",
          variant: "destructive",
        });
      } finally {
        setIsUploadingImage(false);
      }
    };
    
    input.click();
  };

  const onSubmit = (data: InsertArticle) => {
    saveMutation.mutate(data);
  };

  if (isLoading && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading article...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b flex items-center justify-between px-8 sticky top-0 bg-background z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Article title"
                className="text-xl font-semibold border-0 focus-visible:ring-0 px-0 w-96"
                data-testid="input-article-title"
              />
            )}
          />
        </div>
        <div className="flex items-center gap-4">
          {saveStatus && (
            <span className="text-sm text-muted-foreground" data-testid="text-save-status">
              {saveStatus === "saving" ? "Saving..." : "Saved"}
            </span>
          )}
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={saveMutation.isPending}
            data-testid="button-save-article"
          >
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? "Update" : "Save"}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <Form {...form}>
          <form className="max-w-4xl mx-auto py-8 px-4">
            <div className="space-y-6 mb-8">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="challengeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Challenge (optional)</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(
                          value === NO_CHALLENGE_VALUE ? "" : value
                        )
                      }
                      value={field.value ? field.value : NO_CHALLENGE_VALUE}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-challenge">
                          <SelectValue placeholder="Select a challenge" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_CHALLENGE_VALUE}>
                          No challenge
                        </SelectItem>
                        {challenges?.map((challenge) => (
                          <SelectItem key={challenge.id} value={challenge.id}>
                            {challenge.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label>Cover Image</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Recommended: 1200x630px
                </p>
                <CoverImageUpload
                  imageUrl={coverImageUrl}
                  onImageChange={setCoverImageUrl}
                  articleId={articleId || 'new'}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        value={field.value ?? ""}
                        rows={3}
                        placeholder="Short description of the article"
                        className="w-full mt-2 border rounded-md p-3 bg-background"
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <EditorToolbar
                editor={editor}
                onImageUpload={handleImageUpload}
                isUploadingImage={isUploadingImage}
              />
              <div className="border rounded-lg mt-2">
                <EditorContent editor={editor} />
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
