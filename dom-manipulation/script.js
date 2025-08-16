document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let quotes = [];
    let currentCategory = 'all';
    let lastSyncTime = null;
    const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts'; // Mock API endpoint
    const SYNC_INTERVAL = 30000; // Sync every 30 seconds

    // DOM elements
    const quoteText = document.getElementById('quote-text');
    const quoteAuthor = document.getElementById('quote-author');
    const quoteCategory = document.getElementById('quote-category');
    const generateBtn = document.getElementById('generate-btn');
    const addQuoteBtn = document.getElementById('add-quote-btn');
    const addQuoteForm = document.querySelector('.add-quote-form');
    const saveQuoteBtn = document.getElementById('save-quote-btn');
    const cancelQuoteBtn = document.getElementById('cancel-quote-btn');
    const newQuoteText = document.getElementById('new-quote-text');
    const newQuoteAuthor = document.getElementById('new-quote-author');
    const newQuoteCategory = document.getElementById('new-quote-category');
    const categoryFilter = document.getElementById('category-filter');
    const lastViewedInfo = document.getElementById('last-viewed-info');
    const syncStatus = document.getElementById('sync-status');
    const conflictNotification = document.getElementById('conflict-notification');
    const resolveConflictBtn = document.getElementById('resolve-conflict-btn');
    const manualSyncBtn = document.getElementById('manual-sync-btn');

    // Initialize the app
    function init() {
        loadQuotes();
        setupSync();
        setupEventListeners();
        displayRandomQuote();
    }

    // Server functions
    async function fetchQuotesFromServer() {  // REQUIRED FUNCTION
        try {
            const response = await fetch(SERVER_URL);
            if (!response.ok) throw new Error('Server error');
            const serverQuotes = await response.json();
            
            // Transform server data to our format
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
                    'Content-type': 'application/json; charset=UTF-8',
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
        // Initial sync
        syncWithServer();
        
        // Periodic sync
        setInterval(syncWithServer, SYNC_INTERVAL);
    }

    async function syncWithServer() {
        syncStatus.textContent = 'Syncing...';
        
        try {
            const serverQuotes = await fetchQuotesFromServer(); // Using required function
            const localQuotes = JSON.parse(localStorage.getItem('quotes')) || [];
            
            // Conflict resolution
            const mergedQuotes = resolveConflicts(localQuotes, serverQuotes);
            
            // Update local storage
            localStorage.setItem('quotes', JSON.stringify(mergedQuotes));
            quotes = mergedQuotes;
            
            // Update UI
            populateCategories();
            lastSyncTime = new Date();
            syncStatus.textContent = `Last synced: ${lastSyncTime.toLocaleTimeString()}`;
            
            // Show notification if updates were received
            if (serverQuotes.length > 0) {
                showNotification(`${serverQuotes.length} updates received from server`);
            }
        } catch (error) {
            console.error('Sync failed:', error);
            syncStatus.textContent = 'Sync failed';
        }
    }

    // Conflict resolution
    function resolveConflicts(localQuotes, serverQuotes) {
        const localMap = new Map(localQuotes.map(q => [q.id, q]));
        const conflicts = [];
        
        serverQuotes.forEach(serverQuote => {
            const localQuote = localMap.get(serverQuote.id);
            
            if (localQuote) {
                // Conflict detected
                if (JSON.stringify(localQuote) !== JSON.stringify(serverQuote)) {
                    conflicts.push({
                        local: localQuote,
                        server: serverQuote
                    });
                    // Server version wins
                    localMap.set(serverQuote.id, { 
                        ...serverQuote, 
                        // Preserve local category if it exists
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

    // UI functions for conflicts
    function showConflictNotification(conflicts) {
        conflictNotification.innerHTML = `
            <p>${conflicts.length} conflict(s) detected:</p>
            <button id="resolve-conflict-btn">Review Conflicts</button>
        `;
        conflictNotification.style.display = 'block';
        
        document.getElementById('resolve-conflict-btn').addEventListener('click', () => {
            reviewConflicts(conflicts);
        });
    }

    function reviewConflicts(conflicts) {
        // Simple conflict review - in a real app you'd implement proper UI
        if (confirm(`${conflicts.length} conflicts were resolved (server version kept). View in console?`)) {
            console.log('Resolved conflicts:', conflicts);
        }
        conflictNotification.style.display = 'none';
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Quote display and management functions
    function quoteDisplay(quoteObj) {
        quoteText.textContent = quoteObj.text;
        quoteAuthor.textContent = quoteObj.author ? `- ${quoteObj.author}` : "";
        quoteCategory.textContent = quoteObj.category ? `Category: ${quoteObj.category}` : "";
        sessionStorage.setItem('lastViewedQuote', JSON.stringify(quoteObj));
        updateLastViewedInfo();
    }

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
                },
                // ... other default quotes
            ];
            saveQuotes();
        }
        
        const storedCategory = localStorage.getItem('selectedCategory');
        if (storedCategory) {
            currentCategory = storedCategory;
            categoryFilter.value = currentCategory;
        }
        
        populateCategories();
    }

    // Save quotes to local storage
    function saveQuotes() {
        localStorage.setItem('quotes', JSON.stringify(quotes));
        localStorage.setItem('selectedCategory', currentCategory);
    }

    // Populate category dropdown
    function populateCategories() {
        // Clear existing options
        categoryFilter.innerHTML = '';
        
        // Add 'All' option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All Categories';
        categoryFilter.appendChild(allOption);
        
        // Get unique categories using map and Set
        const uniqueCategories = [...new Set(quotes.map(quote => quote.category))];
        
        // Add each category as an option
        uniqueCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
        
        // Set current selection
        categoryFilter.value = currentCategory;
    }

    // Filter quotes by category
    function filterQuotes() {
        if (currentCategory === 'all') {
            return quotes;
        }
        return quotes.filter(quote => quote.category === currentCategory);
    }

    // Display random quote
    function displayRandomQuote() {
        const filteredQuotes = filterQuotes();
        
        if (filteredQuotes.length === 0) {
            quoteText.textContent = currentCategory === 'all' 
                ? "No quotes available. Please add some quotes." 
                : "No quotes in selected category.";
            quoteAuthor.textContent = "";
            quoteCategory.textContent = "";
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        const randomQuote = filteredQuotes[randomIndex];
        quoteText.textContent = randomQuote.text;
        quoteAuthor.textContent = randomQuote.author ? `- ${randomQuote.author}` : "";
        quoteCategory.textContent = randomQuote.category ? `Category: ${randomQuote.category}` : "";
    }

    // Handle category filter change
    function handleCategoryFilter(event) {
        currentCategory = event.target.value;
        saveQuotes();
        displayRandomQuote();
    }

      // Update the last viewed quote info
    function updateLastViewedInfo() {
        const lastQuote = sessionStorage.getItem('lastViewedQuote');
        if (lastQuote) {
            const quoteObj = JSON.parse(lastQuote);
            lastViewedInfo.textContent = `Last viewed: "${quoteObj.text}" by ${quoteObj.author || 'Unknown'}`;
        }
    }

    // Add new quote
    function addNewQuote() {
        const text = newQuoteText.value.trim();
        const author = newQuoteAuthor.value.trim();
        const category = newQuoteCategory.value.trim();
        
        if (!text) {
            alert('Quote text is required!');
            return;
        }
        
        quotes.push({ text, author, category });
        saveQuotes();
        
        // Reset form
        newQuoteText.value = '';
        newQuoteAuthor.value = '';
        newQuoteCategory.value = '';
        addQuoteForm.style.display = 'none';
        
        // Update categories and display
        populateCategories();
        displayRandomQuote();
    }

    // Export quotes to JSON file
    function exportQuotesToJson() {
        if (quotes.length === 0) {
            alert('No quotes to export!');
            return;
        }
        
        const dataStr = JSON.stringify(quotes, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'quotes.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Import quotes from JSON file
    function importFromJsonFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check file type is JSON
        if (file.type !== "application/json") {
            // Fallback for some browsers that don't report correct MIME type
            if (!file.name.endsWith('.json')) {
                alert('Please select a JSON file');
                return;
            }
        }

        const fileReader = new FileReader();
        fileReader.onload = function(e) {
            try {
                const importedQuotes = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedQuotes)) {
                    throw new Error('Invalid format: Expected an array of quotes');
                }
                
                // Validate each quote has at least a text property
                for (const quote of importedQuotes) {
                    if (!quote.text || typeof quote.text !== 'string') {
                        throw new Error('Invalid quote format: Each quote must have a "text" property');
                    }
                }
                
                quotes.push(...importedQuotes);
                saveQuotes();
                populateCategories();
                displayRandomQuote();
                alert(`Successfully imported ${importedQuotes.length} quotes!`);
                
                // Reset file input
                event.target.value = '';
            } catch (error) {
                alert(`Error importing quotes: ${error.message}`);
                console.error('Import error:', error);
            }
        };
        fileReader.onerror = function() {
            alert('Error reading file');
        };
        fileReader.readAsText(file);
    }

    // Clear local storage
    function clearLocalStorage() {
        if (confirm('Are you sure you want to delete all quotes?')) {
            localStorage.removeItem('quotes');
            localStorage.removeItem('selectedCategory');
            quotes = [];
            saveQuotes();
            displayRandomQuote();
            alert('All quotes have been cleared.');
        }
    }


   function setupEventListeners() {
        generateBtn.addEventListener('click', displayRandomQuote);
        addQuoteBtn.addEventListener('click', () => addQuoteForm.style.display = 'block');
        saveQuoteBtn.addEventListener('click', addNewQuote);
        cancelQuoteBtn.addEventListener('click', () => {
            addQuoteForm.style.display = 'none';
            newQuoteText.value = '';
            newQuoteAuthor.value = '';
            newQuoteCategory.value = '';
        });
        categoryFilter.addEventListener('change', handleCategoryFilter);
        manualSyncBtn.addEventListener('click', syncWithServer);
    }

    // Initialize the app
    init();
});