# FileFlip - File Conversion Web Application

A modern, responsive web application for converting files between different formats. Built with React, TypeScript, and Tailwind CSS.

## Features

- **File Conversion**: Convert between multiple file formats (PDF, EPUB, images)
- **User Authentication**: Secure login and registration with Supabase
- **Pricing Plans**: Free and Pro subscription plans
- **Paystack Integration**: Secure payment processing for Pro subscriptions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, intuitive interface with dark/light mode support

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI
- **State Management**: React Context API
- **Authentication**: Supabase
- **Payments**: Paystack
- **Database**: Supabase PostgreSQL

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fileflip
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

## Deployment

### Render.com

This application is configured for deployment on Render.com:

1. Connect your GitHub repository to Render.com
2. Create a new Web Service
3. Select your repository
4. Set the build command: `npm run build`
5. Set the start command: `npm run preview`
6. Configure environment variables in the Render dashboard

### Environment Variables for Production

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Payment Integration

The application uses Paystack for payment processing. When users click "Upgrade Now", they are redirected to the Paystack payment page:

```
https://paystack.com/buy/fileflip-pro-odyigw
```

## Project Structure

```
src/
├── app/                    # Main application components
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── routes.tsx         # Route definitions
│   └── App.tsx            # Main app component
├── styles/                # CSS and styling
├── config/                # Configuration files
└── contexts/              # React contexts
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Contact

For support and questions:
- Email: senayonagboyinu@gmail.com
- Website: [fileflip.com](https://fileflip.com)