const mineflayer = require('mineflayer');
const collectBlock = require('mineflayer-collectblock').plugin;

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: 'mineflayer',
});

bot.loadPlugin(collectBlock);

// mcData nach dem Login laden
let mcData;
bot.once('login', () => {
  mcData = require('minecraft-data')(bot.version);
});


// Funktion, um Baumstämme im Inventar zu zählen
function countLogsInInventory() {
  const logTypes = ['oak_log', 'spruce_log', 'birch_log', 'jungle_log', 'acacia_log', 'dark_oak_log'];
  let totalLogs = 0;

  for (const type of logTypes) {
    const item = bot.inventory.items().find(item => item.name === type);
    if (item) {
      totalLogs += item.count;
    }
  }

  return totalLogs;
}

// Auf Chat-Nachrichten warten
bot.on('chat', async (username, message) => {
    const args = message.split(' ');
    if (args[0] !== 'chop') return;
  
    let type = 'oak_log';  // Standardmäßig Eichenstämme
    if (args.length >= 2) type = args[1];
  
    // Bot schreibt "start" in den Chat, bevor der Farmprozess beginnt
    bot.chat('start');
  
    // Schleife, bis wir 64 Baumstämme haben
    while (countLogsInInventory() < 64) {
      const blockType = mcData.blocksByName[type];
      if (!blockType) {
        bot.chat(`not found ${type}.`);
        return;
      }
  
      const blocks = bot.findBlocks({
        matching: blockType.id,
        maxDistance: 64,
        count: 64,
      });
  
      if (blocks.length === 0) {
        bot.chat("nothing found");
        return;
      }
  
      const targets = [];
      for (const block of blocks) {
        targets.push(bot.blockAt(block));
      }
  
      bot.chat(`Gefunden ${targets.length} ${type}(s)`);
  
      try {
        await bot.collectBlock.collect(targets);
        bot.chat('done');
      } catch (err) {
        bot.chat(err.message);
        console.log(err);
      }
    }
  });

// Maximale Entfernung in Blöcken für den Bot zum Angreifen
  const maxDistance = 5; 

bot.on('physicTick', () => {
  const mobFilter = e => e.type === 'mob' && (e.displayName === 'Zombie' || e.displayName === 'Skeleton'|| e.displayName === 'Spider');
  const mob = bot.nearestEntity(mobFilter);

  if (mob) {
    const distance = bot.entity.position.distanceTo(mob.position);

    if (distance < maxDistance) {
      bot.lookAt(mob.position.offset(0, mob.height, 0), true);
      bot.attack(mob, true);
    }
  }
});
