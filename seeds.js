const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Job = require('./src/models/Job');
const Proposal = require('./src/models/Proposal');
const Contract = require('./src/models/Contract');
const Review = require('./src/models/Review');
const Message = require('./src/models/Message');
const Report = require('./src/models/Report');
const Service = require('./src/models/Service');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Job.deleteMany({}),
    Proposal.deleteMany({}),
    Contract.deleteMany({}),
    Review.deleteMany({}),
    Message.deleteMany({}),
    Report.deleteMany({}),
    Service.deleteMany({})
  ]);

  // Create users
  const [admin, moderator, client, craftsman, blockedUser] = await User.create([
    { role: 'admin', full_name: 'Admin User', email: 'admin@test.com', phone: '1111111111', country: 'Egypt', profile_image: '', password: 'adminpass' },
    { role: 'moderator', full_name: 'Moderator User', email: 'mod@test.com', phone: '2222222222', country: 'Egypt', profile_image: '', password: 'modpass' },
    { role: 'client', full_name: 'Client User', email: 'client@test.com', phone: '3333333333', country: 'Egypt', profile_image: '', password: 'clientpass' },
    { role: 'craftsman', full_name: 'Craftsman User', email: 'craftsman@test.com', phone: '4444444444', country: 'Egypt', profile_image: '', password: 'craftsmanpass' },
    { role: 'client', full_name: 'Blocked User', email: 'blocked@test.com', phone: '5555555555', country: 'Egypt', profile_image: '', password: 'blockedpass', blocked: true, blocked_at: new Date(), blocked_reason: 'Test blocked user' }
  ]);

  // Create services
  const [carpentry, plumbing] = await Service.create([
    { name: 'Carpentry', icon: '', description: 'Woodwork and furniture', subcategories: ['Tables', 'Chairs'], is_active: true },
    { name: 'Plumbing', icon: '', description: 'Pipes and water systems', subcategories: ['Repair', 'Installation'], is_active: true }
  ]);

  // Create a job
  const job = await Job.create({
    client_id: client._id,
    title: 'Build a custom table',
    description: 'Need a wooden table for my dining room.',
    budget: 300,
    category: 'Carpentry',
    location: 'Cairo',
    status: 'open',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  // Create a proposal
  const proposal = await Proposal.create({
    job_id: job._id,
    craftsman_id: craftsman._id,
    cover_letter: 'I can build this table for you.',
    price_offer: 280,
    status: 'accepted'
  });

  // Create a contract
  const contract = await Contract.create({
    job_id: job._id,
    craftsman_id: craftsman._id,
    client_id: client._id,
    start_date: new Date(),
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: 'completed',
    completed_at: new Date(),
    reviewed: false,
    final_price: 280
  });

  // Create a review (client reviews craftsman)
  await Review.create({
    from_user_id: client._id,
    to_user_id: craftsman._id,
    job_id: job._id,
    rating: 5,
    comment: 'Excellent work!'
  });

  // Create a message
  await Message.create({
    sender_id: client._id,
    receiver_id: craftsman._id,
    message: 'When can you start?',
    job_id: job._id,
    is_read: false
  });

  // Create a report
  await Report.create({
    reporter_id: client._id,
    reported_user_id: craftsman._id,
    reason: 'Late delivery',
    job_id: job._id,
    report_type: 'user',
    status: 'pending'
  });

  console.log('Database seeded!');
  process.exit();
}

seed().catch(e => { console.error(e); process.exit(1); }); 