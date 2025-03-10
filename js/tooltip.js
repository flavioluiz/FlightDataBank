// Function to create and manage image tooltips
function createImageTooltip(element, imageUrl) {
    if (!imageUrl) return;

    // Create a unique tooltip for this element
    const tooltipId = 'tooltip-' + Math.random().toString(36).substr(2, 9);
    element.dataset.tooltipId = tooltipId;
    
    const tooltip = document.createElement('div');
    tooltip.id = tooltipId;
    tooltip.className = 'tooltip-image';
    document.body.appendChild(tooltip);

    // Create image element
    const img = document.createElement('img');
    img.src = imageUrl;
    tooltip.appendChild(img);

    // Show tooltip on mouseover
    element.addEventListener('mouseover', (e) => {
        tooltip.style.display = 'block';
        updateTooltipPosition(e, tooltip);
    });

    // Update tooltip position on mousemove
    element.addEventListener('mousemove', (e) => {
        updateTooltipPosition(e, tooltip);
    });

    // Hide tooltip on mouseout
    element.addEventListener('mouseout', () => {
        tooltip.style.display = 'none';
    });
    
    // Clean up tooltip when element is removed
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.removedNodes.length) {
                Array.from(mutation.removedNodes).forEach((node) => {
                    if (node === element || node.contains(element)) {
                        tooltip.remove();
                        observer.disconnect();
                    }
                });
            }
        });
    });
    
    // Start observing the document
    observer.observe(document.body, { childList: true, subtree: true });
}

// Function to update tooltip position
function updateTooltipPosition(event, tooltip) {
    const padding = 10;
    const rect = event.target.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Calculate position
    let top = event.clientY + padding + scrollTop;
    let left = event.clientX + padding + scrollLeft;

    // Adjust if tooltip would go off screen
    const tooltipRect = tooltip.getBoundingClientRect();
    if (left + tooltipRect.width > window.innerWidth) {
        left = event.clientX - tooltipRect.width - padding + scrollLeft;
    }
    if (top + tooltipRect.height > window.innerHeight + scrollTop) {
        top = event.clientY - tooltipRect.height - padding + scrollTop;
    }

    // Set position
    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
}

// Function to add tooltip to aircraft link
function addAircraftTooltip(element, aircraft) {
    if (!aircraft || !aircraft.image_url) return;
    element.classList.add('aircraft-link');
    createImageTooltip(element, aircraft.image_url);
} 