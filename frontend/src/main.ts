import './style.css'

interface QuranVerse {
    reference: string;
    text_ar: string;
    text_fr: string;
    metadata: {
        sourate_name: string;
        sourate: number;
        start_ayah: number;
        end_ayah: number;
    };
}

interface AskResponse {
    question: string;
    answer: string;
    sources: QuranVerse[];
}

const API_URL = 'http://localhost:8000/api/ask/';

const messagesContainer = document.querySelector<HTMLDivElement>('#messages-container')!;
const welcomeScreen = document.querySelector<HTMLDivElement>('#welcome-screen')!;
const chatForm = document.querySelector<HTMLFormElement>('#chat-form')!;
const userInput = document.querySelector<HTMLTextAreaElement>('#user-input')!;
const sendBtn = document.querySelector<HTMLButtonElement>('#send-btn')!;
const suggestions = document.querySelectorAll<HTMLButtonElement>('.suggestion');
const newChatBtn = document.querySelector<HTMLButtonElement>('#new-chat-btn')!;
const historyList = document.querySelector<HTMLDivElement>('#history-list')!;
const hamburgerBtn = document.querySelector<HTMLButtonElement>('#hamburger-btn');
const sidebar = document.querySelector<HTMLElement>('#sidebar');
const sidebarOverlay = document.querySelector<HTMLDivElement>('#sidebar-overlay');

let isProcessing = false;

// ---- Mobile Sidebar Toggle ----
const toggleSidebar = () => {
    sidebar?.classList.toggle('open');
    sidebarOverlay?.classList.toggle('open');
};

hamburgerBtn?.addEventListener('click', toggleSidebar);
sidebarOverlay?.addEventListener('click', toggleSidebar);

// ---- Auto-resize textarea ----
userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = `${Math.min(userInput.scrollHeight, 200)}px`;
    sendBtn.disabled = userInput.value.trim().length === 0 || isProcessing;
});

// ---- Add message to UI ----
const addMessage = (content: string, role: 'user' | 'ai', sources?: QuranVerse[]) => {
    if (welcomeScreen) welcomeScreen.style.display = 'none';

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    let contentHtml = `<div class="message-content">${content}</div>`;

    if (sources && sources.length > 0) {
        contentHtml += `<div class="message-content"><div class="sources-container">`;
        sources.forEach(src => {
            contentHtml += `
                <div class="quran-verse">
                    <span class="arabic-text">${src.text_ar}</span>
                    <span class="french-text">${src.text_fr}</span>
                    <span class="source">${src.reference}</span>
                </div>
            `;
        });
        contentHtml += `</div></div>`;
    }

    messageDiv.innerHTML = contentHtml;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

// ---- Loading indicator ----
const showLoading = () => {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai loading-msg';
    loadingDiv.innerHTML = `
        <div class="message-content">
            <div class="typing">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        </div>
    `;
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return loadingDiv;
};

// ---- Submit question ----
const handleSubmit = async (q: string) => {
    if (isProcessing) return;

    const question = q.trim();
    if (!question) return;

    // Reset UI
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;
    isProcessing = true;

    // Add user message
    addMessage(question, 'user');

    // Show loading
    const loadingIndicator = showLoading();

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: question, limit: 3 })
        });

        if (!response.ok) throw new Error('Erreur serveur');

        const data: AskResponse = await response.json();

        // Remove loading and add AI response
        loadingIndicator.remove();
        addMessage(data.answer, 'ai', data.sources);

        // Add to history sidebar
        addToHistory(question);

    } catch (error) {
        loadingIndicator.remove();
        addMessage("Désolé, une erreur est survenue lors de la communication avec le serveur. Vérifiez que le backend Django est bien lancé.", 'ai');
    } finally {
        isProcessing = false;
        sendBtn.disabled = userInput.value.trim().length === 0;
    }
};

// ---- Add to sidebar history ----
const addToHistory = (text: string) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.textContent = text;
    item.onclick = () => {
        userInput.value = text;
        userInput.dispatchEvent(new Event('input'));
        // Close mobile sidebar if open
        sidebar?.classList.remove('open');
        sidebarOverlay?.classList.remove('open');
    };

    // Prepend
    if (historyList.firstChild) {
        historyList.insertBefore(item, historyList.firstChild);
    } else {
        historyList.appendChild(item);
    }
};

// ---- Event Listeners ----
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit(userInput.value);
});

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.requestSubmit();
    }
});

suggestions.forEach(btn => {
    btn.addEventListener('click', () => {
        const question = btn.textContent || '';
        handleSubmit(question);
    });
});

newChatBtn.addEventListener('click', () => {
    messagesContainer.innerHTML = '';
    messagesContainer.appendChild(welcomeScreen);
    welcomeScreen.style.display = 'block';
    // Close mobile sidebar if open
    sidebar?.classList.remove('open');
    sidebarOverlay?.classList.remove('open');
});
