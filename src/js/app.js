import { Board } from './board.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  const savedState = Board.loadState();
  new Board(app, savedState);
});