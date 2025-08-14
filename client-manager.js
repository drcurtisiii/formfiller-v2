// Client/Matter Management System - Simplified File-Based Version
class ClientMatterManager {
    constructor() {
        this.clients = this.loadClients();
        this.currentClient = null;
        this.initializeEventListeners();
        this.populateClientDropdown();
        
        // Listen for user changes
        document.addEventListener('userChanged', (e) => {
            this.handleUserChange(e.detail.user);
        });
    }

    // Handle user change
    handleUserChange(user) {
        console.log('User changed to:', user.name);
        // Could reload client data specific to user if needed
        // For now, clients are shared across all users
    }

    // Get firm data from current user
    getFirmData() {
        if (window.userManager && window.userManager.currentUser) {
            const user = window.userManager.currentUser;
            return {
                firmName: user.firmName || "The Curtis Law Firm, P.A.",
                attorneyName: user.name || "Ray Curtis",
                barNumber: user.barNumber || "Fla. Bar No. 0043636",
                address: user.firmAddress || "103 N. Jefferson Street, Perry, FL 32347",
                phone: user.firmPhone || "(850) 584-5299",
                fax: user.firmFax || "(850) 290-7448",
                email: user.email || "efile@thecurtislawfirm.com"
            };
        }
        
        // Fallback defaults
        return {
            firmName: "The Curtis Law Firm, P.A.",
            attorneyName: "Ray Curtis",
            barNumber: "Fla. Bar No. 0043636",
            address: "103 N. Jefferson Street, Perry, FL 32347",
            phone: "(850) 584-5299",
            fax: "(850) 290-7448",
            email: "efile@thecurtislawfirm.com"
        };
    }

    // Load clients from localStorage
    loadClients() {
        const saved = localStorage.getItem('tfa_clients');
        return saved ? JSON.parse(saved) : [];
    }

    // Save clients to localStorage
    saveClients() {
        localStorage.setItem('tfa_clients', JSON.stringify(this.clients));
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Client/Matter Modal
        document.getElementById('clientMatterSelect').addEventListener('change', (e) => {
            this.handleClientSelection(e.target.value);
        });

        // Client/Matter Modal events
        document.getElementById('clientMatterModalClose').addEventListener('click', () => {
            this.hideClientMatterModal();
        });

        document.getElementById('clientMatterModalCancel').addEventListener('click', () => {
            this.hideClientMatterModal();
        });

        document.getElementById('clientMatterModalSave').addEventListener('click', () => {
            this.saveClientMatter();
        });

        // Notes modal events
        document.getElementById('addViewNotesBtn').addEventListener('click', () => {
            this.showNotesModal();
        });

        document.getElementById('notesModalClose').addEventListener('click', () => {
            this.hideNotesModal();
        });

        document.getElementById('notesModalCancel').addEventListener('click', () => {
            this.hideNotesModal();
        });

        document.getElementById('addNoteBtn').addEventListener('click', () => {
            this.addNote();
        });
    }

    // Handle client selection
    handleClientSelection(clientId) {
        if (clientId === 'add-new') {
            this.showClientMatterModal();
        } else if (clientId) {
            this.loadClient(clientId);
        } else {
            this.currentClient = null;
            this.hideNotesButton();
        }
    }

    // Load specific client
    loadClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (client) {
            this.currentClient = client;
            this.updateLastUsed(client);
            this.showNotesButton();
            
            // Trigger event for other components
            document.dispatchEvent(new CustomEvent('clientSelected', {
                detail: { client: this.currentClient }
            }));
        }
    }

    // Update client's last used timestamp
    updateLastUsed(client) {
        client.lastUsed = new Date().toISOString();
        this.saveClients();
    }

    // Show/hide notes button
    showNotesButton() {
        const btn = document.getElementById('addViewNotesBtn');
        const text = document.getElementById('notesText');
        btn.style.display = 'inline-block';
        
        if (this.currentClient && this.currentClient.notes && this.currentClient.notes.length > 0) {
            text.textContent = `View Notes (${this.currentClient.notes.length})`;
        } else {
            text.textContent = 'Add Notes';
        }
    }

    hideNotesButton() {
        document.getElementById('addViewNotesBtn').style.display = 'none';
    }

    // Populate client dropdown
    populateClientDropdown() {
        const select = document.getElementById('clientMatterSelect');
        
        // Clear existing options except the default ones
        const defaultOptions = select.querySelectorAll('option[value=""], option[value="add-new"]');
        select.innerHTML = '';
        defaultOptions.forEach(option => select.appendChild(option));

        // Sort clients by last used (most recent first)
        const sortedClients = [...this.clients].sort((a, b) => {
            const aTime = new Date(a.lastUsed || 0);
            const bTime = new Date(b.lastUsed || 0);
            return bTime - aTime;
        });

        // Add client options
        sortedClients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = `${client.client.firstName} ${client.client.lastName} - ${client.matter.description}`;
            select.insertBefore(option, select.lastElementChild);
        });
    }

    // Show client/matter modal
    showClientMatterModal(clientId = null) {
        const modal = document.getElementById('clientMatterModal');
        const title = document.getElementById('clientMatterModalTitle');
        
        if (clientId) {
            // Edit existing client
            const client = this.clients.find(c => c.id === clientId);
            if (client) {
                title.textContent = 'Edit Client/Matter';
                document.getElementById('clientFirstName').value = client.client.firstName;
                document.getElementById('clientLastName').value = client.client.lastName;
                document.getElementById('matterDescription').value = client.matter.description;
                document.getElementById('caseNumber').value = client.matter.caseNumber || '';
            }
        } else {
            // Add new client
            title.textContent = 'Add New Client/Matter';
            document.getElementById('clientMatterForm').reset();
        }

        modal.style.display = 'block';
    }

    // Hide client/matter modal
    hideClientMatterModal() {
        document.getElementById('clientMatterModal').style.display = 'none';
        // Reset dropdown if "add-new" was selected
        const select = document.getElementById('clientMatterSelect');
        if (select.value === 'add-new') {
            select.value = this.currentClient ? this.currentClient.id : '';
        }
    }

    // Save client/matter
    saveClientMatter() {
        const firstName = document.getElementById('clientFirstName').value.trim();
        const lastName = document.getElementById('clientLastName').value.trim();
        const matterDescription = document.getElementById('matterDescription').value.trim();
        const caseNumber = document.getElementById('caseNumber').value.trim();

        if (!firstName || !lastName || !matterDescription) {
            this.showMessage('Please fill in all required fields.', 'error');
            return;
        }

        const clientData = {
            id: this.generateClientId(firstName, lastName, matterDescription),
            client: {
                firstName: firstName,
                lastName: lastName
            },
            matter: {
                description: matterDescription,
                caseNumber: caseNumber
            },
            notes: [],
            created: new Date().toISOString(),
            lastUsed: new Date().toISOString()
        };

        // Check if client already exists
        const existingIndex = this.clients.findIndex(c => c.id === clientData.id);
        if (existingIndex >= 0) {
            // Update existing client
            this.clients[existingIndex] = { ...this.clients[existingIndex], ...clientData };
        } else {
            // Add new client
            this.clients.push(clientData);
        }

        this.saveClients();
        this.populateClientDropdown();
        this.hideClientMatterModal();
        this.showMessage('Client/Matter saved successfully!', 'success');

        // Select the client
        document.getElementById('clientMatterSelect').value = clientData.id;
        this.loadClient(clientData.id);
    }

    // Generate client ID
    generateClientId(firstName, lastName, matterDescription) {
        const name = `${firstName}_${lastName}`.toLowerCase();
        const matter = matterDescription.toLowerCase().replace(/\s+/g, '_');
        const timestamp = Date.now().toString().slice(-6);
        return `${name}_${matter}_${timestamp}`.replace(/[^a-z0-9_]/g, '');
    }

    // Show notes modal
    showNotesModal() {
        if (!this.currentClient) return;

        const modal = document.getElementById('notesModal');
        const existingNotes = document.getElementById('existingNotes');
        
        // Clear and populate existing notes
        existingNotes.innerHTML = '';
        
        if (this.currentClient.notes && this.currentClient.notes.length > 0) {
            this.currentClient.notes.forEach((note, index) => {
                const noteEl = document.createElement('div');
                noteEl.className = 'note-item';
                noteEl.innerHTML = `
                    <div class="note-header">
                        <span class="note-date">${new Date(note.date).toLocaleString()}</span>
                        <button class="btn btn-sm btn-outline remove-note" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="note-content">${note.content}</div>
                `;
                existingNotes.appendChild(noteEl);
            });

            // Add event listeners to remove buttons
            existingNotes.querySelectorAll('.remove-note').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.closest('.remove-note').dataset.index);
                    this.removeNote(index);
                });
            });
        } else {
            existingNotes.innerHTML = '<p class="no-notes">No notes yet.</p>';
        }

        // Clear new note textarea
        document.getElementById('newNoteText').value = '';
        
        modal.style.display = 'block';
    }

    // Hide notes modal
    hideNotesModal() {
        document.getElementById('notesModal').style.display = 'none';
    }

    // Add note
    addNote() {
        const noteText = document.getElementById('newNoteText').value.trim();
        if (!noteText) {
            this.showMessage('Please enter a note.', 'error');
            return;
        }

        if (!this.currentClient.notes) {
            this.currentClient.notes = [];
        }

        this.currentClient.notes.push({
            content: noteText,
            date: new Date().toISOString()
        });

        this.saveClients();
        this.showNotesModal(); // Refresh the modal
        this.showNotesButton(); // Update button text
        this.showMessage('Note added successfully!', 'success');
    }

    // Remove note
    removeNote(index) {
        if (this.currentClient && this.currentClient.notes) {
            this.currentClient.notes.splice(index, 1);
            this.saveClients();
            this.showNotesModal(); // Refresh the modal
            this.showNotesButton(); // Update button text
            this.showMessage('Note removed successfully!', 'success');
        }
    }

    // Show message
    showMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.getElementById('clientMessage');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'clientMessage';
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

    // Get client data for templates
    getClientData() {
        return this.currentClient;
    }

    // Get attorney/firm data for templates (delegates to user manager)
    getAttorneyData() {
        return this.getFirmData();
    }

    // Populate attorney fields in form
    populateAttorneyFields() {
        const firmData = this.getFirmData();
        
        // Find and populate attorney name fields
        const attorneyFields = document.querySelectorAll('[data-field="attorneyName"], [data-field="attorney_name"]');
        attorneyFields.forEach(field => {
            if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                field.value = firmData.attorneyName;
            } else {
                field.textContent = firmData.attorneyName;
            }
        });

        // Find and populate firm fields
        const firmFields = document.querySelectorAll('[data-field="firmName"], [data-field="firm_name"]');
        firmFields.forEach(field => {
            if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                field.value = firmData.firmName;
            } else {
                field.textContent = firmData.firmName;
            }
        });

        // Populate other firm data fields
        Object.keys(firmData).forEach(key => {
            const fields = document.querySelectorAll(`[data-field="${key}"]`);
            fields.forEach(field => {
                if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                    field.value = firmData[key];
                } else {
                    field.textContent = firmData[key];
                }
            });
        });
    }
}

// Initialize client manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.clientManager = new ClientMatterManager();
});
