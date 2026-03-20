import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

function PlaceholderGamePage() {
    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Game Screen Placeholder</h1>
                <p>You logged in successfully.</p>
            </div>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/game" element={<PlaceholderGamePage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;