# 🚀 Deployment Guide

## GitHub Repository Setup

### 1. Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit: Yen Budget Manager with Node.js backend"
```

### 2. Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it: `yen-budget-manager`
3. Make it public or private (your choice)
4. Don't initialize with README (we already have one)

### 3. Connect and Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/yen-budget-manager.git
git branch -M main
git push -u origin main
```

## Vercel Deployment

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy to Vercel
```bash
vercel
```

Follow the prompts:
- Set up and deploy: `Y`
- Which scope: Select your account
- Link to existing project: `N`
- Project name: `yen-budget-manager`
- Directory: `./` (current directory)
- Override settings: `N`

### 3. Set Environment Variables in Vercel
Go to your Vercel dashboard:
1. Select your project
2. Go to Settings → Environment Variables
3. Add the following variables:
   ```
   NODE_ENV=production
   JWT_SECRET=your-production-secret-key
   ```

### 4. Custom Domain (Optional)
1. Go to Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Environment Variables

### Development (.env file)
```env
PORT=3000
NODE_ENV=development
DB_PATH=./data/budget.db
JWT_SECRET=dev-secret-key
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

### Production (Vercel)
```env
NODE_ENV=production
JWT_SECRET=your-production-secret-key
```

## Database Setup

### Local Development
- SQLite database is automatically created in `./data/budget.db`
- Tables are created automatically on first run

### Production (Vercel)
- Vercel uses serverless functions
- Each function gets its own database instance
- Data persists between function calls within the same deployment

## Testing Deployment

### 1. Test API Endpoints
```bash
# Health check
curl https://your-app.vercel.app/api/health

# Get categories
curl https://your-app.vercel.app/api/categories

# Create a category
curl -X POST https://your-app.vercel.app/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Food"}'
```

### 2. Test Frontend
- Open your Vercel URL in a browser
- Test all functionality
- Verify database operations work

## Continuous Deployment

### GitHub Actions (Already Configured)
- Automatic testing on push/PR
- Automatic deployment to Vercel on main branch
- Code quality checks with ESLint

### Manual Deployment
```bash
vercel --prod
```

## Monitoring and Maintenance

### 1. Vercel Analytics
- View deployment status
- Monitor function performance
- Check error logs

### 2. Database Backup
- Export data regularly using `/api/export/json`
- Store backups securely

### 3. Updates
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Deploy updates
vercel --prod
```

## Troubleshooting

### Common Issues

#### 1. Build Failures
- Check Node.js version (requires 18+)
- Verify all dependencies are installed
- Check for syntax errors

#### 2. Database Errors
- Ensure data directory exists
- Check file permissions
- Verify SQLite is working

#### 3. CORS Issues
- Check CORS configuration in server.js
- Verify frontend URL matches CORS settings

#### 4. Environment Variables
- Ensure all required variables are set in Vercel
- Check variable names match exactly

### Getting Help
1. Check Vercel function logs
2. Review GitHub Actions logs
3. Test locally first
4. Check browser console for frontend errors

## Security Considerations

### 1. Environment Variables
- Never commit `.env` files
- Use strong JWT secrets in production
- Rotate secrets regularly

### 2. API Security
- Rate limiting is enabled
- Input validation on all endpoints
- SQL injection protection via parameterized queries

### 3. CORS
- Configured for production use
- Restrict to necessary origins only

## Performance Optimization

### 1. Database
- Indexes on frequently queried columns
- Efficient query patterns
- Connection pooling (handled by Vercel)

### 2. Frontend
- Minified CSS/JS in production
- Efficient DOM manipulation
- Local storage for offline functionality

---

**🎉 Your Yen Budget Manager is now ready for production!**
