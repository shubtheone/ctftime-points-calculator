export const metadata = {
  title: "Privacy Policy | CTFtime Points Calculator",
};

export default function PrivacyPage() {
  return (
    <main>
      <h2>Privacy Policy</h2>
      <p>
        <small>Last updated: October 29, 2026</small>
      </p>

      <p>
        CTFtime Points Calculator (ctfd-calculator.shubtheone.xyz) is a free tool run by Shubham
        Pundir. This page explains what information is collected when you use it.
      </p>

      <h3>What you enter</h3>
      <p>
        The calculator asks for CTFtime event and team IDs and placement numbers. These are used only
        to fetch public data from CTFtime.org and calculate rating points. We do not ask for an
        account, and we do not store what you enter.
      </p>

      <h3>Analytics</h3>
      <p>
        We use Vercel Web Analytics to count visits. It records information such as the pages viewed,
        referring website, country, and device and browser type. It does not use cookies and does not
        identify individual visitors.
      </p>

      <h3>Advertising</h3>
      <p>
        This site uses Google AdSense to show ads. Google and its partners use cookies to serve ads
        based on your previous visits to this and other websites. Google&apos;s use of advertising
        cookies enables it and its partners to serve ads to you based on your visits to this site
        and/or other sites on the Internet.
      </p>
      <p>
        You can opt out of personalized advertising in{" "}
        <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer">
          Google Ads Settings
        </a>
        , or opt out of some third-party vendors&apos; use of cookies at{" "}
        <a href="https://www.aboutads.info/choices/" target="_blank" rel="noreferrer">
          aboutads.info
        </a>
        . Learn more about{" "}
        <a
          href="https://policies.google.com/technologies/partner-sites"
          target="_blank"
          rel="noreferrer"
        >
          how Google uses information from sites that use its services
        </a>
        . Visitors in the European Economic Area, the UK and Switzerland are asked for consent before
        personalized ads are shown.
      </p>

      <h3>Service providers</h3>
      <p>
        The site is hosted on Vercel, and calculation data comes from{" "}
        <a href="https://ctftime.org" target="_blank" rel="noreferrer">
          CTFtime.org
        </a>
        . Ads are provided by Google. Each provider processes data only as needed to run its service.
      </p>

      <h3>Children</h3>
      <p>
        This site is not directed at children under 13, and we do not knowingly collect personal
        information from them.
      </p>

      <h3>Changes</h3>
      <p>
        We may update this policy from time to time. The date at the top shows when it last changed.
      </p>

      <h3>Contact</h3>
      <p>
        Questions? Send a direct message on X to{" "}
        <a href="https://x.com/blackth0rns_" target="_blank" rel="noreferrer">
          @blackth0rns_
        </a>
        .
      </p>
    </main>
  );
}
