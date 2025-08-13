document.addEventListener('DOMContentLoaded', function() {
    // Initialize quotes array
    let quotes = [];
    
    // Get DOM elements
    const quoteText = document.getElementById('quote-text');
    const quoteAuthor = document.getElementById('quote-author');
    const generateBtn = document.getElementById('generate-btn');
    const addQuoteBtn = document.getElementById('add-quote-btn');
    const addQuoteForm = document.querySelector('.add-quote-form');
    const saveQuoteBtn = document.getElementById('save-quote-btn');
    const cancelQuoteBtn = document.getElementById('cancel-quote-btn');
    const newQuoteText = document.getElementById('new-quote-text');
    const newQuoteAuthor = document.getElementById('new-quote-author');

    // Load quotes from local storage or initialize with defaults
    function loadQuotes() {
        const storedQuotes = localStorage.getItem('quotes');
        if (storedQuotes) {
            quotes = JSON.parse(storedQuotes);
        } else {
            quotes = [
                { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
                { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" }
            ];
            saveQuotes();
        }
    }

    // Save quotes to local storage
    function saveQuotes() {
        localStorage.setItem('quotes', JSON.stringify(quotes));
    }

    // Display random quote
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
    }

    // Add new quote
    function addNewQuote() {
        const text = newQuoteText.value.trim();
        const author = newQuoteAuthor.value.trim();
        
        if (!text) {
            alert('Quote text is required!');
            return;
        }
        
        quotes.push({ text, author });
        saveQuotes();
        
        // Reset form
        newQuoteText.value = '';
        newQuoteAuthor.value = '';
        addQuoteForm.style.display = 'none';
        
        displayRandomQuote();
        alert('Quote added successfully!');
    }

    // Event listeners
    generateBtn.addEventListener('click', displayRandomQuote);
    
    addQuoteBtn.addEventListener('click', function() {
        addQuoteForm.style.display = 'block';
    });
    
    saveQuoteBtn.addEventListener('click', addNewQuote);
    
    cancelQuoteBtn.addEventListener('click', function() {
        addQuoteForm.style.display = 'none';
        newQuoteText.value = '';
        newQuoteAuthor.value = '';
    });

    // Initialize the app
    loadQuotes();
    displayRandomQuote();
});