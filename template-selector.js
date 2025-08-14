// Template Selector - Simplified File-Based Version
class TemplateSelector {
    constructor() {
        this.selectedTemplates = [];
        this.availableTemplates = [];
        this.initializeEventListeners();
        this.loadAvailableTemplates();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Template selection events
        document.addEventListener('change', (e) => {
            if (e.target.matches('.template-checkbox')) {
                this.handleTemplateSelection(e.target);
            }
        });

        // Refresh templates button
        const refreshBtn = document.getElementById('refreshTemplatesBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadAvailableTemplates());
        }

        // Select all/none buttons
        const selectAllBtn = document.getElementById('selectAllTemplates');
        const selectNoneBtn = document.getElementById('selectNoneTemplates');
        
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAllTemplates());
        }
        
        if (selectNoneBtn) {
            selectNoneBtn.addEventListener('click', () => this.selectNoneTemplates());
        }

        // Listen for user changes to update template folder
        document.addEventListener('userChanged', (e) => {
            this.handleUserChange(e.detail.user);
        });
    }

    // Handle user change
    handleUserChange(user) {
        console.log('Template selector: User changed to:', user.name);
        this.loadAvailableTemplates();
    }

    // Load available templates from user's Dropbox folder
    async loadAvailableTemplates() {
        const templateContainer = document.getElementById('templateList');
        if (!templateContainer) return;

        try {
            templateContainer.innerHTML = '<div class="loading-templates">Loading templates...</div>';

            // Get current user's template folder
            const user = window.userManager ? window.userManager.currentUser : null;
            if (!user || !user.templateFolder) {
                templateContainer.innerHTML = `
                    <div class="no-templates">
                        <p>No template folder configured.</p>
                        <p>Please select a user and configure their template folder in settings.</p>
                    </div>
                `;
                return;
            }

            // For file-based system, we'll provide a file input for users to select templates
            templateContainer.innerHTML = `
                <div class="template-selection">
                    <div class="template-folder-info">
                        <p><strong>Template Folder:</strong> ${user.templateFolder}</p>
                        <p class="folder-help">Please select DOCX template files from this folder:</p>
                    </div>
                    
                    <div class="file-input-section">
                        <label for="templateFiles" class="file-input-label">
                            <i class="fas fa-folder-open"></i>
                            Select Template Files
                        </label>
                        <input type="file" 
                               id="templateFiles" 
                               multiple 
                               accept=".docx,.doc"
                               style="display: none;">
                        <div class="file-help">
                            Select multiple DOCX files from your ${user.templateFolder} folder
                        </div>
                    </div>
                    
                    <div id="selectedTemplatesList" class="selected-templates-list"></div>
                </div>
            `;

            // Add event listener for file selection
            const fileInput = document.getElementById('templateFiles');
            fileInput.addEventListener('change', (e) => this.handleFileSelection(e));

        } catch (error) {
            console.error('Error loading templates:', error);
            templateContainer.innerHTML = `
                <div class="error-templates">
                    <p>Error loading templates: ${error.message}</p>
                    <button class="btn btn-secondary" onclick="window.templateSelector.loadAvailableTemplates()">
                        <i class="fas fa-refresh"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    // Handle file selection
    handleFileSelection(event) {
        const files = Array.from(event.target.files);
        const listContainer = document.getElementById('selectedTemplatesList');
        
        if (files.length === 0) {
            listContainer.innerHTML = '';
            this.selectedTemplates = [];
            return;
        }

        // Update selected templates
        this.selectedTemplates = files.map(file => ({
            id: `${file.name}_${file.lastModified}`,
            name: file.name,
            file: file,
            selected: true
        }));

        // Display selected templates
        listContainer.innerHTML = `
            <div class="templates-header">
                <h4>Selected Templates (${files.length})</h4>
                <div class="template-actions">
                    <button class="btn btn-sm btn-outline" onclick="window.templateSelector.selectAllTemplates()">
                        Select All
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="window.templateSelector.selectNoneTemplates()">
                        Select None
                    </button>
                </div>
            </div>
            <div class="templates-list">
                ${this.selectedTemplates.map(template => `
                    <div class="template-item">
                        <label class="template-label">
                            <input type="checkbox" 
                                   class="template-checkbox" 
                                   value="${template.id}" 
                                   checked>
                            <div class="template-info">
                                <div class="template-name">
                                    <i class="fas fa-file-word"></i>
                                    ${template.name}
                                </div>
                                <div class="template-details">
                                    Size: ${this.formatFileSize(template.file.size)} | 
                                    Modified: ${new Date(template.file.lastModified).toLocaleDateString()}
                                </div>
                            </div>
                        </label>
                    </div>
                `).join('')}
            </div>
        `;

        // Update analyze button state
        this.updateAnalyzeButton();
    }

    // Handle template checkbox changes
    handleTemplateSelection(checkbox) {
        const templateId = checkbox.value;
        const template = this.selectedTemplates.find(t => t.id === templateId);
        
        if (template) {
            template.selected = checkbox.checked;
        }

        this.updateAnalyzeButton();
    }

    // Update analyze button state
    updateAnalyzeButton() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        const selectedCount = this.getSelectedTemplates().length;
        
        if (analyzeBtn) {
            analyzeBtn.disabled = selectedCount === 0;
            const countText = selectedCount > 0 ? ` (${selectedCount})` : '';
            analyzeBtn.textContent = `Analyze Templates${countText}`;
        }
    }

    // Select all templates
    selectAllTemplates() {
        const checkboxes = document.querySelectorAll('.template-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = true;
            this.handleTemplateSelection(cb);
        });
    }

    // Select no templates
    selectNoneTemplates() {
        const checkboxes = document.querySelectorAll('.template-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = false;
            this.handleTemplateSelection(cb);
        });
    }

    // Get selected templates
    getSelectedTemplates() {
        return this.selectedTemplates.filter(t => t.selected);
    }

    // Get selected template files for processing
    async getSelectedTemplateFiles() {
        const selected = this.getSelectedTemplates();
        
        const filePromises = selected.map(async (template) => {
            return {
                name: template.name,
                file: template.file,
                content: await this.readFileContent(template.file)
            };
        });

        return Promise.all(filePromises);
    }

    // Read file content
    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve({
                    content: e.target.result,
                    isDocx: file.name.toLowerCase().endsWith('.docx'),
                    size: file.size
                });
            };
            
            reader.onerror = () => {
                reject(new Error(`Failed to read file: ${file.name}`));
            };

            // Read as ArrayBuffer for DOCX files, text for others
            if (file.name.toLowerCase().endsWith('.docx')) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Show message
    showMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.getElementById('templateMessage');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'templateMessage';
            messageEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 6px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                max-width: 300px;
            `;
            document.body.appendChild(messageEl);
        }

        // Set message and style based on type
        messageEl.textContent = message;
        switch (type) {
            case 'success':
                messageEl.style.backgroundColor = '#28a745';
                break;
            case 'error':
                messageEl.style.backgroundColor = '#dc3545';
                break;
            case 'warning':
                messageEl.style.backgroundColor = '#ffc107';
                messageEl.style.color = '#212529';
                break;
            default:
                messageEl.style.backgroundColor = '#17a2b8';
        }

        // Show message and auto-hide after 3 seconds
        messageEl.style.display = 'block';
        setTimeout(() => {
            if (messageEl) {
                messageEl.style.display = 'none';
            }
        }, 3000);
    }

    // Clear selected templates
    clearSelection() {
        this.selectedTemplates = [];
        this.loadAvailableTemplates();
    }
}

// Initialize template selector when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.templateSelector = new TemplateSelector();
});
