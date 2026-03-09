

## Plan: Logo Update, Paystack Key Change, and Crypto Deposit

### 1. Replace Logo Across Entire Website

The current logo is a Lucide `Sparkles` icon inside a gradient box + "HelpChain" text. It appears in these locations:

- **Navbar** (desktop logo, line 153-155 + mobile menu, line 403-404)
- **Footer** (line 15-16)
- **Pages using `Sparkles` as decorative badge**: about, careers, cookies, press, pricing, home — these are decorative badges, not the logo itself

**Plan**: Replace the `Sparkles` icon in navbar and footer logo blocks with an `<img>` tag pointing to the uploaded logo image (`/attached_assets/Add_a_heading_(1)_1767580744067.png`). Copy the image to `client/public/images/helpchain-logo.png` for proper serving. Keep the "HelpChain" text alongside it. The decorative `Sparkles` badges on other pages are not the logo and will remain as-is unless you want those changed too.

Also update `client/public/favicon.png` and `index.html` favicon reference if applicable.

### 2. Update Paystack Key

The key you provided (`pk_live_17a0eb470f2f5942f1c358591b5082c757611228`) is a **public key** (starts with `pk_`). The existing `PAYSTACK_SECRET_KEY` secret is the **secret key** used server-side for API calls — that's a different key.

- The public key is safe to store in the codebase and is currently not used anywhere (the deposit flow uses server-side initialization which only needs the secret key).
- If you want to **replace the secret key**, I will use the secrets tool to update `PAYSTACK_SECRET_KEY` with the corresponding secret key (which starts with `sk_live_`). You'll need to provide the **secret key** from your Paystack dashboard.
- I can also add `VITE_PAYSTACK_PUBLIC_KEY` to the `.env`-equivalent or hardcode the public key in the frontend for inline Paystack popup usage instead of redirect-based flow.

### 3. Add Crypto Deposit (USDC on Solana)

Currently the wallet only supports **fiat deposit** (Paystack) and has Phantom wallet **connection** for withdrawals. There is no crypto deposit flow.

**Plan**:
- Add a **"Crypto" deposit method** option in the deposit modal alongside Card/Bank Transfer
- When selected, display a **Solana USDC deposit address** (platform treasury wallet) with a copy button
- Add a QR code display for the address
- Create a backend endpoint (`POST /wallet/deposit/crypto`) that an admin or automated process can use to confirm on-chain deposits
- For MVP: Show the treasury address + instructions ("Send USDC on Solana to this address. Deposits are confirmed within 5 minutes.") with manual admin verification
- For future: Add on-chain monitoring via Helius/Shyft webhooks

**Implementation files to modify**:
- `client/src/components/layout/navbar.tsx` — replace Sparkles icon with logo image (2 places)
- `client/src/components/layout/footer.tsx` — replace Sparkles icon with logo image
- `client/src/pages/wallet.tsx` — add crypto deposit method in deposit modal
- `supabase/functions/wallet-api/index.ts` — add crypto deposit confirmation endpoint
- Copy logo image to `client/public/images/helpchain-logo.png`

**Questions to clarify**: Do you have a Solana treasury wallet address for receiving crypto deposits? And is the key you provided (`pk_live_...`) meant to replace the secret key, or should I add it as the public key alongside the existing secret key?

