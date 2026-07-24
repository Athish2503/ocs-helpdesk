import { prisma } from "../config/prisma.js";
async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error("❌ Please provide an email address. Example: npx tsx src/utils/promote-admin.ts user@example.com");
        process.exit(1);
    }
    try {
        const user = await prisma.user.update({
            where: { email: email.toLowerCase().trim() },
            data: {
                role: "ADMIN",
                emailVerified: true,
                isActive: true,
            },
        });
        console.log(`🎉 Success! User ${user.name} (${user.email}) has been promoted to ADMIN, active, and verified.`);
    }
    catch (error) {
        console.error(`❌ Error promoting user: ${error.message}`);
        process.exit(1);
    }
}
main();
