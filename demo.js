const demoButton = document.querySelector('#demo-button');

demoButton.addEventListener('click', () => {
  const input = document.querySelector('#payload');
  const text = input.value.trim();
  if (!text) {
    setStatus('Спочатку введіть текст для демо-коду.', 'error');
    input.focus();
    return;
  }

  render(text);
  document.querySelector('#download-button').disabled = false;
  document.querySelector('#paid-note').textContent = 'Демо-код · без оплати';
  setStatus('Демо-код створено. Можете завантажити SVG.', 'success');
});