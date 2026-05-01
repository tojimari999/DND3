import { Column } from './column.js';

export class Board {
  constructor(container, initialState) {
    this.columns = [];
    this.element = null;
    this.container = container;
    this.initialState = initialState;

    this.createElement();
    this.initColumns();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'board';
    this.container.appendChild(this.element);

    document.addEventListener('cardDropped', (e) => this.handleCardDrop(e));
  }

  initColumns() {
    const state = this.initialState || this.getDefaultState();
    state.columns.forEach(colData => {
      const column = new Column(colData.id, colData.title, colData.cards, (cardId) => this.deleteCard(colData.id, cardId), () => this.saveState());
      this.columns.push(column);
      this.element.appendChild(column.createElement());
    });
  }

  getDefaultState() {
    return { columns: [{ id: 'col-1', title: 'To Do', cards: [] }, { id: 'col-2', title: 'In Progress', cards: [] }, { id: 'col-3', title: 'Done', cards: [] }] };
  }

  deleteCard(columnId, cardId) {
    const column = this.columns.find(c => c.id === columnId);
    if (column) column.deleteCard(cardId);
  }

  handleCardDrop(e) {
    const { cardId, sourceColumnId, targetColumnId, clientY } = e.detail;
    const sourceColumn = this.columns.find(c => c.id === sourceColumnId);
    const targetColumn = this.columns.find(c => c.id === targetColumnId);
    if (!sourceColumn || !targetColumn) return;

    const cardIndex = sourceColumn.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    const [cardData] = sourceColumn.cards.splice(cardIndex, 1);
    const newCard = new Card(cardData.id, cardData.text, targetColumnId, (id) => this.deleteCard(targetColumnId, id), () => this.saveState(), () => this.saveState());

    const cards = Array.from(targetColumn.cardsContainer.querySelectorAll('.card:not(.dragging)'));
    const insertBefore = targetColumn.getInsertPosition(cards, clientY);
    const targetIndex = insertBefore ? targetColumn.cards.findIndex(c => c.id === insertBefore.dataset.cardId) : targetColumn.cards.length;

    targetColumn.cards.splice(targetIndex, 0, newCard);
    sourceColumn.renderCards();
    targetColumn.renderCards();
    this.saveState();
  }

  saveState() {
    const state = { columns: this.columns.map(col => ({ id: col.id, title: col.title, cards: col.cards.map(c => ({ id: c.id, text: c.text })) })) };
    localStorage.setItem('trello-board-state', JSON.stringify(state));
  }

  static loadState() {
    try {
      const stored = localStorage.getItem('trello-board-state');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }
}