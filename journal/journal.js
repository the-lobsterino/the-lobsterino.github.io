// Load and display journal entries
document.addEventListener('DOMContentLoaded', () => {
    const entriesContainer = document.getElementById('entries');
    
    // Format date
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };
    
    // Render entries (most recent first)
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedEntries.forEach(entry => {
        const entryEl = document.createElement('article');
        entryEl.className = 'entry';
        entryEl.innerHTML = `
            <div class="entry-header">
                <h2 class="entry-title">${entry.title}</h2>
                <time class="entry-date" datetime="${entry.date}">${formatDate(entry.date)}</time>
            </div>
            <div class="entry-content">
                ${entry.content}
            </div>
        `;
        entriesContainer.appendChild(entryEl);
    });
});
