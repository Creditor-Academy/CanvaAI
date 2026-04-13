import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import SideBar from "./components/SideBar";
import Navbar from "./components/Navbar";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";
import { Home } from './pages/Home';
import { Create } from './pages/Create';
import AISuggestTemp from './components/homepage/AISuggestTemp';
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
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AuthPage from "./pages/AuthPage";
import VerifyUserPage from "./pages/VerifyUserPage";
import AdminDash from "./pages/AdminDash";
import BrandKitResult from "./pages/BrandKitResult";
import DocumentGenerator from "./components/aigenerator/DocumentGenerator";
import UiPhotoGenerator from "./components/aigenerator/UiPhotoGenerator";
import SmartCrop from "./components/aigenerator/SmartCrop";
import PresentationStudio from "./components/presentationstudio/PresentationStudio";
import PresentationEditor2 from "./pages/PresentationEditor2";
import LandingPage from "./pages/LandingPage";
import EditorTabPage from './pages/EditorTabPage';
import ForgetPassword from "./pages/ForgetPassword";
import PresentationWorkspace from "./components/presentation3/PresentationWorkspace";
import DocumentTemplates from "./pages/documentTemplates";
import ImageLayout from "./components/canva/ImageLayout/ImageLayout";
import Pricing from "./components/analatics/Pricing";
import ImageTemplates from "./pages/imageTemplates";
import PresentationTemplates from "./pages/presentationTemplates";

const AppContent = () => {
  const location = useLocation();

  const isFullScreenRoute =
    location.pathname.startsWith('/canva-clone') ||
    location.pathname.startsWith('/presentation-editor') ||
    location.pathname.startsWith('/presentation-editor-v3');

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>

      {!isFullScreenRoute && <SideBar />}

      {/* Navbar */}
      {!isFullScreenRoute && <Navbar />}


      {/* Page Content */}
      <div
        style={{
          flex: 1,
          width:"100%",
          minheight:"100vh",
          
         
        }}
      >

        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/ai-suggest-templates" element={<AISuggestTemp />} />
          <Route path="/create" element={<Create />} />
          <Route path="/create/ai-design" element={<AIDesign />} />
          <Route path="/create/image-creator" element={<ImageCreator />} />
          <Route path="/create/content-writer" element={<ContentWriter />} />
          <Route path="/create/code-generator" element={<CodeGenerator />} />
          <Route path="/create/video-producer" element={<VideoProducer />} />
          <Route path="/create/brand-builder" element={<BrandBuilder />} />
          <Route path="/projects/:folder?" element={<Project />} />
          <Route path="/projects" element={<Project />} />
          <Route path="/projects/all" element={<AllProjects />} />
          <Route path="/projects/templates" element={<Templates />} />
          <Route path="/templates/:category" element={<CategoryTemplates />} />
          <Route path="/ai-generator" element={<AiGenerator />} />
          <Route path="/ai-generator/presentation-studio" element={<PresentationStudio />} />
          <Route path="/presentation-studio" element={<PresentationStudio />} />
          <Route path="/ai-presentation" element={<PresentationStudio />} />

          <Route path="/image-editor" element={<ImageEdit />} />
          <Route path="/video-maker" element={<VideoMaker />} />
          <Route path="/analytics" element={<Analatics />} />
          <Route path="/settings" element={<Setting />} />
          <Route path="/help-support" element={<Help />} />
          <Route path="/team" element={<Team />} />
          <Route path="/team/accept" element={<AcceptInvite />} />
          <Route path="/artisticiamge" element={<ArtisticImageGenerator />} />
          <Route path="/bgremove" element={<BackgroundRemover />} />
          <Route path="/imageeditor" element={<ImageEditor />} />
          <Route path="/create-image" element={<ImageLayout />} />
          <Route path="/canva-clone" element={<CanvaClone />} />
          <Route path="/canva-clone/:id" element={<CanvaClone />} />
          <Route path="/brand-kit" element={<Brandkit />} />
          <Route path="/brand-kit-result" element={<BrandKitResult />} />
          <Route path="/brand-kit-detail" element={<BrandKitDetail />} />
          <Route path="/docGenerator" element={<DocumentGenerator />} />
          <Route path="/editor" element={<EditorTabPage />} />
          <Route path="/uiphoto" element={<UiPhotoGenerator />} />
          <Route path="/smartcrop" element={<SmartCrop />} />
          <Route
            path="/admin-dash"
            element={
              <AdminRoute>
                <AdminDash />
              </AdminRoute>
            }
          />

          <Route path="/presentation" element={<Presentation />} />
          <Route path="/PresentationTemplates" element={<PresentationTemplates />} />
          <Route path="/documentTemplates" element={<DocumentTemplates />} />
          <Route path="/imageTemplates" element={<ImageTemplates/>} />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>

      </div>
    </div>
  );
};


function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <AuthProvider>
        <SidebarProvider>
          <Router>
            <Toaster position="top-right" richColors />

            <Routes>

              {/* PUBLIC */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/signup" element={<AuthPage />} />
              <Route path="/verify" element={<VerifyUserPage />} />
              <Route path="/forget-password" element={<ForgetPassword />} />

              {/* FULLSCREEN EDITORS */}
              <Route path="/presentation-editor" element={<ProtectedRoute><PresentationEditor2 /></ProtectedRoute>} />
              <Route path="/presentation-editor/:id" element={<ProtectedRoute><PresentationEditor2 /></ProtectedRoute>} />
              <Route path="/presentation-editor-v3" element={<ProtectedRoute><PresentationWorkspace /></ProtectedRoute>} />
              <Route path="/presentation-editor-v3/:id" element={<ProtectedRoute><PresentationWorkspace /></ProtectedRoute>} />

              {/* MAIN APP */}
              <Route path="/*" element={<ProtectedRoute><AppContent /></ProtectedRoute>} />

            </Routes>
          </Router>
        </SidebarProvider>
      </AuthProvider>
    </DndProvider>
  );
}

export default App;
