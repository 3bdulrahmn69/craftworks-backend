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
    await Service.insertMany([
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
    ]);
    console.log('Seeded services');

    // Create users
    const hashedClientPassword = await bcrypt.hash('123456!Aa', 10);
    const hashedCraftsmanPassword = await bcrypt.hash('123456!Aa', 10);
    const hashedAdminPassword = await bcrypt.hash('123456!Aa', 10);
    const hashModeratorPassword = await bcrypt.hash('123456!Aa', 10);
    const [client, craftsman] = await User.insertMany([
      {
        email: 'client@example.com',
        phone: '01018326780',
        password: hashedClientPassword,
        role: 'client',
        fullName: 'Client User',
        wallet: { balance: 10000, withdrawableBalance: 5000 },
      },
      {
        email: 'craftsman@example.com',
        phone: '01018326781',
        password: hashedCraftsmanPassword,
        role: 'craftsman',
        fullName: 'Craftsman User',
        craftsmanInfo: {
          skills: ['Plumbing'],
          bio: 'Experienced plumber.',
          portfolioImageUrls: [],
          verificationStatus: 'verified',
          verificationDocs: [],
        },
        wallet: { balance: 5000, withdrawableBalance: 2000 },
      },
      {
        email: 'admin@example.com',
        password: hashedAdminPassword,
        role: 'admin',
        fullName: 'Admin User',
      },
      {
        email: 'mod@example.com',
        password: hashModeratorPassword,
        role: 'moderator',
        fullName: 'Moderator User',
      },
    ]);
    console.log('Seeded users');

    // Create a job
    const job = await Job.create({
      client: client._id,
      title: 'Fix kitchen sink leak',
      description: 'There is a leak under the kitchen sink.',
      category: 'Plumbing',
      photos: [],
      address: '123 Main St, Cairo',
      location: { type: 'Point', coordinates: [31.2, 30.1] },
      status: 'Posted',
      paymentType: 'Cash',
    });
    console.log('Seeded job');

    // Create a quote
    const quote = await Quote.create({
      job: job._id,
      craftsman: craftsman._id,
      price: 500,
      notes: 'Can fix it today.',
      status: 'Submitted',
    });
    console.log('Seeded quote');

    // Create an invitation
    const invitation = await Invitation.create({
      job: job._id,
      craftsman: craftsman._id,
      status: 'Pending',
    });
    console.log('Seeded invitation');

    // Create notifications
    await Notification.insertMany([
      {
        user: client._id,
        type: 'quote',
        title: 'New Quote Received',
        message:
          'A craftsman has submitted a quote for your job: Fix kitchen sink leak',
        data: {
          jobId: job._id,
          quoteId: quote._id,
          craftsmanId: craftsman._id,
        },
        read: false,
      },
      {
        user: craftsman._id,
        type: 'invitation',
        title: 'You Were Invited to a Job',
        message:
          'You have been invited to apply for the job: Fix kitchen sink leak',
        data: {
          jobId: job._id,
          invitationId: invitation._id,
          clientId: client._id,
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
