# MediSure AI

A modern, interactive web application for uploading PDF documents and asking AI-powered questions about their content. Built with React, TypeScript, and Tailwind CSS.

## Features

### 🔧 Core Functionality
- **PDF Upload**: Drag-and-drop or click to upload PDF files (up to 10MB)
- **PDF Selection**: Dynamic dropdown to choose from uploaded PDFs
- **AI Chat Interface**: Ask questions about your PDF content and get intelligent responses
- **Real-time Updates**: PDF list automatically refreshes after uploads

### 🎨 User Experience
- **Modern Design**: Beautiful glass morphism effects with gradient backgrounds
- **Responsive Layout**: Optimized for mobile, tablet, and desktop devices
- **Interactive Elements**: Smooth animations, hover states, and micro-interactions
- **Toast Notifications**: Real-time feedback for all user actions
- **Loading States**: Clear indicators for ongoing operations

### 🔒 Reliability
- **Error Handling**: Comprehensive error management with user-friendly messages
- **Input Validation**: File type and size validation before upload
- **State Management**: Clean state handling with React hooks
- **API Integration**: Robust integration with FastAPI backend

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom animations
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Package Manager**: npm

## API Integration

The application integrates with a FastAPI backend through these endpoints:

- `POST /upload` - Upload PDF files
- `GET /pdflist` - Retrieve list of available PDFs  
- `POST /ask` - Ask questions about a specific PDF

## Environment Setup

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
```

## Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   2.1. **If permission error run this**:
      ```chmod +x node_modules/.bin/vite
      and then run   npm run dev
3. **Build for Production**:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/           # React components
│   ├── FileUploader.tsx   # PDF upload functionality
│   ├── PDFSelector.tsx    # PDF selection dropdown
│   ├── ChatBox.tsx        # Chat interface
│   ├── Toast.tsx          # Toast notification component
│   └── ToastContainer.tsx # Toast management
├── hooks/               # Custom React hooks
│   └── useToast.ts       # Toast notification hook
├── services/            # API services
│   └── api.ts            # API client and endpoints
├── types/               # TypeScript type definitions
│   └── index.ts          # Shared types
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles and animations
```

## Key Components

### FileUploader
- Drag-and-drop file upload
- File validation (PDF only, max 10MB)
- Upload progress feedback
- Upload guidelines display

### PDFSelector  
- Dynamic dropdown of available PDFs
- Loading states and error handling
- Selected PDF confirmation
- Available PDFs list view

### ChatBox
- Interactive chat interface
- Pre-filled example questions
- Message history with timestamps
- Copy functionality for responses
- Loading indicators during API calls

## Usage Flow

1. **Upload PDF**: Drag and drop or click to select a PDF file
2. **Select PDF**: Choose from the dropdown of uploaded PDFs
3. **Ask Questions**: Type questions or click example prompts
4. **View Responses**: See AI-generated answers in the chat interface

## Error Handling

- **Network Errors**: Automatic retry suggestions and clear error messages
- **File Validation**: Immediate feedback for invalid file types/sizes
- **API Errors**: User-friendly error messages with suggested actions
- **State Errors**: Graceful handling of invalid states

## Performance Features

- **Optimized Renders**: Proper React key usage and memo optimization
- **Lazy Loading**: Components load as needed
- **Efficient State Updates**: Minimized re-renders with proper dependency arrays
- **Image Optimization**: External images loaded from CDN sources

## Accessibility

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators and logical tab order
- **Color Contrast**: WCAG compliant color combinations

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.