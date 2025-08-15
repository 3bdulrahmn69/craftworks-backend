// Test the UserTransformHelper service population
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/craftworks';

async function testUserTransform() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected successfully');

    // Import after connection
    const { User } = await import('../src/models/user.model.js');
    const { UserTransformHelper } = await import(
      '../src/utils/userTransformHelper.js'
    );

    console.log('🧪 Testing UserTransformHelper service population...');

    // Find a craftsman with a service
    const craftsman = await User.findOne({
      role: 'craftsman',
      'craftsmanInfo.service': { $exists: true, $ne: null, $ne: '' },
    });

    if (!craftsman) {
      console.log('❌ No craftsman with service found');
      return;
    }

    console.log(`👷 Found craftsman: ${craftsman.fullName}`);
    console.log(`🆔 Service ID: ${craftsman.craftsmanInfo?.service}`);

    // Transform user data
    const publicUser = await UserTransformHelper.toPublic(craftsman);

    console.log('\n📄 Transformed user data:');
    console.log(`Name: ${publicUser.fullName}`);
    console.log(`Role: ${publicUser.role}`);

    if (publicUser.service) {
      if (typeof publicUser.service === 'object') {
        console.log('✅ Service populated successfully:');
        console.log(`   - Service ID: ${publicUser.service._id}`);
        console.log(`   - Service Name (EN): ${publicUser.service.name?.en}`);
        console.log(`   - Service Name (AR): ${publicUser.service.name?.ar}`);
      } else {
        console.log(
          `❌ Service NOT populated (still ID): ${publicUser.service}`
        );
      }
    } else {
      console.log('ℹ️  No service in public user data');
    }

    console.log('\n🔍 Full service object:');
    console.log(JSON.stringify(publicUser.service, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testUserTransform().catch(console.error);
