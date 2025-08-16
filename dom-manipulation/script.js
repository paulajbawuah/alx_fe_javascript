document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let quotes = [];
    let currentCategory = 'all';
    let lastSyncTime = null;
    const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts';
    const SYNC_INTERVAL = 30000;
    const CONTENT_TYPE = 'application/json';

    // DOM elements
    const elements = {
        quoteText: document.getElementById('quote-text'),
        quoteAuthor: document.getElementById('quote-author'),
        quoteCategory: document.getElementById('quote-category'),
        generateBtn: document.getElementById('generate-btn'),
        addQuoteBtn: document.getElementById('add-quote-btn'),
        addQuoteForm: document.querySelector('.add-quote-form'),
        saveQuoteBtn: document.getElementById('save-quote-btn'),
        cancelQuoteBtn: document.getElementById('cancel-quote-btn'),
        newQuoteText: document.getElementById('new-quote-text'),
        newQuoteAuthor: document.getElementById('new-quote-author'),
        newQuoteCategory: document.getElementById('new-quote-category'),
        categoryFilter: document.getElementById('category-filter'),
        lastViewedInfo: document.getElementById('last-viewed-info'),
        syncStatus: document.getElementById('sync-status'),
        conflictNotification: document.getElementById('conflict-notification'),
        manualSyncBtn: document.getElementById('manual-sync-btn')
    };

    // Initialize the app
    function init() {
        loadQuotes();
        setupSync();
        setupEventListeners();
        displayRandomQuote();
    }

    // Server functions
    async function fetchQuotesFromServer() {
        try {
            const response = await fetch(SERVER_URL, {
                headers: {
                    'Content-Type': CONTENT_TYPE
                }
            });
            if (!response.ok) throw new Error('Server error');
            const serverQuotes = await response.json();
            
            return serverQuotes.map(post => ({
                id: post.id,
                text: post.title,
                author: post.body || 'Unknown',
                category: 'General',
                serverVersion: true,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Fetch error:', error);
            return [];
        }
    }

    // REQUIRED FUNCTION: syncQuotes
    async function syncQuotes() {
        elements.syncStatus.textContent = 'Syncing...';
        
        try {
            const serverQuotes = await fetchQuotesFromServer();
            const localQuotes = JSON.parse(localStorage.getItem('quotes')) || [];
            const mergedQuotes = resolveConflicts(localQuotes, serverQuotes);
            
            localStorage.setItem('quotes', JSON.stringify(mergedQuotes));
            quotes = mergedQuotes;
            
            populateCategories();
            lastSyncTime = new Date();
            elements.syncStatus.textContent = `Last synced: ${lastSyncTime.toLocaleTimeString()}`;
            
            if (serverQuotes.length > 0) {
                showNotification(`${serverQuotes.length} updates received`);
            }
            return true;
        } catch (error) {
            console.error('Sync failed:', error);
            elements.syncStatus.textContent = 'Sync failed';
            return false;
        }
    }

    async function postQuoteToServer(quote) {
        try {
            const response = await fetch(SERVER_URL, {
                method: 'POST',
                body: JSON.stringify({
                    title: quote.text,
                    body: quote.author || 'Unknown',
                    userId: 1
                }),
                headers: {
                    'Content-Type': CONTENT_TYPE
                },
            });
            return await response.json();
        } catch (error) {
            console.error('Post error:', error);
            return null;
        }
    }

    // Sync functions
    function setupSync() {
        syncQuotes(); // Initial sync
        setInterval(syncQuotes, SYNC_INTERVAL); // Periodic sync
    }

    // Conflict resolution
    function resolveConflicts(localQuotes, serverQuotes) {
        const localMap = new Map(localQuotes.map(q => [q.id, q]));
        const conflicts = [];
        
        serverQuotes.forEach(serverQuote => {
            const localQuote = localMap.get(serverQuote.id);
            
            if (localQuote) {
                if (JSON.stringify(localQuote) !== JSON.stringify(serverQuote)) {
                    conflicts.push({
                        local: localQuote,
                        server: serverQuote
                    });
                    localMap.set(serverQuote.id, { 
                        ...serverQuote, 
                        category: localQuote.category || serverQuote.category 
                    });
                }
            } else {
                localMap.set(serverQuote.id, serverQuote);
            }
        });
        
        if (conflicts.length > 0) {
            showConflictNotification(conflicts);
        }
        
        return Array.from(localMap.values());
    }

    // UI functions
    function showConflictNotification(conflicts) {
        elements.conflictNotification.innerHTML = `
            <p>${conflicts.length} conflict(s) detected</p>
            <button id="resolve-conflict-btn">Review Conflicts</button>
        `;
        elements.conflictNotification.style.display = 'block';
        
        document.getElementById('resolve-conflict-btn').addEventListener('click', () => {
            reviewConflicts(conflicts);
        });
    }

    function reviewConflicts(conflicts) {
        if (confirm(`${conflicts.length} conflicts were resolved (server version kept). View in console?`)) {
            console.log('Resolved conflicts:', conflicts);
        }
        elements.conflictNotification.style.display = 'none';
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // Quote display
    function quoteDisplay(quoteObj) {
        elements.quoteText.textContent = quoteObj.text;
        elements.quoteAuthor.textContent = quoteObj.author ? `- ${quoteObj.author}` : "";
        elements.quoteCategory.textContent = quoteObj.category ? `Category: ${quoteObj.category}` : "";
        sessionStorage.setItem('lastViewedQuote', JSON.stringify(quoteObj));
        updateLastViewedInfo();
    }

    function displayRandomQuote() {
        const filteredQuotes = filterQuotes();
        
        if (filteredQuotes.length === 0) {
            elements.quoteText.textContent = currentCategory === 'all' 
                ? "No quotes available. Please add some quotes." 
                : "No quotes in selected category.";
            elements.quoteAuthor.textContent = "";
            elements.quoteCategory.textContent = "";
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        quoteDisplay(filteredQuotes[randomIndex]);
    }

    // Data management
    function loadQuotes() {
        const storedQuotes = localStorage.getItem('quotes');
        if (storedQuotes) {
            quotes = JSON.parse(storedQuotes);
        } else {
            quotes = [
                { 
                    id: 1,
                    text: "The only way to do great work is to love what you do.", 
                    author: "Steve Jobs", 
                    category: "Motivation",
                    timestamp: new Date().toISOString()
                }
            ];
            saveQuotes();
        }
        
        const storedCategory = localStorage.getItem('selectedCategory');
        if (storedCategory) {
            currentCategory = storedCategory;
            elements.categoryFilter.value = currentCategory;
        }
        
        populateCategories();
    }

    function saveQuotes() {
        localStorage.setItem('quotes', JSON.stringify(quotes));
        localStorage.setItem('selectedCategory', currentCategory);
    }

    function populateCategories() {
        elements.categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        [...new Set(quotes.map(quote => quote.category))].forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            elements.categoryFilter.appendChild(option);
        });
        elements.categoryFilter.value = currentCategory;
    }

    function filterQuotes() {
        if (currentCategory === 'all') {
            return quotes;
        }
        return quotes.filter(quote => quote.category === currentCategory);
    }

    function handleCategoryFilter(event) {
        currentCategory = event.target.value;
        saveQuotes();
        displayRandomQuote();
    }

    function updateLastViewedInfo() {
        const lastQuote = sessionStorage.getItem('lastViewedQuote');
        if (lastQuote) {
            const quoteObj = JSON.parse(lastQuote);
            elements.lastViewedInfo.textContent = `Last viewed: "${quoteObj.text}" by ${quoteObj.author || 'Unknown'}`;
        }
    }

    function addNewQuote() {
        const text = elements.newQuoteText.value.trim();
        const author = elements.newQuoteAuthor.value.trim();
        const category = elements.newQuoteCategory.value.trim();
        
        if (!text) {
            alert('Quote text is required!');
            return;
        }
        
        quotes.push({ 
            id: Date.now(),
            text, 
            author, 
            category,
            timestamp: new Date().toISOString()
        });
        saveQuotes();
        
        elements.newQuoteText.value = '';
        elements.newQuoteAuthor.value = '';
        elements.newQuoteCategory.value = '';
        elements.addQuoteForm.style.display = 'none';
        
        populateCategories();
        displayRandomQuote();
    }

    // Import/export
    function exportQuotesToJson() {
        if (quotes.length === 0) {
            alert('No quotes to export!');
            return;
        }
        
        const dataStr = JSON.stringify(quotes, null, 2);
        const dataBlob = new Blob([dataStr], { type: CONTENT_TYPE });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'quotes.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function importFromJsonFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.type !== CONTENT_TYPE && !file.name.endsWith('.json')) {
            alert('Please select a JSON file');
            return;
        }

        const fileReader = new FileReader();
        fileReader.onload = function(e) {
            try {
                const importedQuotes = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedQuotes)) {
                    throw new Error('Expected an array of quotes');
                }
                
                for (const quote of importedQuotes) {
                    if (!quote.text || typeof quote.text !== 'string') {
                        throw new Error('Each quote must have a "text" property');
                    }
                }
                
                quotes.push(...importedQuotes.map(q => ({
                    ...q,
                    id: q.id || Date.now(),
                    timestamp: q.timestamp || new Date().toISOString()
                })));
                saveQuotes();
                populateCategories();
                displayRandomQuote();
                alert(`Imported ${importedQuotes.length} quotes!`);
                
                event.target.value = '';
            } catch (error) {
                alert(`Import error: ${error.message}`);
            }
        };
        fileReader.onerror = () => alert('Error reading file');
        fileReader.readAsText(file);
    }

    function clearLocalStorage() {
        if (confirm('Delete all quotes?')) {
            localStorage.removeItem('quotes');
            localStorage.removeItem('selectedCategory');
            quotes = [];
            saveQuotes();
            displayRandomQuote();
            alert('All quotes cleared');
        }
    }

    // Event listeners
    function setupEventListeners() {
        elements.generateBtn.addEventListener('click', displayRandomQuote);
        elements.addQuoteBtn.addEventListener('click', () => {
            elements.addQuoteForm.style.display = 'block';
        });
        elements.saveQuoteBtn.addEventListener('click', addNewQuote);
        elements.cancelQuoteBtn.addEventListener('click', () => {
            elements.addQuoteForm.style.display = 'none';
            elements.newQuoteText.value = '';
            elements.newQuoteAuthor.value = '';
            elements.newQuoteCategory.value = '';
        });
        elements.categoryFilter.addEventListener('change', handleCategoryFilter);
        elements.manualSyncBtn.addEventListener('click', syncQuotes);
    }

    // Initialize
    init();
});