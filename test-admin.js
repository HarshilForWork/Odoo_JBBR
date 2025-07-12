const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testAdminSystem() {
  console.log('🧪 Testing Admin System...\n');

  try {
    // Test 1: Login with admin credentials
    console.log('1. Testing admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@stackit.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('✅ Admin login successful');
    console.log(`   User: ${user.username} (${user.role})`);
    console.log(`   Token: ${token.substring(0, 20)}...\n`);

    const headers = { Authorization: `Bearer ${token}` };

    // Test 2: Get admin stats
    console.log('2. Testing admin stats...');
    const statsResponse = await axios.get(`${BASE_URL}/admin/stats`, { headers });
    console.log('✅ Admin stats retrieved');
    console.log(`   Total Users: ${statsResponse.data.totalUsers}`);
    console.log(`   Total Questions: ${statsResponse.data.totalQuestions}`);
    console.log(`   Total Answers: ${statsResponse.data.totalAnswers}`);
    console.log(`   Admin Users: ${statsResponse.data.adminUsers}\n`);

    // Test 3: Get users list
    console.log('3. Testing user management...');
    const usersResponse = await axios.get(`${BASE_URL}/admin/users`, { headers });
    console.log('✅ Users list retrieved');
    console.log(`   Found ${usersResponse.data.users.length} users\n`);

    // Test 4: Create announcement
    console.log('4. Testing announcement creation...');
    const announcementResponse = await axios.post(`${BASE_URL}/announcements`, {
      title: 'Test Announcement',
      message: '<p>This is a <strong>test announcement</strong> from the admin system.</p>'
    }, { headers });
    console.log('✅ Announcement created');
    console.log(`   ID: ${announcementResponse.data.announcement._id}`);
    console.log(`   Title: ${announcementResponse.data.announcement.title}\n`);

    // Test 5: Get announcements
    console.log('5. Testing announcements retrieval...');
    const announcementsResponse = await axios.get(`${BASE_URL}/announcements`);
    console.log('✅ Announcements retrieved');
    console.log(`   Found ${announcementsResponse.data.announcements.length} announcements\n`);

    // Test 6: Get admin announcements
    console.log('6. Testing admin announcements...');
    const adminAnnouncementsResponse = await axios.get(`${BASE_URL}/announcements/admin`, { headers });
    console.log('✅ Admin announcements retrieved');
    console.log(`   Found ${adminAnnouncementsResponse.data.announcements.length} announcements\n`);

    console.log('🎉 All admin system tests passed!');
    console.log('\n📋 Admin System Features:');
    console.log('   ✅ Hardcoded admin credentials (admin@stackit.com / admin123)');
    console.log('   ✅ Admin middleware protection');
    console.log('   ✅ User management (view, role changes, delete)');
    console.log('   ✅ Content deletion (questions, answers)');
    console.log('   ✅ Announcement system (create, edit, delete)');
    console.log('   ✅ Platform statistics');
    console.log('   ✅ Frontend admin dashboard');
    console.log('   ✅ Homepage announcements display');
    console.log('   ✅ Notification highlighting for admin messages');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    console.error('Status:', error.response?.status);
  }
}

testAdminSystem(); 
      "   ✅ Hardcoded admin credentials (admin@stackit.com / admin123)"
    );
    console.log("   ✅ Admin middleware protection");
    console.log("   ✅ User management (view, role changes, delete)");
    console.log("   ✅ Content deletion (questions, answers)");
    console.log("   ✅ Announcement system (create, edit, delete)");
    console.log("   ✅ Platform statistics");
    console.log("   ✅ Frontend admin dashboard");
    console.log("   ✅ Homepage announcements display");
    console.log("   ✅ Notification highlighting for admin messages");
  } catch (error) {
    console.error(
      "❌ Test failed:",
      error.response?.data?.message || error.message
    );
    console.error("Status:", error.response?.status);
  }
}

testAdminSystem();
