const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ]
});

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

let dbClient;
client.on('guildCreate', async (guild) => {
    // Essayer de trouver le canal "general"
    let channel = guild.channels.cache.find(
        channel => channel.name === 'général' && channel.type === 'GUILD_TEXT' && channel.permissionsFor(guild.members.me).has('SendMessages')
      );
    
      // Si le canal "general" n'est pas trouvé, prendre le premier canal textuel disponible où le bot peut envoyer des messages
      if (!channel) {
        channel = guild.channels.cache.find(
          channel => channel.type === 'GUILD_TEXT' && channel.permissionsFor(guild.members.me).has('SendMessages')
        );
      }
    
      // Si aucun canal approprié n'est trouvé, log l'erreur et sortir
      if (!channel) {
        console.log(`Could not find a suitable channel in guild ${guild.name}`);
        return;
      }
  
    const embed = new EmbedBuilder()
      .setTitle('👋 Bienvenue à KudoriBot !')
      .setDescription(`Merci d'avoir ajouté KudoriBot à votre serveur ! Voici quelques commandes pour commencer :`)
      .setColor('#00FF00')
      .addFields(
        { name: '🎲 **!roll**', value: 'Lancez un rouleau pour obtenir un personnage aléatoire.' },
        { name: '🔄 **!resetrolls**', value: 'Réinitialisez les rouleaux pour tous les utilisateurs (administrateur seulement).' },
        { name: '📚 **!collection**', value: 'Affichez votre collection de personnages ou celle d\'un autre utilisateur en mentionnant son nom. Utilisez les boutons pour naviguer entre les personnages.' },
        { name: '🔍 **!find <nom du personnage>**', value: 'Recherchez un personnage par son nom et affichez ses détails.' },
        { name: '💰 **!sell <nom de l\'objet>**', value: 'Vendez un objet de votre collection et recevez des pièces.' },
        { name: '💵 **!monnaie**', value: 'Affichez votre solde de pièces.' },
        { name: '📦 **!buyPack**', value: 'Achetez un paquet de 5 objets pour 10 000 pièces.' },
        { name: '🤝 **!proposeEchange @utilisateur <objet1> <objet2>**', value: 'Proposez un échange d\'objets avec un autre utilisateur. L\'utilisateur peut accepter ou refuser l\'échange.' }
      )
      .setFooter({ text: 'Utilisez ces commandes pour interagir avec KudoriBot et gérer votre collection de personnages. Amusez-vous bien!' });
  
    await channel.send({ embeds: [embed] });
  });
client.once('ready', async () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
  dbClient = await connectToMongoDB();
});

async function getUserData(userId) {
  const collection = dbClient.db(dbName).collection('users');
  let user = await collection.findOne({ userId });

  if (!user) {
    user = {
      userId,
      rollsRemaining: 10,
      lastRollTime: 0,
      lastClaimTime: 0,
      collection: [],
      balance: 0
    };
    await collection.insertOne(user);
  } else {
    if (!user.collection) {
      user.collection = [];
    }
    if (typeof user.balance !== 'number') {
      user.balance = 0;
    }
    await collection.updateOne({ userId }, { $set: { collection: user.collection, balance: user.balance } });
  }

  return user;
}

async function updateUserData(userId, data) {
  const collection = dbClient.db(dbName).collection('users');
  await collection.updateOne({ userId }, { $set: data });
}

async function findCharacterByName(name) {
  const collection = dbClient.db(dbName).collection('characters');
  const character = await collection.findOne({ name: { $regex: new RegExp(name, 'i') } });
  return character;
}

async function isCharacterClaimed(characterName) {
  const collection = dbClient.db(dbName).collection('users');
  const users = await collection.find().toArray();
  for (const user of users) {
    if (user.collection && user.collection.some(char => char.name === characterName)) {
      return user.userId;
    }
  }
  return null;
}

async function claimCharacter(userId, character) {
  const user = await getUserData(userId);
  user.collection.push(character);
  await updateUserData(userId, {
    collection: user.collection
  });
}

async function getRandomCharacter() {
  const collection = dbClient.db(dbName).collection('characters');
  const randomCharacter = await collection.aggregate([{ $sample: { size: 1 } }]).toArray();
  return randomCharacter[0];
}

async function getRandomCharacters(count) {
  const collection = dbClient.db(dbName).collection('characters');
  const randomCharacters = await collection.aggregate([{ $sample: { size: count } }]).toArray();
  return randomCharacters;
}

let tradeProposals = {};  // Stocker les propositions d'échange

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!roll')|| message.content.startsWith('!r')) {
    const userId = message.author.id;
    const user = await getUserData(userId);
    const now = Date.now();

    if (user.rollsRemaining === 0 && now - user.lastRollTime < 30 * 60 * 1000) {
      return message.channel.send(`Vous devez attendre ${(30 - (now - user.lastRollTime) / 60000).toFixed(1)} minutes avant de rouler à nouveau.`);
    }

    if (user.rollsRemaining === 0 && now - user.lastRollTime >= 30 * 60 * 1000) {
      await updateUserData(userId, {
        rollsRemaining: 10,
        lastRollTime: now
      });
      user.rollsRemaining = 10;
    }

    if (user.rollsRemaining <= 0) {
      return message.channel.send('Vous n\'avez plus de rouleaux restants.');
    }

    const character = await getRandomCharacter();
    if (!character) {
      return message.channel.send('Aucun personnage trouvé.');
    }

    console.log('Character rolled:', character);

    const claimedBy = await isCharacterClaimed(character.name);

    const embed = new EmbedBuilder()
    .setTitle(character.name) // Ajoutez le titre de l'anime ici
    .setImage(character.image)
    .addFields(
        { name: '💎', value: character.price.toString(), inline: true },
        { name: 'Collection', value: character.collection, inline: true } // Ajouter la collection
      )

    if (claimedBy) {
      const claimedByUser = await client.users.fetch(claimedBy);
      embed.setFooter({ text: `${claimedByUser.username} a déjà cette carte` });
    }

    // Ajouter le message de rouleaux restants si <= 3
    if (user.rollsRemaining <= 3) {
      embed.addFields({ name: 'Info', value: `Il vous reste ${user.rollsRemaining} roll${user.rollsRemaining > 1 ? 's' : ''}.` });
    }

    const rollMessage = await message.channel.send({ embeds: [embed] });
    await rollMessage.react('👍');

    await updateUserData(userId, {
      rollsRemaining: user.rollsRemaining - 1,
      lastRollTime: user.rollsRemaining === 1 ? now : user.lastRollTime
    });

    const filter = (reaction, user) => {
      return reaction.emoji.name === '👍' && user.id !== rollMessage.author.id;
    };

    const collector = rollMessage.createReactionCollector({ filter, max: 1, time: 15 * 60 * 1000 });

    collector.on('collect', async (reaction, user) => {
      const userData = await getUserData(user.id);
      const now = Date.now();

      if (now - userData.lastClaimTime < 3 * 60 * 60 * 1000) {
        return message.channel.send(`Vous devez attendre ${(3 - (now - userData.lastClaimTime) / 3600000).toFixed(1)} heures avant de revendiquer à nouveau.`);
      }

      await updateUserData(user.id, {
        lastClaimTime: now
      });

      await claimCharacter(user.id, character);

      message.channel.send(`${user.username} a volé et revendiqué ${character.name}!`);
    });

    collector.on('end', async collected => {
      if (!collected.size) {
        await claimCharacter(rollMessage.author.id, character);
        message.channel.send(`${rollMessage.author.username} a revendiqué ${character.name}.`);
      }
    });
  } else if (message.content.startsWith('!resetrolls')|| message.content.startsWith('!rr')) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.channel.send('Vous n\'avez pas la permission de réinitialiser les rouleaux.');
    }

    const collection = dbClient.db(dbName).collection('users');
    await collection.updateMany({}, { $set: { rollsRemaining: 10, lastRollTime: 0 } });

    message.channel.send('Tous les rouleaux ont été réinitialisés.');
  } else if (message.content.startsWith('!collection')|| message.content.startsWith('!c')) {
    const args = message.content.split(' ');
    let userId;

    if (args.length === 1) {
      userId = message.author.id;
    } else {
      const targetUserMention = args[1];
      userId = targetUserMention.replace(/[<@!>]/g, '');
    }

    const user = await getUserData(userId);
    const targetUser = await client.users.fetch(userId);

    if (!user.collection || user.collection.length === 0) {
      return message.channel.send(`${targetUser.username} n'a pas de collection.`);
    }

    let page = 0;
    const character = user.collection[page];

    const embed = new EmbedBuilder()
    .setTitle(character.name) // Ajoutez le titre de l'anime ici
    .setImage(character.image)
    .addFields(
        { name: '💎', value: character.price.toString(), inline: true },
        { name: 'Collection', value: character.collection, inline: true } // Ajouter la collection
      )
    .setFooter({ text: `Personnage ${page + 1} sur ${user.collection.length}` });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('previous')
          .setLabel('Précédent')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Suivant')
          .setStyle(ButtonStyle.Primary)
      );

    const collectionMessage = await message.channel.send({ embeds: [embed], components: [row] });

    const collector = collectionMessage.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async i => {
      if (i.user.id !== message.author.id) return;

      if (i.customId === 'previous') {
        page = page > 0 ? page - 1 : user.collection.length - 1;
      } else if (i.customId === 'next') {
        page = page + 1 < user.collection.length ? page + 1 : 0;
      }

      const character = user.collection[page];

      const embed = new EmbedBuilder()
      .setTitle(character.name) // Ajoutez le titre de l'anime ici
      .setImage(character.image)
      .addFields(
        { name: '💎', value: character.price.toString(), inline: true },
        { name: 'Collection', value: character.collection, inline: true } // Ajouter la collection
      )
      .setFooter({ text: `Personnage ${page + 1} sur ${user.collection.length}` });

      await i.update({ embeds: [embed] });
    });

    collector.on('end', collected => {
      collectionMessage.edit({ components: [] });
    });
} else if (message.content.startsWith('!find') || message.content.startsWith('!f')) {
    const searchQuery = message.content.replace(/!find |!f /, '').trim();
    if (!searchQuery) {
      return message.channel.send('Veuillez fournir un nom de personnage à rechercher.');
    }
  
    const character = await findCharacterByName(searchQuery);
    if (!character) {
      return message.channel.send(`Aucun personnage trouvé pour la recherche : ${searchQuery}`);
    }
  
    const images = [character.image];
    if (character.gif) {
      images.push(character.gif);
    }
  
    let page = 0;
    const embed = new EmbedBuilder()
      .setTitle(character.name)
      .setImage(images[page])
      .addFields(
        { name: 'Prix', value: character.price.toString(), inline: true },
        { name: 'Collection', value: character.collection || 'Unknown', inline: true } // Ajoutez la collection ici
      )
      .setFooter({ text: `Image ${page + 1} sur ${images.length}` });
  
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('previous')
          .setLabel('Précédent')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Suivant')
          .setStyle(ButtonStyle.Primary)
      );
  
    const findMessage = await message.channel.send({ embeds: [embed], components: [row] });
  
    const collector = findMessage.createMessageComponentCollector({ time: 60000 });
  
    collector.on('collect', async i => {
      if (i.user.id !== message.author.id) return;
  
      if (i.customId === 'previous') {
        page = page > 0 ? page - 1 : images.length - 1;
      } else if (i.customId === 'next') {
        page = page + 1 < images.length ? page + 1 : 0;
      }
  
      const embed = new EmbedBuilder()
        .setTitle(character.name)
        .setImage(images[page])
        .addFields(
          { name: '💎', value: character.price.toString(), inline: true },
          { name: 'Collection', value: character.collection || 'Unknown', inline: true } // Ajoutez la collection ici
        )
        .setFooter({ text: `Image ${page + 1} sur ${images.length}` });
  
      await i.update({ embeds: [embed] });
    });
  
    collector.on('end', collected => {
      findMessage.edit({ components: [] });
    });
  }
  
   else if (message.content.startsWith('!sell')|| message.content.startsWith('!s')) {
    const itemName = message.content.replace('!sell ', '').trim();
    if (!itemName) {
      return message.channel.send('Veuillez fournir un nom d\'objet à vendre.');
    }

    const userId = message.author.id;
    const user = await getUserData(userId);
    const itemIndex = user.collection.findIndex(item => item.name.toLowerCase() === itemName.toLowerCase());

    if (itemIndex === -1) {
      return message.channel.send('Objet non trouvé dans votre collection.');
    }

    const [soldItem] = user.collection.splice(itemIndex, 1);
    const updatedBalance = (user.balance || 0) + (soldItem.price || 0);

    await updateUserData(userId, {
      collection: user.collection,
      balance: updatedBalance
    });

    return message.channel.send(`Vous avez vendu ${soldItem.name} pour ${soldItem.price} pièces. Votre solde est maintenant de ${updatedBalance} pièces.`);
  } else if (message.content.startsWith('!monnaie')|| message.content.startsWith('!m')) {
    const userId = message.author.id;
    const user = await getUserData(userId);

    return message.channel.send(`Votre solde est de ${user.balance} pièces.`);
  } else if (message.content.startsWith('!buypack')|| message.content.startsWith('!bp')) {
    const userId = message.author.id;
    const user = await getUserData(userId);

    if (user.balance < 10000) {
      return message.channel.send('Vous n\'avez pas assez de pièces pour acheter un paquet. Il vous faut 10 000 pièces.');
    }

    const randomCharacters = await getRandomCharacters(5);
    user.collection.push(...randomCharacters);
    user.balance -= 10000;

    await updateUserData(userId, {
      collection: user.collection,
      balance: user.balance
    });

    const embed = new EmbedBuilder()
      .setTitle('Paquet acheté !')
      .setDescription('Vous avez acheté un paquet de 5 objets pour 10 000 pièces.')
      .addFields(randomCharacters.map(char => ({ name: char.name, value: `${char.price} pièces`, inline: true })))
      .setFooter({ text: `Votre nouveau solde est de ${user.balance} pièces.` });

    return message.channel.send({ embeds: [embed] });
  } else if (message.content.startsWith('!proposeEchange')|| message.content.startsWith('!pE')) {
    const args = message.content.split(' ').slice(1);
    const targetUserMention = args[0];
    const item1Name = args[1];
    const item2Name = args[2];

    if (!targetUserMention || !item1Name || !item2Name) {
      return message.channel.send('Utilisation: !proposeEchange @joueur2 nomObjet1 nomObjet2');
    }

    const targetUserId = targetUserMention.replace(/[<@!>]/g, '');
    const proposerUserId = message.author.id;

    const proposerUser = await getUserData(proposerUserId);
    const targetUser = await getUserData(targetUserId);

    const item1 = proposerUser.collection.find(item => item.name.toLowerCase() === item1Name.toLowerCase());
    const item2 = targetUser.collection.find(item => item.name.toLowerCase() === item2Name.toLowerCase());

    if (!item1 || !item2) {
      return message.channel.send('Objet non trouvé dans les collections des utilisateurs.');
    }

    tradeProposals[targetUserId] = {
      proposerUserId: proposerUserId,
      proposerItem: item1,
      targetItem: item2
    };

    const embed = new EmbedBuilder()
      .setTitle('Proposition d\'échange')
      .setDescription(`${message.author.username} propose d'échanger ${item1.name} contre ${item2.name}.`)
      .addFields(
        { name: 'Objet proposé', value: item1.name, inline: true },
        { name: 'Objet demandé', value: item2.name, inline: true }
      );

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('accepteEchange')
          .setLabel('Accepter')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('declineEchange')
          .setLabel('Refuser')
          .setStyle(ButtonStyle.Danger)
      );

    const proposalMessage = await message.channel.send({ content: `<@${targetUserId}>`, embeds: [embed], components: [row] });

    const filter = (interaction) => {
      return interaction.user.id === targetUserId;
    };

    const collector = proposalMessage.createMessageComponentCollector({ filter, max: 1, time: 60000 });

    collector.on('collect', async interaction => {
      if (interaction.customId === 'accepteEchange') {
        const proposerUser = await getUserData(tradeProposals[targetUserId].proposerUserId);
        const targetUser = await getUserData(targetUserId);

        proposerUser.collection = proposerUser.collection.filter(item => item.name !== tradeProposals[targetUserId].proposerItem.name);
        targetUser.collection = targetUser.collection.filter(item => item.name !== tradeProposals[targetUserId].targetItem.name);

        proposerUser.collection.push(tradeProposals[targetUserId].targetItem);
        targetUser.collection.push(tradeProposals[targetUserId].proposerItem);

        await updateUserData(tradeProposals[targetUserId].proposerUserId, { collection: proposerUser.collection });
        await updateUserData(targetUserId, { collection: targetUser.collection });

        delete tradeProposals[targetUserId];

        await interaction.update({ content: 'Échange accepté !', embeds: [], components: [] });
      } else if (interaction.customId === 'declineEchange') {
        delete tradeProposals[targetUserId];
        await interaction.update({ content: 'Échange refusé.', embeds: [], components: [] });
      }
    });

    collector.on('end', collected => {
      if (!collected.size) {
        delete tradeProposals[targetUserId];
        proposalMessage.edit({ content: 'Temps écoulé pour répondre à l\'échange.', embeds: [], components: [] });
      }
    });
  }else  if (message.content.startsWith('!help')) {
    const embed = new EmbedBuilder()
      .setTitle('🛠️ Aide des Commandes')
      .setDescription('Voici la liste des commandes disponibles avec leurs explications:')
      .setColor('#00FF00')
      .addFields(
        { name: '🎲 !roll ou !r', value: 'Lancez un rouleau pour obtenir un personnage aléatoire.' },
        { name: '🔄 !resetrolls ou !rr', value: 'Réinitialisez les rouleaux pour tous les utilisateurs (administrateur seulement).' },
        { name: '📚 !collection ou !c', value: 'Affichez votre collection de personnages ou celle d\'un autre utilisateur en mentionnant son nom. Utilisez les boutons pour naviguer entre les personnages.' },
        { name: '🔍 !find <nom du personnage> ou !f <nom du personnage>', value: 'Recherchez un personnage par son nom et affichez ses détails.' },
        { name: '💰 !sell <nom de l\'objet> ou !s <nom de l\'objet>', value: 'Vendez un objet de votre collection et recevez des pièces.' },
        { name: '💵 !monnaie ou !m', value: 'Affichez votre solde de pièces.' },
        { name: '📦 !buypack ou !bp ', value: 'Achetez un paquet de 5 objets pour 10 000 pièces.' },
        { name: '🤝 !proposeEchange @utilisateur <objet1> <objet2> ou !pE @utilisateur <objet1> <objet2>', value: 'Proposez un échange d\'objets avec un autre utilisateur. L\'utilisateur peut accepter ou refuser l\'échange.' }
      )
      .setFooter({ text: 'Utilisez ces commandes pour interagir avec le bot et gérer votre collection de personnages.' });

    return message.channel.send({ embeds: [embed] });
  }
});

client.login("MTI2MTM1NjM1ODE2NzQzMzMwNw.GeWade.V6qB2V-oNt8Pd-YOB9BjTFZXKuJf_c-dR2njvU");

// Fermer la connexion MongoDB de manière ordonnée lors de la terminaison du processus
process.on('SIGINT', async () => {
  if (dbClient) {
    await dbClient.close();
  }
  process.exit();
});
