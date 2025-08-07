import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/craftworks';

import { User } from './models/user.model.js';
import { Job } from './models/job.model.js';
import { Quote } from './models/quote.model.js';
import { Invitation } from './models/invitation.model.js';
import { Notification } from './models/notification.model.js';
import { Service } from './models/service.model.js';
import Message from './models/message.model.js';
import Chat from './models/chat.model.js';
import { ActionLog } from './models/actionLog.model.js';

async function seed() {
  try {
    console.log('🚀 Starting seed process...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear ALL collections first
    console.log('🧹 Clearing all collections...');
    await Promise.all([
      User.deleteMany({}),
      Job.deleteMany({}),
      Quote.deleteMany({}),
      Invitation.deleteMany({}),
      Notification.deleteMany({}),
      Service.deleteMany({}),
      Message.deleteMany({}),
      Chat.deleteMany({}),
      ActionLog.deleteMany({}),
    ]);
    console.log('✅ All collections cleared successfully');

    // Create services with multilingual support and images
    console.log('🔧 Creating services...');
    const services = await Service.insertMany([
      {
        name: {
          en: 'Plumbing',
          ar: 'السباكة',
        },
        description: {
          en: 'Professional plumbing services including pipe repairs, installations, and maintenance',
          ar: 'خدمات سباكة احترافية تشمل إصلاح الأنابيب والتركيبات والصيانة',
        },
        image:
          'https://res.cloudinary.com/craftworks/image/upload/v1/services/plumbing.jpg',
      },
      {
        name: {
          en: 'Electrical',
          ar: 'الكهرباء',
        },
        description: {
          en: 'Licensed electrical services for wiring, repairs, and smart home installations',
          ar: 'خدمات كهربائية مرخصة للأسلاك والإصلاحات وتركيبات المنزل الذكي',
        },
        image:
          'https://res.cloudinary.com/craftworks/image/upload/v1/services/electrical.jpg',
      },
      {
        name: {
          en: 'Painting',
          ar: 'الطلاء',
        },
        description: {
          en: 'Interior and exterior painting services with premium quality materials',
          ar: 'خدمات طلاء داخلي وخارجي بمواد عالية الجودة',
        },
        image:
          'https://res.cloudinary.com/craftworks/image/upload/v1/services/painting.jpg',
      },
      {
        name: {
          en: 'Carpentry',
          ar: 'النجارة',
        },
        description: {
          en: 'Custom woodwork, furniture repair, and cabinet installation services',
          ar: 'أعمال خشبية مخصصة وإصلاح الأثاث وتركيب الخزائن',
        },
        image:
          'https://res.cloudinary.com/craftworks/image/upload/v1/services/carpentry.jpg',
      },
      {
        name: {
          en: 'HVAC',
          ar: 'التكييف والتهوية',
        },
        description: {
          en: 'Heating, ventilation, and air conditioning installation and maintenance',
          ar: 'تركيب وصيانة أنظمة التدفئة والتهوية وتكييف الهواء',
        },
        image:
          'https://res.cloudinary.com/craftworks/image/upload/v1/services/hvac.jpg',
      },
      {
        name: {
          en: 'Masonry',
          ar: 'البناء',
        },
        description: {
          en: 'Professional masonry work including stonework, brickwork, and concrete',
          ar: 'أعمال بناء احترافية تشمل الأحجار والطوب والخرسانة',
        },
        image:
          'https://res.cloudinary.com/craftworks/image/upload/v1/services/masonry.jpg',
      },
      {
        name: {
          en: 'Cleaning',
          ar: 'التنظيف',
        },
        description: {
          en: 'Comprehensive cleaning services for homes and offices',
          ar: 'خدمات تنظيف شاملة للمنازل والمكاتب',
        },
        image:
          'https://res.cloudinary.com/craftworks/image/upload/v1/services/cleaning.jpg',
      },
      {
        name: {
          en: 'Landscaping',
          ar: 'تنسيق الحدائق',
        },
        description: {
          en: 'Garden design, maintenance, and landscaping services',
          ar: 'تصميم وصيانة وتنسيق الحدائق',
        },
        image:
          'https://res.cloudinary.com/craftworks/image/upload/v1/services/landscaping.jpg',
      },
    ]);
    console.log('✅ Services created successfully');

    // Get service IDs for reference
    const plumbingService = services
      .find((s) => s.name.en === 'Plumbing')
      ?._id.toString();
    const electricalService = services
      .find((s) => s.name.en === 'Electrical')
      ?._id.toString();
    const paintingService = services
      .find((s) => s.name.en === 'Painting')
      ?._id.toString();
    const carpentryService = services
      .find((s) => s.name.en === 'Carpentry')
      ?._id.toString();
    const cleaningService = services
      .find((s) => s.name.en === 'Cleaning')
      ?._id.toString();

    console.log('🆔 Service IDs mapped successfully');

    // Create users with enhanced data
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('123456!Aa', 10);

    const [
      client1,
      client2,
      client3,
      craftsman1,
      craftsman2,
      craftsman3,
      craftsman4,
      craftsman5,
      admin,
      moderator,
    ] = await User.insertMany([
      // Clients
      {
        email: 'client1@example.com',
        phone: '01018326780',
        password: hashedPassword,
        role: 'client',
        fullName: 'Ahmed Mohamed',
        profilePicture:
          'https://res.cloudinary.com/craftworks/image/upload/v1/users/client1.jpg',
        address: {
          country: 'Egypt',
          state: 'Cairo',
          city: 'New Cairo',
          street: '123 Main Street',
        },
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444], // Cairo coordinates
        },
        verificationStatus: 'verified',
        rating: 4.2,
        ratingCount: 15,
        isActive: true,
      },
      {
        email: 'client2@example.com',
        phone: '01018326785',
        password: hashedPassword,
        role: 'client',
        fullName: 'Sara Ali',
        profilePicture:
          'https://res.cloudinary.com/craftworks/image/upload/v1/users/client2.jpg',
        address: {
          country: 'Egypt',
          state: 'Alexandria',
          city: 'Alexandria',
          street: '456 Alexandria Street',
        },
        location: {
          type: 'Point',
          coordinates: [29.9187, 31.2001], // Alexandria coordinates
        },
        verificationStatus: 'verified',
        rating: 4.7,
        ratingCount: 23,
        isActive: true,
      },
      {
        email: 'client3@example.com',
        phone: '01018326786',
        password: hashedPassword,
        role: 'client',
        fullName: 'Omar Hassan',
        profilePicture:
          'https://res.cloudinary.com/craftworks/image/upload/v1/users/client3.jpg',
        address: {
          country: 'Egypt',
          state: 'Giza',
          city: 'Giza',
          street: '789 Pyramid Road',
        },
        location: {
          type: 'Point',
          coordinates: [31.2083, 29.9792], // Giza coordinates
        },
        verificationStatus: 'pending',
        rating: 3.9,
        ratingCount: 8,
        isActive: true,
      },
      // Craftsmen
      {
        email: 'craftsman1@example.com',
        phone: '01018326781',
        password: hashedPassword,
        role: 'craftsman',
        fullName: 'Mahmoud Plumber',
        profilePicture:
          'https://res.cloudinary.com/craftworks/image/upload/v1/users/craftsman1.jpg',
        address: {
          country: 'Egypt',
          state: 'Cairo',
          city: 'Cairo',
          street: '321 Workshop Street',
        },
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444],
        },
        craftsmanInfo: {
          service: plumbingService!,
          bio: 'Experienced plumber with 10+ years in residential and commercial plumbing. Specialized in emergency repairs and installations.',
          portfolioImageUrls: [
            'https://res.cloudinary.com/craftworks/image/upload/v1/portfolio/plumbing1.jpg',
            'https://res.cloudinary.com/craftworks/image/upload/v1/portfolio/plumbing2.jpg',
            'https://res.cloudinary.com/craftworks/image/upload/v1/portfolio/plumbing3.jpg',
          ],
          verificationStatus: 'verified',
          verificationDocs: [],
        },
        wallet: { balance: 12500, withdrawableBalance: 8000 },
        verificationStatus: 'verified',
        rating: 4.8,
        ratingCount: 142,
        isActive: true,
      },
      {
        email: 'craftsman2@example.com',
        phone: '01018326782',
        password: hashedPassword,
        role: 'craftsman',
        fullName: 'Hassan Electrician',
        profilePicture:
          'https://res.cloudinary.com/craftworks/image/upload/v1/users/craftsman2.jpg',
        address: {
          country: 'Egypt',
          state: 'Cairo',
          city: 'Heliopolis',
          street: '654 Electric Avenue',
        },
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444],
        },
        craftsmanInfo: {
          service: electricalService!,
          bio: 'Licensed electrician specializing in home wiring, electrical repairs, and smart home installations.',
          portfolioImageUrls: [
            'https://res.cloudinary.com/craftworks/image/upload/v1/portfolio/electrical1.jpg',
            'https://res.cloudinary.com/craftworks/image/upload/v1/portfolio/electrical2.jpg',
          ],
          verificationStatus: 'verified',
          verificationDocs: [],
        },
        wallet: { balance: 8750, withdrawableBalance: 5200 },
        verificationStatus: 'verified',
        rating: 4.6,
        ratingCount: 89,
        isActive: true,
      },
      {
        email: 'craftsman3@example.com',
        phone: '01018326783',
        password: hashedPassword,
        role: 'craftsman',
        fullName: 'Karim Painter',
        profilePicture:
          'https://res.cloudinary.com/craftworks/image/upload/v1/users/craftsman3.jpg',
        address: {
          country: 'Egypt',
          state: 'Giza',
          city: 'Dokki',
          street: '987 Color Street',
        },
        location: {
          type: 'Point',
          coordinates: [31.2083, 29.9792],
        },
        craftsmanInfo: {
          service: paintingService!,
          bio: 'Professional painter with expertise in interior and exterior painting, wallpaper installation.',
          portfolioImageUrls: [
            'https://res.cloudinary.com/craftworks/image/upload/v1/portfolio/painting1.jpg',
            'https://res.cloudinary.com/craftworks/image/upload/v1/portfolio/painting2.jpg',
            'https://res.cloudinary.com/craftworks/image/upload/v1/portfolio/painting3.jpg',
          ],
          verificationStatus: 'verified',
          verificationDocs: [],
        },
        wallet: { balance: 5400, withdrawableBalance: 3100 },
        verificationStatus: 'verified',
        rating: 4.4,
        ratingCount: 67,
        isActive: true,
      },
      {
        email: 'craftsman4@example.com',
        phone: '01018326784',
        password: hashedPassword,
        role: 'craftsman',
        fullName: 'Mohamed Carpenter',
        profilePicture:
          'https://res.cloudinary.com/craftworks/image/upload/v1/users/craftsman4.jpg',
        address: {
          country: 'Egypt',
          state: 'Alexandria',
          city: 'Alexandria',
          street: '147 Wood Workshop Lane',
        },
        location: {
          type: 'Point',
          coordinates: [29.9187, 31.2001],
        },
        craftsmanInfo: {
          service: carpentryService!,
          bio: 'Master carpenter and mason with 15+ years experience. Custom furniture, kitchen cabinets, and stone work.',
          portfolioImageUrls: [
            'https://res.cloudinary.com/craftworks/image/upload/v1/portfolio/carpentry1.jpg',
            'https://res.cloudinary.com/craftworks/image/upload/v1/portfolio/masonry1.jpg',
          ],
          verificationStatus: 'pending',
          verificationDocs: [],
        },
        wallet: { balance: 15200, withdrawableBalance: 12000 },
        verificationStatus: 'pending',
        rating: 4.9,
        ratingCount: 203,
        isActive: true,
      },
      {
        email: 'craftsman5@example.com',
        phone: '01018326787',
        password: hashedPassword,
        role: 'craftsman',
        fullName: 'Fatma Cleaner',
        profilePicture:
          'https://res.cloudinary.com/craftworks/image/upload/v1/users/craftsman5.jpg',
        address: {
          country: 'Egypt',
          state: 'Cairo',
          city: 'Maadi',
          street: '258 Clean Street',
        },
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444],
        },
        craftsmanInfo: {
          service: cleaningService!,
          bio: 'Professional cleaning and landscaping services with eco-friendly products and techniques.',
          portfolioImageUrls: [
            'https://res.cloudinary.com/craftworks/image/upload/v1/portfolio/cleaning1.jpg',
            'https://res.cloudinary.com/craftworks/image/upload/v1/portfolio/landscaping1.jpg',
          ],
          verificationStatus: 'verified',
          verificationDocs: [],
        },
        wallet: { balance: 3200, withdrawableBalance: 2800 },
        verificationStatus: 'verified',
        rating: 4.5,
        ratingCount: 45,
        isActive: true,
      },
      // Admin
      {
        email: 'admin@craftworks.com',
        phone: '01000000000',
        password: hashedPassword,
        role: 'admin',
        fullName: 'System Administrator',
        profilePicture:
          'https://res.cloudinary.com/craftworks/image/upload/v1/users/admin.jpg',
        verificationStatus: 'verified',
        isActive: true,
      },
      // Moderator
      {
        email: 'moderator@craftworks.com',
        phone: '01000000001',
        password: hashedPassword,
        role: 'moderator',
        fullName: 'Content Moderator',
        profilePicture:
          'https://res.cloudinary.com/craftworks/image/upload/v1/users/moderator.jpg',
        verificationStatus: 'verified',
        isActive: true,
      },
    ]);
    console.log('✅ Users created successfully');

    // Create comprehensive jobs with enhanced data
    console.log('💼 Creating jobs...');
    const jobs = await Job.insertMany([
      {
        title: 'Fix kitchen sink leak',
        description:
          'My kitchen sink has been leaking for 2 days. Need urgent repair. The leak is coming from under the sink and water is dripping constantly.',
        client: client1._id,
        service: plumbingService!,
        address: {
          country: 'Egypt',
          state: 'Cairo',
          city: 'New Cairo',
          street: '123 Main Street, Apt 5A',
        },
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444],
        },
        jobDate: new Date('2024-02-15T10:00:00.000Z'),
        paymentType: 'cash',
        status: 'Posted',
        photos: [
          'https://res.cloudinary.com/craftworks/image/upload/v1/jobs/sink-leak1.jpg',
          'https://res.cloudinary.com/craftworks/image/upload/v1/jobs/sink-leak2.jpg',
        ],
      },
      {
        title: 'Install new electrical outlets',
        description:
          'Need to install 4 new electrical outlets in the living room and bedroom. Prefer smart outlets if possible.',
        client: client2._id,
        service: electricalService!,
        address: {
          country: 'Egypt',
          state: 'Alexandria',
          city: 'Alexandria',
          street: '456 Alexandria Street, Floor 3',
        },
        location: {
          type: 'Point',
          coordinates: [29.9187, 31.2001],
        },
        jobDate: new Date('2024-02-20T14:00:00.000Z'),
        paymentType: 'visa',
        status: 'Hired',
        photos: [
          'https://res.cloudinary.com/craftworks/image/upload/v1/jobs/electrical-work1.jpg',
        ],
      },
      {
        title: 'Paint house exterior',
        description:
          'Need professional painting for the entire exterior of my 2-story house. Looking for weather-resistant paint in white color.',
        client: client3._id,
        service: paintingService!,
        address: {
          country: 'Egypt',
          state: 'Giza',
          city: 'Giza',
          street: '789 Pyramid Road, Villa 12',
        },
        location: {
          type: 'Point',
          coordinates: [31.2083, 29.9792],
        },
        jobDate: new Date('2024-02-25T09:00:00.000Z'),
        paymentType: 'cash',
        status: 'Completed',
        photos: [
          'https://res.cloudinary.com/craftworks/image/upload/v1/jobs/house-exterior1.jpg',
          'https://res.cloudinary.com/craftworks/image/upload/v1/jobs/house-exterior2.jpg',
          'https://res.cloudinary.com/craftworks/image/upload/v1/jobs/house-exterior3.jpg',
        ],
      },
      {
        title: 'Custom kitchen cabinets',
        description:
          'Looking for a skilled carpenter to build custom kitchen cabinets. Modern design with soft-close hinges and drawer slides.',
        client: client1._id,
        service: carpentryService!,
        address: {
          country: 'Egypt',
          state: 'Cairo',
          city: 'New Cairo',
          street: '123 Main Street, Apt 5A',
        },
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444],
        },
        jobDate: new Date('2024-03-01T08:00:00.000Z'),
        paymentType: 'visa',
        status: 'Posted',
        photos: [
          'https://res.cloudinary.com/craftworks/image/upload/v1/jobs/kitchen-design1.jpg',
        ],
      },
      {
        title: 'Office deep cleaning',
        description:
          'Need comprehensive deep cleaning for a 200 sqm office space including carpet cleaning, window cleaning, and sanitization.',
        client: client2._id,
        service: cleaningService!,
        address: {
          country: 'Egypt',
          state: 'Cairo',
          city: 'Downtown',
          street: '789 Business District, Tower A, Floor 15',
        },
        location: {
          type: 'Point',
          coordinates: [31.2357, 30.0444],
        },
        jobDate: new Date('2024-02-18T06:00:00.000Z'),
        paymentType: 'visa',
        status: 'Posted',
        photos: [
          'https://res.cloudinary.com/craftworks/image/upload/v1/jobs/office-space1.jpg',
          'https://res.cloudinary.com/craftworks/image/upload/v1/jobs/office-space2.jpg',
        ],
      },
    ]);
    console.log('✅ Jobs created successfully');

    // Create quotes with price details
    console.log('💰 Creating quotes...');
    const quotes = await Quote.insertMany([
      {
        craftsman: craftsman1._id,
        job: jobs[0]._id,
        client: client1._id,
        price: 250.0,
        notes:
          'I can fix the leak within 2 hours. I will bring all necessary materials and provide 6-month warranty.',
        status: 'Submitted',
      },
      {
        craftsman: craftsman2._id,
        job: jobs[1]._id,
        client: client2._id,
        price: 180.0,
        notes:
          'Smart outlets installation with surge protection. Work will be completed in one day.',
        status: 'Accepted',
      },
      {
        craftsman: craftsman3._id,
        job: jobs[2]._id,
        client: client3._id,
        price: 1200.0,
        notes:
          'Complete exterior painting with premium weather-resistant paint. 3-year warranty included.',
        status: 'Accepted',
      },
      {
        craftsman: craftsman4._id,
        job: jobs[3]._id,
        client: client1._id,
        price: 2500.0,
        notes:
          'Custom kitchen cabinets with soft-close hinges and premium wood finish. Project timeline: 2 weeks.',
        status: 'Submitted',
      },
      {
        craftsman: craftsman5._id,
        job: jobs[4]._id,
        client: client2._id,
        price: 400.0,
        notes:
          'Comprehensive office cleaning with eco-friendly products. Flexible scheduling available.',
        status: 'Submitted',
      },
    ]);
    console.log('✅ Quotes created successfully');

    // Create invitations with different statuses
    console.log('📨 Creating invitations...');
    const invitations = await Invitation.insertMany([
      {
        job: jobs[0]._id,
        client: client1._id,
        craftsman: craftsman1._id,
        status: 'Accepted',
        message:
          'I think you would be perfect for this plumbing job based on your excellent reviews.',
      },
      {
        job: jobs[3]._id,
        client: client1._id,
        craftsman: craftsman4._id,
        status: 'Pending',
        message:
          'Your carpentry portfolio is impressive. Would love to have you work on my custom kitchen cabinets.',
      },
      {
        job: jobs[1]._id,
        client: client2._id,
        craftsman: craftsman2._id,
        status: 'Accepted',
        message:
          'Need electrical work done professionally. Your reviews are excellent!',
      },
      {
        job: jobs[4]._id,
        client: client2._id,
        craftsman: craftsman5._id,
        status: 'Pending',
        message: 'Looking for reliable cleaning service for our office space.',
      },
    ]);
    console.log('✅ Invitations created successfully');

    // Create chats and messages
    console.log('💬 Creating chats and messages...');
    const chats = await Chat.insertMany([
      {
        participants: [client1._id.toString(), craftsman1._id.toString()],
        jobId: jobs[0]._id.toString(),
        lastMessage:
          'Great! I can start working on your sink tomorrow morning.',
        lastMessageAt: new Date(),
        lastMessageSenderId: craftsman1._id.toString(),
        unreadCount: {
          [client1._id.toString()]: 1,
          [craftsman1._id.toString()]: 0,
        },
        isActive: true,
      },
      {
        participants: [client2._id.toString(), craftsman2._id.toString()],
        jobId: jobs[1]._id.toString(),
        lastMessage:
          'The electrical work is completed. Please check and confirm.',
        lastMessageAt: new Date(),
        lastMessageSenderId: craftsman2._id.toString(),
        unreadCount: {
          [client2._id.toString()]: 1,
          [craftsman2._id.toString()]: 0,
        },
        isActive: true,
      },
      {
        participants: [client3._id.toString(), craftsman3._id.toString()],
        jobId: jobs[2]._id.toString(),
        lastMessage:
          'Painting job completed! Thank you for choosing our service.',
        lastMessageAt: new Date(),
        lastMessageSenderId: craftsman3._id.toString(),
        unreadCount: {
          [client3._id.toString()]: 0,
          [craftsman3._id.toString()]: 0,
        },
        isActive: true,
      },
    ]);

    const messages = await Message.insertMany([
      // Chat 1: Client1 and Craftsman1
      {
        chatId: chats[0]._id.toString(),
        senderId: client1._id.toString(),
        content:
          'Hello! Thanks for accepting my invitation. When can you start?',
        messageType: 'text',
        isRead: true,
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        isEdited: false,
        isDeleted: false,
      },
      {
        chatId: chats[0]._id.toString(),
        senderId: craftsman1._id.toString(),
        content:
          'Hi! I can start tomorrow morning at 9 AM. I will bring all necessary tools.',
        messageType: 'text',
        isRead: true,
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        isEdited: false,
        isDeleted: false,
      },
      {
        chatId: chats[0]._id.toString(),
        senderId: client1._id.toString(),
        content:
          'Perfect! I will be home. The building entrance is on the main street.',
        messageType: 'text',
        isRead: false,
        timestamp: new Date(Date.now() - 900000), // 15 minutes ago
        isEdited: false,
        isDeleted: false,
      },
      // Chat 2: Client2 and Craftsman2
      {
        chatId: chats[1]._id.toString(),
        senderId: craftsman2._id.toString(),
        content:
          'The electrical work is completed. I have installed 4 smart outlets as requested.',
        messageType: 'text',
        isRead: false,
        timestamp: new Date(Date.now() - 600000), // 10 minutes ago
        isEdited: false,
        isDeleted: false,
      },
      {
        chatId: chats[1]._id.toString(),
        senderId: client2._id.toString(),
        content:
          'Excellent work! Thank you so much. Everything looks professional.',
        messageType: 'text',
        isRead: true,
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        isEdited: false,
        isDeleted: false,
      },
      // Chat 3: Client3 and Craftsman3
      {
        chatId: chats[2]._id.toString(),
        senderId: craftsman3._id.toString(),
        content:
          'Painting job completed! The house looks amazing with the new white paint.',
        messageType: 'text',
        isRead: true,
        timestamp: new Date(),
        isEdited: false,
        isDeleted: false,
      },
    ]);
    console.log('✅ Chats and messages created successfully');

    // Create comprehensive notifications
    console.log('🔔 Creating notifications...');
    const notifications = await Notification.insertMany([
      {
        user: client1._id,
        type: 'quote_received',
        title: 'New Quote Received',
        message:
          'Mahmoud Plumber has sent you a quote for: Fix kitchen sink leak - EGP 250.00',
        data: {
          jobId: jobs[0]._id,
          quoteId: quotes[0]._id,
          craftsmanId: craftsman1._id,
        },
        read: false,
      },
      {
        user: craftsman2._id,
        type: 'quote_accepted',
        title: 'Quote Accepted!',
        message:
          'Sara Ali has accepted your quote for: Install new electrical outlets',
        data: {
          jobId: jobs[1]._id,
          quoteId: quotes[1]._id,
          clientId: client2._id,
        },
        read: false,
      },
      {
        user: craftsman1._id,
        type: 'invitation',
        title: 'Job Invitation Received',
        message: 'Ahmed Mohamed has invited you to: Fix kitchen sink leak',
        data: {
          jobId: jobs[0]._id,
          invitationId: invitations[0]._id,
          clientId: client1._id,
        },
        read: true,
      },
      {
        user: craftsman4._id,
        type: 'invitation',
        title: 'Job Invitation Received',
        message: 'Ahmed Mohamed has invited you to: Custom kitchen cabinets',
        data: {
          jobId: jobs[3]._id,
          invitationId: invitations[1]._id,
          clientId: client1._id,
        },
        read: false,
      },
      {
        user: client3._id,
        type: 'job_completed',
        title: 'Job Completed',
        message:
          'Karim Painter has completed: Paint house exterior. Please review the work.',
        data: {
          jobId: jobs[2]._id,
          quoteId: quotes[2]._id,
          craftsmanId: craftsman3._id,
        },
        read: false,
      },
      {
        user: craftsman5._id,
        type: 'invitation',
        title: 'Job Invitation Received',
        message: 'Sara Ali has invited you to: Office deep cleaning',
        data: {
          jobId: jobs[4]._id,
          invitationId: invitations[3]._id,
          clientId: client2._id,
        },
        read: false,
      },
      {
        user: client2._id,
        type: 'job_completed',
        title: 'Job Completed',
        message:
          'Hassan Electrician has completed: Install new electrical outlets. Payment processed.',
        data: {
          jobId: jobs[1]._id,
          quoteId: quotes[1]._id,
          craftsmanId: craftsman2._id,
        },
        read: true,
      },
    ]);
    console.log('✅ Notifications created successfully');

    // Create action logs for system tracking
    console.log('📝 Creating action logs...');
    await ActionLog.insertMany([
      {
        userId: client1._id.toString(),
        userEmail: 'client1@example.com',
        userName: 'Ahmed Mohamed',
        userRole: 'client',
        action: 'job_created',
        category: 'content',
        details: 'Created job: Fix kitchen sink leak',
        ipAddress: '192.168.1.100',
        success: true,
      },
      {
        userId: craftsman1._id.toString(),
        userEmail: 'craftsman1@example.com',
        userName: 'Mahmoud Plumber',
        userRole: 'craftsman',
        action: 'invitation_accepted',
        category: 'content',
        details: 'Accepted invitation for job: Fix kitchen sink leak',
        ipAddress: '192.168.1.101',
        success: true,
      },
      {
        userId: craftsman1._id.toString(),
        userEmail: 'craftsman1@example.com',
        userName: 'Mahmoud Plumber',
        userRole: 'craftsman',
        action: 'quote_submitted',
        category: 'financial',
        details: 'Submitted quote for job: Fix kitchen sink leak (EGP 250.00)',
        ipAddress: '192.168.1.101',
        success: true,
      },
      {
        userId: client2._id.toString(),
        userEmail: 'client2@example.com',
        userName: 'Sara Ali',
        userRole: 'client',
        action: 'quote_accepted',
        category: 'financial',
        details: 'Accepted quote from Hassan Electrician (EGP 180.00)',
        ipAddress: '192.168.1.102',
        success: true,
      },
      {
        userId: craftsman3._id.toString(),
        userEmail: 'craftsman3@example.com',
        userName: 'Karim Painter',
        userRole: 'craftsman',
        action: 'job_completed',
        category: 'content',
        details: 'Completed job: Paint house exterior',
        ipAddress: '192.168.1.103',
        success: true,
      },
      {
        userId: admin._id.toString(),
        userEmail: 'admin@craftworks.com',
        userName: 'System Administrator',
        userRole: 'admin',
        action: 'user_verification',
        category: 'user_management',
        details: 'Verified craftsman: Mahmoud Plumber',
        ipAddress: '192.168.1.1',
        success: true,
      },
      {
        userId: moderator._id.toString(),
        userEmail: 'moderator@craftworks.com',
        userName: 'Content Moderator',
        userRole: 'moderator',
        action: 'content_moderation',
        category: 'content',
        details: 'Reviewed job posting: Custom kitchen cabinets',
        ipAddress: '192.168.1.2',
        success: true,
      },
    ]);
    console.log('✅ Action logs created successfully');

    console.log('\n🎉 SEED DATA CREATION COMPLETED SUCCESSFULLY! 🎉');
    console.log('==========================================');
    console.log('📊 Summary:');
    console.log(`✅ Services: ${services.length} (multilingual with images)`);
    console.log(`✅ Users: 10 total`);
    console.log(`   👥 Clients: 3`);
    console.log(`   🔨 Craftsmen: 5`);
    console.log(`   🛡️  Admin: 1`);
    console.log(`   👮 Moderator: 1`);
    console.log(`✅ Jobs: ${jobs.length} (various statuses)`);
    console.log(`✅ Quotes: ${quotes.length} (with price and notes)`);
    console.log(`✅ Invitations: ${invitations.length} (accepted/pending)`);
    console.log(`✅ Chats: ${chats.length} with messages`);
    console.log(`✅ Messages: ${messages.length} (realistic conversations)`);
    console.log(`✅ Notifications: ${notifications.length} (various types)`);
    console.log(`✅ Action Logs: 7 (system tracking)`);
    console.log('==========================================');
    console.log('🔑 Test Credentials:');
    console.log('📧 Client: client1@example.com | 🔑 Password: 123456!Aa');
    console.log(
      '🔨 Craftsman: craftsman1@example.com | 🔑 Password: 123456!Aa'
    );
    console.log('🛡️  Admin: admin@craftworks.com | 🔑 Password: 123456!Aa');
    console.log(
      '👮 Moderator: moderator@craftworks.com | 🔑 Password: 123456!Aa'
    );
    console.log('==========================================');

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    console.log('🚀 Seed process completed!');
  } catch (err) {
    console.error('❌ Seed error:', err);
    if (err instanceof Error) {
      console.error('Error message:', err.message);
      console.error('Stack trace:', err.stack);
    }
    process.exit(1);
  }
}

seed();
