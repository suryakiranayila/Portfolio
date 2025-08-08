/**
 * -script.js-
 * -provides interactive features for the portfolio website-
 * - features include:
  *   1. Active navigation link highlighting,
  *   2. Show/hide navigation bar on scroll,
  *   3. Project filtering functionality.
 */

document.addEventListener('DOMContentLoaded', function() {

    // --- 1. Active Navigation Link Highlighting ---
    const navLinks = document.querySelectorAll('.nav-links a');
    const currentPath = window.location.pathname.split('/').pop();

    navLinks.forEach(link => {
        // Remove any existing active class
        link.classList.remove('active');
        
        const linkPath = link.getAttribute('href');

        // Check if the link's href matches the current page's file name
        if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
            link.classList.add('active');
        }
    });
    // --- 2. Show/Hide Navigation Bar on Scroll ---
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop) {
            // Downscroll
            navbar.style.top = '-80px'; // Hides the navbar
        } else {
            // Upscroll
            navbar.style.top = '0';
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
    }, false);

    // --- 3. Project Filtering (only runs if on projects.html) ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length > 0) {
        const projectCards = document.querySelectorAll('.project-card');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Set active class on the clicked button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const filter = button.dataset.filter;
                projectCards.forEach(card => {
                    // Show/hide cards based on the selected filter
                    if (filter === 'all' || card.dataset.category === filter) {
                        // Use 'flex' as it's the display property set in the CSS
                        card.style.display = 'flex'; 
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }
const contactForm = document.getElementById("contactForm");
if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // Stop normal form submission

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Send to your Hugging Face backend
        const response = await fetch("https://huggingface.co/datasets/ayilasurya/portfolio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert("Message sent!");
            e.target.reset();
        } else {
            alert("Error sending message.");
        }
    });
}
});