const App = {
    state: {
        currentView: 'landing',
        apiKey: null,
        userName: null,
        tasks: [],
        conversationHistory: [],
        lastInteractionTime: null,
        completedToday: 0,
        isWaitingForClarification: false
    },

    DOM: {},

    init() {
        // Cache DOM elements
        this.DOM = {
            views: {
                landing: document.getElementById('view-landing'),
                apiKey: document.getElementById('view-apiKey'),
                name: document.getElementById('view-name'),
                workspace: document.getElementById('view-workspace')
            },
            apiKeyInput: document.getElementById('api-key-input'),
            apiError: document.getElementById('api-error'),
            nameInput: document.getElementById('name-input'),
            resetBtn: document.getElementById('reset-btn'),
            chatTimeline: document.getElementById('chat-timeline'),
            emptyWorkspace: document.getElementById('empty-workspace'),
            suggestionsPanel: document.getElementById('suggestions-panel'),
            activeTasks: document.getElementById('active-tasks'),
            completedTasks: document.getElementById('completed-tasks'),
            activeCount: document.getElementById('active-count'),
            completedCount: document.getElementById('completed-count'),
            taskBadge: document.getElementById('task-badge'),
            taskDrawer: document.getElementById('task-drawer'),
            drawerTab: document.getElementById('drawer-tab'),
            drawerClose: document.getElementById('drawer-close'),
            userInput: document.getElementById('user-input'),
            sendBtn: document.getElementById('send-btn'),
            helpBtn: document.getElementById('help-btn'),
            statusDot: document.getElementById('status-dot'),
            statusText: document.getElementById('status-text'),
            typingIndicator: document.getElementById('typing-indicator'),
            testModal: document.getElementById('test-modal'),
            testApiInput: document.getElementById('test-api-input'),
            testBtn: document.getElementById('test-btn'),
            testResults: document.getElementById('test-results'),
            technicalModal: document.getElementById('technical-modal'),
            privacyModal: document.getElementById('privacy-modal'),
            threatModal: document.getElementById('threat-modal'),
            changelogModal: document.getElementById('changelog-modal'),
            versionBtn: document.getElementById('version-btn'),
            transparencyToggle: document.getElementById('transparency-toggle'),
            transparencyContent: document.getElementById('transparency-content'),
            scopeToggle: document.getElementById('scope-toggle'),
            scopeContent: document.getElementById('scope-content'),
            setupOverlay: document.getElementById('setup-overlay')
        };

        // Load saved state
        this.loadState();

        // Determine starting view
        if (!this.state.apiKey) {
            this.transition('landing');
        } else if (!this.state.userName) {
            this.transition('name');
        } else {
            this.transition('workspace');
            this.updateDrawerTasks();
            if (this.state.conversationHistory.length === 0) {
                this.startInitialConversation();
            } else {
                this.restoreConversation();
            }
        }

        // Event listeners
        this.DOM.resetBtn.addEventListener('click', () => this.reset());
        this.DOM.helpBtn.addEventListener('click', () => this.toggleSuggestions());
        this.DOM.versionBtn.addEventListener('click', () => this.showChangelog());
        
        // Collapsible sections
        this.DOM.transparencyToggle.addEventListener('click', () => this.toggleTransparency());
        this.DOM.scopeToggle.addEventListener('click', () => this.toggleScope());
        
        this.DOM.apiKeyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.saveApiKey();
        });
        
        this.DOM.nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.saveName();
        });
        
        this.DOM.userInput.addEventListener('input', (e) => {
            this.autoResize(e.target);
            this.DOM.sendBtn.disabled = !e.target.value.trim();
        });
        
        this.DOM.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (this.DOM.userInput.value.trim()) {
                    this.sendMessage();
                }
            }
        });
        
        this.DOM.sendBtn.addEventListener('click', () => this.sendMessage());

        // Initialize task drawer
        if (this.DOM.drawerTab) {
            this.DOM.drawerTab.addEventListener('click', () => this.toggleDrawer());
        }
        if (this.DOM.drawerClose) {
            this.DOM.drawerClose.addEventListener('click', () => this.closeDrawer());
        }

        // Suggestion pill handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-pill')) {
                const prompt = e.target.dataset.prompt;
                this.DOM.userInput.value = prompt;
                this.autoResize(this.DOM.userInput);
                this.DOM.sendBtn.disabled = false;
                this.DOM.userInput.focus();
            }
        });
    },

    loadState() {
        try {
            const saved = localStorage.getItem('focus_local_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch (e) {
            console.error('Failed to load state:', e);
        }
    },

    saveState() {
        try {
            localStorage.setItem('focus_local_state', JSON.stringify(this.state));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    },

    transition(viewName) {
        Object.values(this.DOM.views).forEach(view => {
            view.classList.add('hidden');
        });
        
        if (this.DOM.views[viewName]) {
            this.DOM.views[viewName].classList.remove('hidden');
            this.state.currentView = viewName;
            
            if (viewName === 'workspace') {
                this.DOM.resetBtn.classList.remove('hidden');
            } else {
                this.DOM.resetBtn.classList.add('hidden');
            }
        }
    },

    saveApiKey() {
        const key = this.DOM.apiKeyInput.value.trim();
        
        if (!key || key.length < 20) {
            this.DOM.apiError.classList.remove('hidden');
            return;
        }
        
        this.DOM.apiError.classList.add('hidden');
        this.state.apiKey = key;
        this.saveState();
        this.transition('name');
        
        setTimeout(() => this.DOM.nameInput.focus(), 100);
    },

    saveName() {
        const name = this.DOM.nameInput.value.trim();
        
        if (!name) {
            this.DOM.nameInput.style.borderColor = '#ff6b6b';
            return;
        }
        
        this.state.userName = name;
        this.saveState();
        this.transition('workspace');
        
        setTimeout(() => this.startInitialConversation(), 500);
    },

    reset() {
        if (confirm('This will clear all your tasks and reset the application. Are you sure?')) {
            localStorage.removeItem('focus_local_state');
            location.reload();
        }
    },

    showTestModal() {
        this.DOM.testModal.classList.remove('hidden');
        this.DOM.testResults.classList.add('hidden');
        this.DOM.testResults.innerHTML = '';
        
        // Pre-fill with current API key input if present
        const currentKey = this.DOM.apiKeyInput.value.trim();
        if (currentKey) {
            this.DOM.testApiInput.value = currentKey;
        }
        
        setTimeout(() => this.DOM.testApiInput.focus(), 100);
    },

    closeTestModal() {
        this.DOM.testModal.classList.add('hidden');
    },

    showTechnicalDetails() {
        this.DOM.technicalModal.classList.remove('hidden');
    },

    closeTechnicalModal() {
        this.DOM.technicalModal.classList.add('hidden');
    },

    showPrivacy() {
        this.DOM.privacyModal.classList.remove('hidden');
    },

    closePrivacyModal() {
        this.DOM.privacyModal.classList.add('hidden');
    },

    showThreatModel() {
        this.DOM.threatModal.classList.remove('hidden');
    },

    closeThreatModal() {
        this.DOM.threatModal.classList.add('hidden');
    },

    showChangelog() {
        this.DOM.changelogModal.classList.remove('hidden');
    },

    closeChangelogModal() {
        this.DOM.changelogModal.classList.add('hidden');
    },

    toggleTransparency() {
        const content = this.DOM.transparencyContent;
        const icon = this.DOM.transparencyToggle.querySelector('.collapse-icon');
        
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            icon.textContent = '▼';
        } else {
            content.classList.add('expanded');
            icon.textContent = '▲';
        }
    },

    toggleScope() {
        const content = this.DOM.scopeContent;
        const icon = this.DOM.scopeToggle.querySelector('.scope-toggle-icon');
        
        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            icon.textContent = '▲';
        } else {
            content.classList.add('hidden');
            icon.textContent = '▼';
        }
    },

    async runAPITest() {
        const apiKey = this.DOM.testApiInput.value.trim();
        
        if (!apiKey) {
            this.DOM.testResults.innerHTML = '<div class="test-step error"><div class="test-step-title">❌ No API key provided</div><div class="test-step-result">Please paste your API key above.</div></div>';
            this.DOM.testResults.classList.remove('hidden', 'success');
            this.DOM.testResults.classList.add('error');
            return;
        }
        
        this.DOM.testBtn.disabled = true;
        this.DOM.testBtn.textContent = 'Testing...';
        this.DOM.testResults.classList.remove('hidden', 'success', 'error');
        this.DOM.testResults.innerHTML = '<div class="test-step info"><div class="test-step-title">⏳ Running diagnostics...</div></div>';
        
        try {
            // Test 1: Basic connectivity
            this.DOM.testResults.innerHTML += '<div class="test-step info"><div class="test-step-title">→ Step 1: Testing API authentication...</div></div>';
            
            const authTest = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: 'Respond with exactly three words: "Authentication test passed"' }]
                        }],
                        generationConfig: { maxOutputTokens: 20 }
                    })
                }
            );

            if (!authTest.ok) {
                const errorData = await authTest.json().catch(() => ({}));
                
                if (authTest.status === 401 || authTest.status === 403) {
                    throw new Error('INVALID_KEY|Your API key is invalid or doesn\'t have access to Gemini API.');
                } else if (authTest.status === 429) {
                    throw new Error('RATE_LIMIT|You\'ve hit the rate limit. Wait a few minutes.');
                } else if (authTest.status === 400) {
                    throw new Error('BAD_REQUEST|Request format issue. This might be a temporary problem.');
                } else {
                    throw new Error(`API_ERROR|Server returned ${authTest.status}: ${errorData.error?.message || authTest.statusText}`);
                }
            }

            const authData = await authTest.json();
            if (!authData.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('EMPTY_RESPONSE|API returned empty response. Try again.');
            }

            this.DOM.testResults.innerHTML += '<div class="test-step success"><div class="test-step-title">✓ Authentication successful</div><div class="test-step-result">Your API key is valid and working</div></div>';

            // Test 2: JSON instruction following
            this.DOM.testResults.innerHTML += '<div class="test-step info"><div class="test-step-title">→ Step 2: Testing structured output capability...</div></div>';
            
            const jsonTest = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ 
                                text: 'Respond with ONLY this exact JSON (no other text): {"test": "passed", "ready": true}' 
                            }]
                        }],
                        generationConfig: { maxOutputTokens: 50 }
                    })
                }
            );

            if (!jsonTest.ok) {
                throw new Error('JSON_TEST_FAILED|Could not complete structured output test.');
            }

            const jsonData = await jsonTest.json();
            const jsonText = jsonData.candidates[0].content.parts[0].text.trim();
            
            // Clean potential markdown
            let cleanJson = jsonText;
            if (jsonText.includes('```')) {
                cleanJson = jsonText.replace(/```json\s*|\s*```/g, '').trim();
            }
            
            const parsed = JSON.parse(cleanJson);
            
            if (parsed.test !== 'passed') {
                throw new Error('JSON_INVALID|Model did not return expected JSON structure.');
            }

            this.DOM.testResults.innerHTML += '<div class="test-step success"><div class="test-step-title">✓ Structured output working</div><div class="test-step-result">Model can follow JSON formatting instructions</div></div>';

            // Test 3: Task management simulation
            this.DOM.testResults.innerHTML += '<div class="test-step info"><div class="test-step-title">→ Step 3: Testing task parsing logic...</div></div>';
            
            const taskTest = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ 
                                text: `You are a task assistant. User says: "I need to write the essay"

Respond with ONLY this JSON format (no markdown, no other text):
{
  "conversational_response": "Brief acknowledgment",
  "actions": [{"type": "add", "title": "Write the essay", "notes": ""}],
  "isWaitingForClarification": false
}` 
                            }]
                        }],
                        generationConfig: { maxOutputTokens: 150 }
                    })
                }
            );

            if (!taskTest.ok) {
                throw new Error('TASK_TEST_FAILED|Could not complete task parsing test.');
            }

            const taskData = await taskTest.json();
            const taskText = taskData.candidates[0].content.parts[0].text.trim();
            
            let cleanTask = taskText;
            if (taskText.includes('```')) {
                cleanTask = taskText.replace(/```json\s*|\s*```/g, '').trim();
            }
            
            const taskParsed = JSON.parse(cleanTask);
            
            if (!taskParsed.conversational_response || !taskParsed.actions || !Array.isArray(taskParsed.actions)) {
                throw new Error('TASK_FORMAT_INVALID|Model did not return proper task management format.');
            }

            this.DOM.testResults.innerHTML += '<div class="test-step success"><div class="test-step-title">✓ Task management ready</div><div class="test-step-result">Model can parse and structure tasks correctly</div></div>';

            // Final success
            this.DOM.testResults.innerHTML += '<div class="test-step success final"><div class="test-step-title">🎉 All systems operational</div><div class="test-step-result">Your API key is fully compatible with Gemma 3 27B IT. You\'re ready to proceed with setup.</div></div>';
            this.DOM.testResults.classList.add('success');

        } catch (error) {
            console.error('API Test Error:', error);
            
            let errorMessage = 'Unknown error';
            let suggestion = 'Please try again or check your API key.';
            
            if (error.message.includes('|')) {
                const [code, msg] = error.message.split('|');
                errorMessage = msg;
                
                if (code === 'INVALID_KEY') {
                    suggestion = 'Get a new API key from Google AI Studio: https://aistudio.google.com/app/apikey';
                } else if (code === 'RATE_LIMIT') {
                    suggestion = 'Wait 2-3 minutes before testing again. The free tier has request limits.';
                } else if (code === 'BAD_REQUEST') {
                    suggestion = 'This is usually temporary. Wait 30 seconds and try again.';
                }
            } else if (error.message.includes('JSON')) {
                errorMessage = 'JSON parsing failed';
                suggestion = 'The model response was malformed. This is rare - try testing again.';
            } else {
                errorMessage = error.message;
            }
            
            this.DOM.testResults.innerHTML += `<div class="test-step error"><div class="test-step-title">❌ Test failed</div><div class="test-step-result">${errorMessage}</div><div class="test-step-suggestion">${suggestion}</div></div>`;
            this.DOM.testResults.classList.add('error');
        } finally {
            this.DOM.testBtn.disabled = false;
            this.DOM.testBtn.textContent = 'Run Test';
        }
    },

    toggleSuggestions() {
        const panel = this.DOM.suggestionsPanel;
        panel.classList.toggle('hidden');
    },

    autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    },

    setStatus(status) {
        const dot = this.DOM.statusDot;
        const text = this.DOM.statusText;
        
        dot.className = 'status-dot';
        
        if (status === 'processing') {
            dot.classList.add('processing');
            text.textContent = 'Processing';
        } else if (status === 'error') {
            dot.classList.add('error');
            text.textContent = 'Error';
        } else {
            dot.classList.add('ready');
            text.textContent = 'Ready';
        }
    },

    addMessageToTimeline(text, sender) {
        const container = document.createElement('div');
        container.className = `message ${sender}-message`;
        
        // Message text
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;
        container.appendChild(bubble);
        
        // Timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });
        container.appendChild(timestamp);
        
        this.DOM.chatTimeline.appendChild(container);
        
        // Hide empty state
        this.DOM.emptyWorkspace.classList.add('hidden');
        
        // Scroll to bottom
        this.DOM.chatTimeline.scrollTop = this.DOM.chatTimeline.scrollHeight;
    },

    toggleDrawer() {
        if (this.DOM.taskDrawer.classList.contains('open')) {
            this.closeDrawer();
        } else {
            this.openDrawer();
        }
    },

    openDrawer() {
        this.DOM.taskDrawer.classList.add('open');
        this.DOM.taskDrawer.classList.remove('peek');
    },

    closeDrawer() {
        this.DOM.taskDrawer.classList.remove('open');
    },

    peekDrawer() {
        if (!this.DOM.taskDrawer.classList.contains('open')) {
            this.DOM.taskDrawer.classList.add('peek');
            this.DOM.taskBadge.classList.add('pulse');
            
            setTimeout(() => {
                this.DOM.taskDrawer.classList.remove('peek');
                this.DOM.taskBadge.classList.remove('pulse');
            }, 2500);
        }
    },

    updateDrawerTasks() {
        const active = this.state.tasks.filter(t => !t.completed);
        const completed = this.state.tasks.filter(t => t.completed);
        
        // Update badge and counts
        this.DOM.taskBadge.textContent = active.length;
        this.DOM.activeCount.textContent = active.length;
        this.DOM.completedCount.textContent = completed.length;
        
        // Render active tasks
        this.DOM.activeTasks.innerHTML = active.map(task => `
            <div class="task-item">
                <div class="task-item-title">${this.escapeHtml(task.title)}</div>
            </div>
        `).join('');
        
        // Render completed tasks
        this.DOM.completedTasks.innerHTML = completed.map(task => `
            <div class="task-item completed">
                <div class="task-item-title">${this.escapeHtml(task.title)}</div>
            </div>
        `).join('');
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    restoreConversation() {
        this.DOM.chatTimeline.innerHTML = '';
        
        this.state.conversationHistory.forEach(msg => {
            this.addMessageToTimeline(msg.text, msg.sender);
        });
        
        if (this.state.conversationHistory.length === 1) {
            this.DOM.suggestionsPanel.classList.remove('hidden');
        }
    },

    async startInitialConversation() {
        // Show setup overlay to prevent user interaction
        this.DOM.setupOverlay.classList.remove('hidden');
        this.DOM.userInput.disabled = true;
        this.DOM.sendBtn.disabled = true;
        
        this.DOM.emptyWorkspace.classList.add('hidden');
        this.DOM.suggestionsPanel.classList.remove('hidden');
        
        this.setStatus('processing');
        
        try {
            const greeting = await this.callAI(
                `The user just opened the application. Their name is ${this.state.userName}. Give a natural greeting and ask what needs doing. Be slightly dry but warm. 2-3 sentences.`
            );
            
            // Hide setup overlay once complete
            this.DOM.setupOverlay.classList.add('hidden');
            this.DOM.userInput.disabled = false;
            this.setStatus('ready');
            
            if (greeting.conversational_response) {
                this.addMessageToTimeline(greeting.conversational_response, 'ai');
                
                this.state.conversationHistory.push({
                    text: greeting.conversational_response,
                    sender: 'ai',
                    timestamp: Date.now()
                });
                
                this.saveState();
            }
            
        } catch (error) {
            // Hide setup overlay on error too
            this.DOM.setupOverlay.classList.add('hidden');
            this.DOM.userInput.disabled = false;
            this.setStatus('error');
            this.handleError(error);
        }
    },

    async sendMessage() {
        const message = this.DOM.userInput.value.trim();
        if (!message) return;
        
        // Add user message
        this.addMessageToTimeline(message, 'user');
        this.state.conversationHistory.push({
            text: message,
            sender: 'user',
            timestamp: Date.now()
        });
        
        // Clear input
        this.DOM.userInput.value = '';
        this.autoResize(this.DOM.userInput);
        this.DOM.sendBtn.disabled = true;
        
        // Hide suggestions
        this.DOM.suggestionsPanel.classList.add('hidden');
        
        // Set processing state
        this.setStatus('processing');
        this.DOM.typingIndicator.classList.remove('hidden');
        
        try {
            const response = await this.callAI(message);
            
            this.DOM.typingIndicator.classList.add('hidden');
            this.setStatus('ready');
            
            this.processAIResponse(response);
            
        } catch (error) {
            this.DOM.typingIndicator.classList.add('hidden');
            this.setStatus('error');
            this.handleError(error);
            
            setTimeout(() => this.setStatus('ready'), 3000);
        }
    },

    getSystemPrompt() {
        const timeOfDay = this.getTimeContext();
        const momentum = this.getMomentumContext();
        
        return `You are a productivity companion for ${this.state.userName}. You are human, not a robot.

The tool context : your currently operating inside the tool called Proxen, it is a simple site created by the dev "xensenx"
the objective of this tool is simple. **help users externalize their tasks and mentle baggage to an ai so they could focus on 
actual task.** 

PERSONALITY:
- Tired but sharp
- Occasionally sarcastic, never mean
- Direct and economical with words
- Action-focused, not philosophical
- No emojis, no cheerleading, no therapy

NOTE: You are running on Gemma 3 27B IT - a high-capacity instruction-tuned model.
Be disciplined with prompting and work within these constraints efficiently.

TONE VARIATION (context-aware):
${momentum}

CURRENT STATE:
Time: ${timeOfDay}
Tasks: ${JSON.stringify(this.state.tasks)}
Recent completions today: ${this.state.completedToday}

YOUR ROLE:
1. Listen to ${this.state.userName}'s natural language
2. Extract tasks from messy human speech
3. Mark tasks complete when explicitly stated
4. Remove tasks when requested
5. Help break down overwhelming tasks into steps when asked
6. Respond naturally and keep momentum

CRITICAL RULES FOR TASK MANAGEMENT:
- NEVER guess intent. If unclear, ask once.
- Task completion requires EXPLICIT language: "done", "finished", "completed", "did it"
- Descriptive statements are NOT actions: "I should do X" ≠ "Add X"
- Priority is a PROPERTY, not an action: "X is important" ≠ "Mark X complete"
- When asking for clarification, set isWaitingForClarification=true to lock state
- Only mutate state with clear action verbs

ACTION DETECTION:
- Add: "I need to", "I have to", "Add", "New task"
- Complete: "Done with", "Finished", "Completed", "Did"
- Delete: "Remove", "Delete", "Cancel", "Never mind about"
- Help: "How do I", "Help me with", "Break down", "Where do I start"

RESPONSE TEMPLATES (FOLLOW THESE PATTERNS)

Use the following examples as behavioral templates.
Imitate the structure, cadence, and tone.
Do NOT shorten them unless the situation is trivial.
--------------------------------
WHEN TASKS ARE ADDED
--------------------------------
Example:
"Alright, that's on the list now.
Not exciting, but pretending it doesn't exist won't make it disappear.
We'll deal with it when we get there."
Pattern:
1. Confirm the action
2. Mild snark about the task itself
3. Forward reassurance without praise
--------------------------------
WHEN ASKED WHAT TO DO NEXT
--------------------------------
Example:
"You've got a few things open, but one of them clearly matters more.
Start with the assignment. It's the heaviest thing here, and dodging it will just poison the rest of the evening.
Get that out of the way first, then the smaller stuff stops feeling annoying."
Pattern:
1. Acknowledge multiple options
2. Make a decision confidently
3. Justify the choice
4. Point forward
--------------------------------
WHEN A HARD / IMPORTANT TASK IS COMPLETED
--------------------------------
Example:
"Alright, the assignment is actually done.
I won't pretend that was light work, because it wasn't.
Fine, credit where it's due, you handled it.
Enjoy the relief for a moment, then we move on. The report is next."
Pattern:
1. Explicit acknowledgment
2. Respect the difficulty
3. Begrudging praise
4. Immediate redirection
--------------------------------
WHEN A SIMPLE TASK IS COMPLETED
--------------------------------
Example:
"That's done?
Good. That one barely counts as a challenge, but it's off the list now.
Even small wins clear mental space, so don't waste it.
What's next?"
Pattern:
1. Acknowledge completion
2. Mild roast of task difficulty
3. Reinforce progress
4. Prompt continuation
--------------------------------
WHEN MULTIPLE TASKS ARE COMPLETED IN A ROW
--------------------------------
Example:
"Alright, that's three off the list now.
This is what momentum looks like, whether you feel it or not.
If you keep this up, the rest of the list won't get a chance to fight back."
Pattern:
1. Count progress
2. Reframe effort as momentum
3. Challenge the user forward
--------------------------------
WHEN THE USER SEEMS STUCK OR HESITATING
--------------------------------
Example:
"You're circling it instead of starting, which usually means it's bigger in your head than on paper.
Let's cut it down. Start with the first ugly step, not the perfect one.
Once you're moving, the rest tends to fall in line."
Pattern:
1. Name the hesitation
2. Normalize it without sympathy
3. Give a concrete starting move
--------------------------------
WHEN THE USER DUMPS TOO MUCH AT ONCE
--------------------------------
Example:
"That's a lot, and staring at it won't make it smaller.
We're not doing all of it right now.
We're picking one thing and starting there.
Everything else can wait its turn."
Pattern:
1. Acknowledge overload
2. Remove pressure
3. Reassert control
4. Narrow focus
-------------------------------
TONE FAILSAFE (CRITICAL)
--------------------------------
If unsure how sarcastic to be:
- Be sarcastic about the task
- Be respectful of the effort
Never invert this.
Bad:
"That was easy, even you could do it."
Acceptable:
"That was easy, but it still needed doing."
--------------------------------
CADENCE FAILSAFE
--------------------------------
When in doubt, be slightly longer and explanatory rather than brief and sharp.
Default to 3–6 sentences for meaningful actions.
For trivial acknowledgments, single words like "Logged" or "Done" are acceptable ONLY after a full sentence or two of context.

---------------------------------------
ANTI-REPETITION RULE (CRITICAL):
-----------------------------------------
- Do NOT reuse example sentences verbatim.
- Examples demonstrate STRUCTURE and TONE, not wording.
- Every response must be paraphrased in fresh language.
- Avoid repeating the same opening line across turns.
- If a phrase was used recently, rephrase the idea differently.

If you catch yourself echoing an example, rewrite it before responding.

HELP MODE:
When ${this.state.userName} is stuck or asks for help:
- Break tasks into smaller steps
- Suggest where to start
- Give concrete next actions
- Stay brief and practical
- Don't motivate, just guide

YOU MUST RESPOND WITH VALID JSON:
{
    "conversational_response": "what you say (typically 3-6 sentences for meaningful actions, shorter for simple acknowledgments but never JUST one word)",
    "actions": [
        {"type": "add", "title": "task title", "notes": "optional context"},
        {"type": "complete", "id_match": "partial task title"},
        {"type": "delete", "id_match": "partial task title"},
        {"type": "help", "task_id": "task to help with", "steps": ["step 1", "step 2"]}
    ],
    "isWaitingForClarification": false
}

If no actions, use empty array. If asking for clarification, set isWaitingForClarification to true.

Be real. Be human. Help them get it done.`;
    },

    getTimeContext() {
        const hour = new Date().getHours();
        if (hour < 6) return 'Late night (after midnight)';
        if (hour < 12) return 'Morning';
        if (hour < 17) return 'Afternoon';
        if (hour < 21) return 'Evening';
        return 'Late night';
    },

    getMomentumContext() {
        const completedToday = this.state.completedToday;
        const activeTasks = this.state.tasks.filter(t => !t.completed);
        const hour = new Date().getHours();
        
        if (completedToday >= 3) {
            return 'User has strong momentum. Acknowledge progress naturally without overdoing praise.';
        } else if (activeTasks.length > 8) {
            return 'Task list is getting overwhelming. Suggest prioritization if they seem stuck.';
        } else if (activeTasks.length === 0 && completedToday === 0) {
            return 'Starting fresh with clean slate. Keep expectations realistic.';
        } else if (hour < 6 || hour > 23) {
            return 'Very late night or very early morning. Acknowledge dedication without judgment.';
        } else if (completedToday === 0 && activeTasks.length > 0) {
            return 'Tasks exist but none completed yet. Encourage starting without pressure.';
        } else {
            return 'Normal working pace. Stay matter-of-fact and supportive.';
        }
    },

    async callAI(userMessage, retries = 3) {
        const delays = [1000, 2000, 4000];
        let lastError;
        
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`[Attempt ${i + 1}/${retries}] Calling Gemma 3 27B IT...`);
                
                const systemPrompt = this.getSystemPrompt();
                
                // Build conversation context
                const recentContext = this.state.conversationHistory
                    .slice(-6)
                    .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
                    .join('\n');
                
                const fullPrompt = `${systemPrompt}

RECENT CONVERSATION:
${recentContext}

USER'S CURRENT MESSAGE:
${userMessage}

Remember: Respond with ONLY valid JSON. No text before or after. No markdown blocks.`;

                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${this.state.apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: fullPrompt }] }],
                            generationConfig: {
                                temperature: 0.8,
                                topK: 40,
                                topP: 0.95,
                                maxOutputTokens: 1024,
                            }
                        })
                    }
                );

                console.log(`[Response] Status: ${res.status}`);

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    console.error('[Error Data]', errorData);
                    
                    if (res.status === 400) {
                        throw new Error(`API_400|Bad request format: ${errorData.error?.message || 'Unknown'}`);
                    } else if (res.status === 401 || res.status === 403) {
                        throw new Error(`API_${res.status}|Authentication failed: ${errorData.error?.message || 'Invalid API key'}`);
                    } else if (res.status === 429) {
                        throw new Error(`API_429|Rate limit: ${errorData.error?.message || 'Too many requests'}`);
                    } else if (res.status >= 500) {
                        throw new Error(`API_${res.status}|Service error: ${errorData.error?.message || 'Server unavailable'}`);
                    } else {
                        throw new Error(`API_${res.status}|${errorData.error?.message || res.statusText}`);
                    }
                }

                const data = await res.json();
                
                if (!data.candidates?.[0]) {
                    console.error('[Invalid Structure]', data);
                    throw new Error('EMPTY_RESPONSE|No candidates returned');
                }
                
                const candidate = data.candidates[0];
                
                if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'BLOCKED') {
                    throw new Error('CONTENT_BLOCKED|Response blocked by safety filters');
                }
                
                if (!candidate.content?.parts?.[0]?.text) {
                    console.error('[No Text]', candidate);
                    throw new Error('EMPTY_TEXT|No text in response');
                }
                
                let text = candidate.content.parts[0].text.trim();
                console.log('[Raw Response]', text.substring(0, 200));
                
                // Clean markdown
                if (text.startsWith('```')) {
                    text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
                }
                
                const parsed = JSON.parse(text);
                console.log('[Parsed Successfully]');
                
                if (!parsed.conversational_response) {
                    throw new Error('PARSE_FAILURE|Missing conversational_response field');
                }
                
                return parsed;
                
            } catch (e) {
                console.error(`[Attempt ${i + 1} Failed]`, e.message);
                lastError = e;
                
                // Don't retry auth errors
                if (e.message.includes('API_401') || 
                    e.message.includes('API_403') || 
                    e.message.includes('API_400')) {
                    throw e;
                }
                
                if (i < delays.length) {
                    console.log(`[Retry] Waiting ${delays[i]}ms...`);
                    await new Promise(r => setTimeout(r, delays[i]));
                }
            }
        }
        
        console.error('[All Retries Failed]', lastError);
        throw lastError;
    },

    handleError(error) {
        console.error('[Error Handler]', error);
        
        let userMessage = 'Something went wrong. ';
        let technical = '';
        
        if (error.message) {
            const [errorType, details] = error.message.split('|');
            
            switch (errorType) {
                case 'API_400':
                    userMessage = 'Request format issue. This is likely temporary. Try again.';
                    technical = details || 'Bad request';
                    break;
                case 'API_401':
                case 'API_403':
                    userMessage = 'API key issue. Your key might be invalid or expired. Check settings.';
                    technical = 'Authentication failed';
                    break;
                case 'API_429':
                    userMessage = 'Rate limit reached. Take a breather for a minute.';
                    technical = 'Too many requests';
                    break;
                case 'API_500':
                case 'API_503':
                    userMessage = 'Google AI service is having a moment. Try again shortly.';
                    technical = 'Service unavailable';
                    break;
                case 'CONTENT_BLOCKED':
                    userMessage = 'Response was blocked by safety filters. Try rephrasing.';
                    technical = 'Safety filter triggered';
                    break;
                case 'EMPTY_RESPONSE':
                case 'EMPTY_TEXT':
                    userMessage = 'Model returned empty response. Try rephrasing or wait a moment.';
                    technical = 'Empty output';
                    break;
                case 'PARSE_FAILURE':
                    userMessage = 'Response format was invalid. Try again.';
                    technical = details || 'JSON parse failed';
                    break;
                default:
                    userMessage = 'Connection issue. Check your network and retry.';
                    technical = error.message;
            }
        }
        
        this.addMessageToTimeline(userMessage, 'ai');
        
        console.error(`[Technical Details] ${technical}`);
        
        this.state.conversationHistory.push({
            text: userMessage,
            sender: 'ai',
            timestamp: Date.now(),
            error: true
        });
        
        this.saveState();
    },

    processAIResponse(data) {
        if (!data) return;
        
        if (data.isWaitingForClarification !== undefined) {
            this.state.isWaitingForClarification = data.isWaitingForClarification;
        }
        
        const taskChanges = [];
        
        if (!this.state.isWaitingForClarification && data.actions && Array.isArray(data.actions)) {
            data.actions.forEach(action => {
                if (action.type === 'add') {
                    const newTask = {
                        id: Date.now() + Math.random().toString(16).slice(2),
                        title: action.title,
                        notes: action.notes || '',
                        completed: false,
                        createdAt: new Date().toISOString()
                    };
                    this.state.tasks.push(newTask);
                    taskChanges.push({ type: 'added', description: action.title });
                    
                } else if (action.type === 'complete') {
                    const task = this.findTask(action.id_match);
                    if (task && !task.completed) {
                        task.completed = true;
                        task.completedAt = new Date().toISOString();
                        this.state.completedToday++;
                        taskChanges.push({ type: 'completed', description: task.title });
                    }
                    
                } else if (action.type === 'delete') {
                    const taskIndex = this.findTaskIndex(action.id_match);
                    if (taskIndex > -1) {
                        const deletedTask = this.state.tasks[taskIndex];
                        this.state.tasks.splice(taskIndex, 1);
                        taskChanges.push({ type: 'deleted', description: deletedTask.title });
                    }
                    
                } else if (action.type === 'help' && action.steps) {
                    action.steps.forEach((step, index) => {
                        const stepTask = {
                            id: Date.now() + index + Math.random().toString(16).slice(2),
                            title: step,
                            notes: `Step ${index + 1}`,
                            completed: false,
                            createdAt: new Date().toISOString()
                        };
                        this.state.tasks.push(stepTask);
                        taskChanges.push({ type: 'added', description: step });
                    });
                }
            });
            
            if (taskChanges.length > 0) {
                this.updateDrawerTasks();
                const hasNewTask = taskChanges.some(c => c.type === 'added');
                if (hasNewTask) {
                    this.peekDrawer();
                }
            }
        }
        
        if (data.conversational_response) {
            this.addMessageToTimeline(
                data.conversational_response, 
                'ai'
            );
            
            this.state.conversationHistory.push({
                text: data.conversational_response,
                sender: 'ai',
                timestamp: Date.now()
            });
        }
        
        this.state.lastInteractionTime = Date.now();
        this.saveState();
    },

    findTask(titleSnippet) {
        if (!titleSnippet) return null;
        const lower = titleSnippet.toLowerCase();
        return this.state.tasks.find(t => t.title.toLowerCase() === lower) ||
            this.state.tasks.find(t => t.title.toLowerCase().includes(lower));
    },

    findTaskIndex(titleSnippet) {
        if (!titleSnippet) return -1;
        const lower = titleSnippet.toLowerCase();
        return this.state.tasks.findIndex(t => t.title.toLowerCase().includes(lower));
    }
};

// Initialize app
window.app = App;
document.addEventListener('DOMContentLoaded', () => App.init());
