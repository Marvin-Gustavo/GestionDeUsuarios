import mongoose from 'mongoose';
import User from './models/User.js';

export const seedDatabase = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@importadora.com' });
    if (!adminExists) {
      const admin = new User({
        name: 'Administrador',
        email: 'admin@importadora.com',
        password: 'admin123', // Will be hashed by pre-save hook
        role: 'admin'
      });
      await admin.save();
      console.log('Admin account created: admin@importadora.com / admin123');
    }

    const userExists = await User.findOne({ email: 'user@importadora.com' });
    if (!userExists) {
      const user = new User({
        name: 'Usuario Prueba',
        email: 'user@importadora.com',
        password: 'user123', // Will be hashed
        role: 'user'
      });
      await user.save();
      console.log('User account created: user@importadora.com / user123');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
