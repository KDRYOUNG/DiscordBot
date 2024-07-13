const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = "mongodb+srv://youngboy9323:Hifquojcub9@kudori.zhipdrg.mongodb.net/?retryWrites=true&w=majority&appName=Kudori";

async function dropDatabase() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db('<dbname>'); // Remplacez par le nom de votre base de données
    await db.dropDatabase();
    console.log("Base de données supprimée avec succès !");
  } catch (err) {
    console.error("Erreur lors de la suppression de la base de données : ", err);
  } finally {
    await client.close();
  }
}

dropDatabase();
