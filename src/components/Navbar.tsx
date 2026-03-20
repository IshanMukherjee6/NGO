import { Button } from "@/components/ui/button"

export default function Navbar() {
    return (
        <nav className="w-full border-b bg-background px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">NGO Connect</h1>

            <div className="flex gap-4">
                <Button variant="ghost">Home</Button>
                <Button variant="ghost">Jobs</Button>
                <Button variant="ghost">Training</Button>
                <Button>Login</Button>
            </div>
        </nav>
    )
}