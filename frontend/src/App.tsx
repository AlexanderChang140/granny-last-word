import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import GamePage from "./pages/GamePage";
import MenuPage from "./pages/MenuPage";

//TODO: make /game require authentication
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="/menu" element={<MenuPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;