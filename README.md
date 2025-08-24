# 💰 Yen Budget Manager

A modern, offline-first budget management application built with Node.js, Express, SQLite, and vanilla JavaScript. Track your expenses, manage budgets, and gain insights into your spending habits.

## ✨ Features

- **📊 Dashboard**: Visual overview of your financial data with charts and statistics
- **💳 Transaction Management**: Add, edit, and categorize income/expenses
- **🏷️ Category Management**: Create and manage custom spending categories
- **💰 Budget Tracking**: Set monthly budgets and track spending against them
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🌙 Dark/Light Theme**: Toggle between themes for comfortable viewing
- **📤 Data Export**: Export your data in JSON, CSV, and Excel formats
- **💾 Local Database**: SQLite database for reliable data storage
- **🔒 Offline-First**: Works without internet connection
- **⚡ Real-time Updates**: Instant feedback and data synchronization

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/yen-budget-manager.git
   cd yen-budget-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🛠️ Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Project Structure

```
yen-budget-manager/
├── server.js              # Express server and API endpoints
├── index.html             # Main application HTML
├── style.css              # Application styles
├── script.js              # Frontend JavaScript logic
├── package.json           # Dependencies and scripts
├── vercel.json            # Vercel deployment configuration
├── env.example            # Environment variables template
├── data/                  # SQLite database files
└── README.md              # This file
```

### API Endpoints

#### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `DELETE /api/categories/:id` - Delete category

#### Transactions
- `GET /api/transactions` - Get transactions (with optional filters)
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

#### Budgets
- `GET /api/budgets` - Get budgets (with optional month filter)
- `POST /api/budgets` - Create/update budget

#### Settings
- `GET /api/settings` - Get application settings
- `POST /api/settings` - Update settings

#### Export
- `GET /api/export/json` - Export all data as JSON
- `GET /api/export/csv` - Export transactions as CSV

## 🗄️ Database Schema

### Categories Table
- `id` - Primary key
- `name` - Category name (unique)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Transactions Table
- `id` - Primary key
- `date` - Transaction date
- `type` - Transaction type (income/expense)
- `category` - Category name
- `amount` - Transaction amount
- `note` - Optional note
- `recurring` - Recurring transaction flag
- `next_date` - Next occurrence date
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Budgets Table
- `id` - Primary key
- `category` - Category name
- `amount` - Budget amount
- `month` - Budget month (YYYY-MM format)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Settings Table
- `id` - Primary key
- `key` - Setting key (unique)
- `value` - Setting value (JSON string)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard**
   - Go to your project settings
   - Add environment variables from your `.env` file

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Upload files to your hosting provider**
   - Ensure Node.js 18+ is supported
   - Set environment variables
   - Configure your domain

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `DB_PATH` | Database file path | ./data/budget.db |
| `JWT_SECRET` | JWT signing secret | (required) |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- --testNamePattern="Category Management"
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Database powered by [SQLite](https://www.sqlite.org/)
- Charts rendered with [Chart.js](https://www.chartjs.org/)
- Icons from [Emoji](https://emojipedia.org/)

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/yen-budget-manager/issues) page
2. Create a new issue with detailed information
3. Include your Node.js version and operating system

---

**Made with ❤️ for better financial management**
# expesnsetracker
