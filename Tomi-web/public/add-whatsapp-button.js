// Script to add WhatsApp pairing button to main page
document.addEventListener('DOMContentLoaded', function() {
    const buttonContainer = document.querySelector('.button-container');
    if (buttonContainer) {
        // Create WhatsApp pairing button
        const whatsappButton = document.createElement('button');
        whatsappButton.className = 'whatsapp-pairing';
        whatsappButton.onclick = function() {
            window.location.href = 'whatsapp.html';
        };
        whatsappButton.innerHTML = '<i class="fab fa-whatsapp"></i> Pairing WhatsApp Bot';
        
        // Add the button to container
        buttonContainer.appendChild(whatsappButton);
    }
});