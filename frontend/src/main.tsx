import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GameClient } from './game/gameManager'


/**
 * SIMPLE DEBUG HUD: 
 * This is the simple green text overlay that shows the game state information.
 * Used to verify the Backend is working properly without needing Phaser.
 */
const debugLine = document.createElement('div');
debugLine.style.cssText = `
  position: fixed; 
  top: 10px; 
  left: 10px; 
  color: #00ff00; 
  font-family: 'Courier New', monospace; 
  background: rgba(0, 0, 0, 0.8); 
  padding: 10px; 
  z-index: 9999;
  border: 1px solid #00ff00;
`;
debugLine.innerText = "PRESS 'S' TO START BATTLE";
document.body.appendChild(debugLine);

/**
 * GAME CLIENT INITIALIZATION:
 * Create an instance of the GameClient. 
 * The callback function runs every time the server emits a 'state_update'.
 */
const client = new GameClient((state) => {
  // Update the debug hud with the latest game state information
  debugLine.innerText = `STATUS: ${state.status.toUpperCase()} | TURN: ${state.turn_owner} | GRANNY HP: ${state.player_hp} | ENEMY HP: ${state.enemy_hp}`;
  
  if (state.status === 'finished') {
    debugLine.style.color = 'red';
    debugLine.innerText += " - BATTLE OVER";
  } else {
    debugLine.style.color = '#00ff00';
  }
});

/**
 * INPUT HANDLING:
 * Temporary keyboard listeners to test the Battle Loop.
 * 'S' = Initialize/Reset Battle
 * 'Space' = Submit an attack word
 */
window.addEventListener('keydown', (event) => {
  // Press 'S' to simulate starting the battle 
  if (event.code === 'KeyS') {
    client.startBattle();
  }

  // Press 'Space' to simulate submitting a word 
  //                NOTE: No word is actually submitted, this just simulates doing damage to the enemy
  if (event.code === 'Space') {
    // Only send if it's the player's turn
    client.sendAction("TEST_WORD"); 
  }
});

/**
 * REACT MOUNTING:
 * Standard React entry point. 
 * Even while we test with the Debug HUD, the React App (Menus/Login) runs here.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
