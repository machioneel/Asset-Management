import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Settings from './pages/Settings';
import UserGuide from "./pages/UserGuide";
import DeletedAsset from "./pages/DeletedAsset";


import Auth from './pages/Auth';
import Footer from './components/Footer';
import { supabase } from './lib/supabase';
import { useAssetStore } from './store/assetStore';

function App() {
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { fetchAssets } = useAssetStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        fetchAssets();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchAssets();
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAssets]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <div className="p-0 pb-0">
          <Routes>
            <Route
              path="/auth"
              element={!session ? <Auth /> : <Navigate to="/" replace />}
            />
            <Route
              path="/"
              element={
                session ? (
                  <Layout 
                    isMobileSidebarOpen={isMobileSidebarOpen}
                    toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                  />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="assets" element={<Assets />} />
              <Route path="userguide" element={<UserGuide />} />
              <Route path="deletedasset" element={<DeletedAsset />} />
              <Route path="settings" element={<Settings />} />
              
            </Route>
          </Routes>
        </div>
        {/*{session && <Footer />}*/}
      </div>
    </Router>
  );
}

export default App;
