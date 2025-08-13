// Quote array - will be loaded from local storage
let quotes = [];

// DOM elements
const quoteText = document.getElementById('quote-text');
const quoteAuthor = document.getElementById('quote-author');
const generateBtn = document.getElementById('generate-btn');
const addQuoteBtn = document.getElementById('add-quote-btn');
const saveQuoteBtn = document.getElementById('save-quote-btn');
const cancelQuoteBtn = document.getElementById('cancel-quote-btn');
const newQuoteText = document.getElementById('new-quote-text');
const newQuoteAuthor = document.getElementById('new-quote-author');
const addQuoteForm = document.querySelector('.add-quote-form');
const clearStorageBtn = document.getElementById('clear-storage-btn');
const exportBtn = document.getElementById('export-btn');
const importFile = document.getElementById('importFile');
const quoteCount = document.getElementById('quote-count');
const lastViewedInfo = document.getElementById('last-viewed-info');

// Initialize the application
function init() {
    loadQuotesFromLocalStorage();
    updateQuoteCount();
    displayRandomQuote();
    
    // Event listeners
    generateBtn.addEventListener('click', displayRandomQuote);
    addQuoteBtn.addEventListener('click', () => {
        addQuoteForm.style.display = 'block';
    });
    saveQuoteBtn.addEventListener('click', saveNewQuote);
    cancelQuoteBtn.addEventListener('click', () => {
        addQuoteForm.style.display = 'none';
        newQuoteText.value = '';
        newQuoteAuthor.value = '';
    });
    clearStorageBtn.addEventListener('click', clearLocalStorage);
    exportBtn.addEventListener('click', exportQuotesToJson);
    importFile.addEventListener('change', importFromJsonFile);
}

// Load quotes from local storage
function loadQuotesFromLocalStorage() {
    const storedQuotes = localStorage.getItem('quotes');
    if (storedQuotes) {
        quotes = JSON.parse(storedQuotes);
    } else {
        // Default quotes if none in storage
        quotes = [
            { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
            { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
            { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
            { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
            { text: "Innovation distinguishes between a leader and a follower.", category: "Business" },
            { text: "Stay hungry, stay foolish.", category: "Motivation" },
            { text: "Don't get mad, get paid", category: "Motivation" }
        ];
        saveQuotesToLocalStorage();
    }
}

// Save quotes to local storage
function saveQuotesToLocalStorage() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
    updateQuoteCount();
}

// Update the quote count display
function updateQuoteCount() {
    quoteCount.textContent = quotes.length;
}

// Display a random quote
function displayRandomQuote() {
    if (quotes.length === 0) {
        quoteText.textContent = "No quotes available. Please add some quotes.";
        quoteAuthor.textContent = "";
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];
    quoteText.textContent = randomQuote.text;
    quoteAuthor.textContent = randomQuote.author ? `- ${randomQuote.author}` : "";
    
    // Store last viewed quote in session storage
    sessionStorage.setItem('lastViewedQuote', JSON.stringify(randomQuote));
    updateLastViewedInfo();
}

// Update the last viewed quote info
function updateLastViewedInfo() {
    const lastQuote = sessionStorage.getItem('lastViewedQuote');
    if (lastQuote) {
        const quoteObj = JSON.parse(lastQuote);
        lastViewedInfo.textContent = `Last viewed: "${quoteObj.text}" by ${quoteObj.author || 'Unknown'}`;
    }
}

// Save a new quote
function saveNewQuote() {
    const text = newQuoteText.value.trim();
    const author = newQuoteAuthor.value.trim();
    
    if (!text) {
        alert('Quote text is required!');
        return;
    }
    
    quotes.push({ text, author });
    saveQuotesToLocalStorage();
    
    newQuoteText.value = '';
    newQuoteAuthor.value = '';
    addQuoteForm.style.display = 'none';
    
    alert('Quote added successfully!');
}

// Clear local storage
function clearLocalStorage() {
    if (confirm('Are you sure you want to delete all quotes?')) {
        localStorage.removeItem('quotes');
        quotes = [];
        saveQuotesToLocalStorage();
        displayRandomQuote();
        alert('All quotes have been cleared.');
    }
}

// Export quotes to JSON file
function exportQuotesToJson() {
    if (quotes.length === 0) {
        alert('No quotes to export!');
        return;
    }
    
    const dataStr = JSON.stringify(quotes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
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
            saveQuotesToLocalStorage();
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

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);