const { MongoClient, ServerApiVersion } = require('mongodb');
const fs = require('fs');
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

async function importCharacters() {
  try {
    await mongoClient.connect();
    console.log('Connected to MongoDB');
    
    const characters = JSON.parse(fs.readFileSync('char.json', 'utf8'));
    const collection = mongoClient.db(dbName).collection('characters');
    
    await collection.insertMany(characters);
    
    console.log('Characters inserted');
  } catch (error) {
    console.error('Failed to insert characters', error);
  } finally {
    await mongoClient.close();
  }
}

importCharacters();
