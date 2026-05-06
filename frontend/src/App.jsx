import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate
} from "react-router-dom";
import { Toaster } from "sonner";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Contexts
import { AuthProvider } from "./contexts/AuthContext";
import { SidebarProvider } from "./contexts/SidebarContext";

import DashboardLayout from "./Layout/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

// Pages
import { Home } from './pages/Home';
import { Create } from './pages/Create';
import AIDesign from './components/createpage/CardsPages/AIDesign';
import ImageCreator from './components/createpage/CardsPages/ImageCreator';
import ContentWriter from './components/createpage/CardsPages/ContentWriter';
import CodeGenerator from './components/createpage/CardsPages/CodeGenerator';
import VideoProducer from './components/createpage/CardsPages/VideoProducer';
import BrandBuilder from './components/createpage/CardsPages/BrandBuilder';
import { Project } from './pages/Project';
import AllProjects from './pages/AllProjects';
import Templates from './pages/Templates';
import CategoryTemplates from './pages/CategoryTemplates';
import { AiGenerator } from './pages/AiGenerator';
import { ImageEdit } from './pages/ImageEdit';
import { VideoMaker } from './pages/VideoMaker';
import { Analatics } from './pages/Analatics';
import { Setting } from './pages/Setting';
import Help from './pages/Help';
import { Team } from './pages/Team';
import AcceptInvite from './pages/AcceptInvite';
import ArtisticImageGenerator from './components/imageeditor/ArtisticImageGenerator';
import BackgroundRemover from './components/imageeditor/BackgroundRemover';
import ImageEditor from './components/imageeditor/ImageEditor';
import CanvaClone from './pages/CanvaClone';
import Brandkit from './pages/Brandkit';
import BrandKitDetail from './pages/BrandKitDetail';
import Presentation from './pages/Presentation';
import AdminDash from './pages/AdminDash';
import BrandKitResult from './pages/BrandKitResult';
import DocumentGenerator from './components/aigenerator/DocumentGenerator';
import UiPhotoGenerator from './components/aigenerator/UiPhotoGenerator';
import SmartCrop from './components/aigenerator/SmartCrop';
import PresentationStudio from './components/presentationstudio/PresentationStudio';
import DocumentTemplates from './pages/documentTemplates';
import ImageLayout from './components/canva/ImageLayout/ImageLayout';
import Pricing from './components/analatics/Pricing';
import ImageTemplates from './pages/imageTemplates';
import PresentationTemplates from './pages/presentationTemplates';
import EditorTabPage from './pages/EditorTabPage';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import VerifyUserPage from './pages/VerifyUserPage';
import ForgetPassword from './pages/ForgetPassword';
import PresentationEditor2 from './pages/PresentationEditor2';
import PresentationWorkspace from './components/presentation3/PresentationWorkspace';

const AppContent = () => {
  const location = useLocation();

  return (
    <div >
      <main style={{ flex: 1, width: "100%" }}>
        <Routes>

          {/* ✅ FIXED HERE (removed leading slash) */}
          <Route path="dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="home" replace />} />

            <Route path="home" element={<Home />} />
            <Route path="create" element={<Create />} />
            <Route path="create/ai-design" element={<AIDesign />} />
            <Route path="create/image-creator" element={<ImageCreator />} />
            <Route path="create/content-writer" element={<ContentWriter />} />
            <Route path="create/code-generator" element={<CodeGenerator />} />
            <Route path="create/video-producer" element={<VideoProducer />} />
            <Route path="create/brand-builder" element={<BrandBuilder />} />

            <Route path="projects" element={<Project />} />
            <Route path="projects/:folder" element={<Project />} />
            <Route path="projects/all" element={<AllProjects />} />
            <Route path="projects/templates" element={<Templates />} />

            <Route path="templates/:category" element={<CategoryTemplates />} />
            <Route path="PresentationTemplates" element={<PresentationTemplates />} />
            <Route path="documentTemplates" element={<DocumentTemplates />} />
            <Route path="imageTemplates" element={<ImageTemplates />} />

            <Route path="ai-generator" element={<AiGenerator />} />
            <Route path="ai-generator/presentation-studio" element={<PresentationStudio />} />
            <Route path="presentation-studio" element={<PresentationStudio />} />
            <Route path="ai-presentation" element={<PresentationStudio />} />

            <Route path="docGenerator" element={<DocumentGenerator />} />
            <Route path="uiphoto" element={<UiPhotoGenerator />} />
            <Route path="smartcrop" element={<SmartCrop />} />

            <Route path="image-editor" element={<ImageEdit />} />
            <Route path="video-maker" element={<VideoMaker />} />
            <Route path="artisticiamge" element={<ArtisticImageGenerator />} />
            <Route path="bgremove" element={<BackgroundRemover />} />
            <Route path="imageeditor" element={<ImageEditor />} />
            <Route path="create-image" element={<ImageLayout />} />

            <Route path="editor" element={<EditorTabPage />} />

            <Route path="canva-clone/:id" element={<CanvaClone />} />

            <Route path="brand-kit" element={<Brandkit />} />
            <Route path="brand-kit-result" element={<BrandKitResult />} />
            <Route path="brand-kit-detail" element={<BrandKitDetail />} />

            <Route path="analytics" element={<Analatics />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="settings" element={<Setting />} />

            <Route path="help-support" element={<Help />} />
            <Route path="team" element={<Team />} />
            <Route path="team/accept" element={<AcceptInvite />} />

            <Route path="presentation" element={<Presentation />} />
            <Route path="admin-dash" element={
              <AdminRoute>
                <AdminDash />
              </AdminRoute>
            } />
          </Route>

          {/* ADMIN */}


          {/* FALLBACK */}
          <Route path="*" element={<div className="flex min-h-screen justify-center items-center" >Page Not Found</div>} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <AuthProvider>
        <SidebarProvider>
          <Router>
            <Toaster position="top-right" richColors closeButton duration={2000} />

            <Routes>
              {/* PUBLIC */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/signup" element={<AuthPage />} />
              <Route path="/verify" element={<VerifyUserPage />} />
              <Route path="/forget-password" element={<ForgetPassword />} />

              {/* FULLSCREEN */}
              <Route path="/presentation-editor" element={<ProtectedRoute><PresentationEditor2 /></ProtectedRoute>} />
              <Route path="/presentation-editor/:id" element={<ProtectedRoute><PresentationEditor2 /></ProtectedRoute>} />
              <Route path="/presentation-editor-v3" element={<ProtectedRoute><PresentationWorkspace /></ProtectedRoute>} />
              <Route path="/presentation-editor-v3/:id" element={<ProtectedRoute><PresentationWorkspace /></ProtectedRoute>} />
              <Route path="/canva-clone" element={<CanvaClone />} />

              {/* MAIN */}
              <Route path="/*" element={<ProtectedRoute><AppContent /></ProtectedRoute>} />
            </Routes>

          </Router>
        </SidebarProvider>
      </AuthProvider>
    </DndProvider>
  );
}

