import React, { useState } from 'react';
import { Building, Users, Star, Plus, Loader2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { useAppData } from '../context/AppContext';
import { avior } from '../Api';
import FeedPosts from '../Components/pagesComp/homePageComp/FeedPosts';
import CreatePostModal from '../Components/pagesComp/homePageComp/CreatePostModal';

// FAB חוצה רנדורים — מוגדר ברמת מודול ולא בתוך HomePage כדי שלא ייווצר טיפוס
// קומפוננטה חדש בכל רינדור (rule: react-hooks/static-components).
function FloatingActionButton({ onClick, isSidebarOpen }) {
  return !isSidebarOpen ? (
    <Button
      onClick={onClick}
      className="fixed bottom-16 left-6 w-14 h-14 rounded-full bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-500/30 flex items-center justify-center z-50 transition-transform hover:scale-105"
    >
      <Plus className="w-8 h-8 text-white" />
    </Button>
  ) : (
    <div className="fixed bottom-16 left-6 w-14 h-14 rounded-full bg-teal-500/60 hover:bg-teal-600 shadow-lg shadow-teal-500/30 flex items-center justify-center z-50 transition-transform hover:scale-105">
      <Plus className="w-4 h-4 text-gray-400" />
    </div>
  );
}

export default function HomePage() {
  const { user, session } = useAppData();
  // מצב הסיידבר מועבר מ-MainLayout דרך Outlet context (ראה docs/ARCHITECTURE.md)
  const { isSidebarOpen } = useOutletContext();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // הפיד נשלף דרך React Query. הסינון לפי קהילה נעשה בשרת לפי הטוקן —
  // ולכן ה-cache key נשען על community_id, לא על ה-session ישירות.
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', user?.community_id],
    queryFn: () => avior.entities.Post.list(session),
    enabled: !!session,
  });

  // אחרי יצירת פוסט חדש — מבטלים את ה-cache כדי שהפיד יתרענן.
  const handlePostCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['posts', user?.community_id] });
  };

  return (
    <div className="min-h-screen space-y-6 relative">

      <div className="max-w-lg mx-auto space-y-4">
        {isLoading ? (
          <div className="flex justify-center pt-20">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-slate-500 pt-24">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  חדשות הקהילה
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-200 text-sm">
                כאן יופיעו עדכונים על אירועים קרובים, הודעות ועד ועוד...
              </CardContent>
            </Card>
            <div className="text-slate-200 font-bold mt-6">
              אין פוסטים עדיין. היה הראשון לפרסם!
            </div>
          </div>
        ) : (
          posts.map((post) => (
            <FeedPosts key={post.id} post={post} />
          ))
        )}
      </div>
      {/* כפתור הוספה */}
      <FloatingActionButton onClick={() => setIsModalOpen(true)} isSidebarOpen={isSidebarOpen} />

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}