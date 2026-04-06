const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = "mongodb://Security-gaurd-managment-system_db_user:Security-gaurd@ac-iecpzpz-shard-00-00.7d7r17m.mongodb.net:27017,ac-iecpzpz-shard-00-01.7d7r17m.mongodb.net:27017,ac-iecpzpz-shard-00-02.7d7r17m.mongodb.net:27017/security_guard_db?authSource=admin&tls=true&replicaSet=atlas-vf740l-shard-0";

mongoose.connect(uri).then(async () => {
  console.log('Connected to Atlas');
  
  const hashed = await bcrypt.hash('AdminPassword123!', 12);
  
  const result = await mongoose.connection.db.collection('users').updateOne(
    { email: 'admin@example.com' },
    { $set: { 
      password: hashed,
      status: 'approved', 
      role: 'admin' 
    }}
  );
  
  console.log('Updated:', result.modifiedCount);
  
  const user = await mongoose.connection.db.collection('users').findOne({ email: 'admin@example.com' });
  const isMatch = await bcrypt.compare('AdminPassword123!', user.password);
  console.log('Password match test:', isMatch);
  console.log('Status:', user.status, '| Role:', user.role);
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});