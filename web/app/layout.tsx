import React from "react";
export const metadata = {
  title: "CTFtime Points Calculator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/sakura.css/css/sakura.css" />
        <link rel="stylesheet" href="/static/styles.css" />
      </head>
      <body>
        <header>
          <h1>CTFtime Points Calculator</h1>
          <nav>
            <a href="/">Home </a>
            &middot;
            <a href="/event"> Event Rating </a>
            &middot;
            <a href="/team"> Team Total</a>
          </nav>
          <hr />
        </header>
        {children}
        <footer>
          <hr />
          <p>
            Built for convenience by shub | team 0bscuri7y. Data sourced from
            <a href="https://ctftime.org" target="_blank" rel="noreferrer"> CTFtime</a>.
          </p>
        </footer>
      </body>
    </html>
  );
}
