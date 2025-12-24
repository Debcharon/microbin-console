This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
API_BASE_URL=https://api.link.microbin.dev
ADMIN_TOKEN=your-secret-admin-token
NEXT_PUBLIC_REDIRECT_BASE_URL=https://link.microbin.dev
CONSOLE_PASSWORD=your-console-password
```

### Required Variables

- `API_BASE_URL`: The URL of the Microbin API
- `ADMIN_TOKEN`: Your admin token for the API
- `NEXT_PUBLIC_REDIRECT_BASE_URL`: The base URL for generated short links
- `CONSOLE_PASSWORD`: The password required to access the console

### Optional Branding Variables

You can customize the console's branding by setting these optional environment variables. If not set, default values will be used.

#### Server-side Metadata (affects browser tab)
- `SITE_TITLE`: Browser tab title (default: `Microbin Console`)
- `SITE_DESCRIPTION`: Page meta description (default: `Microbin short link console`)

#### Client-side Branding (affects visible page content)
- `NEXT_PUBLIC_SITE_TITLE`: Main page heading (default: `Microbin Console`)
- `NEXT_PUBLIC_SITE_SUBTITLE`: Page subtitle (default: `创建自定义路径短链接（跳转）`)
- `NEXT_PUBLIC_HEADER_LINK_TEXT`: Text for the top-right header link (default: `link.microbin.dev`)
- `NEXT_PUBLIC_HEADER_LINK_HREF`: URL for the top-right header link (default: `https://link.microbin.dev`)

**Deployment on Vercel or other platforms**: Set these environment variables in your platform's dashboard (e.g., Vercel Project Settings → Environment Variables). Variables prefixed with `NEXT_PUBLIC_` will be exposed to the browser, while others remain server-side only.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You will be redirected to the login page. Enter the password you configured in `CONSOLE_PASSWORD` to access the console.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
