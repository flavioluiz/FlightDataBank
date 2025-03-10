// Function to create and manage image tooltips
function createImageTooltip(element, imageUrl) {
    if (!imageUrl) return;

    // Create tooltip container if it doesn't exist
    let tooltip = document.querySelector('.tooltip-image');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'tooltip-image';
        document.body.appendChild(tooltip);
    }

    // Create image element
    const img = document.createElement('img');
    img.src = imageUrl;
    tooltip.innerHTML = '';
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