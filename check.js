const { MongoClient, ServerApiVersion } = require('mongodb');
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

async function checkCharacterData() {
  try {
    await mongoClient.connect();
    console.log('Connected to MongoDB');

    const collection = mongoClient.db(dbName).collection('characters');
    const characters = await collection.find().toArray();

    characters.forEach(character => {
      if (!character.name || !character.image || !character.price) {
        console.log('Incomplete character data:', character);
      }
    });

    await mongoClient.close();
    console.log('Done checking characters');
  } catch (error) {
    console.error('Failed to check character data', error);
  }
}

checkCharacterData();
