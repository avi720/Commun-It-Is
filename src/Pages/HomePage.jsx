import React, { useEffect, useState } from 'react';
import { Building, Users, Star, Plus, Loader2 } from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { useAppData } from '../context/AppContext';
import { avior } from '../Api/Client';
import FeedPosts from '../Components/pagesComp/homePageComp/FeedPosts';
import CreatePostModal from '../Components/pagesComp/homePageComp/CreatePostModal';
import MainLayout from '@/Components/MainLayout';

export default function HomePage() {
  const { user } = useAppData();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const FloatingActionButton = ({ onClick }) => {
    const { isSidebarOpen } = useAppData();
    return (!isSidebarOpen ? (
      <Button
        onClick={onClick}
        className="fixed bottom-16 left-6 w-14 h-14 rounded-full bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-500/30 flex items-center justify-center z-50 transition-transform hover:scale-105"
      >
        <Plus className="w-8 h-8 text-white" />
      </Button>)
      : (
        <div className="fixed bottom-16 left-6 w-14 h-14 rounded-full bg-teal-500/60 hover:bg-teal-600 shadow-lg shadow-teal-500/30 flex items-center justify-center z-50 transition-transform hover:scale-105">
          <Plus className="w-4 h-4 text-gray-400" />
        </div>
      )
    );
  };

  // useEffect(() => {
  //   // טוענים פוסטים רק אם יש משתמש ויש לו עיר
  //   if (user && user.city) {
  //     loadPosts();
  //   }
  // }, [user]);

  const loadPosts = async () => {
    try {
      const data = await avior.entities.Post.list();
      setPosts(data);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen space-y-6 relative">

      <div className="max-w-lg mx-auto space-y-4">
        {loading ? (
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
      <FloatingActionButton onClick={() => setIsModalOpen(true)} />

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={loadPosts}
      />
    </div>
  );
}