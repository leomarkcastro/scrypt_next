// import "@/styles/globals.css";
import "@picocss/pico";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
