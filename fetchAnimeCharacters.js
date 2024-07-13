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

const animeList = [
  { id: 23755, title: 'Nanatsu no Taizai' },
  { id: 1, title: 'Cowboy Bebop' },
  { id: 20, title: 'Naruto' },
  { id: 5114, title: 'Fullmetal Alchemist: Brotherhood' },
  { id: 9253, title: 'Steins;Gate' },
  { id: 30276, title: 'One Punch Man' },
  { id: 32281, title: 'Kimi no Na wa.' },
  { id: 28977, title: 'Boku no Hero Academia' },
  { id: 19815, title: 'No Game No Life' },
  { id: 21855, title: 'Fate/stay night: Unlimited Blade Works' },
  { id: 1535, title: 'Death Note' },
  { id: 16498, title: 'Shingeki no Kyojin' },
  { id: 11061, title: 'Hunter x Hunter (2011)' },
  { id: 33486, title: 'Boku no Hero Academia 2nd Season' },
  { id: 22319, title: 'Sword Art Online: Extra Edition' },
  { id: 21881, title: 'Fate/stay night: Unlimited Blade Works 2nd Season' },
  { id: 32379, title: 'One Punch Man 2nd Season' },
  { id: 37987, title: 'Violet Evergarden' },
  { id: 34591, title: 'Shingeki no Kyojin Season 3' },
  { id: 33669, title: 'Re:Zero kara Hajimeru Isekai Seikatsu 2nd Season' },
  { id: 36511, title: 'Shingeki no Kyojin Season 3 Part 2' },
  { id: 15335, title: 'Tokyo Ghoul' },
  { id: 39587, title: 'Kimetsu no Yaiba' },
  { id: 1575, title: 'Code Geass: Hangyaku no Lelouch' },
  { id: 36456, title: 'Violet Evergarden Gaiden: Eien to Jidou Shuki Ningyou' },
  { id: 31964, title: 'Re:Zero kara Hajimeru Isekai Seikatsu' },
  { id: 33079, title: 'Re:Creators' },
  { id: 35849, title: 'Yuru Camp△' },
  { id: 31240, title: 'Youjo Senki' },
  { id: 5114, title: 'Fullmetal Alchemist: Brotherhood' },
  { id: 35849, title: 'Yuru Camp△' },
  { id: 32281, title: 'Kimi no Na wa.' },
  { id: 36793, title: 'Made in Abyss' },
  { id: 38000, title: 'Nanatsu no Taizai: Kamigami no Gekirin' },
  { id: 37999, title: 'Mob Psycho 100 II' },
  { id: 34206, title: 'Mahoutsukai no Yome' },
  { id: 35760, title: 'Tensei shitara Slime Datta Ken' },
  { id: 37510, title: 'Yagate Kimi ni Naru' },
  { id: 33352, title: 'Boku no Hero Academia 3rd Season' },
  { id: 38000, title: 'Nanatsu no Taizai: Kamigami no Gekirin' },
  { id: 34591, title: 'Shingeki no Kyojin Season 3' },
  { id: 35370, title: 'Overlord II' },
  { id: 37890, title: 'Overlord III' },
  { id: 38524, title: 'Shingeki no Kyojin: The Final Season' },
  { id: 36456, title: 'Violet Evergarden Gaiden: Eien to Jidou Shuki Ningyou' },
  { id: 39587, title: 'Kimetsu no Yaiba' },
  { id: 37779, title: 'Yakusoku no Neverland' },
  { id: 34591, title: 'Shingeki no Kyojin Season 3' },
  { id: 37510, title: 'Yagate Kimi ni Naru' },
  { id: 38254, title: 'Yakusoku no Neverland 2nd Season' },
  { id: 35983, title: 'Seishun Buta Yarou wa Bunny Girl Senpai no Yume wo Minai' },
  { id: 38003, title: 'Goblin Slayer' },
  { id: 37105, title: 'Tate no Yuusha no Nariagari' },
  { id: 37105, title: 'Tate no Yuusha no Nariagari' },
  { id: 36456, title: 'Violet Evergarden Gaiden: Eien to Jidou Shuki Ningyou' },
  { id: 34591, title: 'Shingeki no Kyojin Season 3' },
  { id: 34206, title: 'Mahoutsukai no Yome' },
  { id: 34437, title: 'Kaguya-sama wa Kokurasetai: Tensai-tachi no Renai Zunousen' },
  { id: 37140, title: 'Yakusoku no Neverland' },
  { id: 37510, title: 'Yagate Kimi ni Naru' },
  { id: 37999, title: 'Mob Psycho 100 II' },
  { id: 38003, title: 'Goblin Slayer' },
  { id: 35760, title: 'Tensei shitara Slime Datta Ken' },
  { id: 35849, title: 'Yuru Camp△' },
  { id: 36888, title: 'Darling in the FranXX' },
  { id: 33352, title: 'Boku no Hero Academia 3rd Season' },
  { id: 36633, title: 'Sword Art Online: Alicization' },
  { id: 37890, title: 'Overlord III' },
  { id: 35073, title: 'Overlord II' },
  { id: 38003, title: 'Goblin Slayer' },
  { id: 33079, title: 'Re:Creators' },
  { id: 35983, title: 'Seishun Buta Yarou wa Bunny Girl Senpai no Yume wo Minai' },
  { id: 36456, title: 'Violet Evergarden Gaiden: Eien to Jidou Shuki Ningyou' },
  { id: 36862, title: 'Attack on Titan: Lost Girls' },
  { id: 37987, title: 'Violet Evergarden' },
  { id: 36885, title: 'Sora yori mo Tooi Basho' },
  { id: 33079, title: 'Re:Creators' },
  { id: 31953, title: 'Kimi no Na wa.' },
  { id: 35180, title: 'Fate/Apocrypha' },
  { id: 36456, title: 'Violet Evergarden Gaiden: Eien to Jidou Shuki Ningyou' },
  { id: 32182, title: 'Kono Subarashii Sekai ni Shukufuku wo!' },
  { id: 32979, title: 'Re:Zero kara Hajimeru Isekai Seikatsu 2nd Season' },
  { id: 31240, title: 'Youjo Senki' },
  { id: 37779, title: 'Yakusoku no Neverland' },
  { id: 38003, title: 'Goblin Slayer' },
  { id: 38691, title: 'Sword Art Online: Alicization - War of Underworld' },
  { id: 36793, title: 'Made in Abyss' },
  { id: 36862, title: 'Attack on Titan: Lost Girls' },
  { id: 31859, title: 'Yahari Ore no Seishun Love Comedy wa Machigatteiru. Zoku' },
  { id: 33486, title: 'Boku no Hero Academia 2nd Season' },
  { id: 31953, title: 'Kimi no Na wa.' },
  { id: 37779, title: 'Yakusoku no Neverland' },
  { id: 36888, title: 'Darling in the FranXX' },
  { id: 36888, title: 'Darling in the FranXX' },
  { id: 34437, title: 'Kaguya-sama wa Kokurasetai: Tensai-tachi no Renai Zunousen' },
  { id: 35247, title: 'ReLIFE: Kanketsu-hen' },
  { id: 34662, title: 'Violet Evergarden' },
  { id: 33352, title: 'Boku no Hero Academia 3rd Season' },
  { id: 37510, title: 'Yagate Kimi ni Naru' },
  { id: 37999, title: 'Mob Psycho 100 II' },
  { id: 36793, title: 'Made in Abyss' },
  { id: 37690, title: 'Sword Art Online: Alicization - War of Underworld' },
  { id: 35073, title: 'Overlord II' },
  { id: 37200, title: 'Boku no Hero Academia 3rd Season' },
  { id: 31859, title: 'Yahari Ore no Seishun Love Comedy wa Machigatteiru. Zoku' },
  { id: 36511, title: 'Shingeki no Kyojin Season 3 Part 2' },
  { id: 32081, title: 'Gate: Jieitai Kanochi nite, Kaku Tatakaeri 2nd Season' },
  { id: 36456, title: 'Violet Evergarden Gaiden: Eien to Jidou Shuki Ningyou' },
  { id: 38826, title: 'Tensei shitara Slime Datta Ken 2nd Season' },
  { id: 223, title: 'Dragon Ball' },
  { id: 813, title: 'Dragon Ball Z' },
  { id: 225, title: 'Dragon Ball GT' },
  { id: 527, title: 'Dragon Ball Z Kai' },
  { id: 30694, title: 'Dragon Ball Super' },
  { id: 906, title: 'Dragon Ball Z Movie 1: Ora no Gohan wo Kaese!!' },
  { id: 907, title: 'Dragon Ball Z Movie 2: Kono Yo de Ichiban Tsuyoi Yatsu' },
  { id: 908, title: 'Dragon Ball Z Movie 3: Chikyuu Marugoto Choukessen' },
  { id: 909, title: 'Dragon Ball Z Movie 4: Super Saiyajin da Son Gokuu' },
  { id: 910, title: 'Dragon Ball Z Movie 5: Tobikkiri no Saikyou tai Saikyou' },
  { id: 911, title: 'Dragon Ball Z Movie 6: Gekitotsu!! 100-oku Power no Senshi-tachi' },

  // One Piece Series
  { id: 21, title: 'One Piece' },
  { id: 512, title: 'One Piece: Episode of Nami - Koukaishi no Namida to Nakama no Kizuna' },
  { id: 836, title: 'One Piece: Episode of Alabasta - Sabaku no Oujo to Kaizoku-tachi' },
  { id: 1698, title: 'One Piece: Episode of Chopper Plus - Fuyu ni Saku, Kiseki no Sakura' },
  { id: 3702, title: 'One Piece: Strong World' },
  { id: 4929, title: 'One Piece 3D: Mugiwara Chase' },
  { id: 8265, title: 'One Piece Film: Z' },
  { id: 12029, title: 'One Piece: Episode of Luffy - Hand Island no Bouken' },
  { id: 1735, title: 'One Piece Film: Gold' },
  { id: 12979, title: 'One Piece: Heart of Gold' },
  { id: 3783, title: 'One Piece: Adventure of Nebulandia' },
  { id: 37982, title: 'One Piece: Stampede' }

];

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
    console.log(`Données des personnages de l'anime ${animeTitle} :`, JSON.stringify(data, null, 2));

    if (!data.data) {
      throw new Error("Données inattendues : " + JSON.stringify(data));
    }

    return data.data.map(item => {
      const character = item.character;
      return {
        name: character.name,
        image: character.images.jpg.image_url,
        price: Math.floor(Math.random() * (1500 - 500 + 1)) + 500,
        collection: animeTitle
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  await connectToMongoDB();

  for (const anime of animeList) {
    const characters = await fetchAnimeCharacters(anime.id, anime.title);
    if (characters.length > 0) {
      await insertCharacters(characters);
    }
    await sleep(1000); // Pause de 1 seconde entre les requêtes pour éviter le rate limit
  }

  await mongoClient.close();
}

main().catch(console.error);
