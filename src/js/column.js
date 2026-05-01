import { Card } from './card.js';

export class Column {
  constructor(id, title, cards = [], onCardDelete, onStateChange) {
    this.id = id;
    this.title = title;
    this.cards = cards.map(c => new Card(c.id, c.text, this.id, onCardDelete, onStateChange, onStateChange));
    this.onCardDelete = onCardDelete;
    this.onStateChange = onStateChange;
    this.element = null;
    this.cardsContainer = null;
    this.dropIndicator = null;
  }

  createElement() {
    const column = document.createElement('div');
    column.className = 'column';
    column.dataset.columnId = this.id;

    const title = document.createElement('div');
    title.className = 'column-title';
    title.textContent = this.title;

    this.cardsContainer = document.createElement('div');
    this.cardsContainer.className = 'column-cards';
    this.cardsContainer.dataset.columnId = this.id;

    this.cardsContainer.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.cardsContainer.addEventListener('dragenter', (e) => this.handleDragEnter(e));
    this.cardsContainer.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.cardsContainer.addEventListener('drop', (e) => this.handleDrop(e));

    const addBtn = document.createElement('button');
    addBtn.className = 'add-card-btn';
    addBtn.textContent = '+ Add another card';
    addBtn.addEventListener('click', () => this.addCard());

    column.appendChild(title);
    column.appendChild(this.cardsContainer);
    column.appendChild(addBtn);

    this.element = column;
    this.renderCards();

    return column;
  }

  renderCards() {
    this.cardsContainer.innerHTML = '';
    this.cards.forEach(card => this.cardsContainer.appendChild(card.createElement()));
  }

  addCard(text = 'New card') {
    const newCard = new Card(Date.now().toString() + Math.random().toString(36).substr(2, 9), text, this.id, this.onCardDelete, this.onStateChange, this.onStateChange);
    this.cards.push(newCard);
    this.cardsContainer.appendChild(newCard.createElement());
    this.onStateChange();
  }

  deleteCard(cardId) {
    const index = this.cards.findIndex(c => c.id === cardId);
    if (index !== -1) {
      this.cards[index].destroy();
      this.cards.splice(index, 1);
      this.onStateChange();
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.updateDropIndicator(e);
  }

  handleDragEnter(e) { e.preventDefault(); }

  handleDragLeave(e) {
    if (!this.cardsContainer.contains(e.relatedTarget)) {
      this.removeDropIndicator();
    }
  }

  handleDrop(e) {
    e.preventDefault();
    this.removeDropIndicator();

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.sourceColumnId === this.id) {
        this.moveWithinColumn(data.cardId, e.clientY);
      } else {
        document.dispatchEvent(new CustomEvent('cardDropped', { detail: { cardId: data.cardId, sourceColumnId: data.sourceColumnId, targetColumnId: this.id, clientY: e.clientY } }));
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  }

  moveWithinColumn(cardId, clientY) {
    const cardIndex = this.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    const [movedCard] = this.cards.splice(cardIndex, 1);
    const cards = Array.from(this.cardsContainer.querySelectorAll('.card:not(.dragging)'));
    const insertBefore = this.getInsertPosition(cards, clientY);
    const targetIndex = insertBefore ? this.cards.findIndex(c => c.id === insertBefore.dataset.cardId) : this.cards.length;

    this.cards.splice(targetIndex, 0, movedCard);
    this.renderCards();
    this.onStateChange();
  }

  getInsertPosition(cards, clientY) {
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return card;
    }
    return null;
  }

  updateDropIndicator(e) {
    if (!this.dropIndicator) {
      this.dropIndicator = document.createElement('div');
      this.dropIndicator.className = 'drop-indicator';
    }

    const cards = Array.from(this.cardsContainer.querySelectorAll('.card:not(.dragging)'));
    const target = this.getInsertPosition(cards, e.clientY);

    if (target) {
      this.cardsContainer.insertBefore(this.dropIndicator, target);
    } else {
      this.cardsContainer.appendChild(this.dropIndicator);
    }
  }

  removeDropIndicator() {
    if (this.dropIndicator && this.dropIndicator.parentNode) {
      this.dropIndicator.parentNode.removeChild(this.dropIndicator);
    }
  }
}