// @refresh reload
import {createHandler, StartServer} from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({assets, children, scripts}) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>rex's space</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="description" content="rex's personal website" />
          <meta name="theme-color" content="#030303" />

          <meta name="robots" content="index,follow" />
          <meta name="googlebot" content="index,follow" />

          <meta property="og:title" content="rex's space" />
          <meta property="og:description" content="rex's personal website" />
          <meta property="og:type" content="website" />
          <meta property="og:image:width" content="192" />
          <meta property="og:image:height" content="192" />
          <meta property="og:image" content="/image.png" />

          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content="rex's space" />
          <meta name="twitter:description" content="rex's personal website" />
          <meta name="twitter:image" content="/image.png" />

          <link rel="icon" href="/image.png" />
          <link rel="apple-touch-icon" href="/image.png" />

          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
