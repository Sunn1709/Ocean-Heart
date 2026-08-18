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
// NGƯỜI ĐANG CÂU (chống spam)
// ========================================

const catching = new Set();
const CATCH_COOLDOWN_MS = 3000; // 3 giây "đang câu"

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
            emoji: "🌊",
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
// HELPER: lấy dữ liệu cá của 1 user
// ========================================

function getUserData(userId) {
    if (!fishData[userId]) {
        fishData[userId] = {
            totalCaught: 0,
            fishes: {} // { "Tên cá": số lượng }
        };
    }
    return fishData[userId];
}

function addFishToUser(userId, fishName) {
    const userData = getUserData(userId);
    userData.totalCaught += 1;
    userData.fishes[fishName] = (userData.fishes[fishName] || 0) + 1;
    saveDatabase();
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
                "🎣 `och catch` — Câu cá\n" +
                "📖 `och bst` — Xem bộ sưu tập cá"
            );
        }

        // ========================================
        // OCH CATCH
        // ========================================

        if (command === "catch") {

            const userId = message.author.id;

            if (catching.has(userId)) {
                return message.reply(
                    "🎣 Bạn đang câu cá rồi, chờ chút nhé!"
                );
            }

            catching.add(userId);

            const waitingMsg = await message.reply("🎣 Đang thả cần câu...");

            setTimeout(async () => {
                try {
                    const result = getFish();

                    addFishToUser(userId, result.fish);

                    const embed = new EmbedBuilder()
                        .setColor(result.color)
                        .setTitle(`${result.emoji} Bạn câu được ${result.fish}!`)
                        .setDescription(`Độ hiếm: **${result.rarity}**`)
                        .setFooter({ text: `Người câu: ${message.author.username}` })
                        .setTimestamp();

                    await waitingMsg.edit({ content: null, embeds: [embed] });

                } catch (err) {
                    console.error("❌ Lỗi khi xử lý kết quả câu cá:", err);
                    await waitingMsg.edit("❌ Có lỗi xảy ra khi câu cá, thử lại nhé!");
                } finally {
                    catching.delete(userId);
                }
            }, CATCH_COOLDOWN_MS);

            return;
        }

        // ========================================
        // OCH BST (Bộ sưu tập)
        // ========================================

        if (command === "bst") {

            const userId = message.author.id;
            const userData = getUserData(userId);

            const fishNames = Object.keys(userData.fishes);

            if (fishNames.length === 0) {
                return message.reply(
                    "📖 Bạn chưa câu được con cá nào cả. Gõ `och catch` để bắt đầu!"
                );
            }

            const lines = fishNames
                .sort((a, b) => userData.fishes[b] - userData.fishes[a])
                .map(name => `• ${name}: **${userData.fishes[name]}**`);

            const embed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setTitle(`📖 Bộ sưu tập cá của ${message.author.username}`)
                .setDescription(lines.join("\n"))
                .setFooter({ text: `Tổng số cá đã câu: ${userData.totalCaught}` })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // ========================================
        // LỆNH KHÔNG TỒN TẠI
        // ========================================

        return message.reply(
            "❓ Lệnh không tồn tại. Gõ `och` để xem danh sách lệnh."
        );

    } catch (error) {
        console.error("❌ Lỗi trong messageCreate:", error);
    }
});

// ========================================
// READY
// ========================================

client.once("ready", () => {
    console.log(`✅ Bot đã đăng nhập với tên ${client.user.tag}`);
});

// ========================================
// ERROR HANDLING TOÀN CỤC
// (giúp tránh crash exit 1 do lỗi không bắt được)
// ========================================

process.on("unhandledRejection", (error) => {
    console.error("❌ Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught exception:", error);
});

// ========================================
// LOGIN
// ========================================

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
    console.error(
        "❌ Không tìm thấy DISCORD_TOKEN trong biến môi trường. " +
        "Vào Render → Environment → thêm biến DISCORD_TOKEN với token bot của bạn."
    );
    process.exit(1);
}

client.login(TOKEN);