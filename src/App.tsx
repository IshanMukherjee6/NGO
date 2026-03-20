import Navbar from "./components/Navbar"

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="p-10">
        <h2 className="text-3xl font-semibold">
          Welcome to NGO Worker Connect
        </h2>
      </main>
    </div>
  )
}