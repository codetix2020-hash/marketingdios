import { auth } from "@repo/auth";
import { createUser, createUserAccount, getUserByEmail } from "@repo/database";
import { nanoid } from "nanoid";

async function main() {
	const email = process.argv[2] || "codetix2020@gmail.com";
	const name = process.argv[3] || "CodeTix Admin";

	console.log(`Creating admin user: ${email}`);

	const authContext = await auth.$context;
	const adminPassword = nanoid(16);
	const hashedPassword = await authContext.password.hash(adminPassword);

	// check if user exists
	const existingUser = await getUserByEmail(email);

	if (existingUser) {
		console.error("❌ User with this email already exists!");
		process.exit(1);
	}

	const adminUser = await createUser({
		email,
		name,
		role: "admin",
		emailVerified: true,
		onboardingComplete: true,
	});

	if (!adminUser) {
		console.error("❌ Failed to create user!");
		process.exit(1);
	}

	await createUserAccount({
		userId: adminUser.id,
		providerId: "credential",
		accountId: adminUser.id,
		hashedPassword,
	});

	console.log("✅ Admin user created successfully!");
	console.log(`📧 Email: ${email}`);
	console.log(`👤 Name: ${name}`);
	console.log(`🔑 Password: ${adminPassword}`);
	console.log("\n⚠️  SAVE THIS PASSWORD - IT WON'T BE SHOWN AGAIN!");
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("❌ Error:", error);
		process.exit(1);
	});

