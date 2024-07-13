const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = "mongodb+srv://youngboy9323:Hifquojcub9@kudori.zhipdrg.mongodb.net/?retryWrites=true&w=majority&appName=Kudori";
const dbName = 'Kudori';

const mongoClient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function updateCharacterData() {
  try {
    await mongoClient.connect();
    console.log('Connected to MongoDB');

    const collection = mongoClient.db(dbName).collection('characters');

    // Trouver et mettre à jour les documents incomplets
    const characters = await collection.find().toArray();

    for (const character of characters) {
      if (!character.image || !character.price) {
        const updates = {};
        if (!character.image) {
          updates.image = 'https://example.com/default_image.jpg'; // Remplace par une URL d'image valide
        }
        if (!character.price) {
          updates.price = 1000; // Remplace par un prix par défaut
        }

        await collection.updateOne(
          { _id: new ObjectId(character._id) },
          { $set: updates }
        );

        console.log(`Updated character with ID ${character._id}`);
      }
    }

    await mongoClient.close();
    console.log('Done updating characters');
  } catch (error) {
    console.error('Failed to update character data', error);
  }
}

updateCharacterData();
