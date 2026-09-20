const demoButton = document.querySelector('#demo-button');

demoButton.addEventListener('click', () => {
  const { payload: input, render, setStatus, download } = window.qarkod;
  const text = input.value.trim();
  if (!text) {
    setStatus('Спочатку введіть текст для демо-коду.', 'error');
    input.focus();
    return;
  }

  render(text);
  download.disabled = false;
  document.querySelector('#paid-note').textContent = 'Демо-код · без оплати';
  setStatus('Демо-код створено. Можете завантажити SVG.', 'success');
});