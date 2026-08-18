const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = "och";

// =========================
// DATABASE
// =========================

const DATABASE_FILE = "./fish_collection.json";

let fishData = {};

if (fs.existsSync(DATABASE_FILE)) {
    fishData = JSON.parse(
        fs.readFileSync(DATABASE_FILE, "utf8")
    );
}

function saveDatabase() {
    fs.writeFileSync(
        DATABASE_FILE,
        JSON.stringify(fishData, null, 2),
        "utf8"
    );
}

// =========================
// FISH
// =========================

const COMMON_FISH = [
    "Cá cơm", "Cá trích", "Cá mòi", "Cá nục", "Cá bạc má",
    "Cá thu", "Cá ngừ", "Cá đối", "Cá bống", "Cá kèo",
    "Cá dìa", "Cá hồng", "Cá đổng", "Cá đù", "Cá mối",
    "Cá chuồn", "Cá chỉ vàng", "Cá liệt", "Cá chim trắng", "Cá sòng",
    "Cá rô biển", "Cá nóc", "Cá mú nhỏ", "Cá bơn", "Cá thia",
    "Cá đuôi gai", "Cá mó", "Cá dìa bông", "Cá sặc biển", "Cá bướm"
];

const RARE_FISH = [
    "Cá mú đỏ", "Cá mú nghệ", "Cá hồng đỏ", "Cá chim trắng lớn",
    "Cá cam", "Cá thu ngàng", "Cá ngừ vây vàng", "Cá ngừ mắt to",
    "Cá kiếm", "Cá cờ", "Cá bớp", "Cá chẽm", "Cá hồng vện",
    "Cá mú cọp", "Cá mú sao", "Cá nâu", "Cá đối mục",
    "Cá dìa sọc", "Cá mặt quỷ", "Cá mao tiên"
];

const SUPER_RARE_FISH = [
    "Cá ngừ vây xanh",
    "Cá mập voi",
    "Cá mặt trăng",
    "Cá mái chèo",
    "Cá rồng biển",
    "Cá oarfish khổng lồ",
    "Cá nhám voi",
    "Cá kiếm đen",
    "Cá cờ xanh",
    "Cá quỷ biển sâu"
];

const SPECIAL_FISH = [
    "Cá Vua Đại Dương",
    "Cá Hoàng Kim",
    "Cá Long Thần",
    "Cá Nguyệt Hải",
    "Cá Ocean Emperor"
];

// =========================
// NGƯỜI ĐANG CÂU
// =========================

const catching = new Set();

// =========================
// RANDOM CÁ
// =========================

function getFish() {

    const chance = Math.random() * 100;

    if (chance < 60) {
        return {
            fish: COMMON_FISH[
                Math.floor(Math.random() * COMMON_FISH.length)
            ],
            rarity: "Cá thường",
            emoji: "🐟"
        };
    }

    if (chance < 90) {
        return {
            fish: RARE_FISH[
                Math.floor(Math.random() * RARE_FISH.length)
            ],
            rarity: "Cá hiếm",
            emoji: "🐠"
        };
    }

    if (chance < 99.5) {
        return {
            fish: SUPER_RARE_FISH[
                Math.floor(Math.random() * SUPER_RARE_FISH.length)
            ],
            rarity: "Cá siêu hiếm",
            emoji: "🌊"
        };
    }

    return {
        fish: SPECIAL_FISH[
            Math.floor(Math.random() * SPECIAL_FISH.length)
        ],
        rarity: "Cá đặc biệt",
        emoji: "👑"
    };
}

// =========================
// MESSAGE
// =========================

client.on("messageCreate", async (message) => {

    if (message.author.bot) return;

    const args = message.content.trim().split(/\s+/);

    if (args[0].toLowerCase() !== PREFIX) return;

    const command = args[1]?.toLowerCase();

    // =========================
    // OCH CATCH
    // =========================

    if (command === "catch") {

        const userId = message.author.id;

        if (catching.has(userId)) {
            return message.reply(
                "🎣 M đang câu cá rồi! Hãy đợi **30 giây**."
            );
        }

        catching.add(userId);

        await message.reply(
            "🎣 **Đã thả cần xuống biển!**\n" +
            "🌊 Cá đang cắn câu...\n" +
            "⏳ Thời gian câu: **30 giây**"
        );

        setTimeout(async () => {

            const result = getFish();

            if (!fishData[userId]) {
                fishData[userId] = {};
            }

            if (!fishData[userId][result.fish]) {
                fishData[userId][result.fish] = 0;
            }

            fishData[userId][result.fish]++;

            saveDatabase();

            const embed = new EmbedBuilder()
                .setTitle("🎣 CÂU CÁ THÀNH CÔNG!")
                .setDescription(
                    `${result.emoji} **${message.author.displayName}** đã câu được:\n\n` +
                    `## ${result.emoji} ${result.fish}\n\n` +
                    `🌟 Độ hiếm: **${result.rarity}**`
                )
                .setColor(
                    result.rarity === "Cá đặc biệt"
                        ? 0xFFD700
                        : result.rarity === "Cá siêu hiếm"
                        ? 0x9B59B6
                        : result.rarity === "Cá hiếm"
                        ? 0x3498DB
                        : 0x95A5A6
                )
                .setFooter({
                    text: "Ocean Catch • och catch"
                });

            await message.channel.send({
                embeds: [embed]
            });

            catching.delete(userId);

        }, 30000);
    }

    // =========================
    // OCH BST
    // =========================

    if (command === "bst") {

        const userId = message.author.id;

        if (
            !fishData[userId] ||
            Object.keys(fishData[userId]).length === 0
        ) {
            return message.reply(
                "📖 **Bộ sưu tập cá**\n\n" +
                "🌊 M chưa bắt được con cá nào!"
            );
        }

        const collection = fishData[userId];

        let text = "";

        let total = 0;
        let unique = 0;

        for (const fish in collection) {

            total += collection[fish];
            unique++;

            text += `• ${fish} × **${collection[fish]}**\n`;
        }

        const embed = new EmbedBuilder()
            .setTitle(
                `📖 Bộ sưu tập của ${message.author.displayName}`
            )
            .setDescription(text)
            .addFields({
                name: "📊 Thống kê",
                value:
                    `🐟 Tổng cá đã bắt: **${total}**\n` +
                    `📚 Cá khác nhau: **${unique}/65**`
            })
            .setColor(0x3498DB)
            .setFooter({
                text: "Ocean Catch • och bst"
            });

        await message.reply({
            embeds: [embed]
        });
    }
});

// =========================
// READY
// =========================

client.once("ready", () => {

    console.log(
        `🌊 Ocean Catch đã online: ${client.user.tag}`
    );

});

// =========================
// LOGIN
// =========================

client.login(process.env.DISCORD_TOKEN);