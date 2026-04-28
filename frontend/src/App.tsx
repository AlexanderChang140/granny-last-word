import './App.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import GamePage from './game/pages/GamePage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './modules/auth/AuthProvider';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import MenuPage from "./pages/MenuPage";
import ChatPage from "./pages/ChatPage";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={<Navigate to="/login" replace />}
                    />
                    <Route element={<AuthenticatedRoute />}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                    </Route>

                    <Route element={<ProtectedRoute />}>
                        <Route path="/game" element={<GamePage />} />
                    </Route>
                    <Route path="/*" element={<NotFound />} />
                    <Route path="/menu" element={<MenuPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
