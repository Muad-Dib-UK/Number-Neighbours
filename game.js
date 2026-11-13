(() => {
  const cells = [...document.querySelectorAll('.box')];
  const tray = document.querySelector('#number-tray');
  const remaining = document.querySelector('#remaining');
  const status = document.querySelector('#status');
  const statusText = document.querySelector('#status-text');
  const attemptsEl = document.querySelector('#attempts');
  const resetLabel = document.querySelector('#reset-label');
  const themeButton = document.querySelector('#theme-toggle');
  const themeName = document.querySelector('#theme-name');
  const themes = [
    { id: 'meadow', name: 'Meadow' },
    { id: 'ocean', name: 'Ocean' },
    { id: 'berry', name: 'Berry' },
    { id: 'sunset', name: 'Sunset' }
  ];
  let themeIndex = Math.max(0, themes.findIndex(theme => theme.id === localStorage.getItem('neighbour-numbers-theme')));
  const coordinates = [[1, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2], [1, 3]];
  let board = Array(8).fill(null);
  let drag = null;
  let checked = false;
  let failed = false;
  let solved = false;
  let attempts = Number(localStorage.getItem('neighbour-numbers-attempts') ?? localStorage.getItem('neighbor-numbers-attempts') ?? 0);

  // Diagonal contact is allowed everywhere; only side-sharing boxes count.
  function touches(a, b) {
    const [ax, ay] = coordinates[a], [bx, by] = coordinates[b];
    const dx = Math.abs(ax - bx), dy = Math.abs(ay - by);
    return (dx === 0 && dy === 1) || (dx === 1 && dy === 0);
  }
  function conflicts() {
    const pairs = [];
    for (let a = 0; a < board.length; a++) {
      if (board[a] == null) continue;
      for (let b = a + 1; b < board.length; b++) {
        if (board[b] != null && touches(a, b) && Math.abs(board[a] - board[b]) === 1) pairs.push([a, b]);
      }
    }
    return pairs;
  }
  function playNotes(notes, type = 'triangle') {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    notes.forEach(([frequency, start, duration]) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, context.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(.10, context.currentTime + start + .02);
      gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + start + duration);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(context.currentTime + start);
      oscillator.stop(context.currentTime + start + duration + .02);
      oscillator.onended = () => { if (start + duration >= Math.max(...notes.map(note => note[1] + note[2]))) context.close(); };
    });
  }
  function playFanfare() {
    playNotes([[523, 0, .14], [659, .13, .14], [784, .26, .17], [1047, .42, .42]]);
  }
  function playWrongAnswer() {
    playNotes([[330, 0, .22], [247, .20, .25], [196, .42, .38]], 'square');
  }
  function playDropSound() {
    playNotes([[587, 0, .07], [392, .035, .09]], 'sine');
  }
  function playErrorSound() {
    playNotes([[220, 0, .12], [165, .08, .16]], 'square');
  }
  function checkPuzzle() {
    if (board.some(value => value == null) || failed || solved) return;
    checked = true;
    attempts += 1;
    localStorage.setItem('neighbour-numbers-attempts', String(attempts));
    const hasConflicts = conflicts().length > 0;
    failed = hasConflicts;
    solved = !hasConflicts;
    if (solved) playFanfare(); else playWrongAnswer();
    render();
  }
  function render() {
    const count = board.filter(value => value != null).length;
    const clashPairs = checked && count === 8 ? conflicts() : [];
    const clashCells = new Set(clashPairs.flat());
    cells.forEach((cell, i) => {
      cell.textContent = board[i] ?? '';
      cell.classList.toggle('filled', board[i] != null);
      cell.classList.toggle('conflict', clashCells.has(i));
      cell.disabled = failed || solved;
      const spot = i === 0 ? 'top box' : i === 7 ? 'bottom box' : `row ${i < 4 ? 2 : 3}, column ${(i - 1) % 3 + 1}`;
      cell.setAttribute('aria-label', `${spot}, ${board[i] == null ? 'empty' : `number ${board[i]}`}${clashCells.has(i) ? ', consecutive neighbour conflict' : ''}`);
    });
    tray.innerHTML = '';
    for (let number = 1; number <= 8; number++) {
      const used = board.includes(number);
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'number'; button.textContent = number;
      button.disabled = used || failed || solved;
      button.setAttribute('aria-label', `Drag number ${number} into a box${used ? ', already placed' : ''}`);
      tray.appendChild(button);
    }
    remaining.textContent = `${8 - count} remaining`;
    attemptsEl.textContent = attempts;
    resetLabel.textContent = solved ? 'Play again' : failed ? 'Clear puzzle' : 'Start over';
    if (count === 8 && checked && clashPairs.length === 0) {
      status.className = 'status success'; statusText.textContent = 'You solved it! No consecutive numbers are neighbours.';
    } else if (count === 8 && checked) {
      status.className = 'status warning'; statusText.textContent = `Not quite — ${clashPairs.length} consecutive pair${clashPairs.length === 1 ? '' : 's'} touch. Select Clear puzzle to try again.`;
    } else if (count === 8) {
      status.className = 'status'; statusText.textContent = 'All numbers are placed.';
    }
  }
  function startDrag(event) {
    if (failed || solved || event.button !== 0) return;
    const numberButton = event.target.closest('.number');
    const box = event.target.closest('.box');
    let number = null, source = null;
    if (numberButton && !numberButton.disabled) {
      number = Number(numberButton.textContent); source = numberButton;
    } else if (box && board[Number(box.dataset.cell)] != null) {
      status.className = 'status';
      statusText.textContent = 'Once placed, a number cannot be moved. Clear the puzzle to try again.';
      return;
    }
    if (number == null) return;
    event.preventDefault();
    drag = { number, pointerId: event.pointerId };
    source.classList.add('dragging');
    const tile = document.createElement('div');
    tile.className = 'floating-tile'; tile.textContent = number; tile.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tile);
    drag.preview = tile;
    movePreview(event);
  }
  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const activeDrag = drag;
    drag = null;
    activeDrag.preview?.remove();
    document.querySelectorAll('.dragging,.drop-target').forEach(el => el.classList.remove('dragging', 'drop-target'));
    if (event.type === 'pointercancel') return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const targetBox = target?.closest('.box');
    const targetCell = targetBox ? Number(targetBox.dataset.cell) : null;
    if (targetCell != null && board[targetCell] == null) {
      board[targetCell] = activeDrag.number;
      playDropSound();
      checked = false;
      if (board.every(value => value != null)) {
        checkPuzzle();
      } else {
        status.className = 'status'; statusText.textContent = 'Number placed. Keep going.';
        render();
      }
    } else if (targetCell != null) {
      playErrorSound();
      targetBox.classList.add('error-flash');
      window.setTimeout(() => targetBox.classList.remove('error-flash'), 700);
      status.className = 'status warning';
      statusText.textContent = 'That box is already occupied. Drop the tile in an empty box.';
    }
  }
  function trackDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    movePreview(event);
    document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.box');
    if (target && board[Number(target.dataset.cell)] == null) target.classList.add('drop-target');
  }
  function movePreview(event) {
    if (!drag?.preview) return;
    drag.preview.style.left = `${event.clientX}px`;
    drag.preview.style.top = `${event.clientY}px`;
  }
  tray.addEventListener('pointerdown', startDrag);
  document.querySelector('#puzzle').addEventListener('pointerdown', startDrag);
  document.addEventListener('pointermove', trackDrag);
  document.addEventListener('pointerup', finishDrag);
  document.addEventListener('pointercancel', finishDrag);
  document.querySelector('#reset').addEventListener('click', () => {
    board = Array(8).fill(null); drag = null; checked = false; failed = false; solved = false;
    status.className = 'status'; statusText.textContent = 'Drag numbers from the tray into the boxes.';
    render();
  });
  const instructions = document.querySelector('#instructions');
  document.querySelector('#how-to').addEventListener('click', () => instructions.showModal());
  document.querySelector('#close-how').addEventListener('click', () => instructions.close());
  document.querySelector('#got-it').addEventListener('click', () => instructions.close());
  function applyTheme() {
    const theme = themes[themeIndex];
    document.documentElement.dataset.theme = theme.id;
    themeName.textContent = theme.name;
    themeButton.setAttribute('aria-label', `Change colour scheme. Current scheme: ${theme.name}.`);
    localStorage.setItem('neighbour-numbers-theme', theme.id);
  }
  themeButton.addEventListener('click', () => {
    themeIndex = (themeIndex + 1) % themes.length;
    applyTheme();
  });
  applyTheme();
  render();
})();
