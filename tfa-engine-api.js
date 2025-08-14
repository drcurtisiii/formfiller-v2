/**
 * TFA Engine with PDF Generation
 * Template Filler App for Curtis Law Firm
 */

class TFAEngine {
    constructor() {
        this.templates = [];
        this.parsedFields = new Map();
        this.fieldValues = new Map();
        
        console.log('TFA Engine initialized with PDF generation');
    }

    /**
     * Process uploaded templates and extract TFA fields
     */
    async processTemplates(files) {
        this.templates = [];
        this.parsedFields.clear();
        
        const loadingMessages = [
            'Analyzing templates...',
            'Extracting TFA fields...',
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
                
                const template = await this.analyzeTemplate(file);
                this.templates.push(template);
                
                // Add unique fields to global collection
                template.uniqueFields.forEach(field => {
                    this.parsedFields.set(field.key, field);
                });
                
                updateMessage();
                
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                throw new Error(`Failed to process ${file.name}: ${error.message}`);
            }
        }

        console.log(`Processed ${this.templates.length} templates with ${this.parsedFields.size} unique fields`);
        
        // Return organized categories for the UI
        return this.organizeFieldsByCategory();
    }

    /**
     * Analyze template file and extract fields
     */
    async analyzeTemplate(file) {
        console.log(`Analyzing template: ${file.name}`);
        
        try {
            let content = '';
            
            if (file.name.toLowerCase().endsWith('.docx')) {
                // Use mammoth.js to extract text from .docx files
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                content = result.value;
            } else {
                // Handle text files
                content = await file.text();
            }
            
            // Extract TFA fields
            const fields = this.extractFields(content);
            
            const template = {
                name: file.name,
                size: file.size,
                file: file,
                content: content,
                fields: fields,
                uniqueFields: this.getUniqueFields(fields),
                isDocx: file.name.toLowerCase().endsWith('.docx')
            };
            
            return template;
            
        } catch (error) {
            console.error('Template analysis failed:', error);
            throw new Error(`Failed to analyze template: ${error.message}`);
        }
    }

    /**
     * Extract TFA fields from content
     */
    extractFields(content) {
        // Enhanced regex to match TFA field format: {{CATEGORY.FIELD_NAME|TYPE|OPTIONS}}
        const fieldRegex = /\{\{([^}]+)\}\}/g;
        const fields = [];
        let match;

        while ((match = fieldRegex.exec(content)) !== null) {
            const fieldString = match[1];
            const field = this.parseFieldString(fieldString, match[0]);
            if (field) {
                fields.push(field);
            }
        }

        return fields;
    }

    /**
     * Parse individual field string
     */
    parseFieldString(fieldString, original) {
        try {
            const parts = fieldString.split('|');
            if (parts.length < 1) return null;

            const categoryField = parts[0];
            const type = parts[1] || 'TEXT';
            const options = parts[2] || '';

            // Split category and field name
            const dotIndex = categoryField.indexOf('.');
            if (dotIndex === -1) {
                // No category, treat entire string as field name
                return {
                    category: 'GENERAL',
                    name: categoryField.trim(),
                    key: `GENERAL.${categoryField.trim()}`,
                    type: type.trim().toUpperCase(),
                    options: options.trim(),
                    original: original
                };
            }

            const category = categoryField.substring(0, dotIndex).trim();
            const name = categoryField.substring(dotIndex + 1).trim();

            return {
                category: category.toUpperCase(),
                name: name,
                key: `${category.toUpperCase()}.${name}`,
                type: type.trim().toUpperCase(),
                options: options.trim(),
                original: original
            };
        } catch (error) {
            console.warn('Failed to parse field:', fieldString, error);
            return null;
        }
    }

    /**
     * Get unique fields from array
     */
    getUniqueFields(fields) {
        const uniqueMap = new Map();
        fields.forEach(field => {
            if (!uniqueMap.has(field.key)) {
                uniqueMap.set(field.key, field);
            }
        });
        return Array.from(uniqueMap.values());
    }

    /**
     * Organize fields by category
     */
    organizeFieldsByCategory() {
        const categories = {};
        
        this.parsedFields.forEach(field => {
            if (!categories[field.category]) {
                categories[field.category] = [];
            }
            categories[field.category].push(field);
        });

        // Sort categories and fields within each category
        const sortedCategories = {};
        Object.keys(categories).sort().forEach(category => {
            sortedCategories[category] = categories[category].sort((a, b) => a.name.localeCompare(b.name));
        });

        return sortedCategories;
    }

    /**
     * Set field value
     */
    setFieldValue(key, value) {
        this.fieldValues.set(key, value);
    }

    /**
     * Get field value
     */
    getFieldValue(key) {
        return this.fieldValues.get(key) || '';
    }

    /**
     * Get all field values
     */
    getAllFieldValues() {
        return Object.fromEntries(this.fieldValues);
    }

    /**
     * Load field values from object
     */
    loadFieldValues(values) {
        this.fieldValues.clear();
        Object.entries(values || {}).forEach(([key, value]) => {
            this.fieldValues.set(key, value);
        });
    }

    /**
     * Format field value based on type
     */
    formatFieldValue(field, value) {
        if (!value) return '';

        switch (field.type) {
            case 'PHONE':
                // Format phone number as (XXX) XXX-XXXX
                const digits = value.replace(/\D/g, '');
                if (digits.length === 10) {
                    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
                }
                return value;
            
            case 'DATE':
                // Ensure consistent date format
                if (value.includes('/')) {
                    const parts = value.split('/');
                    if (parts.length === 3) {
                        const month = parts[0].padStart(2, '0');
                        const day = parts[1].padStart(2, '0');
                        const year = parts[2];
                        return `${month}/${day}/${year}`;
                    }
                }
                return value;
            
            case 'CALCULATED':
                // Handle calculated fields
                try {
                    return this.calculateFieldValue(field.options, value);
                } catch (error) {
                    console.warn('Calculation failed for field:', field.key, error);
                    return value;
                }
            
            default:
                return value;
        }
    }

    /**
     * Calculate field value for CALCULATED type
     */
    calculateFieldValue(formula, defaultValue) {
        try {
            // Simple calculation support - could be expanded
            // For now, just return the default value
            return defaultValue || '';
        } catch (error) {
            console.error('Calculation error:', error);
            return defaultValue || '';
        }
    }

    /**
     * Generate documents with PDF output
     */
    async generateDocuments(selectedTemplateNames = null) {
        try {
            const templatesToProcess = selectedTemplateNames 
                ? this.templates.filter(t => selectedTemplateNames.includes(t.name))
                : this.templates;

            if (templatesToProcess.length === 0) {
                throw new Error('No templates selected for processing');
            }

            console.log(`Generating PDFs for ${templatesToProcess.length} templates...`);
            
            const results = [];
            
            for (const template of templatesToProcess) {
                console.log(`Generating PDF for: ${template.name}`);
                
                try {
                    const blob = await this.generatePDF(template);
                    results.push({
                        template: template.name,
                        blob: blob,
                        success: true
                    });
                } catch (error) {
                    console.error(`Failed to generate PDF for ${template.name}:`, error);
                    results.push({
                        template: template.name,
                        error: error.message,
                        success: false
                    });
                }
            }

            console.log('Document generation completed');
            return results;

        } catch (error) {
            console.error('Document generation failed:', error);
            throw error;
        }
    }

    /**
     * Generate PDF from template
     */
    async generatePDF(template) {
        console.log(`Generating PDF for template: ${template.name}`);
        
        try {
            // Replace fields in content
            let filledContent = template.content;
            
            template.fields.forEach(field => {
                const value = this.getFieldValue(field.key);
                if (value) {
                    const formattedValue = this.formatFieldValue(field, value);
                    filledContent = filledContent.replace(new RegExp(this.escapeRegex(field.original), 'g'), formattedValue);
                } else {
                    // Replace with empty string if no value
                    filledContent = filledContent.replace(new RegExp(this.escapeRegex(field.original), 'g'), '');
                }
            });

            // Create PDF using jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Add Curtis Law Firm letterhead
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('CURTIS LAW FIRM', 105, 20, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Professional Legal Services', 105, 28, { align: 'center' });
            doc.text('Phone: (555) 123-4567 | Email: info@curtislawfirm.com', 105, 35, { align: 'center' });
            
            // Add a line separator
            doc.line(20, 42, 190, 42);

            // Add document title
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            const titleText = template.name.replace('.docx', '').replace('.txt', '');
            doc.text(titleText, 105, 55, { align: 'center' });

            // Add filled content
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            
            // Split content into lines and add to PDF
            const lines = doc.splitTextToSize(filledContent, 170);
            let yPosition = 70;
            const lineHeight = 6;
            const pageHeight = 280;

            lines.forEach((line, index) => {
                if (yPosition > pageHeight - 20) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(line, 20, yPosition);
                yPosition += lineHeight;
            });

            // Add footer with generation info
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'italic');
                const footerText = `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${totalPages}`;
                doc.text(footerText, 105, 290, { align: 'center' });
            }

            // Return PDF as blob
            const pdfBlob = doc.output('blob');
            console.log('PDF generated successfully:', pdfBlob.size, 'bytes');
            
            return pdfBlob;

        } catch (error) {
            console.error('PDF generation failed:', error);
            throw new Error(`Failed to generate PDF: ${error.message}`);
        }
    }

    /**
     * Escape special regex characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Download blob as file
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Get templates
     */
    getTemplates() {
        return this.templates;
    }

    /**
     * Get parsed fields
     */
    getParsedFields() {
        return this.parsedFields;
    }

    /**
     * Clear all data
     */
    clear() {
        this.templates = [];
        this.parsedFields.clear();
        this.fieldValues.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TFAEngine;
}

// Export for use in main app
window.TFAEngine = TFAEngine;
