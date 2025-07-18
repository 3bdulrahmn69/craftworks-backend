import { ActionLogService } from '../src/services/actionLog.service.js';
import { connectDatabase } from '../src/config/database.js';
import { ActionLog } from '../src/models/actionLog.model.js';
import mongoose from 'mongoose';

/**
 * Script to initialize the logging system with sample data
 * Run with: npm run init-logs
 */

async function initializeLoggingSystem() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDatabase();
    console.log('✅ Database connected');

    console.log('🔄 Creating sample log entries...');

    // Sample log entries for demonstration
    const sampleLogs = [
      {
        userId: '507f1f77bcf86cd799439011',
        userEmail: 'admin@craftworks.com',
        userName: 'Admin User',
        userRole: 'admin',
        action: 'login',
        category: 'auth',
        details: {
          email: 'admin@craftworks.com',
          loginMethod: 'email',
        },
        ipAddress: '192.168.1.100',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: true,
        timestamp: new Date('2025-07-14T08:00:00Z'),
      },
      {
        userId: '507f1f77bcf86cd799439012',
        userEmail: 'john@example.com',
        userName: 'John Doe',
        userRole: 'client',
        action: 'register',
        category: 'auth',
        details: {
          email: 'john@example.com',
          loginMethod: 'email',
        },
        ipAddress: '192.168.1.101',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: true,
        timestamp: new Date('2025-07-14T09:15:00Z'),
      },
      {
        userEmail: 'hacker@evil.com',
        action: 'login_failed',
        category: 'auth',
        details: {
          email: 'hacker@evil.com',
          loginMethod: 'email',
        },
        ipAddress: '10.0.0.100',
        userAgent: 'curl/7.68.0',
        success: false,
        errorMessage: 'Invalid credentials',
        timestamp: new Date('2025-07-14T10:30:00Z'),
      },
      {
        userId: '507f1f77bcf86cd799439013',
        userEmail: 'craftsman@example.com',
        userName: 'Jane Smith',
        userRole: 'craftsman',
        action: 'login',
        category: 'auth',
        details: {
          email: 'craftsman@example.com',
          loginMethod: 'email',
        },
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
        success: true,
        timestamp: new Date('2025-07-14T11:45:00Z'),
      },
      {
        userId: '507f1f77bcf86cd799439011',
        userEmail: 'admin@craftworks.com',
        userName: 'Admin User',
        userRole: 'admin',
        action: 'view_logs',
        category: 'system',
        details: {
          query: { category: 'auth', limit: 50 },
          resultCount: 25,
        },
        ipAddress: '192.168.1.100',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: true,
        timestamp: new Date('2025-07-14T12:00:00Z'),
      },
      {
        userId: '507f1f77bcf86cd799439012',
        userEmail: 'john@example.com',
        userName: 'John Doe',
        userRole: 'client',
        action: 'update_profile',
        category: 'user_management',
        details: {
          fieldsUpdated: ['fullName', 'phone'],
        },
        ipAddress: '192.168.1.101',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: true,
        timestamp: new Date('2025-07-14T13:20:00Z'),
      },
      // Add some failed attempts for demonstration
      {
        userEmail: 'test@example.com',
        action: 'login_failed',
        category: 'auth',
        details: {
          email: 'test@example.com',
          loginMethod: 'email',
        },
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        success: false,
        errorMessage: 'Account not found',
        timestamp: new Date('2025-07-14T14:10:00Z'),
      },
      {
        userId: '507f1f77bcf86cd799439013',
        userEmail: 'craftsman@example.com',
        userName: 'Jane Smith',
        userRole: 'craftsman',
        action: 'logout',
        category: 'auth',
        details: {},
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
        success: true,
        timestamp: new Date('2025-07-14T15:30:00Z'),
      },
    ];

    // Insert sample logs
    await ActionLog.insertMany(sampleLogs);
    console.log(`✅ Created ${sampleLogs.length} sample log entries`);

    // Test the ActionLogService
    console.log('🔄 Testing ActionLogService...');

    // Test logging a new action
    await ActionLogService.logAction({
      action: 'system_init',
      category: 'system',
      details: {
        message: 'Logging system initialized successfully',
        sampleDataCount: sampleLogs.length,
      },
      success: true,
    });
    console.log('✅ ActionLogService test successful');

    // Display some statistics
    console.log('🔄 Generating statistics...');
    const stats = await ActionLogService.getActionStats();
    console.log('📊 Current Statistics:');
    console.log(`   Total Actions: ${stats.overview.totalActions}`);
    console.log(`   Success Rate: ${stats.overview.successRate.toFixed(1)}%`);
    console.log(
      `   Categories: ${stats.categoryBreakdown.map((c) => c._id).join(', ')}`
    );

    // Test retrieval
    console.log('🔄 Testing log retrieval...');
    const logs = await ActionLogService.getActionLogs({
      category: 'auth',
      page: 1,
      limit: 5,
    });
    console.log(`✅ Retrieved ${logs.logs.length} auth logs`);

    console.log('\n🎉 Logging system initialization complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start your server: npm run dev');
    console.log('   2. Login as admin to get a JWT token');
    console.log('   3. Access logs at: GET /api/logs');
    console.log('   4. View documentation in LOGGING.md and API_EXAMPLES.md');
  } catch (error) {
    console.error('❌ Error initializing logging system:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
}

// Run the initialization
initializeLoggingSystem();
