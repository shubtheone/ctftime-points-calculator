export default function Home() {
  return (
    <main>
      <p>Select a tool:</p>
      <ul>
        <li><a href="/event">Calculate single event rating</a></li>
        <li><a href="/team">Compute team total points (top N)</a></li>
      </ul>
    </main>
  );
}