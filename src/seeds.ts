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

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear collections
    await Promise.all([
      User.deleteMany({}),
      Job.deleteMany({}),
      Quote.deleteMany({}),
      Invitation.deleteMany({}),
      Notification.deleteMany({}),
      Service.deleteMany({}),
    ]);
    console.log('Cleared all collections');

    // Create services
    const services = await Service.insertMany([
      {
        name: 'Plumbing',
        icon: 'faucet-icon',
        description: 'Water systems and pipe work',
      },
      {
        name: 'Electrical',
        icon: 'bolt-icon',
        description: 'Electrical wiring and repair',
      },
      {
        name: 'Painting',
        icon: 'paint-icon',
        description: 'Wall and house painting',
      },
      {
        name: 'Carpentry',
        icon: 'hammer-icon',
        description: 'Wood work and furniture repair',
      },
      {
        name: 'HVAC',
        icon: 'thermometer-icon',
        description: 'Heating, ventilation, and air conditioning',
      },
      {
        name: 'Masonry',
        icon: 'brick-icon',
        description: 'Stone and brick work',
      },
    ]);
    console.log('Seeded services');

    // Get service IDs for reference
    const plumbingService = services
      .find((s) => s.name === 'Plumbing')
      ?._id.toString();
    const electricalService = services
      .find((s) => s.name === 'Electrical')
      ?._id.toString();
    const paintingService = services
      .find((s) => s.name === 'Painting')
      ?._id.toString();
    const carpentryService = services
      .find((s) => s.name === 'Carpentry')
      ?._id.toString();

    // Create users
    const hashedPassword = await bcrypt.hash('123456!Aa', 10);

    const [
      client1,
      client2,
      client3,
      craftsman1,
      craftsman2,
      craftsman3,
      craftsman4,
    ] = await User.insertMany([
      // Clients
      {
        email: 'client1@example.com',
        phone: '01018326780',
        password: hashedPassword,
        role: 'client',
        fullName: 'Ahmed Mohamed',
        profilePicture:
          'https://res.cloudinary.com/demo/image/upload/d_avatar.png/client1.png',
        address: {
          country: 'Egypt',
          state: 'Cairo',
          city: 'New Cairo',
          street: '123 Main Street',
        },
        rating: 4.2,
        ratingCount: 15,
      },
      {
        email: 'client2@example.com',
        phone: '01018326785',
        password: hashedPassword,
        role: 'client',
        fullName: 'Sara Ali',
        profilePicture:
          'https://res.cloudinary.com/demo/image/upload/d_avatar.png/client2.png',
        address: {
          country: 'Egypt',
          state: 'Alexandria',
          city: 'Alexandria',
          street: '456 Alexandria Street',
        },
        rating: 4.7,
        ratingCount: 23,
      },
      {
        email: 'client3@example.com',
        phone: '01018326786',
        password: hashedPassword,
        role: 'client',
        fullName: 'Omar Hassan',
        profilePicture:
          'https://res.cloudinary.com/demo/image/upload/d_avatar.png/client3.png',
        address: {
          country: 'Egypt',
          state: 'Giza',
          city: 'Giza',
          street: '789 Pyramid Road',
        },
        rating: 3.9,
        ratingCount: 8,
      },
      // Craftsmen
      {
        email: 'craftsman1@example.com',
        phone: '01018326781',
        password: hashedPassword,
        role: 'craftsman',
        fullName: 'Mahmoud Plumber',
        profilePicture:
          'https://res.cloudinary.com/demo/image/upload/d_avatar.png/craftsman1.png',
        address: {
          country: 'Egypt',
          state: 'Cairo',
          city: 'Cairo',
          street: '321 Workshop Street',
        },
        craftsmanInfo: {
          skills: ['Plumbing', 'HVAC'],
          service: plumbingService!,
          bio: 'Experienced plumber with 10+ years in residential and commercial plumbing. Specialized in emergency repairs and installations.',
          portfolioImageUrls: [
            'https://res.cloudinary.com/demo/image/upload/plumbing1.jpg',
            'https://res.cloudinary.com/demo/image/upload/plumbing2.jpg',
          ],
          verificationStatus: 'verified',
          verificationDocs: [],
        },
        wallet: { balance: 12500, withdrawableBalance: 8000 },
        rating: 4.8,
        ratingCount: 142,
      },
      {
        email: 'craftsman2@example.com',
        phone: '01018326782',
        password: hashedPassword,
        role: 'craftsman',
        fullName: 'Hassan Electrician',
        profilePicture:
          'https://res.cloudinary.com/demo/image/upload/d_avatar.png/craftsman2.png',
        address: {
          country: 'Egypt',
          state: 'Cairo',
          city: 'Heliopolis',
          street: '654 Electric Avenue',
        },
        craftsmanInfo: {
          skills: ['Electrical'],
          service: electricalService!,
          bio: 'Licensed electrician specializing in home wiring, electrical repairs, and smart home installations.',
          portfolioImageUrls: [
            'https://res.cloudinary.com/demo/image/upload/electrical1.jpg',
          ],
          verificationStatus: 'verified',
          verificationDocs: [],
        },
        wallet: { balance: 8750, withdrawableBalance: 5200 },
        rating: 4.6,
        ratingCount: 89,
      },
      {
        email: 'craftsman3@example.com',
        phone: '01018326783',
        password: hashedPassword,
        role: 'craftsman',
        fullName: 'Karim Painter',
        profilePicture:
          'https://res.cloudinary.com/demo/image/upload/d_avatar.png/craftsman3.png',
        address: {
          country: 'Egypt',
          state: 'Giza',
          city: 'Dokki',
          street: '987 Color Street',
        },
        craftsmanInfo: {
          skills: ['Painting'],
          service: paintingService!,
          bio: 'Professional painter with expertise in interior and exterior painting, wallpaper installation.',
          portfolioImageUrls: [
            'https://res.cloudinary.com/demo/image/upload/painting1.jpg',
            'https://res.cloudinary.com/demo/image/upload/painting2.jpg',
            'https://res.cloudinary.com/demo/image/upload/painting3.jpg',
          ],
          verificationStatus: 'verified',
          verificationDocs: [],
        },
        wallet: { balance: 5400, withdrawableBalance: 3100 },
        rating: 4.4,
        ratingCount: 67,
      },
      {
        email: 'craftsman4@example.com',
        phone: '01018326784',
        password: hashedPassword,
        role: 'craftsman',
        fullName: 'Mohamed Carpenter',
        profilePicture:
          'https://res.cloudinary.com/demo/image/upload/d_avatar.png/craftsman4.png',
        address: {
          country: 'Egypt',
          state: 'Alexandria',
          city: 'Alexandria',
          street: '147 Wood Workshop Lane',
        },
        craftsmanInfo: {
          skills: ['Carpentry', 'Masonry'],
          service: carpentryService!,
          bio: 'Master carpenter and mason with 15+ years experience. Custom furniture, kitchen cabinets, and stone work.',
          portfolioImageUrls: [
            'https://res.cloudinary.com/demo/image/upload/carpentry1.jpg',
            'https://res.cloudinary.com/demo/image/upload/masonry1.jpg',
          ],
          verificationStatus: 'pending',
          verificationDocs: [],
        },
        wallet: { balance: 15200, withdrawableBalance: 12000 },
        rating: 4.9,
        ratingCount: 203,
      },
      // Admin
      {
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        fullName: 'System Administrator',
        profilePicture:
          'https://res.cloudinary.com/demo/image/upload/d_avatar.png/admin.png',
      },
      // Moderator
      {
        email: 'moderator@example.com',
        password: hashedPassword,
        role: 'moderator',
        fullName: 'Content Moderator',
        profilePicture:
          'https://res.cloudinary.com/demo/image/upload/d_avatar.png/moderator.png',
      },
    ]);
    console.log('Seeded users');

    // Clean up admin and moderator users to remove unwanted fields
    await User.updateMany(
      { role: { $in: ['admin', 'moderator'] } },
      {
        $unset: {
          address: 1,
          rating: 1,
          ratingCount: 1,
          wallet: 1,
        },
      }
    );
    console.log('Cleaned up admin/moderator users');

    // Create multiple jobs
    const jobs = await Job.insertMany([
      {
        client: client1._id,
        title: 'Fix kitchen sink leak',
        description:
          'There is a persistent leak under the kitchen sink that needs immediate attention. Water is pooling and causing damage.',
        category: 'Plumbing',
        photos: [
          'https://res.cloudinary.com/demo/image/upload/sink_leak1.jpg',
          'https://res.cloudinary.com/demo/image/upload/sink_leak2.jpg',
        ],
        address: '123 Main Street, New Cairo',
        location: { type: 'Point', coordinates: [31.2, 30.1] },
        status: 'Posted',
        paymentType: 'Cash',
        appliedCraftsmen: [craftsman1._id],
      },
      {
        client: client2._id,
        title: 'Electrical wiring for new room',
        description:
          'Need complete electrical wiring installation for a newly constructed room including outlets, switches, and lighting.',
        category: 'Electrical',
        photos: [
          'https://res.cloudinary.com/demo/image/upload/electrical_room1.jpg',
        ],
        address: '456 Alexandria Street, Alexandria',
        location: { type: 'Point', coordinates: [31.1, 29.9] },
        status: 'Posted',
        paymentType: 'Escrow',
        appliedCraftsmen: [craftsman2._id],
      },
      {
        client: client3._id,
        title: 'House exterior painting',
        description:
          'Complete exterior house painting including prep work, primer, and two coats of high-quality paint.',
        category: 'Painting',
        photos: [
          'https://res.cloudinary.com/demo/image/upload/house_exterior1.jpg',
          'https://res.cloudinary.com/demo/image/upload/house_exterior2.jpg',
        ],
        address: '789 Pyramid Road, Giza',
        location: { type: 'Point', coordinates: [31.0, 29.8] },
        status: 'Posted',
        paymentType: 'Cash',
        appliedCraftsmen: [craftsman3._id],
      },
      {
        client: client1._id,
        title: 'Custom kitchen cabinets',
        description:
          'Design and build custom kitchen cabinets with modern handles and soft-close hinges.',
        category: 'Carpentry',
        photos: [
          'https://res.cloudinary.com/demo/image/upload/kitchen_design1.jpg',
        ],
        address: '123 Main Street, New Cairo',
        location: { type: 'Point', coordinates: [31.2, 30.1] },
        status: 'Posted',
        paymentType: 'CashProtected',
        appliedCraftsmen: [],
      },
      {
        client: client2._id,
        title: 'Bathroom tile repair',
        description:
          'Several tiles in the bathroom are cracked and need to be replaced. Looking for professional tiling work.',
        category: 'Masonry',
        photos: [
          'https://res.cloudinary.com/demo/image/upload/tile_repair1.jpg',
        ],
        address: '456 Alexandria Street, Alexandria',
        location: { type: 'Point', coordinates: [31.1, 29.9] },
        status: 'Posted',
        paymentType: 'Cash',
        appliedCraftsmen: [craftsman4._id],
      },
      {
        client: client3._id,
        title: 'HVAC system maintenance',
        description:
          'Annual maintenance and cleaning of central air conditioning system including filter replacement.',
        category: 'HVAC',
        photos: ['https://res.cloudinary.com/demo/image/upload/hvac1.jpg'],
        address: '789 Pyramid Road, Giza',
        location: { type: 'Point', coordinates: [31.0, 29.8] },
        status: 'Posted',
        paymentType: 'Escrow',
        appliedCraftsmen: [craftsman1._id],
      },
      {
        client: client1._id,
        title: 'Living room ceiling fan installation',
        description:
          'Install a new ceiling fan in the living room including electrical connections and mounting.',
        category: 'Electrical',
        photos: [
          'https://res.cloudinary.com/demo/image/upload/ceiling_fan1.jpg',
        ],
        address: '123 Main Street, New Cairo',
        location: { type: 'Point', coordinates: [31.2, 30.1] },
        status: 'Posted',
        paymentType: 'Cash',
        appliedCraftsmen: [craftsman2._id],
      },
      {
        client: client2._id,
        title: 'Bedroom wall painting',
        description:
          'Paint two bedrooms with neutral colors. Need primer application and two coats of paint.',
        category: 'Painting',
        photos: [
          'https://res.cloudinary.com/demo/image/upload/bedroom_paint1.jpg',
          'https://res.cloudinary.com/demo/image/upload/bedroom_paint2.jpg',
        ],
        address: '456 Alexandria Street, Alexandria',
        location: { type: 'Point', coordinates: [31.1, 29.9] },
        status: 'Posted',
        paymentType: 'CashProtected',
        appliedCraftsmen: [craftsman3._id],
      },
      {
        client: client3._id,
        title: 'Garden fence repair',
        description:
          'Wooden garden fence needs repair and reinforcement. Several panels are loose or damaged.',
        category: 'Carpentry',
        photos: [
          'https://res.cloudinary.com/demo/image/upload/fence_repair1.jpg',
        ],
        address: '789 Pyramid Road, Giza',
        location: { type: 'Point', coordinates: [31.0, 29.8] },
        status: 'Posted',
        paymentType: 'Cash',
        appliedCraftsmen: [craftsman4._id],
      },
      {
        client: client1._id,
        title: 'Toilet installation',
        description:
          'Replace old toilet with new one. Need professional plumbing work and proper installation.',
        category: 'Plumbing',
        photos: [
          'https://res.cloudinary.com/demo/image/upload/toilet_install1.jpg',
        ],
        address: '123 Main Street, New Cairo',
        location: { type: 'Point', coordinates: [31.2, 30.1] },
        status: 'Posted',
        paymentType: 'Escrow',
        appliedCraftsmen: [craftsman1._id],
      },
      {
        client: client2._id,
        title: 'Outdoor lighting installation',
        description:
          'Install garden and pathway lighting for security and aesthetics. Need electrical wiring.',
        category: 'Electrical',
        photos: [
          'https://res.cloudinary.com/demo/image/upload/outdoor_lighting1.jpg',
        ],
        address: '456 Alexandria Street, Alexandria',
        location: { type: 'Point', coordinates: [31.1, 29.9] },
        status: 'Posted',
        paymentType: 'Cash',
        appliedCraftsmen: [],
      },
      {
        client: client3._id,
        title: 'Balcony waterproofing',
        description:
          'Balcony has water leakage issues. Need professional waterproofing treatment.',
        category: 'Masonry',
        photos: [
          'https://res.cloudinary.com/demo/image/upload/balcony_waterproof1.jpg',
        ],
        address: '789 Pyramid Road, Giza',
        location: { type: 'Point', coordinates: [31.0, 29.8] },
        status: 'Posted',
        paymentType: 'CashProtected',
        appliedCraftsmen: [craftsman4._id],
      },
      {
        client: client1._id,
        title: 'Air conditioning repair',
        description:
          'Central AC unit not cooling properly. Need diagnosis and repair of cooling system.',
        category: 'HVAC',
        photos: ['https://res.cloudinary.com/demo/image/upload/ac_repair1.jpg'],
        address: '123 Main Street, New Cairo',
        location: { type: 'Point', coordinates: [31.2, 30.1] },
        status: 'Posted',
        paymentType: 'Cash',
        appliedCraftsmen: [craftsman1._id],
      },
      {
        client: client2._id,
        title: 'Kitchen backsplash installation',
        description:
          'Install ceramic tile backsplash in kitchen. Need professional tiling work with proper grouting.',
        category: 'Masonry',
        photos: [
          'https://res.cloudinary.com/demo/image/upload/backsplash1.jpg',
        ],
        address: '456 Alexandria Street, Alexandria',
        location: { type: 'Point', coordinates: [31.1, 29.9] },
        status: 'Posted',
        paymentType: 'Escrow',
        appliedCraftsmen: [craftsman4._id],
      },
      {
        client: client3._id,
        title: 'Built-in wardrobe construction',
        description:
          'Design and build custom built-in wardrobe for master bedroom with sliding doors.',
        category: 'Carpentry',
        photos: ['https://res.cloudinary.com/demo/image/upload/wardrobe1.jpg'],
        address: '789 Pyramid Road, Giza',
        location: { type: 'Point', coordinates: [31.0, 29.8] },
        status: 'Posted',
        paymentType: 'CashProtected',
        appliedCraftsmen: [craftsman4._id],
      },
      {
        client: client1._id,
        title: 'Water heater installation',
        description:
          'Install new electric water heater in bathroom. Need plumbing and electrical connections.',
        category: 'Plumbing',
        photos: [
          'https://res.cloudinary.com/demo/image/upload/water_heater1.jpg',
        ],
        address: '123 Main Street, New Cairo',
        location: { type: 'Point', coordinates: [31.2, 30.1] },
        status: 'Posted',
        paymentType: 'Cash',
        appliedCraftsmen: [craftsman1._id, craftsman2._id],
      },
      {
        client: client2._id,
        title: 'Gate automation system',
        description:
          'Install automatic gate opener with remote control for main entrance gate.',
        category: 'Electrical',
        photos: [
          'https://res.cloudinary.com/demo/image/upload/gate_automation1.jpg',
        ],
        address: '456 Alexandria Street, Alexandria',
        location: { type: 'Point', coordinates: [31.1, 29.9] },
        status: 'Posted',
        paymentType: 'Escrow',
        appliedCraftsmen: [craftsman2._id],
      },
      {
        client: client3._id,
        title: 'Roof waterproofing',
        description:
          'Complete roof waterproofing and insulation work. Prevent water leakage during rainy season.',
        category: 'Masonry',
        photos: [
          'https://res.cloudinary.com/demo/image/upload/roof_waterproof1.jpg',
          'https://res.cloudinary.com/demo/image/upload/roof_waterproof2.jpg',
        ],
        address: '789 Pyramid Road, Giza',
        location: { type: 'Point', coordinates: [31.0, 29.8] },
        status: 'Posted',
        paymentType: 'Cash',
        appliedCraftsmen: [craftsman4._id],
      },
      {
        client: client1._id,
        title: 'Window frame painting',
        description:
          'Paint all window frames in the house. Need surface preparation and weather-resistant paint.',
        category: 'Painting',
        photos: [
          'https://res.cloudinary.com/demo/image/upload/window_frames1.jpg',
        ],
        address: '123 Main Street, New Cairo',
        location: { type: 'Point', coordinates: [31.2, 30.1] },
        status: 'Posted',
        paymentType: 'CashProtected',
        appliedCraftsmen: [craftsman3._id],
      },
      {
        client: client2._id,
        title: 'Shower installation',
        description:
          'Install new walk-in shower with glass doors and modern fixtures. Need plumbing work.',
        category: 'Plumbing',
        photos: [
          'https://res.cloudinary.com/demo/image/upload/shower_install1.jpg',
        ],
        address: '456 Alexandria Street, Alexandria',
        location: { type: 'Point', coordinates: [31.1, 29.9] },
        status: 'Posted',
        paymentType: 'Cash',
        appliedCraftsmen: [craftsman1._id],
      },
    ]);
    console.log('Seeded 20 jobs');

    // Create multiple quotes
    const [quote1, quote2, quote3] = await Quote.insertMany([
      {
        job: jobs[0]._id,
        craftsman: craftsman1._id,
        price: 1500,
        notes:
          'I can fix the leak today. Price includes parts and labor. 2 year warranty on work.',
        status: 'Submitted',
      },
      {
        job: jobs[1]._id,
        craftsman: craftsman2._id,
        price: 3200,
        notes:
          'Complete electrical installation with premium materials. Timeline: 3-4 days.',
        status: 'Submitted',
      },
      {
        job: jobs[2]._id,
        craftsman: craftsman3._id,
        price: 8500,
        notes:
          'High-quality exterior paint with weather protection. Includes surface preparation and cleanup.',
        status: 'Accepted',
      },
    ]);
    console.log('Seeded quotes');

    // Create invitations
    const [invitation1, invitation2] = await Invitation.insertMany([
      {
        job: jobs[0]._id,
        craftsman: craftsman1._id,
        status: 'Accepted',
      },
      {
        job: jobs[3]._id,
        craftsman: craftsman4._id,
        status: 'Pending',
      },
    ]);
    console.log('Seeded invitations');

    // Create notifications
    await Notification.insertMany([
      {
        user: client1._id,
        type: 'quote',
        title: 'New Quote Received',
        message:
          'Mahmoud Plumber has submitted a quote for your plumbing job: Fix kitchen sink leak',
        data: {
          jobId: jobs[0]._id,
          quoteId: quote1._id,
          craftsmanId: craftsman1._id,
        },
        read: false,
      },
      {
        user: client2._id,
        type: 'quote',
        title: 'New Quote Received',
        message:
          'Hassan Electrician has submitted a quote for your electrical job',
        data: {
          jobId: jobs[1]._id,
          quoteId: quote2._id,
          craftsmanId: craftsman2._id,
        },
        read: false,
      },
      {
        user: craftsman1._id,
        type: 'invitation',
        title: 'You Were Invited to a Job',
        message:
          'Ahmed Mohamed has invited you to apply for: Fix kitchen sink leak',
        data: {
          jobId: jobs[0]._id,
          invitationId: invitation1._id,
          clientId: client1._id,
        },
        read: true,
      },
      {
        user: craftsman4._id,
        type: 'invitation',
        title: 'You Were Invited to a Job',
        message:
          'Ahmed Mohamed has invited you to apply for: Custom kitchen cabinets',
        data: {
          jobId: jobs[3]._id,
          invitationId: invitation2._id,
          clientId: client1._id,
        },
        read: false,
      },
      {
        user: client3._id,
        type: 'quote_accepted',
        title: 'Quote Accepted',
        message: 'Your quote for house exterior painting has been accepted!',
        data: {
          jobId: jobs[2]._id,
          quoteId: quote3._id,
          craftsmanId: craftsman3._id,
        },
        read: false,
      },
    ]);
    console.log('Seeded notifications');

    console.log('Seed data created!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed error:', err);
    if (err) console.error(err);
    process.exit(1);
  }
}

seed();
