import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { LectureForm } from "@/components/lectures/LectureForm";
import { LectureList } from "@/components/lectures/LectureList";
import { useLectures } from "@/hooks/useLectures";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Calendar } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { lectures, isLoading, addLecture, deleteLecture } = useLectures();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session?.user) {
        navigate("/login");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            <h1 className="text-2xl font-bold text-foreground">College Lecture Alerts</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">
              <Calendar className="h-4 w-4 mr-2" />
              My Schedule
            </TabsTrigger>
            <TabsTrigger value="add">
              <GraduationCap className="h-4 w-4 mr-2" />
              Add Lecture
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <LectureList lectures={lectures} onDelete={deleteLecture} />
          </TabsContent>

          <TabsContent value="add">
            <LectureForm onSubmit={addLecture} isLoading={isLoading} />
          </TabsContent>
        </Tabs>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            💡 Notifications are sent daily at 8:00 AM for today's lectures
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
