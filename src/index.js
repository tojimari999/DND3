import './styles/main.css';

const STORAGE_KEY = 'trello_board_state';
const DEFAULT_STATE = [
  { id: 'col-1', title: 'Column 1', cards: [] },
  { id: 'col-2', title: 'Column 2', cards: [] },
  { id: 'col-3', title: 'Column 3', cards: [] }
];

let state = loadState();
let dragState = null;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_STATE));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  state.forEach(col => {
    const colEl = document.createElement('div');
    colEl.className = 'column';
    colEl.dataset.colId = col.id;

    const header = document.createElement('div');
    header.className = 'column-header';
    header.textContent = col.title;
    colEl.appendChild(header);

    const list = document.createElement('div');
    list.className = 'cards-list';
    list.dataset.colId = col.id;

    col.cards.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      cardEl.dataset.cardId = card.id;
      cardEl.dataset.text = card.text;
      cardEl.textContent = card.text;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'card-delete';
      deleteBtn.innerHTML = '&#10005;';
      deleteBtn.addEventListener('click', e => {
        e.stopPropagation();
        removeCard(col.id, card.id);
      });
      cardEl.appendChild(deleteBtn);

      cardEl.addEventListener('pointerdown', handlePointerDown);
      list.appendChild(cardEl);
    });

    colEl.appendChild(list);

    const addBtn = document.createElement('button');
    addBtn.className = 'add-card-btn';
    addBtn.textContent = 'Add another card';
    addBtn.addEventListener('click', () => showAddForm(col.id, addBtn, list));
    colEl.appendChild(addBtn);

    app.appendChild(colEl);
  });
}

function showAddForm(colId, btn, list) {
  btn.style.display = 'none';
  const form = document.createElement('div');
  form.className = 'add-card-form';

  const textarea = document.createElement('textarea');
  textarea.rows = 3;
  textarea.placeholder = 'Enter a title for this card...';

  const actions = document.createElement('div');
  actions.className = 'add-card-form-actions';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn-save';
  saveBtn.textContent = 'Add card';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancel';

  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  form.appendChild(textarea);
  form.appendChild(actions);
  btn.after(form);
  textarea.focus();

  const finishAdd = () => {
    if (textarea.value.trim()) addCard(colId, textarea.value.trim());
    form.remove();
    btn.style.display = 'block';
  };

  saveBtn.addEventListener('click', finishAdd);
  cancelBtn.addEventListener('click', () => { form.remove(); btn.style.display = 'block'; });
  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finishAdd(); }
    if (e.key === 'Escape') { form.remove(); btn.style.display = 'block'; }
  });
}

function addCard(colId, text) {
  const col = state.find(c => c.id === colId);
  if (col) {
    col.cards.push({ id: 'card-' + Date.now(), text });
    saveState();
    render();
  }
}

function removeCard(colId, cardId) {
  const col = state.find(c => c.id === colId);
  if (col) {
    col.cards = col.cards.filter(c => c.id !== cardId);
    saveState();
    render();
  }
}

function handlePointerDown(e) {
  if (e.button !== 0) return;
  e.preventDefault();
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  const colId = card.closest('.cards-list').dataset.colId;
  const cardId = card.dataset.cardId;

  const ghost = document.createElement('div');
  ghost.className = 'ghost-card';
  ghost.textContent = card.dataset.text;
  ghost.style.width = rect.width + 'px';
  ghost.style.transform = `translate(${e.clientX - offsetX}px, ${e.clientY - offsetY}px)`;
  document.body.appendChild(ghost);

  dragState = { card, colId, cardId, offsetX, offsetY, ghost, placeholder: null, targetList: null, insertBefore: null };
  card.classList.add('dragging');

  document.addEventListener('pointermove', handlePointerMove);
  document.addEventListener('pointerup', handlePointerUp);
}

function handlePointerMove(e) {
  if (!dragState) return;
  const { ghost, offsetX, offsetY } = dragState;
  ghost.style.transform = `translate(${e.clientX - offsetX}px, ${e.clientY - offsetY}px)`;

  ghost.style.display = 'none';
  const target = document.elementFromPoint(e.clientX, e.clientY);
  ghost.style.display = 'block';

  if (dragState.placeholder) dragState.placeholder.remove();

  if (target) {
    const list = target.closest('.cards-list');
    if (list) {
      let insertBefore = null;
      const cards = Array.from(list.querySelectorAll('.card:not(.dragging)'));
      for (const c of cards) {
        const rect = c.getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) {
          insertBefore = c;
          break;
        }
      }
      const placeholder = document.createElement('div');
      placeholder.className = 'placeholder';
      placeholder.style.height = dragState.card.offsetHeight + 'px';
      if (insertBefore) {
        list.insertBefore(placeholder, insertBefore);
      } else {
        list.appendChild(placeholder);
      }
      dragState.placeholder = placeholder;
      dragState.targetList = list;
      dragState.insertBefore = insertBefore;
    } else {
      dragState.targetList = null;
    }
  }
}

function handlePointerUp() {
  document.removeEventListener('pointermove', handlePointerMove);
  document.removeEventListener('pointerup', handlePointerUp);

  if (!dragState) return;

  const { colId, cardId, ghost, placeholder, targetList, insertBefore } = dragState;

  if (targetList) {
    const targetColId = targetList.dataset.colId;
    const sourceCol = state.find(c => c.id === colId);
    const targetCol = state.find(c => c.id === targetColId);

    const cardIdx = sourceCol.cards.findIndex(c => c.id === cardId);
    const movedCard = sourceCol.cards.splice(cardIdx, 1)[0];

    const targetCards = targetCol.cards;
    let insertIdx = targetCards.length;
    if (insertBefore) {
      insertIdx = targetCards.findIndex(c => c.id === insertBefore.dataset.cardId);
    }
    targetCards.splice(insertIdx, 0, movedCard);
    saveState();
  }

  ghost.remove();
  if (placeholder) placeholder.remove();
  dragState.card.classList.remove('dragging');
  dragState = null;
  render();
}

render();