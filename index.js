const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");

// ========================================
// DISCORD CLIENT
// ========================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = "och";
const DATABASE_FILE = "./fish_collection.json";

// ========================================
// DATABASE
// ========================================

let fishData = {};

try {
    if (fs.existsSync(DATABASE_FILE)) {
        const data = fs.readFileSync(DATABASE_FILE, "utf8");

        if (data.trim() !== "") {
            fishData = JSON.parse(data);
        }
    }
} catch (error) {
    console.error("❌ Không thể đọc fish_collection.json:");
    console.error(error);

    fishData = {};
}

function saveDatabase() {
    try {
        fs.writeFileSync(
            DATABASE_FILE,
            JSON.stringify(fishData, null, 2),
            "utf8"
        );
    } catch (error) {
        console.error("❌ Không thể lưu database:");
        console.error(error);
    }
}

// ========================================
// FISH LIST
// ========================================

const COMMON_FISH = [
    "Cá cơm", "Cá trích", "Cá mòi", "Cá nục", "Cá bạc má",
    "Cá thu", "Cá ngừ", "Cá đối", "Cá bống", "Cá kèo",
    "Cá dìa", "Cá hồng", "Cá đổng", "Cá đù", "Cá mối",
    "Cá chuồn", "Cá chỉ vàng", "Cá liệt", "Cá chim trắng", "Cá sòng",
    "Cá rô biển", "Cá nóc", "Cá mú nhỏ", "Cá bơn", "Cá thia",
    "Cá đuôi gai", "Cá mó", "Cá dìa bông", "Cá sặc biển", "Cá bướm"
];

const RARE_FISH = [
    "Cá mú đỏ", "Cá mú nghệ", "Cá hồng đỏ", "Cá chim trắng lớn", "Cá cam",
    "Cá thu ngàng", "Cá ngừ vây vàng", "Cá ngừ mắt to", "Cá kiếm", "Cá cờ",
    "Cá bớp", "Cá chẽm", "Cá hồng vện", "Cá mú cọp", "Cá mú sao",
    "Cá nâu", "Cá đối mục", "Cá dìa sọc", "Cá mặt quỷ", "Cá mao tiên"
];

const SUPER_RARE_FISH = [
    "Cá ngừ vây xanh", "Cá mập voi", "Cá mặt trăng", "Cá mái chèo", "Cá rồng biển",
    "Cá oarfish khổng lồ", "Cá nhám voi", "Cá kiếm đen", "Cá cờ xanh", "Cá quỷ biển sâu"
];

const SPECIAL_FISH = [
    "Cá Vua Đại Dương", "Cá Hoàng Kim", "Cá Long Thần", "Cá Nguyệt Hải", "Cá Ocean Emperor"
];

// ========================================
// NGƯỜI ĐANG CÂU
// ========================================

const catching = new Set();

// ========================================
// RANDOM CÁ
// ========================================

function getFish() {
    const chance = Math.random() * 100;

    // 60%
    if (chance < 60) {
        return {
            fish: COMMON_FISH[Math.floor(Math.random() * COMMON_FISH.length)],
            rarity: "Cá thường",
            emoji: "🐟",
            color: 0x95A5A6
        };
    }

    // 30%
    if (chance < 90) {
        return {
            fish: RARE_FISH[Math.floor(Math.random() * RARE_FISH.length)],
            rarity: "Cá hiếm",
            emoji: "🐠",
            color: 0x3498DB
        };
    }

    // 9.5%
    if (chance < 99.5) {
        return {
            fish: SUPER_RARE_FISH[Math.floor(Math.random() * SUPER_RARE_FISH.length)],
            rarity: "Cá siêu hiếm",
            emoji: "",
            color: 0x9B59B6
        };
    }

    // 0.5%
    return {
        fish: SPECIAL_FISH[Math.floor(Math.random() * SPECIAL_FISH.length)],
        rarity: "Cá đặc biệt",
        emoji: "👑",
        color: 0xFFD700
    };
}

// ========================================
// MESSAGE
// ========================================

client.on("messageCreate", async (message) => {
    try {
        if (message.author.bot) return;

        const content = message.content.trim();
        if (!content) return;

        const args = content.split(/\s+/);

        if (!args[0] || args[0].toLowerCase() !== PREFIX) {
            return;
        }

        const command = args[1]?.toLowerCase();

        // ========================================
        // OCH
        // ========================================

        if (!command) {
            return message.reply(
                "🌊 **Ocean Catch**\n\n" +
                "▫️ `och catch` — Câu cá\n" +
                "▫️ `och bst` — Xem bộ sưu tập cá"
            );
        }

        // ========================================
        // OCH CATCH
        // ========================================

        if (command === "catch") {
            const userId = message.author.id;

            if (catching.has(userId)) {
                return message.reply(
                    "⚠️ Bạn đang câu cá rồi!\n" +
                    "Hãy đợi đủ *30 giây*."
                );
            }

            catching.add(userId);

            await message.reply(
                "🎣 **Đã thả cần xuống biển!**\n" +
                "Cá đang cắn câu...\n" +
                "Thời gian câu: *30 giây*"
            );

            setTimeout(async () => {
                try {
                    const result = getFish();

                    // Tạo dữ liệu người chơi
                    if (!fishData[userId]) {
                        fishData[userId] = {};
                    }

                    // Tạo cá nếu chưa có
                    if (!fishData[userId][result.fish]) {
                        fishData[userId][result.fish] = 0;
                    }

                    // +1 cá
                    fishData[userId][result.fish]++;

                    saveDatabase();

                    const embed = new EmbedBuilder()
                        .setTitle("🎉 CÂU CÁ THÀNH CÔNG!")
                        .setDescription(
                            `${result.emoji} **${message.author.displayName}** đã câu được:\n\n` +
                            `## ${result.emoji} ${result.fish}\n\n` +
                            `🌟 Độ hiếm: **${result.rarity}**`
                        )
                        .setColor(result.color)
                        .setFooter({
                            text: "Ocean Catch • och catch"
                        });

                    await message.channel.send({
                        embeds: [embed]
                    });

                } catch (error) {
                    console.error("❌ Lỗi khi xử lý câu cá:", error);
                } finally {
                    catching.delete(userId);
                }
            }, 30000);

            return;
        }

        // ========================================
        // OCH BST
        // ========================================

        if (command === "bst") {
            const userId = message.author.id;

            if (
                !fishData[userId] ||
                Object.keys(fishData[userId]).length === 0
            ) {
                return message.reply(
                    "📖 **Bộ sưu tập cá**\n\n" +
                    "Bạn chưa bắt được con cá nào!"
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
                .setTitle(`📖 Bộ sưu tập của ${message.author.displayName}`)
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

            return message.reply({
                embeds: [embed]
            });
        }

        // ========================================
        // LỆNH KHÔNG TỒN TẠI
        // ========================================

        return message.reply(
            "❌ Lệnh không tồn tại.\n\n" +
            "Dùng:\n" +
            "▫️ `och catch`\n" +
            "▫️ `och bst`"
        );

    } catch (error) {
        console.error("❌ Lỗi messageCreate:", error);
    }
});

// ========================================
// BOT ONLINE
// ========================================

client.once("ready", () => {
    console.log("================================");
    console.log("🌊 OCEAN CATCH");
    console.log(`✅ Bot: ${client.user.tag}`);
    console.log(`🆔 ID: ${client.user.id}`);
    console.log("🚀 Bot đã sẵn sàng!");
    console.log("================================");
});

// ========================================
// LOGIN
// ========================================

let TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
    console.error("❌ LỖI: Không tìm thấy DISCORD_TOKEN!");
    console.error("Vào Render → Environment → thêm DISCORD_TOKEN");
    process.exit(1);
}

// Xóa khoảng trắng/dấu nháy nếu lỡ nhập vào Render
TOKEN = TOKEN.trim().replace(/^["']|["']$/g, "");

client.login(TOKEN)
    .then(() => {
        console.log("🔑 Đang đăng nhập Discord...");
    })
    .catch((error) => {
        console.error("❌ DISCORD LOGIN FAILED");

        if (error.code === "TokenInvalid") {
            console.error("Token Discord không hợp lệ!");
            console.error("Hãy Reset Token trong Discord Developer Portal.");
        } else {
            console.error(error);
        }

        process.exit(1);
    });