// main.js
const params = new URLSearchParams(window.location.search);
const projectId = params.get('id');

fetch('projects.json')
    .then(res => res.json())
    .then(data => {
        const project = data[projectId];
        if (!project) {
            document.body.innerHTML = "<h1>Project not found.</h1>";
            return;
        }

        // 1. Basic Content
        document.getElementById('title').innerText = project.title;
        document.getElementById('subtitle').innerText = project.subtitle;
        document.getElementById('description').innerText = project.description;
        document.getElementById('challenge').innerText = project.challenge;
        document.getElementById('process').innerText = project.process;

        // 2. Hero Image
        const heroImg = document.getElementById('hero-image');
        if (project.heroImage) {
            heroImg.src = project.heroImage;
            document.getElementById('hero-image-container').classList.remove('hidden');
        }

        // 3. Tools (Rendering an array as badges)
        const toolsContainer = document.getElementById('tools-list');
        if (project.tools) {
            toolsContainer.innerHTML = project.tools.map(tool => 
                `<span class="bg-stone-200 px-3 py-1 rounded-full text-xs font-bold">${tool}</span>`
            ).join('');
        }

        // 4. Research Documents (The new PDF feature)
        const docsContainer = document.getElementById('docs-list');
        if (project.researchDocuments) {
            docsContainer.innerHTML = project.researchDocuments.map(doc => 
                `<a href="${doc.url}" target="_blank" class="block underline text-blue-600 hover:text-blue-800">
                    Download: ${doc.title}
                </a>`
            ).join('');
        }

        // 5. Process Images (The new Gallery feature)
        const gallery = document.getElementById('process-gallery');
        if (project.processImages) {
            gallery.innerHTML = project.processImages.map(img => 
                `<img src="${img}" class="rounded-2xl w-full border border-stone-200">`
            ).join('');
        }
    });
    // ... (previous code for Title, Hero, Tools, and Documents)

// 4. Research Documents
const docsContainer = document.getElementById('docs-list');
if (project.researchDocuments) {
    docsContainer.innerHTML = project.researchDocuments.map(doc => 
        `<a href="${doc.url}" target="_blank" class="block underline text-blue-600 hover:text-blue-800">
            Download: ${doc.title}
        </a>`
    ).join('');
}

// --- NEW: Figma Prototype Button ---
const ctaContainer = document.getElementById('cta-container'); // Make sure this div exists in your HTML!
if (project.figmaUrl && ctaContainer) {
    ctaContainer.innerHTML = `
        <a href="${project.figmaUrl}" target="_blank" class="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-8 py-4 rounded-full font-bold hover:bg-[#e61e1e] transition-colors">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15 12h-2v2h2v-2zM12 9h-2v2h2V9zM9 12H7v2h2v-2zM12 15h-2v2h2v-2zM15 6h-2v2h2V6zM12 3H9v3h3V3zM9 6H6v3h3V6zM6 9H3v3h3V9zM9 12H6v3h3v-3zM12 12h-2v2h2v-2zM12 18h3v-3h-3v3zM15 18h3v-3h-3v3zM18 12h3v-3h-3v3zM18 15h3v-3h-3v3z"/></svg>
            View Figma Prototype
        </a>
    `;
}

// 5. Process Images
const gallery = document.getElementById('process-gallery');
// ... rest of your code