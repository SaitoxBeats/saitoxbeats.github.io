// Anima proceduralmente o filtro SVG para efeito de onda
const turb = document.getElementById('turb');
let t = 0;
function animateWave() {
    t += 0.008;
    // Frequência baixa, mas amplitude de variação maior
    const freqX = 0.003 + Math.sin(t) * 0.0015;
    const freqY = 0.004 + Math.cos(t * 0.7) * 0.002;
    turb.setAttribute('baseFrequency', `${freqX} ${freqY}`);
    requestAnimationFrame(animateWave);
}
if (turb) animateWave();