window.addEventListener('load', function() {
    const pElement = document.querySelector('header p');
    pElement.classList.add('visible');
});


window.addEventListener('load', function() {
    const fadeInElements = document.querySelectorAll('.fade-in');
    fadeInElements.forEach(element => {
        element.classList.add('visible');
    });
});