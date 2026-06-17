import { useEffect } from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import "../styles/globals.css";
import { ToastProvider } from "@/components/Toast";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const savedTheme = localStorage.getItem("cloudvault_theme") || "dark";
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </>
  );
}
