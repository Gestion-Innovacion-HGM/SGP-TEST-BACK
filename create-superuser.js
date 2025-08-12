const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const MONGO_URL =
  'mongodb://localhost:27018/staff?replicaSet=rs0&directConnection=true';
const email = 'superuser@example.com';
const password = 'SuperSecurePassword1*';

async function createSuperUser() {
  const client = new MongoClient(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('user');
    const profilesCollection = db.collection('profile');
    const hiringsCollection = db.collection('hiring');
    const groupsCollection = db.collection('group');
    const servicesCollection = db.collection('service');
    const ubicationsCollection = db.collection('ubication');

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const currentDate = new Date();

    // Verifica si el perfil predeterminado ya existe
    let defaultProfile = await profilesCollection.findOne({ name: 'default' });
    if (!defaultProfile) {
      defaultProfile = {
        name: 'default',
        createdAt: currentDate,
        updatedAt: currentDate,
        requisites: [],
      };
      await profilesCollection.insertOne(defaultProfile);
      console.log('Default profile created successfully.');
    }

    // Verifica si el hiring predeterminado ya existe
    let defaultHiring = await hiringsCollection.findOne({ type: 'default' });
    if (!defaultHiring) {
      defaultHiring = {
        type: 'default',
        createdAt: currentDate,
        updatedAt: currentDate,
        requisites: [],
      };
      await hiringsCollection.insertOne(defaultHiring);
      console.log('Default hiring created successfully.');
    }

    // Verifica si el grupo predeterminado ya existe
    let defaultGroup = await groupsCollection.findOne({ name: 'default' });
    if (!defaultGroup) {
      defaultGroup = {
        name: 'default',
        createdAt: currentDate,
        updatedAt: currentDate,
      };
      await groupsCollection.insertOne(defaultGroup);
      console.log('Default group created successfully.');
    }

    // Verifica si la ubicación predeterminada ya existe
    let defaultUbication = await ubicationsCollection.findOne({
      state: 'default',
      municipality: 'default',
    });
    if (!defaultUbication) {
      defaultUbication = {
        state: 'default',
        municipality: 'default',
        createdAt: currentDate,
        updatedAt: currentDate,
      };
      await ubicationsCollection.insertOne(defaultUbication);
      console.log('Default ubication created successfully.');
    }

    // Verifica si el servicio predeterminado ya existe
    let defaultService = await servicesCollection.findOne({ name: 'default' });
    if (!defaultService) {
      defaultService = {
        name: 'default',
        createdAt: currentDate,
        updatedAt: currentDate,
      };
      await servicesCollection.insertOne(defaultService);
      console.log('Default service created successfully.');
    }

    // Verifica si el superusuario ya existe
    let superUser = await usersCollection.findOne({ email });
    if (!superUser) {
      // Create the superuser
      superUser = {
        firstName: 'Super',
        surname: 'User',
        email: email,
        birthdate: '1990-01-01',
        sex: 'Hombre',
        idDocument: { type: 'DNI', number: '00000000' },
        roles: ['SUPERUSUARIO'],
        account: { _password: hashedPassword },
        address: {
          state: 'default',
          municipality: 'default',
          neighborhood: 'default',
          typeOfRoad: 'PATH',
        },
        folder: {
          name: 'defaultFolder',
          state: 'APROBADO',
          hiring: defaultHiring._id,
          inheritable: defaultHiring._id,
          profile: defaultProfile._id,
          services: [defaultService._id],
          documents: [],
        },
        createdAt: currentDate,
        updatedAt: currentDate,
      };

      await usersCollection.insertOne(superUser);
      console.log('Superuser created successfully.');
    } else {
      console.log('Superuser already exists.');
    }
  } catch (error) {
    console.error('Failed to create superuser:', error);
  } finally {
    await client.close();
  }
}

createSuperUser();
