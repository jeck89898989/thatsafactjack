import { factsData } from './facts-data.js';
import { toast, showThemeChangeNotification, showGridChangeNotification, showJackNotification, showImportSuccess, showDownloadSuccess, createFloatingElements } from './ui.js';

class FactsApp {
    constructor() {
        this.facts = factsData.slice();
        this.conversations = []; // New: conversations data
        this.displayedFacts = [];
        this.favorites = [];
        this.likedFacts = [];
        this.currentIndex = 0;
        this.isLoading = false;
        this.batchSize = 5;
        this.currentTheme = 'default';
        this.selectedCategory = 'none';
        this.currentGrid = 'default';
        this.popupsEnabled = false; // Changed: popup toggle state
        
        this.initializeElements();
        this.loadSettings(); // New: Load settings from localStorage
        this.setupEventListeners();
        this.startRandomPopups();
        // Don't auto-load facts since default is 'none'
    }

    initializeElements() {
        this.factsContainer = document.getElementById('factsContainer');
        this.loading = document.getElementById('loading');
        this.importBtn = document.getElementById('importBtn');
        this.csvInput = document.getElementById('csvInput');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.themeSelector = document.getElementById('themeSelector');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.gridSelector = document.getElementById('gridSelector');
        this.searchEngineSelector = document.getElementById('searchEngineSelector');
        this.searchModifier = document.getElementById('searchModifier');
        this.customSearchUrl = document.getElementById('customSearchUrl');
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.pasteBtn = document.getElementById('pasteBtn');
        this.conversationImportBtn = document.getElementById('conversationImportBtn'); // New
        this.conversationCsvInput = document.getElementById('conversationCsvInput'); // New
        this.popupToggle = document.getElementById('popupToggle'); // New
        this.fontSelector = document.getElementById('fontSelector'); // New
        this.fontSizeSlider = document.getElementById('fontSizeSlider'); // New
        this.fontSizeValue = document.getElementById('fontSizeValue'); // New
        // New: How to use modal elements
        this.howToUseBtn = document.getElementById('howToUseBtn');
        this.howToUseOverlay = document.getElementById('howToUseOverlay');
        this.howToUseCloseBtn = document.getElementById('howToUseCloseBtn');
    }

    setupEventListeners() {
        // Scroll detection for infinite loading
        window.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Sidebar toggle functionality
        this.sidebarToggle.addEventListener('click', this.toggleSidebar.bind(this));
        this.sidebarOverlay.addEventListener('click', this.closeSidebar.bind(this));
        
        // Close sidebar with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSidebar();
            }
        });
        
        // CSV import functionality
        this.importBtn.addEventListener('click', () => {
            this.csvInput.click();
        });
        
        this.csvInput.addEventListener('change', this.handleCSVImport.bind(this));
        
        // New: Conversation CSV import functionality
        this.conversationImportBtn.addEventListener('click', () => {
            this.conversationCsvInput.click();
        });
        
        this.conversationCsvInput.addEventListener('change', this.handleConversationCSVImport.bind(this));
        
        // New: Popup toggle functionality
        this.popupToggle.addEventListener('change', this.handlePopupToggle.bind(this));
        
        // Download favorites functionality
        this.downloadBtn.addEventListener('click', this.downloadFavorites.bind(this));
        
        // Theme selection
        this.themeSelector.addEventListener('change', this.handleThemeChange.bind(this));
        
        // Hide scroll indicator after first interaction
        let hasScrolled = false;
        window.addEventListener('scroll', () => {
            if (!hasScrolled) {
                document.querySelector('.scroll-indicator').style.display = 'none';
                hasScrolled = true;
            }
        });
        
        // Category filtering
        this.categoryFilter.addEventListener('change', this.handleCategoryChange.bind(this));
        
        // Grid type selection
        this.gridSelector.addEventListener('change', this.handleGridChange.bind(this));
        
        // Search engine selection
        this.searchEngineSelector.addEventListener('change', this.handleSearchEngineChange.bind(this));
        
        // Paste from clipboard functionality
        this.pasteBtn.addEventListener('click', this.handlePasteFromClipboard.bind(this));
        
        // New: Font settings functionality
        this.fontSelector.addEventListener('change', this.handleFontChange.bind(this));
        this.fontSizeSlider.addEventListener('input', this.handleFontSizeChange.bind(this));

        // New: How to use modal functionality
        this.howToUseBtn.addEventListener('click', this.showHowToUseModal.bind(this));
        this.howToUseOverlay.addEventListener('click', this.hideHowToUseModal.bind(this));
        this.howToUseCloseBtn.addEventListener('click', this.hideHowToUseModal.bind(this));
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('open');
        this.sidebarOverlay.classList.toggle('active');
        document.body.classList.toggle('sidebar-open');
    }

    closeSidebar() {
        this.sidebar.classList.remove('open');
        this.sidebarOverlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    }

    // New: How to use modal methods
    showHowToUseModal() {
        this.howToUseOverlay.classList.add('active');
        this.closeSidebar(); // Close sidebar when modal opens
    }

    hideHowToUseModal(event) {
        // Only close if overlay is clicked directly, not the modal content
        if (event.target === this.howToUseOverlay || event.target === this.howToUseCloseBtn) {
            this.howToUseOverlay.classList.remove('active');
        }
    }

    handleSearchEngineChange(event) {
        if (event.target.value === 'icon') {
            // Reset to first real option
            event.target.value = 'google';
        }
        const isCustom = event.target.value === 'custom';
        this.customSearchUrl.style.display = isCustom ? 'block' : 'none';
        
        if (isCustom) {
            this.customSearchUrl.focus();
        }
    }

    handleScroll() {
        if (this.isLoading) return;
        
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        
        if (scrollTop + clientHeight >= scrollHeight - 1000) {
            this.loadMoreFacts();
        }
    }

    async loadInitialFacts() {
        this.loading.style.display = 'block';
        await this.delay(800); // Simulate loading
        this.loadMoreFacts();
        this.loading.style.display = 'none';
    }

    handleCategoryChange(event) {
        if (event.target.value === 'icon') {
            // Reset to first real option
            event.target.value = 'all';
        }
        this.selectedCategory = event.target.value;
        this.resetDisplay();
        if (this.selectedCategory !== 'none') {
            this.loadInitialFacts();
        }
    }

    getFilteredFacts() {
        if (this.selectedCategory === 'all') {
            return this.facts;
        }
        if (this.selectedCategory === 'none') {
            return [];
        }
        if (this.selectedCategory === 'favorites') {
            return this.favorites;
        }
        if (this.selectedCategory === 'liked') {
            return this.likedFacts;
        }
        return this.facts.filter(fact => fact.category === this.selectedCategory);
    }

    loadMoreFacts() {
        if (this.isLoading) return;
        
        const filteredFacts = this.getFilteredFacts();
        if (this.currentIndex >= filteredFacts.length) return;
        
        this.isLoading = true;
        
        const endIndex = Math.min(this.currentIndex + this.batchSize, filteredFacts.length);
        const newFacts = filteredFacts.slice(this.currentIndex, endIndex);
        
        newFacts.forEach((fact, index) => {
            setTimeout(() => {
                this.createFactCard(fact);
            }, index * 100);
        });
        
        this.currentIndex = endIndex;
        
        setTimeout(() => {
            this.isLoading = false;
        }, newFacts.length * 100);
    }

    createFactCard(fact) {
        const card = document.createElement('div');
        card.className = 'fact-card fade-in';
        
        const isFavorited = this.favorites.some(fav => fav.fact === fact.fact);
        const isLiked = this.likedFacts.some(liked => liked.fact === fact.fact);
        
        card.innerHTML = `
            <button class="like-btn ${isLiked ? 'liked' : ''}" data-fact='${JSON.stringify(fact)}'>
                👍
            </button>
            <div class="fact-category">${fact.category}</div>
            <div class="fact-text">${fact.fact}</div>
            <div class="fact-actions">
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-fact='${JSON.stringify(fact)}'>
                        <span class="heart">${isFavorited ? '❤️' : '🤍'}</span>
                    </button>
                    ${fact.category !== 'I KNOW THAT JACK' ? `<button class="jack-btn" data-fact='${JSON.stringify(fact)}'>🧠</button>` : ''}
                </div>
                <div class="fact-action">🔍</div>
            </div>
        `;
        
        // Add stagger animation delay
        card.style.animationDelay = `${Math.random() * 0.3}s`;
        
        // Search functionality (click on card but not on buttons)
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.favorite-btn') && !e.target.closest('.jack-btn') && !e.target.closest('.like-btn')) {
                this.searchFact(fact.fact);
                this.addClickEffect(e.target);
            }
        });
        
        // Like button functionality
        const likeBtn = card.querySelector('.like-btn');
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleLike(fact, likeBtn);
        });
        
        // Favorite functionality
        const favoriteBtn = card.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(fact, favoriteBtn);
        });
        
        // Jack functionality
        const jackBtn = card.querySelector('.jack-btn');
        if (jackBtn) {
            jackBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.moveToJackCategory(fact, card);
            });
        }
        
        this.factsContainer.appendChild(card);
    }

    toggleLike(fact, likeBtn) {
        const existingIndex = this.likedFacts.findIndex(liked => liked.fact === fact.fact);

        if (existingIndex > -1) {
            // Remove from liked
            this.likedFacts.splice(existingIndex, 1);
            likeBtn.classList.remove('liked');
            toast('👎 Unliked!', 'var(--tertiary-color)');
        } else {
            // Add to liked
            this.likedFacts.push(fact);
            likeBtn.classList.add('liked');
            
            // Floating +1 animation
            const floating = document.createElement('div');
            floating.innerHTML = '+1';
            floating.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-weight: bold;
                font-size: 1rem;
                pointer-events: none;
                animation: floatUp 1s ease-out forwards;
                z-index: 1000;
            `;
            likeBtn.appendChild(floating);
            setTimeout(() => floating.remove(), 1000);

            toast('👍 Liked!', 'var(--secondary-color)');
        }
        
        this.saveSettings();
    }

    handleLike(likeBtn) {
        likeBtn.classList.add('liked');
        likeBtn.innerHTML = '👍';
        
        // Create a floating animation
        const floating = document.createElement('div');
        floating.innerHTML = '+1';
        floating.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: var(--primary-color);
            font-weight: bold;
            font-size: 1rem;
            pointer-events: none;
            animation: floatUp 1s ease-out forwards;
            z-index: 1000;
        `;
        
        likeBtn.appendChild(floating);
        
        setTimeout(() => {
            floating.remove();
            likeBtn.classList.remove('liked');
        }, 1000);
        
        // Show toast notification
        toast('👍 Liked!', 'var(--secondary-color)');
    }

    addClickEffect(element) {
        element.style.animation = 'none';
        element.offsetHeight; // Trigger reflow
        element.style.animation = 'clickPulse 0.3s ease-out';
    }

    searchFact(factText) {
        const searchEngine = this.searchEngineSelector.value;
        const modifier = this.searchModifier.value.trim();
        
        let searchQuery = factText;
        if (modifier) {
            searchQuery = `${modifier} ${factText}`;
        }
        
        const encodedQuery = encodeURIComponent(searchQuery);
        let searchUrl;
        
        if (searchEngine === 'custom') {
            const customUrl = this.customSearchUrl.value.trim();
            if (!customUrl) {
                alert('Please enter a custom search URL first');
                return;
            }
            searchUrl = customUrl.replace('{query}', encodedQuery);
        } else {
            switch (searchEngine) {
                case 'google':
                    searchUrl = `https://www.google.com/search?q=${encodedQuery}`;
                    break;
                case 'bing':
                    searchUrl = `https://www.bing.com/search?q=${encodedQuery}`;
                    break;
                case 'duckduckgo':
                    searchUrl = `https://duckduckgo.com/?q=${encodedQuery}`;
                    break;
                case 'yahoo':
                    searchUrl = `https://search.yahoo.com/search?p=${encodedQuery}`;
                    break;
                case 'yandex':
                    searchUrl = `https://yandex.com/search/?text=${encodedQuery}`;
                    break;
                case 'baidu':
                    searchUrl = `https://www.baidu.com/s?wd=${encodedQuery}`;
                    break;
                default:
                    searchUrl = `https://www.google.com/search?q=${encodedQuery}`;
            }
        }
        
        window.open(searchUrl, '_blank');
    }

    async handleCSVImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const newFacts = this.parseCSV(text);
            
            if (newFacts.length > 0) {
                this.facts = [...newFacts, ...this.facts];
                this.updateCategoryFilter(newFacts);
                this.resetDisplay();
                this.loadInitialFacts();
                
                // Show success feedback
                showImportSuccess(newFacts.length);
            }
        } catch (error) {
            alert('Error importing CSV. Please ensure it has Category and Fact columns.');
        }
        
        // Reset file input
        event.target.value = '';
    }

    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) throw new Error('CSV must have headers and data');
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const categoryIndex = headers.findIndex(h => h.includes('category'));
        const factIndex = headers.findIndex(h => h.includes('fact'));
        
        if (categoryIndex === -1 || factIndex === -1) {
            throw new Error('CSV must have Category and Fact columns');
        }
        
        const facts = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length > Math.max(categoryIndex, factIndex)) {
                facts.push({
                    category: values[categoryIndex].trim().toUpperCase(),
                    fact: values[factIndex].trim()
                });
            }
        }
        
        return facts;
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    updateCategoryFilter(newFacts) {
        const existingOptions = Array.from(this.categoryFilter.options).map(opt => opt.value);
        const newCategories = [...new Set(newFacts.map(fact => fact.category))];

        newCategories.forEach(category => {
            if (!existingOptions.includes(category)) {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category.charAt(0) + category.slice(1).toLowerCase();
                this.categoryFilter.appendChild(option);
            }
        });
    }

    resetDisplay() {
        this.factsContainer.innerHTML = '<div class="loading" id="loading"><div class="loading-spinner"></div><p>Loading facts...</p></div>';
        this.loading = document.getElementById('loading');
        this.currentIndex = 0;
        this.displayedFacts = [];
        this.updateDownloadButton();
    }

    updateDownloadButton() {
        this.downloadBtn.innerHTML = `💾 <span class="count">${this.favorites.length}</span>`;
        this.downloadBtn.disabled = this.favorites.length === 0;
    }

    downloadFavorites() {
        if (this.favorites.length === 0) {
            alert('No favorites to download!');
            return;
        }
        
        let content = 'MY FAVORITE FACTS\n';
        content += '==================\n\n';
        
        this.favorites.forEach((fact, index) => {
            content += `${index + 1}. [${fact.category}]\n`;
            content += `${fact.fact}\n\n`;
        });
        
        content += `Total favorites: ${this.favorites.length}\n`;
        content += `Downloaded on: ${new Date().toLocaleDateString()}`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'my-favorite-facts.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        // Show success message
        showDownloadSuccess(this.favorites.length);
    }

    handleThemeChange(event) {
        if (event.target.value === 'icon') {
            // Reset to first real option
            event.target.value = 'default';
        }
        this.currentTheme = event.target.value;
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        // Add theme transition effect
        document.body.style.transition = 'all 0.5s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 500);
        
        // Show theme change notification
        showThemeChangeNotification(this.currentTheme);
    }

    handleGridChange(event) {
        if (event.target.value === 'icon') {
            // Reset to first real option
            event.target.value = 'default';
        }
        this.currentGrid = event.target.value;
        this.factsContainer.setAttribute('data-grid', this.currentGrid);
        
        // Show grid change notification
        showGridChangeNotification(this.currentGrid);
    }

    moveToJackCategory(fact, card) {
        // Find and update the fact in the facts array
        const factIndex = this.facts.findIndex(f => f.fact === fact.fact && f.category === fact.category);
        if (factIndex !== -1) {
            this.facts[factIndex].category = 'I KNOW THAT JACK';
            
            // Add animation and remove card
            card.style.transform = 'translateX(100%) rotate(10deg)';
            card.style.opacity = '0';
            
            setTimeout(() => {
                card.remove();
            }, 400);
            
            // Show notification
            showJackNotification();
        }
    }

    toggleFavorite(fact, favoriteBtn) {
        const existingIndex = this.favorites.findIndex(fav => fav.fact === fact.fact);
        
        if (existingIndex > -1) {
            // Remove from favorites
            this.favorites.splice(existingIndex, 1);
            favoriteBtn.classList.remove('favorited');
            favoriteBtn.querySelector('.heart').textContent = '🤍';
        } else {
            // Add to favorites
            this.favorites.push(fact);
            favoriteBtn.classList.add('favorited');
            favoriteBtn.querySelector('.heart').textContent = '❤️';
        }
        
        this.updateDownloadButton();
    }

    async handlePasteFromClipboard() {
        try {
            if (!navigator.clipboard) {
                alert('Clipboard access not supported in this browser');
                return;
            }

            const text = await navigator.clipboard.readText();
            if (!text.trim()) {
                alert('No text found in clipboard');
                return;
            }

            // Split text into sentences or lines for individual facts
            const sentences = text.split(/[.!?]\s+|[\r\n]+/).filter(s => s.trim().length > 10);
            
            if (sentences.length === 0) {
                alert('No valid facts found in clipboard text');
                return;
            }

            // Add each sentence as a new fact in PASTED category
            sentences.forEach(sentence => {
                const cleanSentence = sentence.trim();
                if (cleanSentence) {
                    this.facts.unshift({
                        category: 'PASTED',
                        fact: cleanSentence
                    });
                }
            });

            // Switch to PASTED category and refresh display
            this.categoryFilter.value = 'PASTED';
            this.selectedCategory = 'PASTED';
            this.resetDisplay();
            this.loadInitialFacts();

            toast(`📋 Added ${sentences.length} facts from clipboard!`, 'var(--tertiary-color)');

        } catch (error) {
            if (error.name === 'NotAllowedError') {
                alert('Please allow clipboard access to paste facts');
            } else {
                alert('Error reading from clipboard: ' + error.message);
            }
        }
    }

    // New: Handle conversation CSV import
    async handleConversationCSVImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const newConversations = this.parseConversationCSV(text);
            
            if (newConversations.length > 0) {
                this.conversations = [...newConversations, ...this.conversations];
                
                // Show success feedback
                toast(`💬 Imported ${newConversations.length} conversations!`, 'var(--tertiary-color)');
            }
        } catch (error) {
            alert('Error importing conversations CSV. Please ensure it has English and Spanish columns.');
        }
        
        // Reset file input
        event.target.value = '';
    }

    // New: Parse conversation CSV
    parseConversationCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) throw new Error('CSV must have headers and data');
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const englishIndex = headers.findIndex(h => h.includes('english'));
        const spanishIndex = headers.findIndex(h => h.includes('spanish'));
        
        if (englishIndex === -1 || spanishIndex === -1) {
            throw new Error('CSV must have English and Spanish columns');
        }
        
        const conversations = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length > Math.max(englishIndex, spanishIndex)) {
                conversations.push({
                    english: values[englishIndex].trim(),
                    spanish: values[spanishIndex].trim()
                });
            }
        }
        
        return conversations;
    }

    // New: Handle popup toggle
    handlePopupToggle(event) {
        this.popupsEnabled = event.target.checked;
        toast(this.popupsEnabled ? '🔔 Popups enabled' : '🔕 Popups disabled', 'var(--secondary-color)');
    }

    startRandomPopups() {
        // Start showing random popups after 10 seconds, then every 15-45 seconds
        setTimeout(() => {
            if (this.popupsEnabled) {
                this.showRandomPopup();
            }
            this.scheduleNextPopup();
        }, 10000);
    }

    scheduleNextPopup() {
        // Random interval between 15-45 seconds
        const interval = Math.random() * 30000 + 15000;
        setTimeout(() => {
            if (this.popupsEnabled) {
                this.showRandomPopup();
            }
            this.scheduleNextPopup();
        }, interval);
    }

    showRandomPopup() {
        // Randomly choose between fact popup or conversation popup
        const showConversation = this.conversations.length > 0 && Math.random() < 0.4;
        
        if (showConversation) {
            this.showConversationPopup();
        } else {
            this.showFactPopup();
        }
    }

    // Modified: Split original popup logic into fact-specific popup
    showFactPopup() {
        // Get a random fact from all categories
        const randomFact = this.facts[Math.floor(Math.random() * this.facts.length)];
        
        const popup = document.createElement('div');
        popup.className = 'fake-popup';
        
        // Random popup styles
        const popupTypes = [
            { title: '💡 Did You Know?', icon: '💡' },
            { title: '🤯 Mind = Blown', icon: '🤯' },
            { title: '📚 Random Fact Alert!', icon: '📚' },
            { title: '🧠 Brain Food', icon: '🧠' },
            { title: '⚡ Fact Flash!', icon: '⚡' }
        ];
        
        const popupType = popupTypes[Math.floor(Math.random() * popupTypes.length)];
        
        popup.innerHTML = `
            <div class="popup-header">
                <span class="popup-icon">${popupType.icon}</span>
                <span class="popup-title">${popupType.title}</span>
                <button class="popup-close">×</button>
            </div>
            <div class="popup-content">
                <div class="popup-category">${randomFact.category}</div>
                <div class="popup-fact">${randomFact.fact}</div>
            </div>
        `;
        
        this.showPopup(popup);
    }

    // New: Show conversation popup
    showConversationPopup() {
        const randomConversation = this.conversations[Math.floor(Math.random() * this.conversations.length)];
        
        const popup = document.createElement('div');
        popup.className = 'fake-popup conversation-popup';
        
        popup.innerHTML = `
            <div class="popup-header">
                <span class="popup-icon">💬</span>
                <span class="popup-title">English ↔ Spanish</span>
                <button class="popup-close">×</button>
            </div>
            <div class="popup-content">
                <div class="conversation-pair">
                    <div class="english-text">🇺🇸 ${randomConversation.english}</div>
                    <div class="spanish-text">🇪🇸 ${randomConversation.spanish}</div>
                </div>
            </div>
        `;
        
        this.showPopup(popup);
    }

    // New: Common popup display logic
    showPopup(popup) {
        // Random position (but keep some margin from edges)
        const x = Math.random() * (window.innerWidth - 320) + 10;
        const y = Math.random() * (window.innerHeight - 200) + 80;
        
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        
        document.body.appendChild(popup);
        
        // Animate in
        setTimeout(() => popup.classList.add('show'), 100);
        
        // Auto-dismiss after 8 seconds
        const dismissTimer = setTimeout(() => {
            this.dismissPopup(popup);
        }, 8000);
        
        // Close button functionality
        const closeBtn = popup.querySelector('.popup-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(dismissTimer);
            this.dismissPopup(popup);
        });
        
        // Click anywhere on popup to dismiss
        popup.addEventListener('click', (e) => {
            if (e.target === popup || e.target.closest('.popup-content')) {
                clearTimeout(dismissTimer);
                this.dismissPopup(popup);
            }
        });
    }

    dismissPopup(popup) {
        popup.classList.add('hide');
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
            }
        }, 300);
    }

    // New: Handle font family change
    handleFontChange(event) {
        const fontFamily = event.target.value;
        document.documentElement.style.setProperty('--font-family', fontFamily);
        localStorage.setItem('fontFamily', fontFamily);
    }

    // New: Handle font size change
    handleFontSizeChange(event) {
        const fontSize = event.target.value;
        document.documentElement.style.setProperty('--font-size', `${fontSize}px`);
        this.fontSizeValue.textContent = `${fontSize}px`;
        localStorage.setItem('fontSize', fontSize);
    }
    
    // New: Load saved settings from localStorage
    loadSettings() {
        // Load liked facts
        const savedLiked = localStorage.getItem('likedFacts');
        if (savedLiked) {
            this.likedFacts = JSON.parse(savedLiked);
        }

        // Load font family
        const savedFont = localStorage.getItem('fontFamily');
        if (savedFont) {
            this.fontSelector.value = savedFont;
            document.documentElement.style.setProperty('--font-family', savedFont);
        }

        // Load font size
        const savedSize = localStorage.getItem('fontSize');
        if (savedSize) {
            this.fontSizeSlider.value = savedSize;
            this.fontSizeValue.textContent = `${savedSize}px`;
            document.documentElement.style.setProperty('--font-size', `${savedSize}px`);
        }
    }

    saveSettings() {
        localStorage.setItem('likedFacts', JSON.stringify(this.likedFacts));
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FactsApp();
});