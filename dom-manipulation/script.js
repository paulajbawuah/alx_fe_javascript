document.addEventListener('DOMContentLoaded', function() {
    // Initialize quotes array
    let quotes = [];
    let currentCategory = 'all';
    
    // Get DOM elements
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

    // Load quotes from local storage or initialize with defaults
    function loadQuotes() {
        const storedQuotes = localStorage.getItem('quotes');
        if (storedQuotes) {
            quotes = JSON.parse(storedQuotes);
        } else {
            quotes = [
                { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Motivation" },
                { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", category: "Business" },
                { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs", category: "Life" }
            ];
            saveQuotes();
        }
        
        // Load last selected category
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

    // Event listeners
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

    // Initialize the app
    loadQuotes();
    displayRandomQuote();
});