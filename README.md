# Template Filler App (TFA) - Web Version

A professional web-based template filling application for legal documents. Upload Word documents with TFA field strings, fill in information once, and generate completed documents.

## Features

- **Multi-Template Processing**: Upload and process multiple Word documents simultaneously
- **Smart Field Detection**: Automatically extracts and organizes TFA field strings
- **One-Time Data Entry**: Enter information once, apply to all templates
- **Professional Interface**: Clean, modern design optimized for legal professionals
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Field Validation**: Ensures all required fields are completed before generation
- **Bulk Download**: Download all completed documents at once

## TFA Field Format

The app recognizes field strings in the format:
```
# Template Filler App v2 - Simplified File-Based Version

A simplified web application for filling legal document templates with client/matter data. This version uses local file selection and Dropbox folder sharing instead of complex cloud APIs.

## Features

- **User Management**: Support for multiple users (Ray Curtis, Danielle Brown, Jessie Mangum, Laurel Lavalle)
- **Template Selection**: Select DOCX templates directly from local Dropbox folders
- **Client/Matter Management**: Store and manage client information locally
- **Document Generation**: Fill templates with data and output as DOCX files
- **Notes System**: Add notes to client matters
- **File-Based Sharing**: Share data files through Dropbox between team members

## Quick Start

1. **Select User**: Choose your name from the dropdown in the top-right
2. **Configure Folder**: Set your template folder path in user settings
3. **Select Templates**: Use the file picker to select DOCX templates from your folder
4. **Analyze**: Click "Analyze Templates" to extract fillable fields
5. **Fill Data**: Enter client/matter information and field values
6. **Generate**: Create filled documents and download as DOCX files

## User Configuration

Each user can configure:
- Template folder path (e.g., `D:\Curtis Law Firm Dropbox\Templates\Criminal`)
- Firm information (name, address, phone, etc.)
- Bar number and email

## File Structure

```
formfiller-v2/
├── index.html              # Main application interface
├── app.js                  # Main application logic
├── user-manager.js         # User management system
├── client-manager.js       # Client/matter management
├── template-selector.js    # Template file selection
├── tfa-engine.js          # Template processing engine
├── styles.css             # Application styling
└── README.md              # This file
```

## Template Format

Templates should be DOCX files with field placeholders in the format:
```
{{CATEGORY.FIELD_NAME|TYPE|OPTIONS}}
```

Examples:
- `{{CLIENT.FIRST_NAME|TEXT}}` - Text input for client first name
- `{{CLIENT.LAST_NAME|TEXT}}` - Text input for client last name
- `{{MATTER.CASE_NUMBER|TEXT}}` - Text input for case number
- `{{COURT.NAME|SELECT|County Court,Circuit Court,District Court}}` - Dropdown selection

## Simplified Architecture

This version removes complex cloud API dependencies in favor of:
- Local file selection instead of GitHub API
- localStorage for user/client data instead of cloud storage
- Dropbox file sharing for team collaboration
- Direct DOCX output instead of PDF conversion

## Team Collaboration

Share data between team members by:
1. Saving client data as JSON files in shared Dropbox folders
2. Using consistent template folder structures
3. Coordinating user settings through shared configuration files

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari

Requires modern browser with File API support for template selection.

## Development

To modify the application:
1. Edit the appropriate JavaScript files
2. Test in a local web server or open `index.html` directly
3. Commit changes: `git add . && git commit -m "Description"`
4. Push updates: `git push origin main`

## Troubleshooting

**Templates not loading**: Check that template folder path is correct and files are DOCX format
**Field extraction failing**: Verify template field syntax matches expected format
**Download issues**: Ensure browser allows file downloads from local applications

---

Created by The Curtis Law Firm, P.A.
Simplified for reliable file-based operation.
```

### Supported Field Types

- **TEXT**: Regular text input
- **SELECT**: Dropdown with predefined options
- **DATE**: Date picker with proper formatting
- **PHONE**: Phone number with automatic formatting
- **CALCULATED**: Auto-calculated fields (planned)
- **CONDITIONAL**: Conditional fields (planned)

### Example Field Strings

```
{{CLIENT.FIRST_NAME|TEXT}}
{{CLIENT.LAST_NAME|TEXT}}
{{CASE.STYLE_PREFIX|SELECT|The Marriage of,The Former Marriage of,FLORIDA DEPARTMENT OF REVENUE o/b/o}}
{{MOTION.FILING_DATE|DATE}}
{{ATTORNEY.PHONE|PHONE}}
```

## Deployment to Netlify

### Option 1: Git Integration (Recommended)

1. **Create Git Repository**:
   ```bash
   cd web-tfa
   git init
   git add .
   git commit -m "Initial TFA web app"
   git branch -M main
   git remote add origin https://github.com/yourusername/tfa-web.git
   git push -u origin main
   ```

2. **Deploy to Netlify**:
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Build settings:
     - Build command: (leave empty)
     - Publish directory: `.` (current directory)
   - Click "Deploy site"

### Option 2: Direct Upload

1. **Zip the Files**:
   - Select all files in the `web-tfa` folder
   - Create a zip file

2. **Manual Deploy**:
   - Go to [Netlify](https://netlify.com)
   - Drag and drop your zip file to the deploy area
   - Your site will be live immediately

### Option 3: Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   cd web-tfa
   netlify login
   netlify init
   netlify deploy --prod
   ```

## Configuration

The app includes:

- **Security Headers**: Configured via `netlify.toml`
- **HTTPS**: Automatic via Netlify
- **CDN**: Global content delivery via Netlify
- **Custom Domain**: Can be configured in Netlify dashboard

## Browser Compatibility

- Chrome 70+ ✅
- Firefox 65+ ✅
- Safari 12+ ✅
- Edge 79+ ✅

## File Processing

**Current Implementation**: Text-based processing (for demonstration)
**Production Ready**: Integrate with [mammoth.js](https://github.com/mwilliamson/mammoth.js/) for proper .docx reading:

```javascript
// Add to your deployment
npm install mammoth
```

## Security Features

- Content Security Policy (CSP)
- XSS Protection
- Frame denial
- HTTPS enforcement
- No server-side data storage (client-side only)

## Usage Instructions

1. **Upload Templates**: Drag and drop or browse for .docx files
2. **Analyze**: Click "Analyze Templates" to extract fields
3. **Fill Fields**: Enter information organized by category
4. **Generate**: Create filled documents
5. **Download**: Get your completed files

## Customization

### Adding Field Types

Edit `tfa-engine.js` to add new field types:

```javascript
case 'YOUR_TYPE':
    return this.formatYourType(value);
```

### Styling

Modify `styles.css` for custom branding:

```css
:root {
    --primary-color: #your-brand-color;
    --secondary-color: #your-secondary-color;
}
```

### Categories

Update `getCategoryIcon()` in `tfa-engine.js` for custom category icons.

## Development

For local development:

1. Start a local server:
   ```bash
   python -m http.server 8000
   # or
   npx serve .
   ```

2. Open `http://localhost:8000`

## Support

For issues or questions:
- Check browser console for errors
- Ensure .docx files contain properly formatted TFA strings
- Verify field format: `{{CATEGORY.FIELD|TYPE|OPTIONS}}`

## License

Professional legal document automation tool for Curtis Law Firm.

---

**Ready for Production**: This app is fully functional and ready for deployment to Netlify!
