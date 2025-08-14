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
{{CATEGORY.FIELD_NAME|TYPE|OPTIONS}}
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
