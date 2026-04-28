import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

type ForumPost = {
    post_id: number;
    username: string;
    content: string;
    created_at: string;
};

export default function ChatPage() {
    const navigate = useNavigate();

    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        async function loadPosts() {
            try {
                setErrorMessage("");

                const response = await fetch("/api/forum/posts", {
                    method: "GET",
                    credentials: "include",
                });

                if (response.status === 401) {
                    navigate("/");
                    return;
                }

                if (!response.ok) {
                    throw new Error("Failed to load posts");
                }

                const data: ForumPost[] = await response.json();
                setPosts(data);
            } catch {
                setErrorMessage("Could not load forum posts.");
            } finally {
                setIsLoading(false);
            }
        }
        loadPosts();
    }, [navigate]);

    async function handleSend() {
        const trimmed = input.trim();
        if (!trimmed || isSubmitting) return;

        try {
            setIsSubmitting(true);
            setErrorMessage("");

            const response = await fetch("/api/forum/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ content: trimmed }),
            });

            if (response.status === 401) {
                navigate("/");
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to post");
            }

            setPosts((prev) => [...prev, data]);
            setInput("");
        } catch (error) {
            if (error instanceof Error) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage("Could not send post.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    const postCountText = useMemo(() => {
        if (posts.length === 1) return "1 post";
        return `${posts.length} posts`;
    }, [posts.length]);

    return (
        <div className="chat-page">
            <div className="chat-card forum-card">
                <div className="forum-header">
                    <h1 className="chat-title">Granny's Forum</h1>
                    <p className="forum-subtitle">
                        Share tips, battle stories, and lucky words with other players.
                    </p>
                    <p className="forum-meta">{postCountText}</p>
                </div>

                <div className="chat-box forum-box">
                    <div className="chat-messages forum-messages">
                        {isLoading && (
                            <p className="chat-placeholder">Loading posts...</p>
                        )}

                        {!isLoading && posts.length === 0 && (
                            <p className="chat-placeholder">
                                No posts yet. Be the first one to write something.
                            </p>
                        )}

                        {!isLoading &&
                            posts.map((post) => (
                                <article key={post.post_id} className="forum-post">
                                    <div className="forum-post-header">
                                        <strong>{post.username}</strong>
                                        <span>
                                            {new Date(post.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="forum-post-content">{post.content}</p>
                                </article>
                            ))}
                    </div>
                </div>

                {errorMessage && <p className="error-text">{errorMessage}</p>}

                <div className="chat-input-row forum-input-row">
                    <textarea
                        className="forum-input"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey && input.trim()) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Write a forum post..."
                        maxLength={300}
                        rows={3}
                    />
                    <button
                        className="battle-button"
                        onClick={handleSend}
                        disabled={!input.trim() || isSubmitting}
                    >
                        {isSubmitting ? "Posting..." : "Post"}
                    </button>
                </div>

                <p className="forum-character-count">{input.trim().length}/300</p>

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