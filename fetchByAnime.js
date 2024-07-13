const { MongoClient, ServerApiVersion } = require('mongodb');
const fetch = require('node-fetch');
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

async function connectToMongoDB() {
  try {
    await mongoClient.connect();
    console.log('MongoClient connecté.');
    await mongoClient.db("admin").command({ ping: 1 });
    console.log("Ping envoyé. Vous êtes connecté à MongoDB!");
    return mongoClient;
  } catch (error) {
    console.error("Échec de la connexion à MongoDB", error);
  }
}

async function fetchAnimeCharacters(animeId, animeTitle) {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/characters`);
    const data = await response.json();
    console.log(`Données des personnages de l'anime ${animeTitle} :`, JSON.stringify(data, null, 2)); // Log détaillé des données

    if (!data.data) {
      throw new Error("Données inattendues : " + JSON.stringify(data));
    }

    return data.data.map(item => {
      const character = item.character;
      console.log('Character Object:', character); // Log de chaque objet personnage
      return {
        name: character.name,
        image: character.images.jpg.image_url,
        price: Math.floor(Math.random() * (1500 - 500 + 1)) + 500,
        collection: animeTitle // Ajout du titre de l'anime comme collection
      };
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des personnages:", error);
    return [];
  }
}

async function insertCharacters(characters) {
  const collection = mongoClient.db(dbName).collection('characters');
  await collection.insertMany(characters);
  console.log(`${characters.length} personnages insérés dans la base de données.`);
}

async function main() {
  await connectToMongoDB();
  
  const animeTitle = 'Nanatsu no Taizai'; // Titre de l'anime
  const animeId = 23755; // ID de l'anime sur MyAnimeList

  const characters = await fetchAnimeCharacters(animeId, animeTitle);
  if (characters.length > 0) {
    await insertCharacters(characters);
  }

  await mongoClient.close();
}

main().catch(console.error);
