This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# API Configuration
API_BASE_URL=https://api.link.microbin.dev
ADMIN_TOKEN=your-secret-admin-token

# Public Configuration
NEXT_PUBLIC_REDIRECT_BASE_URL=https://link.microbin.dev

# Console Authentication
CONSOLE_PASSWORD=your-console-password

# Site Branding (Server-side - used in page metadata)
SITE_TITLE=Microbin Console
SITE_DESCRIPTION=Create custom path short links with 301 redirects

# Site Branding (Client-side - used in page UI)
NEXT_PUBLIC_SITE_TITLE=Microbin Console
NEXT_PUBLIC_SITE_SUBTITLE=创建自定义路径短链接（301 跳转）
NEXT_PUBLIC_HEADER_LINK_TEXT=link.microbin.dev
NEXT_PUBLIC_HEADER_LINK_HREF=https://link.microbin.dev
```

### Environment Variables

**API Configuration:**
- `API_BASE_URL`: The URL of the Microbin API
- `ADMIN_TOKEN`: Your admin token for the API

**Public Configuration:**
- `NEXT_PUBLIC_REDIRECT_BASE_URL`: The base URL for generated short links (e.g., `https://link.microbin.dev`)

**Console Authentication:**
- `CONSOLE_PASSWORD`: The password required to access the console

**Site Branding (Server-side):**
These variables are used in page metadata (browser tab title, search engine descriptions):
- `SITE_TITLE`: Browser tab title (default: "Microbin Console")
- `SITE_DESCRIPTION`: Page meta description (default: "Create custom path short links with 301 redirects")

**Site Branding (Client-side):**
These variables customize the UI elements visible on the page:
- `NEXT_PUBLIC_SITE_TITLE`: Main page heading/title (default: "Microbin Console")
- `NEXT_PUBLIC_SITE_SUBTITLE`: Page subtitle/description (default: "创建自定义路径短链接（301 跳转）")
- `NEXT_PUBLIC_HEADER_LINK_TEXT`: Text displayed in the header link (default: "link.microbin.dev")
- `NEXT_PUBLIC_HEADER_LINK_HREF`: URL for the header link (default: "https://link.microbin.dev")

**Note:** All branding variables have sensible defaults, so the console works out-of-the-box without configuration. Set these variables to customize the console for your deployment environment.

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
