import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { initializeFirebase } from "@/lib/firebase";
import type { FirebaseSettings, InsertFirebaseSettings } from "@shared/schema";
import { insertFirebaseSettingsSchema } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();

  const { data: firebaseSettings } = useQuery<FirebaseSettings>({
    queryKey: ["/api/firebase-settings"],
  });

  const form = useForm<InsertFirebaseSettings>({
    resolver: zodResolver(insertFirebaseSettingsSchema),
    defaultValues: {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
    },
  });

  useEffect(() => {
    if (firebaseSettings) {
      form.reset({
        apiKey: firebaseSettings.apiKey,
        authDomain: firebaseSettings.authDomain,
        projectId: firebaseSettings.projectId,
        storageBucket: firebaseSettings.storageBucket,
        messagingSenderId: firebaseSettings.messagingSenderId,
        appId: firebaseSettings.appId,
      });
      initializeFirebase(firebaseSettings);
    }
  }, [firebaseSettings, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: InsertFirebaseSettings) => {
      return await apiRequest("POST", "/api/firebase-settings", data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/firebase-settings"] });
      initializeFirebase(data);
      toast({
        title: "Success",
        description: "Firebase settings saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save Firebase settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertFirebaseSettings) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      <h1 className="text-3xl font-semibold mb-8">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Firebase Storage Configuration</CardTitle>
          <CardDescription>
            Configure Firebase to enable image uploads for articles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Security Notice</AlertTitle>
            <AlertDescription>
              Your Firebase credentials are stored securely in the database and used only
              for image uploads. Make sure to restrict your Firebase Storage rules appropriately.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Your Firebase API Key"
                        data-testid="input-api-key"
                      />
                    </FormControl>
                    <FormDescription>
                      Found in Firebase Console → Project Settings → General
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="authDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auth Domain</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="your-app.firebaseapp.com"
                        data-testid="input-auth-domain"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="your-project-id"
                        data-testid="input-project-id"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storageBucket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Bucket</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="your-app.appspot.com"
                        data-testid="input-storage-bucket"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="messagingSenderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Messaging Sender ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="123456789012"
                        data-testid="input-messaging-sender-id"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>App ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="1:123456789012:web:abc123def456"
                        data-testid="input-app-id"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  data-testid="button-save-settings"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
