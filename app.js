/**
 * TFA Main Application
 * Handles user interface and application flow
 */

class TFAApp {
    constructor() {
        this.engine = new TFAEngine();
        this.currentStep = 1;
        this.selectedFiles = [];
        this.autoSaveTimeout = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Button events (file upload removed - now using cloud templates)
        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyzeTemplates());
        document.getElementById('backToStep1').addEventListener('click', () => this.showStep(1));
        
        // Engine error events
        document.addEventListener('tfaError', (e) => {
            console.error('TFA Error:', e.detail.message);
            this.showToast(e.detail.message, 'error');
        });
        document.getElementById('generateBtn').addEventListener('click', () => this.generateDocuments());
        document.getElementById('startOver').addEventListener('click', () => this.startOver());
        document.getElementById('downloadAll').addEventListener('click', () => this.downloadAll());

        // Modal events
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
        document.getElementById('closeHelp').addEventListener('click', () => this.hideHelp());

        // Progress events
        document.addEventListener('tfaProgress', (e) => this.updateLoadingMessage(e.detail.message));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    async analyzeTemplates() {
        if (!window.templateSelector || window.templateSelector.getSelectedTemplates().length === 0) {
            this.showError('Please select at least one template');
            return;
        }

        this.showLoading('Downloading and analyzing templates...');

        try {
            // Get template files from cloud
            const files = await window.templateSelector.getSelectedTemplateFiles();
            
            // Process templates with the engine
            const categories = await this.engine.processTemplates(files);
            this.displayFieldCategories(categories);
            this.showStep(2);
        } catch (error) {
            this.showError(`Analysis failed: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    displayFieldCategories(categories) {
        const container = document.getElementById('fieldCategories');
        container.innerHTML = '';

        if (categories.length === 0) {
            container.innerHTML = `
                <div class="no-fields">
                    <i class="fas fa-info-circle"></i>
                    <h3>No TFA Fields Found</h3>
                    <p>Your templates don't contain any TFA field strings. Make sure your documents include fields in the format {{CATEGORY.FIELD_NAME|TYPE|OPTIONS}}.</p>
                </div>
            `;
            return;
        }

        categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'field-category';
            
            const fieldsHtml = category.fields.map(field => this.createFieldHTML(field)).join('');
            
            categoryElement.innerHTML = `
                <div class="category-header">
                    <i class="${category.icon}"></i>
                    <h3>${category.name}</h3>
                    <span class="field-count">${category.fields.length} field${category.fields.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="category-body">
                    <div class="field-grid">
                        ${fieldsHtml}
                    </div>
                </div>
            `;
            
            container.appendChild(categoryElement);
        });

        // Add event listeners for field inputs
        this.attachFieldEventListeners();
    }

    createFieldHTML(field) {
        const fieldId = `field_${field.key.replace(/[^a-zA-Z0-9]/g, '_')}`;
        let inputHTML = '';

        switch (field.type) {
            case 'CALCULATED':
                // CALCULATED fields are read-only and auto-populated
                inputHTML = `
                    <input type="text" class="field-input calculated-field" id="${fieldId}" data-field-key="${field.key}" 
                           readonly placeholder="Auto-calculated..." title="This field is automatically calculated">
                `;
                break;
                
            case 'SELECT':
                const options = field.options.map(option => 
                    `<option value="${option}">${option}</option>`
                ).join('');
                inputHTML = `
                    <select class="field-select" id="${fieldId}" data-field-key="${field.key}">
                        <option value="">Select an option...</option>
                        ${options}
                    </select>
                `;
                break;
            
            case 'DATE':
                inputHTML = `
                    <input type="date" class="field-input" id="${fieldId}" data-field-key="${field.key}">
                `;
                break;
            
            case 'PHONE':
                inputHTML = `
                    <input type="tel" class="field-input" id="${fieldId}" data-field-key="${field.key}" 
                           placeholder="(555) 123-4567">
                `;
                break;
            
            default:
                inputHTML = `
                    <input type="text" class="field-input" id="${fieldId}" data-field-key="${field.key}" 
                           placeholder="Enter ${field.name.toLowerCase()}...">
                `;
                break;
        }

        return `
            <div class="field-group ${field.type === 'CALCULATED' ? 'calculated-field-group' : ''}">
                <label class="field-label" for="${fieldId}">
                    ${this.formatFieldName(field.name)}
                    <span class="field-type">(${field.type}${field.type === 'CALCULATED' ? ' - Auto' : ''})</span>
                </label>
                <div class="field-description">
                    ${this.getFieldDescription(field)}
                </div>
                ${inputHTML}
            </div>
        `;
    }

    formatFieldName(name) {
        return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    getFieldDescription(field) {
        // Special descriptions for calculated fields
        if (field.type === 'CALCULATED') {
            if (field.name === 'CIRCUIT') {
                return 'Automatically calculated based on the selected county';
            }
            return 'This field is automatically calculated';
        }
        
        const descriptions = {
            'FIRST_NAME': 'Enter the first name',
            'LAST_NAME': 'Enter the last name',
            'ADDRESS': 'Enter the full address',
            'PHONE': 'Enter phone number with area code',
            'EMAIL': 'Enter email address',
            'CASE_NUMBER': 'Enter the court case number',
            'FILING_DATE': 'Select the date when filed',
            'HEARING_DATE': 'Select the hearing date',
            'BAR_NUMBER': 'Enter attorney bar number',
            'STYLE_PREFIX': 'Select the appropriate case style prefix',
            'COUNTY': 'Select the Florida county where the case is filed'
        };
        
        return descriptions[field.name] || `Enter value for ${this.formatFieldName(field.name)}`;
    }

    attachFieldEventListeners() {
        const fieldInputs = document.querySelectorAll('[data-field-key]');
        
        fieldInputs.forEach(input => {
            // Skip calculated fields - they don't get manual input
            if (input.readOnly) return;
            
            input.addEventListener('input', (e) => {
                const fieldKey = e.target.dataset.fieldKey;
                const value = e.target.value;
                this.engine.setFieldValue(fieldKey, value);
                this.updateCalculatedFields();
                this.updateProgress();
                this.scheduleAutoSave();
            });

            input.addEventListener('change', (e) => {
                const fieldKey = e.target.dataset.fieldKey;
                const value = e.target.value;
                this.engine.setFieldValue(fieldKey, value);
                this.updateCalculatedFields();
                this.updateProgress();
                this.autoSaveNow();
            });
        });

        // Initialize calculated fields
        this.updateCalculatedFields();
        
        // Load client data if a client is selected
        this.loadClientFieldData();
    }

    // Schedule auto-save (debounced)
    scheduleAutoSave() {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.autoSaveNow();
        }, 1000); // Save after 1 second of inactivity
    }

    // Immediate auto-save
    autoSaveNow() {
        if (window.clientManager && window.clientManager.currentClient) {
            window.clientManager.saveCurrentFieldData();
        }
    }

    // Load client field data into form
    loadClientFieldData() {
        if (window.clientManager && window.clientManager.currentClient) {
            window.clientManager.populateFieldsFromClient();
        }
    }

    updateCalculatedFields() {
        // Handle circuit calculation based on county
        const countyValue = this.engine.getFieldValue('COURT.COUNTY');
        if (countyValue) {
            const circuit = this.getJudicialCircuit(countyValue);
            if (circuit) {
                this.engine.setFieldValue('COURT.CIRCUIT', circuit);
                
                // Update the UI for the circuit field
                const circuitInput = document.querySelector('[data-field-key="COURT.CIRCUIT"]');
                if (circuitInput) {
                    circuitInput.value = circuit;
                }
            }
        }

        // Add other calculated field logic here as needed
    }

    getJudicialCircuit(county) {
        // Florida county to judicial circuit mapping
        const countyToCircuit = {
            'Alachua': '8th',
            'Baker': '8th',
            'Bay': '14th',
            'Bradford': '8th',
            'Brevard': '18th',
            'Broward': '17th',
            'Calhoun': '14th',
            'Charlotte': '20th',
            'Citrus': '5th',
            'Clay': '4th',
            'Collier': '20th',
            'Columbia': '3rd',
            'DeSoto': '12th',
            'Dixie': '3rd',
            'Duval': '4th',
            'Escambia': '1st',
            'Flagler': '7th',
            'Franklin': '2nd',
            'Gadsden': '2nd',
            'Gilchrist': '8th',
            'Glades': '20th',
            'Gulf': '14th',
            'Hamilton': '3rd',
            'Hardee': '10th',
            'Hendry': '20th',
            'Hernando': '5th',
            'Highlands': '10th',
            'Hillsborough': '13th',
            'Holmes': '14th',
            'Indian River': '19th',
            'Jackson': '14th',
            'Jefferson': '2nd',
            'Lafayette': '3rd',
            'Lake': '5th',
            'Lee': '20th',
            'Leon': '2nd',
            'Levy': '8th',
            'Liberty': '2nd',
            'Madison': '3rd',
            'Manatee': '12th',
            'Marion': '5th',
            'Martin': '19th',
            'Miami-Dade': '11th',
            'Monroe': '16th',
            'Nassau': '4th',
            'Okaloosa': '1st',
            'Okeechobee': '19th',
            'Orange': '9th',
            'Osceola': '9th',
            'Palm Beach': '15th',
            'Pasco': '6th',
            'Pinellas': '6th',
            'Polk': '10th',
            'Putnam': '7th',
            'St. Johns': '7th',
            'St. Lucie': '19th',
            'Santa Rosa': '1st',
            'Sarasota': '12th',
            'Seminole': '18th',
            'Sumter': '5th',
            'Suwannee': '3rd',
            'Taylor': '3rd',
            'Union': '8th',
            'Volusia': '7th',
            'Wakulla': '2nd',
            'Walton': '1st',
            'Washington': '14th'
        };

        return countyToCircuit[county] || null;
    }

    updateProgress() {
        const summary = this.engine.getSummary();
        
        // Calculate progress excluding calculated fields
        let totalUserFields = 0;
        let completedUserFields = 0;
        
        this.engine.parsedFields.forEach((field, key) => {
            if (field.type !== 'CALCULATED') {
                totalUserFields++;
                const value = this.engine.getFieldValue(key);
                if (value && value.trim() !== '') {
                    completedUserFields++;
                }
            }
        });
        
        const progress = totalUserFields > 0 ? 
            (completedUserFields / totalUserFields) * 100 : 0;
        
        console.log(`Progress: ${Math.round(progress)}% (${completedUserFields}/${totalUserFields} user fields, ${summary.totalFields} total fields)`);
    }

    async generateDocuments() {
        const validation = this.engine.validateFields();
        
        if (!validation.isValid) {
            this.showFieldValidationError(validation.missingFields);
            return;
        }

        this.showLoading('Generating documents...');

        try {
            const filledDocuments = await this.engine.generateDocuments();
            this.displayResults(filledDocuments);
            this.showStep(3);
        } catch (error) {
            this.showError(`Generation failed: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    displayResults(documents) {
        const container = document.getElementById('resultsArea');
        container.innerHTML = '';

        documents.forEach((doc, index) => {
            if (doc.success === false) {
                // Handle failed documents
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item error';
                resultItem.innerHTML = `
                    <div class="result-info">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div class="result-details">
                            <h4>${doc.name || 'Unknown Document'}</h4>
                            <p class="error-text">Generation failed: ${doc.error}</p>
                        </div>
                    </div>
                `;
                container.appendChild(resultItem);
                return;
            }

            // Determine file type and icon
            let formatLabel, iconClass, fileType;
            
            if (doc.isPDF) {
                formatLabel = 'PDF Document (.pdf)';
                iconClass = 'fas fa-file-pdf';
                fileType = 'PDF';
            } else if (doc.isDocx) {
                formatLabel = 'Word Document (.docx)';
                iconClass = 'fas fa-file-word';
                fileType = 'Word';
            } else {
                formatLabel = 'Text Document (.txt)';
                iconClass = 'fas fa-file-alt';
                fileType = 'Text';
            }
            
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <div class="result-info">
                    <i class="${iconClass}"></i>
                    <div class="result-details">
                        <h4>${doc.name}</h4>
                        <p>${this.formatFileSize(doc.size)} • ${formatLabel}</p>
                        ${doc.isPreview ? '<small class="preview-note">Preview only - full system required for actual files</small>' : ''}
                    </div>
                </div>
                <div class="result-actions">
                    <button class="btn btn-primary" onclick="app.downloadDocument(${index})">
                        <i class="fas fa-download"></i> Download ${fileType}
                    </button>
                </div>
            `;
            container.appendChild(resultItem);
        });
    }

    async downloadDocument(index) {
        try {
            // Save current field data to client before generating
            if (window.clientManager && window.clientManager.currentClient) {
                window.clientManager.saveCurrentFieldData();
            }
            
            const documents = await this.engine.generateDocuments();
            const doc = documents[index];
            
            if (doc.success === false) {
                this.showToast(`Cannot download: ${doc.error}`, 'error');
                return;
            }
            
            let blob, mimeType, formatInfo;
            
            if (doc.isPDF) {
                // For PDF files
                blob = doc.content;
                mimeType = 'application/pdf';
                formatInfo = 'PDF document';
            } else if (doc.isDocx) {
                // For .docx files, content is already a blob from API
                blob = doc.content;
                mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                formatInfo = 'Word document (.docx)';
            } else {
                // For text files
                blob = new Blob([doc.content], { type: 'text/plain' });
                mimeType = 'text/plain';
                formatInfo = 'Text file (.txt)';
            }
            
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Show success message with format info
            console.log(`Downloaded: ${doc.name} (${formatInfo})`);
            this.showToast(`Downloaded: ${doc.name}`, 'success');
            
        } catch (error) {
            console.error('Download error:', error);
            this.showToast('Download failed: ' + error.message, 'error');
        }
    }

    async downloadAll() {
        try {
            const documents = await this.engine.generateDocuments();
            for (let i = 0; i < documents.length; i++) {
                setTimeout(() => this.downloadDocument(i), i * 500);
            }
        } catch (error) {
            console.error('Download all error:', error);
            this.showToast('Failed to download documents: ' + error.message, 'error');
        }
    }

    showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.step-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target step
        document.getElementById(`step${stepNumber}`).classList.add('active');
        this.currentStep = stepNumber;
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showLoading(message = 'Processing...') {
        const overlay = document.getElementById('loadingOverlay');
        const messageElement = document.getElementById('loadingMessage');
        messageElement.textContent = message;
        overlay.style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    updateLoadingMessage(message) {
        document.getElementById('loadingMessage').textContent = message;
    }

    showError(message) {
        alert(`Error: ${message}`);
        // In a production app, you'd use a proper toast/notification system
    }

    showFieldValidationError(missingFields) {
        const fieldNames = missingFields.map(f => this.formatFieldName(f.name)).join(', ');
        this.showError(`Please fill in the following required fields: ${fieldNames}`);
    }

    showHelp() {
        document.getElementById('helpModal').style.display = 'flex';
    }

    hideHelp() {
        document.getElementById('helpModal').style.display = 'none';
    }

    startOver() {
        if (confirm('Are you sure you want to start over? All entered data will be lost.')) {
            this.selectedFiles = [];
            this.engine = new TFAEngine();
            
            // Reset template selector
            if (window.templateSelector) {
                window.templateSelector.clear();
            }
            
            // Reset UI
            document.getElementById('analyzeBtn').disabled = true;
            
            this.showStep(1);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    handleKeyboard(e) {
        // Escape key closes modals
        if (e.key === 'Escape') {
            this.hideHelp();
        }
        
        // F1 shows help
        if (e.key === 'F1') {
            e.preventDefault();
            this.showHelp();
        }
    }

    // Export/Import functionality for field values
    exportFieldValues() {
        const data = this.engine.exportFieldValues();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tfa_field_values.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async importFieldValues() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const text = await file.text();
                if (this.engine.importFieldValues(text)) {
                    // Refresh the field display with imported values
                    this.refreshFieldValues();
                    alert('Field values imported successfully!');
                } else {
                    this.showError('Invalid field values file');
                }
            }
        };
        
        input.click();
    }

    refreshFieldValues() {
        const fieldInputs = document.querySelectorAll('[data-field-key]');
        fieldInputs.forEach(input => {
            const fieldKey = input.dataset.fieldKey;
            const value = this.engine.getFieldValue(fieldKey);
            if (value) {
                input.value = value;
            }
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TFAApp();
    console.log('TFA App initialized successfully');
});
