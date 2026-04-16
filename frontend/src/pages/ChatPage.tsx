import { useState } from "react";
import { useNavigate } from "react-router";

type Message = {
    id: number;
    text: string;
};

export default function ChatPage() {
    const navigate = useNavigate();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");

    function handleSend() {
        if (!input.trim()) return;

        const newMessage: Message = {
            id: Date.now(),
            text: input,
        };

        setMessages((prev) => [...prev, newMessage]);
        setInput("");
    }

    return (
        <div className="chat-page">
            <div className="chat-card">
                <h1 className="chat-title">Chat with Other Players</h1>

                <div className="chat-box">
                    <div className="chat-messages">
                        {messages.length === 0 && (
                            <p className="chat-placeholder">No messages yet...</p>
                        )}

                        {messages.map((msg) => (
                            <div key={msg.id} className="chat-message">
                                {msg.text}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="chat-input-row">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && input.trim()) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Type a message..."
                    />
                    <button className="battle-button" onClick={handleSend}>
                        Send
                    </button>
                </div>

                <button
                    className="battle-button"
                    style={{ marginTop: "16px" }}
                    onClick={() => navigate("/menu")}
                >
                    Back to Menu
                </button>
            </div>
        </div>
    );
}