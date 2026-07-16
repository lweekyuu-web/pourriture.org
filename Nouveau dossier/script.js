document.addEventListener('DOMContentLoaded', function() {
  let clicks = 0;
  const clickArea = document.getElementById('clickArea');
  const text = document.getElementById('text');
  const gif = document.getElementById('gif');

  if (!clickArea || !text || !gif) {
    return;
  }

  clickArea.addEventListener('click', clickSite);
  clickArea.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      clickSite();
    }
  });

  function clickSite() {
    clicks += 1;
    if (clicks === 1) {
      text.textContent = 'enkor';
      gif.style.display = 'block';
    } else if (clicks === 2) {
      text.textContent = 'ENKOR G DIT';
    } else if (clicks === 3) {
      text.textContent = 'b-bakadayo...T-tu insistes vraiment...?';
    } else if (clicks === 4) {
      text.textContent = 'bravo Hugo charpipi G TON ADRESSE IP';
    } else {
      text.textContent = 'Tu as cliqué ' + clicks + ' fois';
    }
  }
});
