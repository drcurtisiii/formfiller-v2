/**
 * TFA Engine - Template Filler App Core Logic
 * Handles parsing and processing of TFA field strings
 */

class TFAEngine {
    constructor() {
        this.fieldPattern = /\{\{([^}]+)\}\}/g;
        this.parsedFields = new Map();
        this.fieldValues = new Map();
        this.templates = [];
    }

    /**
     * Parse a field string into its components
     * Format: {{CATEGORY.FIELD_NAME|TYPE|OPTIONS}}
     */
    parseFieldString(fieldString) {
        const content = fieldString.replace(/\{\{|\}\}/g, '');
        const parts = content.split('|');
        
        if (parts.length < 2) {
            throw new Error(`Invalid field format: ${fieldString}`);
        }

        const [categoryField, type, ...optionParts] = parts;
        const [category, fieldName] = categoryField.split('.');
        
        if (!category || !fieldName) {
            throw new Error(`Invalid category.field format: ${categoryField}`);
        }

        const field = {
            original: fieldString,
            category: category.trim(),
            name: fieldName.trim(),
            type: type.trim().toUpperCase(),
            key: `${category}.${fieldName}`,
            options: []
        };

        // Parse options for SELECT fields
        if (field.type === 'SELECT' && optionParts.length > 0) {
            field.options = optionParts.join('|').split(',').map(opt => opt.trim());
        }

        return field;
    }

    /**
     * Extract all TFA fields from document content
     */
    extractFields(content) {
        const fields = [];
        const matches = content.matchAll(this.fieldPattern);
        
        console.log(`Scanning content (${content.length} characters) for TFA fields...`);
        
        let matchCount = 0;
        for (const match of matches) {
            matchCount++;
            try {
                const field = this.parseFieldString(match[0]);
                fields.push(field);
                console.log(`Found field: ${field.key} (${field.type})`);
            } catch (error) {
                console.warn(`Skipping invalid field: ${match[0]}`, error);
            }
        }
        
        console.log(`Found ${matchCount} field matches, ${fields.length} valid fields`);
        
        // Debug: Show a sample of the content
        const contentSample = content.substring(0, 500);
        console.log('Content sample:', contentSample);
        
        return fields;
    }

    /**
     * Process uploaded templates and extract unique fields
     */
    async processTemplates(files) {
        this.templates = [];
        this.parsedFields.clear();
        
        const loadingMessages = [
            'Reading document structure...',
            'Extracting field definitions...',
            'Analyzing field types...',
            'Organizing field categories...',
            'Preparing form interface...'
        ];

        let messageIndex = 0;
        const updateMessage = () => {
            const event = new CustomEvent('tfaProgress', {
                detail: { message: loadingMessages[messageIndex % loadingMessages.length] }
            });
            document.dispatchEvent(event);
            messageIndex++;
        };

        updateMessage();

        for (const file of files) {
            try {
                updateMessage();
                
                // Read file content with RTF conversion for .docx files
                const fileContent = await this.readFileAsText(file);
                const content = fileContent.text || fileContent; // Handle both new and old formats
                const rtfContent = fileContent.rtf; // RTF version for .docx files
                const fields = this.extractFields(content);
                
                const template = {
                    name: file.name,
                    size: file.size,
                    content: content,
                    rtfContent: rtfContent, // Store RTF for direct editing
                    isDocx: fileContent.isDocx || false,
                    fields: fields,
                    uniqueFields: this.getUniqueFields(fields)
                };

                this.templates.push(template);
                
                // Add unique fields to global collection
                fields.forEach(field => {
                    this.parsedFields.set(field.key, field);
                });

                updateMessage();
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                throw new Error(`Failed to process ${file.name}: ${error.message}`);
            }
        }

        updateMessage();
        return this.organizeFieldsByCategory();
    }

    /**
     * Read file content - converts .docx to RTF immediately to preserve formatting
     */
    async readFileAsText(file) {
        return new Promise((resolve, reject) => {
            if (file.name.toLowerCase().endsWith('.docx')) {
                // Convert .docx to RTF directly using a third-party service or library
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const arrayBuffer = e.target.result;
                        
                        // Get text for field extraction
                        const textResult = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                        
                        // Convert directly to RTF using online conversion API
                        const rtfContent = await this.convertDocxToRTF(arrayBuffer);
                        
                        resolve({
                            text: textResult.value,
                            rtf: rtfContent,
                            isDocx: true
                        });
                    } catch (error) {
                        console.error('Error reading .docx file:', error);
                        reject(new Error(`Failed to read .docx file: ${error.message}`));
                    }
                };
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsArrayBuffer(file);
            } else {
                // For other file types, read as text
                const reader = new FileReader();
                reader.onload = (e) => {
                    const textContent = e.target.result;
                    resolve({
                        text: textContent,
                        rtf: null,
                        isDocx: false
                    });
                };
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            }
        });
    }

    /**
     * Convert .docx ArrayBuffer to RTF using LibreOffice Online API
     */
    async convertDocxToRTF(arrayBuffer) {
        try {
            // For now, let's use mammoth to get HTML and do a better HTML-to-RTF conversion
            // In the future, this could use a proper .docx to RTF conversion service
            const result = await mammoth.convertToHtml({ 
                arrayBuffer: arrayBuffer,
                styleMap: [
                    "p[style-name='Header'] => p.header:fresh",
                    "p[style-name='Footer'] => p.footer:fresh", 
                    "p[style-name='Title'] => h1:fresh",
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh"
                ]
            });
            
            return this.convertCleanHtmlToRTF(result.value);
        } catch (error) {
            throw new Error(`RTF conversion failed: ${error.message}`);
        }
    }

    /**
     * Get unique fields from a field array
     */
    getUniqueFields(fields) {
        const unique = new Map();
        fields.forEach(field => {
            unique.set(field.key, field);
        });
        return Array.from(unique.values());
    }

    /**
     * Organize fields by category for display
     */
    organizeFieldsByCategory() {
        const categories = new Map();
        
        this.parsedFields.forEach(field => {
            if (!categories.has(field.category)) {
                categories.set(field.category, {
                    name: field.category,
                    fields: [],
                    icon: this.getCategoryIcon(field.category)
                });
            }
            categories.get(field.category).fields.push(field);
        });

        return Array.from(categories.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Get appropriate icon for category
     */
    getCategoryIcon(category) {
        const iconMap = {
            'CLIENT': 'fas fa-user',
            'ATTORNEY': 'fas fa-user-tie',
            'CASE': 'fas fa-gavel',
            'COURT': 'fas fa-landmark',
            'DATE': 'fas fa-calendar',
            'FINANCIAL': 'fas fa-dollar-sign',
            'CHILDREN': 'fas fa-child',
            'PROPERTY': 'fas fa-home',
            'MOTION': 'fas fa-file-alt',
            'HEARING': 'fas fa-calendar-check',
            'DOCUMENT': 'fas fa-file-text'
        };
        
        return iconMap[category.toUpperCase()] || 'fas fa-folder';
    }

    /**
     * Set field value
     */
    setFieldValue(fieldKey, value) {
        this.fieldValues.set(fieldKey, value);
    }

    /**
     * Get field value
     */
    getFieldValue(fieldKey) {
        return this.fieldValues.get(fieldKey) || '';
    }

    /**
     * Validate required fields (excluding calculated fields)
     */
    validateFields() {
        const missingFields = [];
        
        this.parsedFields.forEach((field, key) => {
            // Skip validation for calculated fields
            if (field.type === 'CALCULATED') {
                return;
            }
            
            const value = this.getFieldValue(key);
            if (!value || value.trim() === '') {
                missingFields.push(field);
            }
        });

        return {
            isValid: missingFields.length === 0,
            missingFields: missingFields
        };
    }

    /**
     * Generate filled documents
     */
    generateDocuments() {
        const filledTemplates = [];

        this.templates.forEach(template => {
            let outputContent;
            const isDocx = template.isDocx || template.name.toLowerCase().endsWith('.docx');
            
            if (isDocx && template.rtfContent) {
                // Work directly with RTF content - replace fields in RTF
                outputContent = template.rtfContent;
                
                template.fields.forEach(field => {
                    const value = this.getFieldValue(field.key) || '';
                    const formattedValue = this.formatFieldValue(field, value);
                    
                    // Escape RTF special characters in the replacement value
                    const rtfValue = this.escapeRTFText(formattedValue);
                    
                    // Replace field placeholders in RTF content
                    const regex = new RegExp(this.escapeRegex(field.original), 'g');
                    outputContent = outputContent.replace(regex, rtfValue);
                });
            } else {
                // For text files, work with plain text
                outputContent = template.content;
                
                template.fields.forEach(field => {
                    const value = this.getFieldValue(field.key) || '';
                    const formattedValue = this.formatFieldValue(field, value);
                    outputContent = outputContent.replace(new RegExp(this.escapeRegex(field.original), 'g'), formattedValue);
                });
            }

            // Determine output name
            const outputName = isDocx ? 
                template.name.replace('.docx', '_filled.rtf') : 
                template.name.replace(/\.(txt|docx)$/, '_filled.txt');

            filledTemplates.push({
                name: outputName,
                originalName: template.name,
                content: outputContent,
                size: new Blob([outputContent]).size,
                isRTF: isDocx
            });
        });

        return filledTemplates;
    }

    /**
     * Convert clean HTML to RTF with better formatting preservation
     */
    convertCleanHtmlToRTF(htmlContent) {
        // RTF header with comprehensive formatting support
        let rtf = '{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1033';
        rtf += '{\\fonttbl{\\f0\\froman\\fprq2\\fcharset0 Times New Roman;}';
        rtf += '{\\f1\\fswiss\\fprq2\\fcharset0 Arial;}';
        rtf += '{\\f2\\fmodern\\fprq1\\fcharset0 Courier New;}}';
        rtf += '{\\colortbl;\\red0\\green0\\blue0;\\red255\\green0\\blue0;\\red0\\green0\\blue255;}';
        rtf += '{\\*\\generator Curtis Law Firm TFA;}';
        rtf += '\\viewkind4\\uc1';
        
        // Clean up HTML and convert to RTF
        let cleanHtml = htmlContent
            .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove style tags
            .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
            .replace(/<!--.*?-->/g, '') // Remove comments
            .replace(/&nbsp;/g, ' ') // Convert non-breaking spaces
            .replace(/&amp;/g, '&') // Convert HTML entities
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"');
        
        // Parse HTML and convert to RTF
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cleanHtml;
        
        const rtfContent = this.parseHtmlElementToRTF(tempDiv);
        
        rtf += rtfContent;
        rtf += '}';
        
        return rtf;
    }

    /**
     * Parse HTML element to RTF with improved formatting
     */
    parseHtmlElementToRTF(element) {
        let rtfText = '';
        
        for (let i = 0; i < element.childNodes.length; i++) {
            const node = element.childNodes[i];
            
            if (node.nodeType === Node.TEXT_NODE) {
                rtfText += this.escapeRTFText(node.textContent);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                
                switch (tagName) {
                    case 'p':
                        const style = node.getAttribute('style') || '';
                        const align = node.getAttribute('align') || '';
                        let pFormat = '\\pard';
                        
                        if (style.includes('text-align:center') || align === 'center') {
                            pFormat += '\\qc';
                        } else if (style.includes('text-align:right') || align === 'right') {
                            pFormat += '\\qr';
                        } else if (style.includes('text-align:justify') || align === 'justify') {
                            pFormat += '\\qj';
                        }
                        
                        pFormat += '\\f0\\fs24 ';
                        rtfText += pFormat + this.parseHtmlElementToRTF(node) + '\\par ';
                        break;
                        
                    case 'strong':
                    case 'b':
                        rtfText += '{\\b ' + this.parseHtmlElementToRTF(node) + '}';
                        break;
                        
                    case 'em':
                    case 'i':
                        rtfText += '{\\i ' + this.parseHtmlElementToRTF(node) + '}';
                        break;
                        
                    case 'u':
                        rtfText += '{\\ul ' + this.parseHtmlElementToRTF(node) + '}';
                        break;
                        
                    case 'br':
                        rtfText += '\\line ';
                        break;
                        
                    case 'div':
                        rtfText += '\\pard\\f0\\fs24 ' + this.parseHtmlElementToRTF(node) + '\\par ';
                        break;
                        
                    default:
                        rtfText += this.parseHtmlElementToRTF(node);
                        break;
                }
            }
        }
        
        return rtfText;
    }

    /**
     * Escape text for RTF format
     */
    escapeRTFText(text) {
        if (!text) return '';
        
        return text
            .replace(/\\/g, '\\\\')    // Escape backslashes
            .replace(/\{/g, '\\{')     // Escape opening braces
            .replace(/\}/g, '\\}')     // Escape closing braces
            .replace(/\r\n/g, '\\par ') // Windows line endings
            .replace(/\n/g, '\\par ')   // Unix line endings
            .replace(/\r/g, '\\par ')   // Mac line endings
            .replace(/\t/g, '\\tab ');  // Tabs
    }

    /**
     * Convert plain text to RTF format (fallback method)
     */
    convertToRTF(textContent) {
        // RTF header with proper formatting
        let rtf = '{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1033';
        rtf += '{\\fonttbl{\\f0\\froman\\fprq2\\fcharset0 Times New Roman;}}';
        rtf += '{\\*\\generator Curtis Law Firm TFA;}';
        rtf += '\\viewkind4\\uc1\\pard\\f0\\fs24 '; // Font Times New Roman, 12pt
        
        // Convert text content to RTF
        let rtfContent = textContent
            .replace(/\\/g, '\\\\')           // Escape backslashes
            .replace(/\{/g, '\\{')            // Escape opening braces
            .replace(/\}/g, '\\}')            // Escape closing braces
            .replace(/\r\n/g, '\n')           // Normalize line endings
            .replace(/\n\n+/g, '\\par\\par ') // Double line breaks = paragraph breaks
            .replace(/\n/g, '\\par ')         // Single line breaks = line breaks
            .replace(/\t/g, '\\tab ');        // Tabs
        
        rtf += rtfContent;
        rtf += '}';
        
        return rtf;
    }

    /**
     * Format field value based on type
     */
    formatFieldValue(field, value) {
        switch (field.type) {
            case 'DATE':
                return this.formatDate(value);
            case 'PHONE':
                return this.formatPhone(value);
            case 'CALCULATED':
                return this.calculateValue(field, value);
            default:
                return value;
        }
    }

    /**
     * Format date value
     */
    formatDate(value) {
        if (!value) return '';
        try {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return value;
        }
    }

    /**
     * Format phone number
     */
    formatPhone(value) {
        if (!value) return '';
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `(${cleaned.substr(0, 3)}) ${cleaned.substr(3, 3)}-${cleaned.substr(6, 4)}`;
        }
        return value;
    }

    /**
     * Calculate field value (placeholder for complex calculations)
     */
    calculateValue(field, value) {
        // Placeholder for calculated fields
        // This would contain logic for auto-calculations
        return value;
    }

    /**
     * Escape regex special characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Get summary statistics
     */
    getSummary() {
        return {
            totalTemplates: this.templates.length,
            totalFields: this.parsedFields.size,
            categories: this.organizeFieldsByCategory().length,
            completedFields: Array.from(this.fieldValues.values()).filter(v => v && v.trim() !== '').length
        };
    }

    /**
     * Export field values as JSON
     */
    exportFieldValues() {
        const values = {};
        this.fieldValues.forEach((value, key) => {
            values[key] = value;
        });
        return JSON.stringify(values, null, 2);
    }

    /**
     * Import field values from JSON
     */
    importFieldValues(jsonString) {
        try {
            const values = JSON.parse(jsonString);
            Object.entries(values).forEach(([key, value]) => {
                this.setFieldValue(key, value);
            });
            return true;
        } catch {
            return false;
        }
    }
}

// Export for use in main app
window.TFAEngine = TFAEngine;
