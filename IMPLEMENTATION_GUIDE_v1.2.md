# Proxen v1.2 - Working Task Drawer Implementation

## HTML Changes (index.html)

### 1. Replace the workspace sidebar section (lines ~650-667) with this drawer:

```html
<!-- TASK DRAWER - Pull down from top like notifications -->
<div id="task-drawer" class="task-drawer">
    <div class="drawer-tab" id="drawer-tab">
        <div class="tab-handle"></div>
        <span class="task-badge" id="task-badge">0</span>
    </div>
    
    <div class="drawer-panel" id="drawer-panel">
        <div class="drawer-header">
            <h3>Tasks</h3>
            <button class="drawer-close-btn" id="drawer-close">×</button>
        </div>
        
        <div class="drawer-body">
            <div class="task-group">
                <div class="task-group-header">
                    <span>Active</span>
                    <span class="task-count" id="active-count">0</span>
                </div>
                <div id="active-tasks" class="task-list"></div>
            </div>
            
            <div class="task-group completed-group">
                <div class="task-group-header">
                    <span>Completed</span>
                    <span class="task-count" id="completed-count">0</span>
                </div>
                <div id="completed-tasks" class="task-list"></div>
            </div>
        </div>
    </div>
</div>
```

Place this RIGHT AFTER the workspace section opens, BEFORE setup overlay.

## CSS Changes (styles.css)

### 1. Update workspace layout (replace .workspace-view section):

```css
.workspace-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    position: relative;
}

.main-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-xl);
    background: var(--gradient-warm);
}
```

### 2. Add complete task drawer CSS (add at end of file):

```css
/* ========== TASK DRAWER v1.2 ========== */

.task-drawer {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    pointer-events: none;
}

.drawer-tab {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background: #000;
    padding: 8px 20px 12px;
    border-radius: 0 0 12px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    pointer-events: all;
    box-shadow: 0 2px 12px rgba(0,0,0,0.4);
    transition: all 0.2s;
}

.drawer-tab:hover {
    background: #1a1a1a;
    transform: translateX(-50%) translateY(2px);
}

.tab-handle {
    width: 30px;
    height: 3px;
    background: #666;
    border-radius: 2px;
}

.task-badge {
    background: var(--accent-primary);
    color: #000;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 10px;
    min-width: 20px;
    text-align: center;
}

.task-badge.pulse {
    animation: badgePulse 0.5s ease;
}

@keyframes badgePulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
}

.drawer-panel {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: #000;
    max-height: 70vh;
    transform: translateY(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: all;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(0,0,0,0.6);
}

.task-drawer.open .drawer-panel {
    transform: translateY(0);
}

.task-drawer.peek .drawer-panel {
    transform: translateY(calc(-100% + 60px));
}

.drawer-header {
    padding: var(--spacing-lg);
    border-bottom: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.drawer-header h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1.1rem;
}

.drawer-close-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.drawer-close-btn:hover {
    color: var(--text-primary);
}

.drawer-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-lg);
}

.task-group {
    margin-bottom: var(--spacing-xl);
}

.task-group.completed-group {
    opacity: 0.7;
    padding-top: var(--spacing-lg);
    border-top: 1px solid #333;
}

.task-group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-tertiary);
    font-weight: 600;
}

.task-count {
    background: var(--accent-primary);
    color: #000;
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 700;
}

.task-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.task-list:empty::after {
    content: "No tasks";
    display: block;
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--text-muted);
    font-size: 13px;
    font-style: italic;
}

.task-item {
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 6px;
    padding: var(--spacing-md);
    transition: all 0.2s;
}

.task-item:hover {
    border-color: var(--accent-primary);
    background: #222;
}

.task-item.completed {
    opacity: 0.6;
}

.task-item-title {
    color: var(--text-primary);
    font-size: 14px;
    line-height: 1.5;
    user-select: text;
    -webkit-user-select: text;
}

.task-item.completed .task-item-title {
    text-decoration: line-through;
    color: var(--text-secondary);
}

/* Mobile */
@media (max-width: 768px) {
    .drawer-panel {
        max-height: 80vh;
    }
}
```

### 3. Remove ALL sidebar CSS (delete these selectors):
- .sidebar
- .sidebar-section
- .sidebar-header
- .sidebar-title
- .sidebar-tasks
- .task-count-badge (old one)
- Any @media rules for sidebar

### 4. Fix text selection (add to base styles, around line 75):

```css
/* Allow text selection */
.message-bubble,
.task-item-title,
.transparency-value,
.scope-value,
p, span {
    -webkit-user-select: text;
    -moz-user-select: text;
    user-select: text;
}

/* Keep buttons non-selectable */
button,
.drawer-tab,
.suggestion-pill {
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
}
```

## JavaScript Changes (app.js)

### 1. Update DOM references (in init method):

```javascript
// Replace the task-related DOM elements:
activeTasks: document.getElementById('active-tasks'),
completedTasks: document.getElementById('completed-tasks'),
activeCount: document.getElementById('active-count'),
completedCount: document.getElementById('completed-count'),
taskBadge: document.getElementById('task-badge'),
taskDrawer: document.getElementById('task-drawer'),
drawerTab: document.getElementById('drawer-tab'),
drawerClose: document.getElementById('drawer-close'),
```

### 2. Add drawer initialization (add this after event listeners setup):

```javascript
// Initialize task drawer
if (this.DOM.drawerTab) {
    this.DOM.drawerTab.addEventListener('click', () => this.toggleDrawer());
}
if (this.DOM.drawerClose) {
    this.DOM.drawerClose.addEventListener('click', () => this.closeDrawer());
}
```

### 3. Add drawer methods (add these new methods):

```javascript
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
```

### 4. Replace renderSidebarTasks() calls with updateDrawerTasks()

Find and replace:
- `this.renderSidebarTasks()` → `this.updateDrawerTasks()`

### 5. Add peek when tasks added (in processAIResponse):

After tasks are processed, add:
```javascript
if (taskChanges.length > 0) {
    this.updateDrawerTasks();
    const hasNewTask = taskChanges.some(c => c.type === 'added');
    if (hasNewTask) {
        this.peekDrawer();
    }
}
```

### 6. Simplify addMessageToTimeline (remove inline task UI):

Remove the task changes parameter and rendering:
```javascript
addMessageToTimeline(text, sender) {
    // Just message bubble, no task changes UI
    const container = document.createElement('div');
    container.className = `message ${sender}-message`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;
    container.appendChild(bubble);
    
    // ... rest of message rendering
}
```

## Testing Checklist

1. ✓ Drawer tab visible at top
2. ✓ Click tab to open drawer
3. ✓ Click X to close drawer
4. ✓ Add task → drawer peeks for 2.5s
5. ✓ Badge shows task count
6. ✓ Active/completed sections work
7. ✓ Can select and copy text
8. ✓ No inline task UI in chat
9. ✓ Same on mobile and PC
10. ✓ Clean black design

## Key Points

- Drawer is FIXED position, not absolute
- Tab is ALWAYS visible (black rounded tab at top)
- Panel slides down from hidden (-100%)
- Peek shows just top 60px
- Text selection works with proper CSS
- No sidebar anywhere
