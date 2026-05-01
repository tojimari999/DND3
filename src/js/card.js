export class Card {
  constructor(id, text, columnId, onDelete, onDragStart, onDragEnd) {
    this.id = id;
    this.text = text;
    this.columnId = columnId;
    this.onDelete = onDelete;
    this.onDragStart = onDragStart;
    this.onDragEnd = onDragEnd;
    this.element = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
  }

  createElement() {
    const card = document.createElement('div');
    card.className = 'card';
    card.draggable = true;
    card.dataset.cardId = this.id;

    const text = document.createElement('div');
    text.className = 'card-text';
    text.textContent = this.text;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'card-delete';
    deleteBtn.type = 'button';
    deleteBtn.title = 'Удалить';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onDelete(this.id);
    });

    card.appendChild(text);
    card.appendChild(deleteBtn);

    card.addEventListener('dragstart', (e) => this.handleDragStart(e));
    card.addEventListener('dragend', (e) => this.handleDragEnd(e));
    card.addEventListener('mousedown', (e) => this.handleMouseDown(e));

    this.element = card;
    return card;
  }

  handleMouseDown(e) {
    if (e.target.classList.contains('card-delete')) return;
    const rect = this.element.getBoundingClientRect();
    this.dragOffsetX = e.clientX - rect.left;
    this.dragOffsetY = e.clientY - rect.top;
  }

  handleDragStart(e) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ cardId: this.id, sourceColumnId: this.columnId }));
    e.dataTransfer.setDragImage(this.element, this.dragOffsetX, this.dragOffsetY);
    this.element.classList.add('dragging');
    this.onDragStart();
  }

  handleDragEnd() {
    this.element.classList.remove('dragging');
    this.onDragEnd();
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}