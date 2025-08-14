// User Management System for Template Filler App
class UserManager {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.templateFolderPath = null;
        this.initializeEventListeners();
        this.initializeUserSelection();
    }

    // Predefined users
    getDefaultUsers() {
        return {
            'ray_curtis': {
                id: 'ray_curtis',
                name: 'Ray Curtis',
                barNumber: 'Fla. Bar No. 0043636',
                email: 'efile@thecurtislawfirm.com',
                phone: '(850) 584-5299',
                firmName: 'The Curtis Law Firm, P.A.',
                firmAddress: '103 N. Jefferson Street, Perry, FL 32347',
                firmPhone: '(850) 584-5299',
                firmFax: '(850) 290-7448'
            },
            'danielle_brown': {
                id: 'danielle_brown',
                name: 'Danielle Brown',
                barNumber: '',
                email: '',
                phone: '',
                firmName: 'The Curtis Law Firm, P.A.',
                firmAddress: '103 N. Jefferson Street, Perry, FL 32347',
                firmPhone: '(850) 584-5299',
                firmFax: '(850) 290-7448'
            },
            'jessie_mangum': {
                id: 'jessie_mangum',
                name: 'Jessie Mangum',
                barNumber: '',
                email: '',
                phone: '',
                firmName: 'The Curtis Law Firm, P.A.',
                firmAddress: '103 N. Jefferson Street, Perry, FL 32347',
                firmPhone: '(850) 584-5299',
                firmFax: '(850) 290-7448'
            },
            'laurel_lavalle': {
                id: 'laurel_lavalle',
                name: 'Laurel Lavalle',
                barNumber: '',
                email: '',
                phone: '',
                firmName: 'The Curtis Law Firm, P.A.',
                firmAddress: '103 N. Jefferson Street, Perry, FL 32347',
                firmPhone: '(850) 584-5299',
                firmFax: '(850) 290-7448'
            }
        };
    }

    // Load users from localStorage
    loadUsers() {
        const saved = localStorage.getItem('tfa_users');
        const defaultUsers = this.getDefaultUsers();
        
        if (saved) {
            const savedUsers = JSON.parse(saved);
            // Merge with defaults to ensure all predefined users exist
            return { ...defaultUsers, ...savedUsers };
        }
        
        return defaultUsers;
    }

    // Save users to localStorage
    saveUsers() {
        localStorage.setItem('tfa_users', JSON.stringify(this.users));
    }

    // Load current user selection
    loadCurrentUser() {
        const savedUserId = localStorage.getItem('tfa_current_user');
        if (savedUserId && this.users[savedUserId]) {
            return this.users[savedUserId];
        }
        return null;
    }

    // Save current user selection
    saveCurrentUser() {
        if (this.currentUser) {
            localStorage.setItem('tfa_current_user', this.currentUser.id);
        }
    }

    // Load template folder path
    loadTemplateFolderPath() {
        return localStorage.getItem('tfa_template_folder_path') || '';
    }

    // Save template folder path
    saveTemplateFolderPath(path) {
        this.templateFolderPath = path;
        localStorage.setItem('tfa_template_folder_path', path);
    }

    // Initialize user selection
    initializeUserSelection() {
        const userSelect = document.getElementById('userSelect');
        const savedUser = this.loadCurrentUser();
        const savedPath = this.loadTemplateFolderPath();
        
        if (savedUser) {
            this.currentUser = savedUser;
            userSelect.value = savedUser.id;
            this.showUserSettingsButton();
        }
        
        if (savedPath) {
            this.templateFolderPath = savedPath;
        }
    }

    // Initialize event listeners
    initializeEventListeners() {
        // User selection dropdown
        document.getElementById('userSelect').addEventListener('change', (e) => {
            this.handleUserSelection(e.target.value);
        });

        // User settings modal events
        document.getElementById('userSettingsBtn').addEventListener('click', () => {
            this.showUserModal();
        });

        document.getElementById('userModalClose').addEventListener('click', () => {
            this.hideUserModal();
        });

        document.getElementById('userModalCancel').addEventListener('click', () => {
            this.hideUserModal();
        });

        document.getElementById('userModalSave').addEventListener('click', () => {
            this.saveUserSettings();
        });

        // Browse folder button
        document.getElementById('browseFolderBtn').addEventListener('click', () => {
            this.browseForFolder();
        });
    }

    // Handle user selection
    handleUserSelection(userId) {
        if (userId === 'add_edit_user') {
            this.showUserModal(true); // true = add new user mode
            return;
        }

        if (userId && this.users[userId]) {
            this.currentUser = this.users[userId];
            this.saveCurrentUser();
            this.showUserSettingsButton();
            
            // Trigger event for other components
            document.dispatchEvent(new CustomEvent('userChanged', {
                detail: { user: this.currentUser }
            }));
        } else {
            this.currentUser = null;
            this.hideUserSettingsButton();
        }
    }

    // Show/hide user settings button
    showUserSettingsButton() {
        document.getElementById('userSettingsBtn').style.display = 'inline-block';
    }

    hideUserSettingsButton() {
        document.getElementById('userSettingsBtn').style.display = 'none';
    }

    // Show user modal
    showUserModal(isNewUser = false) {
        const modal = document.getElementById('userModal');
        
        if (isNewUser) {
            // Clear form for new user
            document.getElementById('userForm').reset();
            document.getElementById('templateFolderPath').value = this.templateFolderPath || '';
        } else if (this.currentUser) {
            // Populate form with current user data
            document.getElementById('userName').value = this.currentUser.name || '';
            document.getElementById('userBarNumber').value = this.currentUser.barNumber || '';
            document.getElementById('userEmail').value = this.currentUser.email || '';
            document.getElementById('userPhone').value = this.currentUser.phone || '';
            document.getElementById('firmName').value = this.currentUser.firmName || '';
            document.getElementById('firmAddress').value = this.currentUser.firmAddress || '';
            document.getElementById('firmPhone').value = this.currentUser.firmPhone || '';
            document.getElementById('firmFax').value = this.currentUser.firmFax || '';
            document.getElementById('templateFolderPath').value = this.templateFolderPath || '';
        }

        modal.style.display = 'block';
    }

    // Hide user modal
    hideUserModal() {
        document.getElementById('userModal').style.display = 'none';
        
        // Reset user selection if it was "add_edit_user"
        const userSelect = document.getElementById('userSelect');
        if (userSelect.value === 'add_edit_user') {
            userSelect.value = this.currentUser ? this.currentUser.id : '';
        }
    }

    // Save user settings
    saveUserSettings() {
        const name = document.getElementById('userName').value.trim();
        const folderPath = document.getElementById('templateFolderPath').value.trim();

        if (!name) {
            this.showMessage('Please enter a name.', 'error');
            return;
        }

        if (!folderPath) {
            this.showMessage('Please select a template folder.', 'error');
            return;
        }

        // Create or update user
        const userId = this.generateUserId(name);
        const userData = {
            id: userId,
            name: name,
            barNumber: document.getElementById('userBarNumber').value.trim(),
            email: document.getElementById('userEmail').value.trim(),
            phone: document.getElementById('userPhone').value.trim(),
            firmName: document.getElementById('firmName').value.trim(),
            firmAddress: document.getElementById('firmAddress').value.trim(),
            firmPhone: document.getElementById('firmPhone').value.trim(),
            firmFax: document.getElementById('firmFax').value.trim()
        };

        // Save user data
        this.users[userId] = userData;
        this.saveUsers();

        // Save template folder path
        this.saveTemplateFolderPath(folderPath);

        // Set as current user
        this.currentUser = userData;
        this.saveCurrentUser();

        // Update dropdown if it's a new user
        this.updateUserDropdown();

        // Select the user in dropdown
        document.getElementById('userSelect').value = userId;
        this.showUserSettingsButton();

        this.hideUserModal();
        this.showMessage('User settings saved successfully!', 'success');

        // Trigger event for other components
        document.dispatchEvent(new CustomEvent('userChanged', {
            detail: { user: this.currentUser }
        }));
    }

    // Generate user ID from name
    generateUserId(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    // Update user dropdown with custom users
    updateUserDropdown() {
        const userSelect = document.getElementById('userSelect');
        const defaultOptions = userSelect.querySelectorAll('option[value=""], option[value^="ray_"], option[value^="danielle_"], option[value^="jessie_"], option[value^="laurel_"], option[value="add_edit_user"]');
        
        // Remove any custom user options
        const customOptions = userSelect.querySelectorAll('option:not([value=""]):not([value^="ray_"]):not([value^="danielle_"]):not([value^="jessie_"]):not([value^="laurel_"]):not([value="add_edit_user"])');
        customOptions.forEach(option => option.remove());

        // Add custom users before the "add_edit_user" option
        const addEditOption = userSelect.querySelector('option[value="add_edit_user"]');
        
        Object.values(this.users).forEach(user => {
            // Skip if it's a default user
            if (['ray_curtis', 'danielle_brown', 'jessie_mangum', 'laurel_lavalle'].includes(user.id)) {
                return;
            }

            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            userSelect.insertBefore(option, addEditOption);
        });
    }

    // Browse for folder (will need to be implemented with file system access)
    browseForFolder() {
        // For now, show an input prompt - in a real implementation,
        // you'd use the File System Access API or Electron's dialog
        const path = prompt('Enter the full path to your template folder:', this.templateFolderPath || '');
        if (path !== null) {
            document.getElementById('templateFolderPath').value = path.trim();
        }
    }

    // Show message
    showMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.getElementById('userMessage');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'userMessage';
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

    // Get current user data for templates
    getCurrentUserData() {
        return this.currentUser;
    }

    // Get template folder path
    getTemplateFolderPath() {
        return this.templateFolderPath;
    }

    // Check if user is properly configured
    isConfigured() {
        return this.currentUser && this.templateFolderPath;
    }
}

// Initialize user manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.userManager = new UserManager();
});
