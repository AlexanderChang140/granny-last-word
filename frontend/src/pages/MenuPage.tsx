import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

type PlayerStats = {
  totalRuns: number;
  bestScore: number;
  enemiesDefeated: number;
  longestWord: string;
  lastRunResult: string;
};

export default function MenuPage() {
  const navigate = useNavigate();

  // Frontend-only placeholder state for now.
  // Later this can come from backend/session save data.
  const hasInProgressRun = false;

  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const stats = useMemo<PlayerStats>(
    () => ({
      totalRuns: 0,
      bestScore: 0,
      enemiesDefeated: 0,
      longestWord: "-",
      lastRunResult: "No runs yet",
    }),
    []
  );

  function handleStartNewRun() {
    navigate("/game");
  }

  function handleContinueRun() {
    if (!hasInProgressRun) return;
    navigate("/game");
  }

  function handleOpenStats() {
    setShowStatsModal(true);
  }

  function handleCloseStats() {
    setShowStatsModal(false);
  }

  function handleChat() {
    navigate("/chat");
  }

  function handleLogoutClick() {
    setShowLogoutModal(true);
  }

  function handleCancelLogout() {
    setShowLogoutModal(false);
  }

  function handleConfirmLogout() {
    // Frontend-only version:
    // Later replace with logout API call if needed.
    navigate("/");
  }

  return (
    <div className="menu-page">
      <div className="menu-background" />

      <main className="menu-shell">
        <section className="menu-card">
          <div className="menu-header">
            <h1 className="menu-title">Granny’s Last Word</h1>
            <p className="menu-subtitle">A wordy battle of life and death awaits...</p>
          </div>

          <div className="menu-actions">
            <button className="menu-button primary" onClick={handleStartNewRun}>
              Start New Run
            </button>

            <button
              className="menu-button"
              onClick={handleContinueRun}
              disabled={!hasInProgressRun}
              title={!hasInProgressRun ? "No run currently in progress" : "Continue your run"}
            >
              Continue Run
            </button>

            <button className="menu-button" onClick={handleOpenStats}>
              Statistics
            </button>

            <button className="menu-button" onClick={handleChat}>
              Chat with Other Players
            </button>

            <button className="menu-button danger" onClick={handleLogoutClick}>
              Log Out
            </button>
          </div>
        </section>
      </main>

      {showStatsModal && (
        <div className="menu-modal-overlay" onClick={handleCloseStats}>
          <div className="menu-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="menu-modal-title">Statistics</h2>

            <div className="stats-list">
              <div className="stat-row">
                <span>Total Runs</span>
                <strong>{stats.totalRuns}</strong>
              </div>
              <div className="stat-row">
                <span>Best Score</span>
                <strong>{stats.bestScore}</strong>
              </div>
              <div className="stat-row">
                <span>Enemies Defeated</span>
                <strong>{stats.enemiesDefeated}</strong>
              </div>
              <div className="stat-row">
                <span>Longest Word</span>
                <strong>{stats.longestWord}</strong>
              </div>
              <div className="stat-row">
                <span>Last Run Result</span>
                <strong>{stats.lastRunResult}</strong>
              </div>
            </div>

            <div className="menu-modal-actions">
              <button className="menu-button" onClick={handleCloseStats}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="menu-modal-overlay" onClick={handleCancelLogout}>
          <div className="menu-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="menu-modal-title">Log Out</h2>
            <p className="menu-modal-text">Are you sure you want to log out?</p>

            <div className="menu-modal-actions two-column">
              <button className="menu-button" onClick={handleCancelLogout}>
                Cancel
              </button>
              <button className="menu-button danger" onClick={handleConfirmLogout}>
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}